# Delete Behavior Documentation

## Subject Deletion

**Question:** If I delete the subject Physics, will all of its data including the current groupings, students, and so on be deleted?

**Answer:** Yes, absolutely! When you delete a subject, ALL related data is permanently removed from the database in a cascading manner.

### What Gets Deleted (In Order):

1. **Group Members** - All members from all groups within the subject
2. **Groups** - All groups within all groupings of the subject
3. **Groupings** - All grouping categories under the subject
4. **Students** - All enrolled students in the subject
5. **Subject** - The subject itself

### Technical Implementation

The deletion follows this sequence (from `/utils/supabase/database.ts`):

```typescript
export async function deleteSubject(id: string): Promise<boolean> {
  // Delete in order: group_members -> groups -> groupings -> students -> subject
  
  // 1. Get all groupings for this subject
  const { data: groupings } = await supabase
    .from('groupings')
    .select('id')
    .eq('subject_id', id);

  if (groupings && groupings.length > 0) {
    const groupingIds = groupings.map(g => g.id);

    // 2. Get all groups for these groupings
    const { data: groups } = await supabase
      .from('groups')
      .select('id')
      .in('grouping_id', groupingIds);

    if (groups && groups.length > 0) {
      const groupIds = groups.map(g => g.id);

      // 3. Delete group members
      await supabase.from('group_members').delete().in('group_id', groupIds);

      // 4. Delete groups
      await supabase.from('groups').delete().in('grouping_id', groupingIds);
    }

    // 5. Delete groupings
    await supabase.from('groupings').delete().eq('subject_id', id);
  }

  // 6. Delete students
  await supabase.from('students').delete().eq('subject_id', id);

  // 7. Delete subject
  const { error } = await supabase.from('subjects').delete().eq('id', id);

  return !error;
}
```

### Example

If you delete **Physics** subject:
- All Physics groupings (e.g., "Lab 1", "Quiz 1", etc.) are deleted
- All groups within those groupings are deleted
- All members in those groups are removed
- All enrolled students in Physics are removed
- The Physics subject itself is deleted

### Warning

⚠️ **This action is IRREVERSIBLE!** There is no undo functionality. Once deleted, all data is permanently gone.

### Best Practices

Before deleting a subject, consider:
1. **Export/backup** important data if needed
2. **Lock groupings** instead if you want to prevent changes but keep data
3. **Verify** you're deleting the correct subject
4. **Communicate** with users if this is a shared system

## Grouping Deletion

Similarly, when you delete a grouping:
1. All group members in that grouping's groups are deleted
2. All groups in that grouping are deleted
3. The grouping itself is deleted

**Note:** Students are NOT deleted when deleting a grouping (they remain enrolled in the subject).

## Group Deletion

When you delete a single group:
1. All members in that group are removed
2. The group itself is deleted

**Note:** Students remain enrolled in the subject.
