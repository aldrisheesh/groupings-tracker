import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { SubjectsPage } from "./components/SubjectsPage";
import { SubjectPage } from "./components/SubjectPage";
import { GroupingPage } from "./components/GroupingPage";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import * as db from "./utils/supabase/database";
import { supabase } from "./utils/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type Subject = {
  id: string;
  name: string;
  color: string;
  icon: string;
  students: Student[];
};

export type Grouping = {
  id: string;
  subjectId: string;
  title: string;
  color: string;
  locked?: boolean;
};

export type Group = {
  id: string;
  groupingId: string;
  name: string;
  members: string[];
  memberLimit: number;
  representative?: string;
};

export type Student = {
  id: string;
  name: string;
};

export type GroupHistory = {
  id: string;
  groupingId: string;
  groupId: string | null;
  actionType: 'group_created' | 'group_deleted' | 'member_added' | 'member_removed' | 'group_updated' | 'representative_set' | 'representative_removed';
  groupName: string;
  memberName?: string;
  details?: string;
  performedBy: 'admin' | 'user';
  createdAt: string;
};

export type Page =
  | { type: "home" }
  | { type: "subject"; subjectId: string }
  | { type: "grouping"; subjectId: string; groupingId: string };

function App() {
  const [currentPage, setCurrentPage] = useState<Page>({
    type: "home",
  });
  // Initialize admin mode from localStorage (defaults to false if not set)
  const [isAdmin, setIsAdmin] = useState(() => {
    const saved = localStorage.getItem('adminMode');
    return saved ? JSON.parse(saved) : false;
  });
  // Initialize dark mode from localStorage (defaults to false if not set)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Save admin mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminMode', JSON.stringify(isAdmin));
  }, [isAdmin]);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save to localStorage whenever it changes
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Data from Supabase
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groupings, setGroupings] = useState<Grouping[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Helper function to update URL without reload
  const updateURL = (page: Page) => {
    const url = new URL(window.location.href);
    url.search = ''; // Clear existing params

    if (page.type === 'subject') {
      url.searchParams.set('subject', page.subjectId);
    } else if (page.type === 'grouping') {
      url.searchParams.set('subject', page.subjectId);
      url.searchParams.set('grouping', page.groupingId);
    }

    window.history.pushState({}, '', url.toString());
  };

  // Custom setCurrentPage that also updates URL
  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
    updateURL(page);
  };

  // Parse URL on mount and navigate if params exist
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get('subject');
    const groupingId = params.get('grouping');

    if (subjectId && groupingId) {
      setCurrentPage({ type: 'grouping', subjectId, groupingId });
    } else if (subjectId) {
      setCurrentPage({ type: 'subject', subjectId });
    }
  }, []);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (loading || dbError) return;

    console.log('Setting up real-time subscriptions...');

    // Subscribe to subjects table
    const subjectsChannel = supabase
      .channel('subjects-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subjects' },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Subjects change received:', payload);

          if (payload.eventType === 'INSERT') {
            const newSubject = await db.fetchSubjects();
            const inserted = newSubject.find((s: Subject) => s.id === payload.new.id);
            if (inserted) {
              setSubjects((prev) => {
                if (prev.some(s => s.id === inserted.id)) return prev;
                return [...prev, inserted];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedSubjects = await db.fetchSubjects();
            const updated = updatedSubjects.find((s: Subject) => s.id === payload.new.id);
            if (updated) {
              setSubjects((prev) => prev.map((s) => s.id === updated.id ? updated : s));
            }
          } else if (payload.eventType === 'DELETE') {
            setSubjects((prev) => prev.filter((s) => s.id !== payload.old.id));
            setGroupings((prev) => prev.filter((g) => g.subjectId !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to students table
    const studentsChannel = supabase
      .channel('students-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        async () => {
          console.log('Students change received, reloading subjects...');
          // Reload all subjects to get updated students
          const updatedSubjects = await db.fetchSubjects();
          setSubjects(updatedSubjects);
        }
      )
      .subscribe();

    // Subscribe to groupings table
    const groupingsChannel = supabase
      .channel('groupings-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groupings' },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Groupings change received:', payload);

          if (payload.eventType === 'INSERT') {
            const newGrouping: Grouping = {
              id: payload.new.id,
              subjectId: payload.new.subject_id,
              title: payload.new.title,
              color: payload.new.color,
              locked: payload.new.locked,
            };
            setGroupings((prev) => {
              if (prev.some(g => g.id === newGrouping.id)) return prev;
              return [...prev, newGrouping];
            });
          } else if (payload.eventType === 'UPDATE') {
            setGroupings((prev) =>
              prev.map((g) =>
                g.id === payload.new.id
                  ? {
                    ...g,
                    title: payload.new.title,
                    color: payload.new.color,
                    locked: payload.new.locked,
                  }
                  : g
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setGroupings((prev) => prev.filter((g) => g.id !== payload.old.id));
            setGroups((prev) => prev.filter((gr) => gr.groupingId !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to groups table
    const groupsChannel = supabase
      .channel('groups-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groups' },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Groups change received:', payload);

          if (payload.eventType === 'INSERT') {
            const newGroup: Group = {
              id: payload.new.id,
              groupingId: payload.new.grouping_id,
              name: payload.new.name,
              members: [],
              memberLimit: payload.new.member_limit,
              representative: payload.new.representative || undefined,
            };
            setGroups((prev) => {
              const exists = prev.some(g => g.id === newGroup.id);
              if (exists) {
                console.log(`Group ${newGroup.id} already exists, skipping duplicate`);
                return prev;
              }
              console.log(`Adding new group via realtime: ${newGroup.id} - ${newGroup.name}`);
              return [...prev, newGroup];
            });
          } else if (payload.eventType === 'UPDATE') {
            setGroups((prev) =>
              prev.map((g) =>
                g.id === payload.new.id
                  ? {
                    ...g,
                    name: payload.new.name,
                    memberLimit: payload.new.member_limit,
                    representative: payload.new.representative || undefined,
                  }
                  : g
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setGroups((prev) => prev.filter((g) => g.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to group_members table
    const groupMembersChannel = supabase
      .channel('group-members-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members' },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Group members change received:', payload);

          if (payload.eventType === 'INSERT') {
            setGroups((prev) =>
              prev.map((g) =>
                g.id === payload.new.group_id
                  ? {
                    ...g,
                    // Only add if not already present (prevent duplicates)
                    members: g.members.includes(payload.new.member_name)
                      ? g.members
                      : [...g.members, payload.new.member_name],
                  }
                  : g
              )
            );
          } else if (payload.eventType === 'DELETE') {
            console.log('Member removed, reloading groups to ensure sync...');
            // Since DELETE payload might not contain detailed info (only ID) depending on Replica Identity,
            // and our local state only stores member names (not IDs), we can't easily identify which group/member to remove.
            // fetching fresh data is the most robust fix.
            const updatedGroups = await db.fetchGroups();
            setGroups(updatedGroups);
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up real-time subscriptions...');
      subjectsChannel.unsubscribe();
      studentsChannel.unsubscribe();
      groupingsChannel.unsubscribe();
      groupsChannel.unsubscribe();
      groupMembersChannel.unsubscribe();
    };
  }, [loading, dbError]);



  const loadAllData = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const [subjectsData, groupingsData, groupsData] =
        await Promise.all([
          db.fetchSubjects(),
          db.fetchGroupings(),
          db.fetchGroups(),
        ]);

      setSubjects(subjectsData);
      setGroupings(groupingsData);
      setGroups(groupsData);
    } catch (error: any) {
      console.error("Error loading data:", error);

      // Check if it's a table not found error
      if (
        error?.message?.includes("Could not find the table") ||
        error?.code === "PGRST205"
      ) {
        setDbError("database_not_initialized");
      } else {
        setDbError("connection_error");
        toast.error(
          "Failed to load data. Please refresh the page.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Subject handlers
  const handleCreateSubject = async (
    name: string,
    color: string,
    icon: string,
  ) => {
    const newSubject = await db.createSubject(
      name,
      color,
      icon,
    );
    if (newSubject) {
      setSubjects([...subjects, newSubject]);
      toast.success(`${name} created successfully!`);
    } else {
      toast.error("Failed to create subject");
    }
  };

  const handleUpdateSubject = async (
    id: string,
    updates: { name?: string; color?: string; icon?: string },
  ) => {
    const success = await db.updateSubject(id, updates);
    if (success) {
      setSubjects(
        subjects.map((s) =>
          s.id === id ? { ...s, ...updates } : s,
        ),
      );
      toast.success("Subject updated successfully!");
    } else {
      toast.error("Failed to update subject");
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const success = await db.deleteSubject(id);
    if (success) {
      setSubjects(subjects.filter((s) => s.id !== id));
      setGroupings(groupings.filter((g) => g.subjectId !== id));
      navigateToPage({ type: "home" });
      toast.success("Subject deleted successfully");
    } else {
      toast.error("Failed to delete subject");
    }
  };

  // Student handlers
  const handleAddStudent = async (
    subjectId: string,
    studentName: string,
  ) => {
    const newStudent = await db.addStudentToSubject(
      subjectId,
      studentName,
    );
    if (newStudent) {
      setSubjects(
        subjects.map((s) =>
          s.id === subjectId
            ? { ...s, students: [...s.students, newStudent] }
            : s,
        ),
      );
      // Toast is now handled in StudentManagement component
    } else {
      toast.error("Failed to add student");
    }
  };

  const handleBatchAddStudents = async (
    subjectId: string,
    studentNames: string[],
  ) => {
    const success = await db.batchAddStudents(
      subjectId,
      studentNames,
    );
    if (success) {
      // Reload subjects to get updated student list
      const subjectsData = await db.fetchSubjects();
      setSubjects(subjectsData);
    } else {
      toast.error("Failed to add students");
    }
  };

  const handleRemoveStudent = async (
    subjectId: string,
    studentId: string,
  ) => {
    const success =
      await db.removeStudentFromSubject(studentId);
    if (success) {
      setSubjects(
        subjects.map((s) =>
          s.id === subjectId
            ? {
              ...s,
              students: s.students.filter(
                (student) => student.id !== studentId,
              ),
            }
            : s,
        ),
      );
    } else {
      toast.error("Failed to remove student");
    }
  };

  // Grouping handlers
  const handleCreateGrouping = async (
    subjectId: string,
    title: string,
    color: string,
  ) => {
    const newGrouping = await db.createGrouping(
      subjectId,
      title,
      color,
    );
    if (newGrouping) {
      setGroupings([...groupings, newGrouping]);
      toast.success(`${title} created successfully!`);
    } else {
      toast.error("Failed to create grouping");
    }
  };

  const handleToggleGroupingLock = async (
    groupingId: string,
  ) => {
    const grouping = groupings.find((g) => g.id === groupingId);
    if (!grouping) return;

    const success = await db.toggleGroupingLock(
      groupingId,
      grouping.locked || false,
    );
    if (success) {
      setGroupings(
        groupings.map((g) =>
          g.id === groupingId ? { ...g, locked: !g.locked } : g,
        ),
      );
    } else {
      toast.error("Failed to toggle lock");
    }
  };

  const handleDeleteGrouping = async (groupingId: string) => {
    const success = await db.deleteGrouping(groupingId);
    if (success) {
      setGroupings(
        groupings.filter((g) => g.id !== groupingId),
      );
      setGroups(
        groups.filter((g) => g.groupingId !== groupingId),
      );
    } else {
      toast.error("Failed to delete grouping");
    }
  };

  const handleUpdateGrouping = async (
    groupingId: string,
    updates: { title?: string; color?: string }
  ) => {
    const success = await db.updateGrouping(groupingId, updates);
    if (success) {
      setGroupings(
        groupings.map((g) =>
          g.id === groupingId ? { ...g, ...updates } : g
        ),
      );
      toast.success("Grouping updated successfully!");
    } else {
      toast.error("Failed to update grouping");
    }
  };

  // Group handlers
  const handleCreateGroup = async (
    groupingId: string,
    groupName: string,
    memberLimit: number,
  ) => {
    const newGroup = await db.createGroup(
      groupingId,
      groupName,
      memberLimit,
    );
    if (newGroup) {
      console.log(`Created group in DB: ${newGroup.id} - ${newGroup.name}`);
      // Don't update local state - let real-time subscription handle it
      // This prevents duplicates from race conditions
      // Don't log group creation to keep history focused on member changes
      toast.success(`${groupName} created successfully!`);
    } else {
      toast.error("Failed to create group");
    }
  };

  const handleJoinGroup = async (
    groupId: string,
    memberName: string,
  ) => {
    const success = await db.addMemberToGroup(
      groupId,
      memberName,
    );
    if (success) {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        // Log history
        await db.logGroupHistory(
          group.groupingId,
          groupId,
          'member_added',
          group.name,
          memberName,
          null,
          isAdmin ? 'admin' : 'user'
        );
      }
      // Update local state for immediate feedback
      // Real-time subscription will also fire, but has duplicate prevention
      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === groupId
            ? {
              ...g,
              members: g.members.includes(memberName)
                ? g.members
                : [...g.members, memberName]
            }
            : g,
        ),
      );
    } else {
      toast.error("Failed to join group");
    }
  };

  const handleBatchJoinGroup = async (
    groupId: string,
    memberNames: string[],
  ) => {
    const success = await db.batchAddMembersToGroup(
      groupId,
      memberNames,
    );
    if (success) {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        // Log history for each member
        for (const memberName of memberNames) {
          await db.logGroupHistory(
            group.groupingId,
            groupId,
            'member_added',
            group.name,
            memberName,
            null,
            isAdmin ? 'admin' : 'user'
          );
        }
      }
      // Update local state for immediate feedback
      // Real-time subscription will also fire, but has duplicate prevention
      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === groupId
            ? {
              ...g,
              members: [
                ...g.members,
                ...memberNames.filter(name => !g.members.includes(name))
              ]
            }
            : g,
        ),
      );
    } else {
      toast.error("Failed to add members");
    }
  };

  const handleUpdateGroup = async (
    groupId: string,
    updatedGroup: Partial<Group>,
  ) => {
    const success = await db.updateGroup(groupId, updatedGroup);
    if (success) {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        // Check if representative was SET (not removed)
        if (updatedGroup.representative !== undefined && updatedGroup.representative !== null) {
          // Representative set
          await db.logGroupHistory(
            group.groupingId,
            groupId,
            'representative_set',
            group.name,
            updatedGroup.representative,
            null,
            isAdmin ? 'admin' : 'user'
          );
        }
        // Don't log representative removal or other updates
      }

      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === groupId ? { ...g, ...updatedGroup } : g,
        ),
      );
    } else {
      toast.error("Failed to update group");
    }
  };

  const handleRemoveMember = async (
    groupId: string,
    memberName: string,
  ) => {
    const success = await db.removeMemberFromGroup(
      groupId,
      memberName,
    );
    if (success) {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        // Log history
        await db.logGroupHistory(
          group.groupingId,
          groupId,
          'member_removed',
          group.name,
          memberName,
          null,
          isAdmin ? 'admin' : 'user'
        );
      }
      // Update local state for immediate feedback
      // Real-time subscription will also fire for other users
      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === groupId
            ? {
              ...g,
              members: g.members.filter(
                (m) => m !== memberName,
              ),
            }
            : g,
        ),
      );
    } else {
      toast.error("Failed to remove member");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const success = await db.deleteGroup(groupId);
    if (success) {
      // Don't log group deletion to keep history focused on member changes
      setGroups((prevGroups) => prevGroups.filter((g) => g.id !== groupId));
    } else {
      toast.error("Failed to delete group");
    }
  };

  const handleDeleteAllGroups = async (groupingId: string) => {
    const success = await db.deleteAllGroupsInGrouping(groupingId);
    if (success) {
      // Remove all groups for this grouping from state
      setGroups((prevGroups) => prevGroups.filter((g) => g.groupingId !== groupingId));
      toast.success("All groups removed successfully!");
    } else {
      toast.error("Failed to remove all groups");
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading Groupings Tracker...
          </p>
        </div>
      </div>
    );
  }

  // Render database setup error
  if (dbError === "database_not_initialized") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-amber-600 dark:text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-slate-900 dark:text-slate-100 mb-2">
              Database Not Set Up
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              The database tables haven't been created yet.
              Follow these steps to get started:
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                  1
                </div>
                <div>
                  <p className="text-slate-900 dark:text-slate-100">
                    Go to your Supabase project dashboard
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Visit{" "}
                    <a
                      href="https://app.supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      app.supabase.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <p className="text-slate-900 dark:text-slate-100">
                    Click "SQL Editor" in the left sidebar
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <div>
                  <p className="text-slate-900 dark:text-slate-100">
                    Click "New query"
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                  4
                </div>
                <div>
                  <p className="text-slate-900 dark:text-slate-100">
                    Copy the migration SQL
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    File:{" "}
                    <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                      /supabase/migrations/001_initial_schema.sql
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                  5
                </div>
                <div>
                  <p className="text-slate-900 dark:text-slate-100">
                    Paste and run the SQL
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Click "Run" or press Ctrl+Enter
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                  6
                </div>
                <div>
                  <p className="text-slate-900 dark:text-slate-100">
                    Refresh this page
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    The app should load successfully
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() =>
                window.open(
                  "https://app.supabase.com",
                  "_blank",
                )
              }
              className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 px-4 py-2 rounded-md transition-colors"
            >
              Open Supabase
            </button>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              📚 For detailed instructions, see{" "}
              <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                GETTING_STARTED.md
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get current subject and grouping names for the navbar
  const getCurrentPageInfo = () => {
    if (currentPage.type === 'grouping') {
      const subject = subjects.find(s => s.id === currentPage.subjectId);
      const grouping = groupings.find(g => g.id === currentPage.groupingId);
      return {
        subjectName: subject?.name,
        groupingTitle: grouping?.title,
      };
    }
    return {};
  };

  const { subjectName, groupingTitle } = getCurrentPageInfo();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar
        isAdmin={isAdmin}
        onToggleAdmin={(value) => setIsAdmin(value)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={(value) => setIsDarkMode(value)}
        onNavigateHome={() => navigateToPage({ type: "home" })}
        currentPage={currentPage}
        subjectName={subjectName}
        groupingTitle={groupingTitle}
      />
      <main className="container mx-auto px-4 py-8 max-w-7xl flex-1">
        {currentPage.type === "home" && (
          <SubjectsPage
            subjects={subjects}
            onNavigate={(page) => navigateToPage(page)}
            onCreateSubject={handleCreateSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onAddStudent={handleAddStudent}
            onBatchAddStudents={handleBatchAddStudents}
            onRemoveStudent={handleRemoveStudent}
            isAdmin={isAdmin}
          />
        )}
        {currentPage.type === "subject" &&
          (() => {
            const subject = subjects.find(
              (s) => s.id === currentPage.subjectId,
            );
            const subjectGroupings = groupings.filter(
              (g) => g.subjectId === currentPage.subjectId,
            );

            if (!subject) {
              navigateToPage({ type: "home" });
              return null;
            }

            return (
              <SubjectPage
                subject={subject}
                groupings={subjectGroupings}
                onNavigate={(page) => navigateToPage(page)}
                onCreateGrouping={handleCreateGrouping}
                onUpdateGrouping={handleUpdateGrouping}
                onDeleteGrouping={handleDeleteGrouping}
                onBack={() => navigateToPage({ type: "home" })}
                isAdmin={isAdmin}
              />
            );
          })()}
        {currentPage.type === "grouping" &&
          (() => {
            const subject = subjects.find(
              (s) => s.id === currentPage.subjectId,
            );
            const grouping = groupings.find(
              (g) => g.id === currentPage.groupingId,
            );
            // Filter and deduplicate groups for this grouping
            const groupingGroups = groups
              .filter((g) => g.groupingId === currentPage.groupingId)
              .reduce((unique: Group[], group) => {
                if (!unique.some(g => g.id === group.id)) {
                  unique.push(group);
                }
                return unique;
              }, []);

            if (!subject || !grouping) {
              navigateToPage({
                type: "subject",
                subjectId: currentPage.subjectId,
              });
              return null;
            }

            return (
              <GroupingPage
                subject={subject}
                grouping={grouping}
                groups={groupingGroups}
                students={subject.students}
                onCreateGroup={handleCreateGroup}
                onJoinGroup={handleJoinGroup}
                onBatchJoinGroup={handleBatchJoinGroup}
                onUpdateGroup={handleUpdateGroup}
                onRemoveMember={handleRemoveMember}
                onDeleteGroup={handleDeleteGroup}
                onDeleteAllGroups={handleDeleteAllGroups}
                onBack={() =>
                  navigateToPage({
                    type: "subject",
                    subjectId: currentPage.subjectId,
                  })
                }
                isAdmin={isAdmin}
                onToggleGroupingLock={handleToggleGroupingLock}
              />
            );
          })()}
      </main>
      <Footer />
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;