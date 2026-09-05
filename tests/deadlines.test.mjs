import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

test('deadline migration, authorization, assignments and retries', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA cron;
      CREATE TABLE cron.jobs(name text, schedule text, command text);
      CREATE FUNCTION cron.schedule(text, text, text) RETURNS bigint LANGUAGE sql AS
      $$ INSERT INTO cron.jobs VALUES ($1, $2, $3); SELECT 1::bigint; $$;`);
    for (const file of ['001_initial_schema.sql', '003_add_grouping_colors_and_history.sql', '004_optional_deadlines.sql']) {
      await db.exec(await readFile(new URL(`../src/supabase/migrations/${file}`, import.meta.url), 'utf8'));
    }
    await db.exec('GRANT USAGE ON SCHEMA public TO anon; GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;');
    const scalar = async (sql, params = []) => Object.values((await db.query(sql, params)).rows[0])[0];
    const fixture = async (limits, count) => {
      const subject = randomUUID(), grouping = randomUUID();
      await db.query("INSERT INTO subjects(id,name,color,icon) VALUES ($1,'Test','blue','book')", [subject]);
      await db.query("INSERT INTO groupings(id,subject_id,title) VALUES ($1,$2,'Test')", [grouping, subject]);
      const groups = [];
      for (const limit of limits) {
        const id = randomUUID(); groups.push(id);
        await db.query("INSERT INTO groups(id,grouping_id,name,member_limit) VALUES ($1,$2,$3,$4)", [id, grouping, `Group ${groups.length}`, limit]);
      }
      const students = [];
      for (let i = 0; i < count; i++) {
        const id = randomUUID(); students.push(id);
        await db.query('INSERT INTO students(id,subject_id,name) VALUES ($1,$2,$3)', [id, subject, `Student, ${i}`]);
      }
      return { subject, grouping, groups, students };
    };
    const join = (group, name) => db.query('INSERT INTO group_members(id,group_id,member_name) VALUES ($1,$2,$3)', [randomUUID(), group, name]);
    const enable = (id) => db.query("SELECT configure_grouping_deadline($1, now() + interval '2 days')", [id]);
    const expire = (id) => db.query("UPDATE groupings SET deadline_at = now() - interval '1 second' WHERE id=$1", [id]);
    const process = () => db.exec('SELECT process_grouping_deadlines()');
    const asAnon = async (fn) => {
      await db.exec('SET ROLE anon');
      try { return await fn(); } finally { await db.exec('RESET ROLE'); }
    };

    const f = await fixture([4, 4], 8);
    await join(f.groups[0], 'Student, 0');
    await join(f.groups[1], 'Student, 1');
    await join(f.groups[1], 'Student, 2');
    await enable(f.grouping);
    assert.equal(await scalar('SELECT count(*)::int FROM group_members WHERE student_id = ANY($1::uuid[])', [f.students]), 3);
    await assert.rejects(asAnon(() => join(f.groups[1], 'Student, 0')), /already belongs/);
    await assert.rejects(asAnon(() => join(f.groups[1], 'Student, Unknown')), /exact, unique/);
    await assert.rejects(asAnon(() => db.query('UPDATE groupings SET deadline_at=NULL WHERE id=$1', [f.grouping])), /admin authorization/);
    await assert.rejects(asAnon(() => enable(f.grouping)), /permission denied/);
    await assert.rejects(asAnon(process), /permission denied/);
    await asAnon(() => join(f.groups[0], 'Student, 3'));
    await expire(f.grouping);
    await assert.rejects(asAnon(() => join(f.groups[0], 'Student, 4')), /Registration is closed/);
    await assert.rejects(asAnon(() => db.query('DELETE FROM group_members WHERE group_id=$1', [f.groups[0]])), /Registration is closed/);
    await process();
    const counts = await db.query('SELECT count(m.id)::int AS count FROM groups g LEFT JOIN group_members m ON m.group_id=g.id WHERE g.grouping_id=$1 GROUP BY g.id', [f.grouping]);
    assert.deepEqual(counts.rows.map(row => row.count), [4, 4]);
    assert.equal(await scalar('SELECT group_id FROM group_members WHERE student_id=$1', [f.students[0]]), f.groups[0]);
    assert.equal(await scalar('SELECT deadline_unassigned_count FROM groupings WHERE id=$1', [f.grouping]), 0);
    const historyCount = await scalar('SELECT count(*) FROM group_history WHERE grouping_id=$1', [f.grouping]);
    await process();
    assert.equal(await scalar('SELECT count(*) FROM group_history WHERE grouping_id=$1', [f.grouping]), historyCount);

    const shortage = await fixture([1, 2], 5);
    await enable(shortage.grouping); await expire(shortage.grouping); await process();
    assert.equal(await scalar('SELECT deadline_unassigned_count FROM groupings WHERE id=$1', [shortage.grouping]), 2);

    const optional = await fixture([3], 2);
    await asAnon(() => join(optional.groups[0], 'Legacy, Name'));
    await process();
    assert.equal(await scalar('SELECT count(*)::int FROM group_members WHERE group_id=$1', [optional.groups[0]]), 1);
    await assert.rejects(enable(optional.grouping), /Match existing member names/);

    const cancelled = await fixture([2], 2);
    await enable(cancelled.grouping);
    await db.query('SELECT configure_grouping_deadline($1, NULL)', [cancelled.grouping]);
    await process();
    assert.equal(await scalar('SELECT count(*)::int FROM group_members WHERE group_id=$1', [cancelled.groups[0]]), 0);

    const retry = await fixture([4], 3);
    await enable(retry.grouping);
    const duplicate = randomUUID();
    await db.query("INSERT INTO students(id,subject_id,name) VALUES ($1,$2,'Student, 0')", [duplicate, retry.subject]);
    await expire(retry.grouping); await process();
    assert.equal(await scalar('SELECT count(*)::int FROM group_members WHERE group_id=$1', [retry.groups[0]]), 0, 'failed run rolls back every assignment');
    assert.equal(await scalar('SELECT deadline_processed_at FROM groupings WHERE id=$1', [retry.grouping]), null);
    assert.ok(await scalar('SELECT deadline_error FROM groupings WHERE id=$1', [retry.grouping]));
    await db.query('DELETE FROM students WHERE id=$1', [duplicate]);
    await process();
    assert.equal(await scalar('SELECT count(*)::int FROM group_members WHERE group_id=$1', [retry.groups[0]]), 3);
    assert.equal(await scalar('SELECT deadline_error FROM groupings WHERE id=$1', [retry.grouping]), null);
    assert.equal(await scalar('SELECT schedule FROM cron.jobs'), '* * * * *');
  } finally { await db.close(); }
});
