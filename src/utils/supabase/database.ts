import { supabase } from './client';
import { Subject, Student, Grouping, Group } from '../../App';

// ============ SUBJECTS ============

export async function fetchSubjects(): Promise<Subject[]> {
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: true });

  if (subjectsError) {
    console.error('Error fetching subjects:', subjectsError);
    throw subjectsError;
  }

  // Fetch all students for all subjects
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*');

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    throw studentsError;
  }

  // Group students by subject
  return subjects.map(subject => ({
    id: subject.id,
    name: subject.name,
    color: subject.color,
    icon: subject.icon,
    students: students
      .filter(student => student.subject_id === subject.id)
      .map(student => ({ id: student.id, name: student.name })),
  }));
}

export async function createSubject(name: string, color: string, icon: string): Promise<Subject | null> {
  const newSubject = {
    id: crypto.randomUUID(),
    name,
    color,
    icon,
  };

  const { data, error } = await supabase
    .from('subjects')
    .insert([newSubject])
    .select()
    .single();

  if (error) {
    console.error('Error creating subject:', error);
    return null;
  }

  return { ...data, students: [] };
}

export async function updateSubject(id: string, updates: { name?: string; color?: string; icon?: string }): Promise<boolean> {
  const { error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating subject:', error);
    return false;
  }

  return true;
}

export async function deleteSubject(id: string): Promise<boolean> {
  // Delete in order: group_members -> groups -> groupings -> students -> subject
  
  // Get all groupings for this subject
  const { data: groupings } = await supabase
    .from('groupings')
    .select('id')
    .eq('subject_id', id);

  if (groupings && groupings.length > 0) {
    const groupingIds = groupings.map(g => g.id);

    // Get all groups for these groupings
    const { data: groups } = await supabase
      .from('groups')
      .select('id')
      .in('grouping_id', groupingIds);

    if (groups && groups.length > 0) {
      const groupIds = groups.map(g => g.id);

      // Delete group members
      await supabase.from('group_members').delete().in('group_id', groupIds);

      // Delete groups
      await supabase.from('groups').delete().in('grouping_id', groupingIds);
    }

    // Delete groupings
    await supabase.from('groupings').delete().eq('subject_id', id);
  }

  // Delete students
  await supabase.from('students').delete().eq('subject_id', id);

  // Delete subject
  const { error } = await supabase.from('subjects').delete().eq('id', id);

  if (error) {
    console.error('Error deleting subject:', error);
    return false;
  }

  return true;
}

// ============ STUDENTS ============

export async function addStudentToSubject(subjectId: string, studentName: string): Promise<Student | null> {
  const newStudent = {
    id: crypto.randomUUID(),
    subject_id: subjectId,
    name: studentName,
  };

  const { data, error } = await supabase
    .from('students')
    .insert([newStudent])
    .select()
    .single();

  if (error) {
    console.error('Error adding student:', error);
    return null;
  }

  return { id: data.id, name: data.name };
}

export async function batchAddStudents(subjectId: string, studentNames: string[]): Promise<boolean> {
  const newStudents = studentNames.map(name => ({
    id: crypto.randomUUID(),
    subject_id: subjectId,
    name,
  }));

  const { error } = await supabase
    .from('students')
    .insert(newStudents);

  if (error) {
    console.error('Error batch adding students:', error);
    return false;
  }

  return true;
}

export async function removeStudentFromSubject(studentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

  if (error) {
    console.error('Error removing student:', error);
    return false;
  }

  return true;
}

// ============ GROUPINGS ============

export async function fetchGroupings(): Promise<Grouping[]> {
  const { data, error } = await supabase
    .from('groupings')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching groupings:', error);
    throw error;
  }

  return data.map(g => ({
    id: g.id,
    subjectId: g.subject_id,
    title: g.title,
    locked: g.locked,
  }));
}

export async function createGrouping(subjectId: string, title: string): Promise<Grouping | null> {
  const newGrouping = {
    id: crypto.randomUUID(),
    subject_id: subjectId,
    title,
    locked: false,
  };

  const { data, error } = await supabase
    .from('groupings')
    .insert([newGrouping])
    .select()
    .single();

  if (error) {
    console.error('Error creating grouping:', error);
    return null;
  }

  return {
    id: data.id,
    subjectId: data.subject_id,
    title: data.title,
    locked: data.locked,
  };
}

