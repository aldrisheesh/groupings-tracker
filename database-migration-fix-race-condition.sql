-- Function to check member limit before insertion
CREATE OR REPLACE FUNCTION check_group_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  limit_count INTEGER;
BEGIN
  -- Get the current member count for the group
  SELECT COUNT(*) INTO current_count
  FROM group_members
  WHERE group_id = NEW.group_id;

  -- Get the member limit for the group
  SELECT member_limit INTO limit_count
  FROM groups
  WHERE id = NEW.group_id;

  -- Check if adding this member would exceed the limit
  -- We use >= because current_count is the count *before* this insertion
  IF current_count >= limit_count THEN
    RAISE EXCEPTION 'Group member limit reached';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function before insert
DROP TRIGGER IF EXISTS trigger_check_member_limit ON group_members;
CREATE TRIGGER trigger_check_member_limit
BEFORE INSERT ON group_members
FOR EACH ROW
EXECUTE FUNCTION check_group_member_limit();
