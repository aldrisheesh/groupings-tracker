# Database Schema Reference

## Tables Overview

### 1. `subjects`
Stores all subject/course information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Subject name (e.g., "Mathematics") |
| `color` | TEXT | Tailwind color class (e.g., "bg-blue-500") |
| `icon` | TEXT | Lucide icon name (e.g., "calculator") |
| `created_at` | TIMESTAMP | Auto-generated creation time |

**Relationships**:
- Has many `students`
- Has many `groupings`

---

### 2. `students`
Stores enrolled students for each subject.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `subject_id` | UUID | Foreign key to `subjects` |
| `name` | TEXT | Student name in "Last, First" format |
| `created_at` | TIMESTAMP | Auto-generated creation time |

**Relationships**:
- Belongs to one `subject`

**Notes**:
- Cascades on subject deletion
- Student names stored as strings (not user accounts)

---

### 3. `groupings`
Stores grouping categories within each subject (e.g., "Final Project", "Lab Partners").

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `subject_id` | UUID | Foreign key to `subjects` |
| `title` | TEXT | Grouping category name |
| `locked` | BOOLEAN | Whether users can join/leave groups |
| `created_at` | TIMESTAMP | Auto-generated creation time |

**Relationships**:
- Belongs to one `subject`
- Has many `groups`

**Notes**:
- Cascades on subject deletion
- `locked` defaults to `false`

---

### 4. `groups`
Stores individual groups within each grouping category.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `grouping_id` | UUID | Foreign key to `groupings` |
| `name` | TEXT | Group name (e.g., "Group Alpha") |
| `member_limit` | INTEGER | Maximum number of members |
| `representative` | TEXT | Name of the group representative (nullable) |
| `created_at` | TIMESTAMP | Auto-generated creation time |

**Relationships**:
- Belongs to one `grouping`
- Has many `group_members`

**Notes**:
- Cascades on grouping deletion
- `member_limit` must be > 0
- `representative` can be NULL

---

### 5. `group_members`
Stores individual member assignments to groups.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `group_id` | UUID | Foreign key to `groups` |
| `member_name` | TEXT | Name of the member |
| `created_at` | TIMESTAMP | Auto-generated creation time |

**Relationships**:
- Belongs to one `group`

**Constraints**:
- UNIQUE constraint on (`group_id`, `member_name`) - prevents duplicate members in same group

**Notes**:
- Cascades on group deletion
- Member names are plain text (not linked to student records)
- This allows flexibility for non-enrolled members

---

## Indexes

For optimal query performance:

```sql
idx_students_subject_id      ON students(subject_id)
idx_groupings_subject_id     ON groupings(subject_id)
idx_groups_grouping_id       ON groups(grouping_id)
idx_group_members_group_id   ON group_members(group_id)
```

---

## Row Level Security (RLS)

All tables have RLS enabled with permissive policies:

```sql
-- Allows all operations for all users
CREATE POLICY "Allow all operations on [table]" ON [table]
  FOR ALL USING (true) WITH CHECK (true);
```

**Production Note**: For a production app with authentication, you should restrict these policies based on user roles:
- Regular users: Read all, write only to `group_members`
- Admins: Full CRUD access to all tables

---

## Data Flow Example

### Creating a Complete Subject with Groups

```
1. INSERT INTO subjects
   ↓
2. INSERT INTO students (batch)
   ↓
3. INSERT INTO groupings
   ↓
4. INSERT INTO groups
   ↓
5. INSERT INTO group_members
```

### Deleting a Subject

```
1. DELETE FROM group_members (cascade)
   ↓
2. DELETE FROM groups (cascade)
   ↓
3. DELETE FROM groupings (cascade)
   ↓
4. DELETE FROM students (cascade)
   ↓
5. DELETE FROM subjects
```

All handled automatically by CASCADE constraints!

---

## Sample Queries

### Get all groups with member counts for a subject

```sql
SELECT 
  g.id,
  g.name,
  g.member_limit,
  COUNT(gm.id) as member_count,
  g.member_limit - COUNT(gm.id) as spots_available
FROM subjects s
JOIN groupings gr ON gr.subject_id = s.id
JOIN groups g ON g.grouping_id = gr.id
LEFT JOIN group_members gm ON gm.group_id = g.id
WHERE s.id = 'your-subject-id'
GROUP BY g.id, g.name, g.member_limit;
```

