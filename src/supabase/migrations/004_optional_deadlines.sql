-- Run after 001–003. Enable Supabase Cron in the dashboard before running this migration.
BEGIN;

ALTER TABLE public.groupings
  ADD COLUMN deadline_at timestamptz,
  ADD COLUMN deadline_processed_at timestamptz,
  ADD COLUMN deadline_unassigned_count integer,
  ADD COLUMN deadline_error text;
ALTER TABLE public.group_members ADD COLUMN student_id uuid REFERENCES public.students(id) ON DELETE SET NULL;
CREATE INDEX ON public.group_members(student_id);
CREATE INDEX ON public.groupings(deadline_at) WHERE deadline_processed_at IS NULL AND deadline_at IS NOT NULL;

CREATE FUNCTION public.deadline_name(value text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT lower(regexp_replace(trim(value), '\s+', ' ', 'g'));
$$;

-- Trigger runs with the caller's privileges: only the server RPC and cron may
-- change deadline state. Browser clients retain their existing ordinary controls.
CREATE FUNCTION public.guard_deadline_settings() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.deadline_at IS NOT NULL OR NEW.deadline_processed_at IS NOT NULL
         OR NEW.deadline_unassigned_count IS NOT NULL OR NEW.deadline_error IS NOT NULL THEN
        RAISE EXCEPTION 'Deadline settings require admin authorization';
      END IF;
    ELSIF ROW(NEW.deadline_at, NEW.deadline_processed_at, NEW.deadline_unassigned_count, NEW.deadline_error)
      IS DISTINCT FROM ROW(OLD.deadline_at, OLD.deadline_processed_at, OLD.deadline_unassigned_count, OLD.deadline_error) THEN
      RAISE EXCEPTION 'Deadline settings require admin authorization';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_deadline_settings BEFORE INSERT OR UPDATE ON public.groupings
FOR EACH ROW EXECUTE FUNCTION public.guard_deadline_settings();

-- All membership changes share a grouping lock with the deadline processor.
-- This also serializes joins to different groups within the same grouping.
CREATE FUNCTION public.guard_deadline_membership() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  grouping public.groupings;
  target_group uuid;
  resolved_student uuid;
  matches integer;
  capacity integer;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.group_id <> OLD.group_id THEN
    RAISE EXCEPTION 'Remove the member before moving them to another group';
  END IF;
  IF TG_OP = 'DELETE' THEN target_group := OLD.group_id;
  ELSE target_group := NEW.group_id; END IF;
  SELECT c.* INTO grouping FROM public.groupings c
    JOIN public.groups g ON g.grouping_id = c.id WHERE g.id = target_group FOR UPDATE OF c;
  -- Cascading deletes can arrive after the parent has been deleted.
  IF NOT FOUND THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RAISE EXCEPTION 'Group does not exist';
  END IF;
  IF grouping.deadline_at IS NOT NULL THEN
    IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin') AND
       grouping.deadline_at <= clock_timestamp() THEN
      RAISE EXCEPTION 'Registration is closed for this grouping';
    END IF;
    IF TG_OP <> 'DELETE' THEN
      SELECT count(*), (array_agg(id))[1] INTO matches, resolved_student FROM public.students
        WHERE subject_id = grouping.subject_id AND public.deadline_name(name) = public.deadline_name(NEW.member_name);
      IF matches <> 1 THEN
        RAISE EXCEPTION 'Use the exact, unique name from the enrolled student list';
      END IF;
      NEW.student_id := resolved_student;
      IF EXISTS (SELECT 1 FROM public.group_members m JOIN public.groups g ON g.id = m.group_id
        WHERE g.grouping_id = grouping.id AND m.student_id = resolved_student AND m.id <> NEW.id) THEN
        RAISE EXCEPTION 'This student already belongs to a group';
      END IF;
    END IF;
  ELSIF TG_OP <> 'DELETE' THEN
    -- Unscheduled groupings retain their existing free-form name behavior.
    NEW.student_id := NULL;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    SELECT member_limit INTO capacity FROM public.groups WHERE id = target_group;
    IF (SELECT count(*) FROM public.group_members WHERE group_id = target_group AND id <> NEW.id) >= capacity THEN
      RAISE EXCEPTION 'Group member limit reached';
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$;
-- Replaces the old count-only trigger, which did not serialize concurrent joins.
DROP TRIGGER IF EXISTS trigger_check_member_limit ON public.group_members;
CREATE TRIGGER guard_deadline_membership BEFORE INSERT OR UPDATE OR DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.guard_deadline_membership();

CREATE FUNCTION public.serialize_deadline_group_changes() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.grouping_id <> OLD.grouping_id THEN
    RAISE EXCEPTION 'Groups cannot be moved between groupings';
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM 1 FROM public.groupings WHERE id = OLD.grouping_id FOR UPDATE;
    RETURN OLD;
  END IF;
  PERFORM 1 FROM public.groupings WHERE id = NEW.grouping_id FOR UPDATE;
  IF TG_OP = 'UPDATE' AND NEW.member_limit < (SELECT count(*) FROM public.group_members WHERE group_id = NEW.id) THEN
    RAISE EXCEPTION 'Member limit cannot be smaller than the current membership';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER serialize_deadline_group_changes BEFORE INSERT OR UPDATE OR DELETE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.serialize_deadline_group_changes();

CREATE FUNCTION public.configure_grouping_deadline(target_id uuid, deadline timestamptz)
RETURNS public.groupings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.groupings;
BEGIN
  SELECT * INTO result FROM public.groupings WHERE id = target_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Grouping not found'; END IF;
  IF deadline IS NOT NULL THEN
    IF deadline <= clock_timestamp() THEN RAISE EXCEPTION 'Choose a future deadline'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.groups WHERE grouping_id = target_id) THEN
      RAISE EXCEPTION 'Create groups before setting a deadline';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE subject_id = result.subject_id) THEN
      RAISE EXCEPTION 'Add enrolled students before setting a deadline';
    END IF;
    -- Never guess which student a legacy abbreviated name represents.
    IF EXISTS (SELECT 1 FROM public.students WHERE subject_id = result.subject_id
      GROUP BY public.deadline_name(name) HAVING count(*) > 1) THEN
      RAISE EXCEPTION 'Resolve duplicate enrolled names before enabling a deadline';
    END IF;
    IF EXISTS (SELECT 1 FROM public.group_members m JOIN public.groups g ON g.id = m.group_id
      WHERE g.grouping_id = target_id AND NOT EXISTS (SELECT 1 FROM public.students s
        WHERE s.subject_id = result.subject_id AND public.deadline_name(s.name) = public.deadline_name(m.member_name))) THEN
      RAISE EXCEPTION 'Match existing member names to the enrolled student list before enabling a deadline';
    END IF;
    IF EXISTS (SELECT 1 FROM public.group_members m JOIN public.groups g ON g.id = m.group_id
      WHERE g.grouping_id = target_id GROUP BY public.deadline_name(m.member_name) HAVING count(*) > 1) THEN
      RAISE EXCEPTION 'Remove duplicate memberships before enabling a deadline';
    END IF;
  END IF;
  UPDATE public.groupings SET deadline_at = deadline, deadline_processed_at = NULL,
    deadline_unassigned_count = NULL, deadline_error = NULL WHERE id = target_id;
  IF deadline IS NOT NULL THEN
    UPDATE public.group_members m SET student_id = s.id FROM public.students s, public.groups g
      WHERE m.group_id = g.id AND g.grouping_id = target_id AND s.subject_id = result.subject_id
      AND public.deadline_name(m.member_name) = public.deadline_name(s.name);
  END IF;
  SELECT * INTO result FROM public.groupings WHERE id = target_id;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.configure_grouping_deadline(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.configure_grouping_deadline(uuid, timestamptz) TO service_role;

CREATE FUNCTION public.process_grouping_deadlines() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE grouping public.groupings; student public.students; chosen public.groups; remaining integer;
BEGIN
  FOR grouping IN SELECT * FROM public.groupings
    WHERE deadline_at <= clock_timestamp() AND deadline_processed_at IS NULL
    ORDER BY deadline_at FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      FOR student IN SELECT s.* FROM public.students s WHERE s.subject_id = grouping.subject_id
        AND NOT EXISTS (SELECT 1 FROM public.group_members m JOIN public.groups g ON g.id = m.group_id
          WHERE g.grouping_id = grouping.id AND m.student_id = s.id) ORDER BY random()
      LOOP
        SELECT g.* INTO chosen FROM public.groups g
          WHERE g.grouping_id = grouping.id AND (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id) < g.member_limit
          ORDER BY (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id), random() LIMIT 1;
        EXIT WHEN NOT FOUND;
        INSERT INTO public.group_members(id, group_id, member_name, student_id)
          VALUES (gen_random_uuid(), chosen.id, student.name, student.id);
        INSERT INTO public.group_history(grouping_id, group_id, action_type, group_name, member_name, details, performed_by)
          VALUES (grouping.id, chosen.id, 'member_added', chosen.name, student.name, 'Automatically assigned at the registration deadline', 'system');
      END LOOP;
      SELECT count(*) INTO remaining FROM public.students s WHERE s.subject_id = grouping.subject_id
        AND NOT EXISTS (SELECT 1 FROM public.group_members m JOIN public.groups g ON g.id = m.group_id
          WHERE g.grouping_id = grouping.id AND m.student_id = s.id);
      UPDATE public.groupings SET deadline_processed_at = clock_timestamp(), deadline_unassigned_count = remaining,
        deadline_error = NULL WHERE id = grouping.id;
    EXCEPTION WHEN OTHERS THEN
      -- The per-grouping subtransaction rolls back all assignments on failure.
      -- Keep it pending so the next scheduled run retries it.
      UPDATE public.groupings SET deadline_error = 'Automatic assignment needs attention. Check enrolled names and group capacity.' WHERE id = grouping.id;
      RAISE WARNING 'Deadline assignment failed for %: %', grouping.id, SQLERRM;
    END;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.process_grouping_deadlines() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_grouping_deadlines() TO service_role;

SELECT cron.schedule('assign-expired-groupings', '* * * * *', 'SELECT public.process_grouping_deadlines()');
COMMIT;