export async function deleteGrouping(id: string): Promise<boolean> {
  // Get all groups for this grouping
  const { data: groups } = await supabase
    .from('groups')
    .select('id')
    .eq('grouping_id', id);

  if (groups && groups.length > 0) {
    const groupIds = groups.map(g => g.id);

    // Delete group members
    await supabase.from('group_members').delete().in('group_id', groupIds);

    // Delete groups
    await supabase.from('groups').delete().eq('grouping_id', id);
  }

  // Delete grouping
  const { error } = await supabase.from('groupings').delete().eq('id', id);

  if (error) {
    console.error('Error deleting grouping:', error);
    return false;
  }

  return true;
}

export async function toggleGroupingLock(id: string, currentLocked: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('groupings')
    .update({ locked: !currentLocked })
    .eq('id', id);

  if (error) {
    console.error('Error toggling grouping lock:', error);
    return false;
  }

  return true;
}

// ============ GROUPS ============

export async function fetchGroups(): Promise<Group[]> {
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: true });

  if (groupsError) {
    console.error('Error fetching groups:', groupsError);
    throw groupsError;
  }

  // Fetch all group members
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('*');

  if (membersError) {
    console.error('Error fetching group members:', membersError);
    throw membersError;
  }

  // Group members by group
  return groups.map(group => ({
    id: group.id,
    groupingId: group.grouping_id,
    name: group.name,
    members: members
      .filter(member => member.group_id === group.id)
      .map(member => member.member_name),
    memberLimit: group.member_limit,
    representative: group.representative || undefined,
  }));
}

export async function createGroup(groupingId: string, name: string, memberLimit: number): Promise<Group | null> {
  const newGroup = {
    id: crypto.randomUUID(),
    grouping_id: groupingId,
    name,
    member_limit: memberLimit,
    representative: null,
  };

  const { data, error } = await supabase
    .from('groups')
    .insert([newGroup])
    .select()
    .single();

  if (error) {
    console.error('Error creating group:', error);
    return null;
  }

  return {
    id: data.id,
    groupingId: data.grouping_id,
    name: data.name,
    members: [],
    memberLimit: data.member_limit,
    representative: data.representative || undefined,
  };
}

export async function updateGroup(id: string, updates: Partial<Group>): Promise<boolean> {
  const dbUpdates: any = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.memberLimit !== undefined) dbUpdates.member_limit = updates.memberLimit;
  if (updates.representative !== undefined) dbUpdates.representative = updates.representative;

  // Handle member updates separately
  if (updates.members !== undefined) {
    // Get current members
    const { data: currentMembers } = await supabase
      .from('group_members')
      .select('member_name')
      .eq('group_id', id);

    const currentMemberNames = currentMembers?.map(m => m.member_name) || [];
    const newMemberNames = updates.members;

    // Find members to add and remove
    const toAdd = newMemberNames.filter(name => !currentMemberNames.includes(name));
    const toRemove = currentMemberNames.filter(name => !newMemberNames.includes(name));

    // Add new members
    if (toAdd.length > 0) {
      const newMembers = toAdd.map(name => ({
        id: crypto.randomUUID(),
        group_id: id,
        member_name: name,
      }));

      await supabase.from('group_members').insert(newMembers);
    }

    // Remove old members
    if (toRemove.length > 0) {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .in('member_name', toRemove);
    }
  }

  // Update group fields if any
  if (Object.keys(dbUpdates).length > 0) {
    const { error } = await supabase
      .from('groups')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating group:', error);
      return false;
    }
  }

  return true;
}

export async function deleteGroup(id: string): Promise<boolean> {
  // Delete group members first
  await supabase.from('group_members').delete().eq('group_id', id);

  // Delete group
  const { error } = await supabase.from('groups').delete().eq('id', id);

  if (error) {
    console.error('Error deleting group:', error);
    return false;
  }

  return true;
}

export async function addMemberToGroup(groupId: string, memberName: string): Promise<boolean> {
  const newMember = {
    id: crypto.randomUUID(),
    group_id: groupId,
    member_name: memberName,
  };

  const { error } = await supabase
    .from('group_members')
    .insert([newMember]);

  if (error) {
    console.error('Error adding member to group:', error);
    return false;
  }

  return true;
}

export async function removeMemberFromGroup(groupId: string, memberName: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('member_name', memberName);

  if (error) {
    console.error('Error removing member from group:', error);
    return false;
  }

  return true;
}