### Find students not in any group for a specific grouping

```sql
SELECT s.name
FROM students s
WHERE s.subject_id = 'your-subject-id'
  AND NOT EXISTS (
    SELECT 1 
    FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    WHERE g.grouping_id = 'your-grouping-id'
      AND gm.member_name = s.name
  );
```

### Get all locked groupings

```sql
SELECT 
  s.name as subject_name,
  gr.title as grouping_title,
  gr.locked
FROM groupings gr
JOIN subjects s ON s.id = gr.subject_id
WHERE gr.locked = true;
```

---

## Estimated Storage

Based on typical usage:

| Data | Average Size | 1000 Records |
|------|-------------|--------------|
| Subject | ~200 bytes | 200 KB |
| Student | ~150 bytes | 150 KB |
| Grouping | ~150 bytes | 150 KB |
| Group | ~200 bytes | 200 KB |
| Group Member | ~200 bytes | 200 KB |

**Total for 1000 of each**: ~900 KB

**Supabase Free Tier**: 500 MB database = ~550,000 records total

You're unlikely to hit the limit for a school project! 🎉

---

## Backup & Recovery

### Manual Backup (SQL Dump)

In Supabase Dashboard:
1. Go to Database → Backups
2. Click "Download backup"
3. Save the .sql file

### Restore from Backup

1. Create a new Supabase project
2. Run the backup SQL file in SQL Editor

### Point-in-Time Recovery

Supabase Pro plan includes automatic point-in-time recovery (not needed for free tier usage).

---

## Performance Optimization Tips

### Current Implementation (Good for <10,000 records)

- Fetches all data on page load
- Uses client-side state management
- Fast for typical school/project usage

### For Larger Scale (>10,000 records)

Consider:
- Pagination for subjects/groupings
- Lazy loading of groups
- Real-time subscriptions for live updates
- Caching with React Query or SWR

Example with real-time:
```typescript
supabase
  .channel('groups')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'groups' }, 
    (payload) => {
      // Update UI when groups change
    }
  )
  .subscribe();
```

---

## Security Considerations

### Current Setup (Development/Internal Tool)

✅ Good for:
- School projects
- Internal team tools
- Prototypes
- Low-sensitivity data

### Production Setup Checklist

- [ ] Add authentication (Supabase Auth)
- [ ] Restrict RLS policies based on user roles
- [ ] Add input validation on the server side
- [ ] Implement rate limiting
- [ ] Add audit logging
- [ ] Encrypt sensitive data
- [ ] Set up monitoring and alerts

---

## Migration Management

### Creating New Migrations

When you need to change the schema:

1. Create a new file: `002_add_feature.sql`
2. Add your changes:
   ```sql
   ALTER TABLE groupings ADD COLUMN description TEXT;
   ```
3. Run in Supabase SQL Editor
4. Update TypeScript types in `/utils/supabase/client.ts`

### Version Control

- Keep all migrations in `/supabase/migrations/`
- Number them sequentially: `001_`, `002_`, `003_`
- Document what each migration does
- Never modify old migrations (create new ones)

---

## Useful Supabase Features

### Auto-generated API

Supabase automatically creates a REST API:
```
GET https://xxx.supabase.co/rest/v1/subjects
GET https://xxx.supabase.co/rest/v1/groups?grouping_id=eq.123
```

### Real-time Subscriptions

Listen to database changes:
```typescript
supabase
  .channel('any')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'groups' },
    (payload) => console.log('New group:', payload)
  )
  .subscribe();
```

### Storage (if needed)

Store files like group photos:
```typescript
const { data, error } = await supabase.storage
  .from('group-photos')
  .upload('group-123.jpg', file);
```

---

## Quick Reference: Common Operations

### Check table sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Count all records
```sql
SELECT 
  'subjects' as table_name, COUNT(*) as count FROM subjects
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'groupings', COUNT(*) FROM groupings
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
UNION ALL
SELECT 'group_members', COUNT(*) FROM group_members;
```

### Clear all data (keep structure)
```sql
TRUNCATE group_members, groups, groupings, students, subjects CASCADE;
```

---

That's everything you need to know about the database! 📚
