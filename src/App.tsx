import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { SubjectsPage } from "./components/SubjectsPage";
import { SubjectPage } from "./components/SubjectPage";
import { GroupingPage } from "./components/GroupingPage";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import * as db from "./utils/supabase/database";
import { useRealtime } from "./hooks/useRealtime";

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

export type Page =
  | { type: "home" }
  | { type: "subject"; subjectId: string }
  | { type: "grouping"; subjectId: string; groupingId: string };

function App() {
  const [currentPage, setCurrentPage] = useState<Page>({
    type: "home",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Apply dark mode class to document
  if (isDarkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  // Data from Supabase
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groupings, setGroupings] = useState<Grouping[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  useRealtime({
    table: "subjects",
    onInsert: (payload) => {
      const newRow = payload.new as {
        id: string;
        name: string;
        color: string;
        icon: string;
      } | null;

      if (!newRow) {
        return;
      }

      const newSubject: Subject = {
        id: newRow.id,
        name: newRow.name,
        color: newRow.color,
        icon: newRow.icon,
        students: [],
      };

      setSubjects((prev) => {
        const existingIndex = prev.findIndex((subject) => subject.id === newSubject.id);
        if (existingIndex !== -1) {
          return prev.map((subject) =>
            subject.id === newSubject.id
              ? {
                  ...subject,
                  name: newSubject.name,
                  color: newSubject.color,
                  icon: newSubject.icon,
                }
              : subject,
          );
        }

        return [newSubject, ...prev];
      });
    },
    onUpdate: (payload) => {
      const updatedRow = payload.new as {
        id: string;
        name: string;
        color: string;
        icon: string;
      } | null;

      if (!updatedRow) {
        return;
      }

      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === updatedRow.id
            ? {
                ...subject,
                name: updatedRow.name,
                color: updatedRow.color,
                icon: updatedRow.icon,
              }
            : subject,
        ),
      );
    },
    onDelete: (payload) => {
      const removedRow = payload.old as { id: string } | null;
      if (!removedRow) {
        return;
      }

      const groupingIdsToRemove = groupings
        .filter((grouping) => grouping.subjectId === removedRow.id)
        .map((grouping) => grouping.id);

      setSubjects((prev) => prev.filter((subject) => subject.id !== removedRow.id));
      setGroupings((prev) => prev.filter((grouping) => grouping.subjectId !== removedRow.id));
      setGroups((prev) =>
        prev.filter((group) => !groupingIdsToRemove.includes(group.groupingId)),
      );
      setCurrentPage((prev) => {
        if (prev.type === "subject" && prev.subjectId === removedRow.id) {
          return { type: "home" };
        }
        if (prev.type === "grouping" && prev.subjectId === removedRow.id) {
          return { type: "home" };
        }
        return prev;
      });
    },
  });

  useRealtime({
    table: "students",
    onInsert: (payload) => {
      const newRow = payload.new as {
        id: string;
        subject_id: string;
        name: string;
      } | null;

      if (!newRow) {
        return;
      }

      const newStudent: Student = {
        id: newRow.id,
        name: newRow.name,
      };

      setSubjects((prev) =>
        prev.map((subject) => {
          if (subject.id !== newRow.subject_id) {
            return subject;
          }

          const alreadyExists = subject.students.some(
            (student) => student.id === newStudent.id,
          );

          if (alreadyExists) {
            return subject;
          }

          return {
            ...subject,
            students: [...subject.students, newStudent],
          };
        }),
      );
    },
    onUpdate: (payload) => {
      const newRow = payload.new as {
        id: string;
        subject_id: string;
        name: string;
      } | null;
      const oldRow = payload.old as {
        id: string;
        subject_id: string;
        name?: string;
      } | null;

      if (!newRow || !oldRow) {
        return;
      }

      const updatedStudent: Student = {
        id: newRow.id,
        name: newRow.name,
      };

      setSubjects((prev) =>
        prev.map((subject) => {
          let students = subject.students;

          if (subject.id === oldRow.subject_id && oldRow.subject_id !== newRow.subject_id) {
            students = students.filter((student) => student.id !== oldRow.id);
          }

          if (subject.id === newRow.subject_id) {
            const withoutUpdated = students.filter((student) => student.id !== newRow.id);
            students = [...withoutUpdated, updatedStudent];
          }

          if (students !== subject.students) {
            return {
              ...subject,
              students,
            };
          }

          return subject;
        }),
      );
    },
    onDelete: (payload) => {
      const oldRow = payload.old as {
        id: string;
        subject_id: string;
      } | null;

      if (!oldRow) {
        return;
      }

      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === oldRow.subject_id
            ? {
                ...subject,
                students: subject.students.filter((student) => student.id !== oldRow.id),
              }
            : subject,
        ),
      );
    },
  });

  useRealtime({
    table: "groupings",
    onInsert: (payload) => {
      const newRow = payload.new as {
        id: string;
        subject_id: string;
        title: string;
        locked: boolean | null;
      } | null;

      if (!newRow) {
        return;
      }

      const newGrouping: Grouping = {
        id: newRow.id,
        subjectId: newRow.subject_id,
        title: newRow.title,
        locked: newRow.locked ?? undefined,
      };

      setGroupings((prev) => {
        const exists = prev.some((grouping) => grouping.id === newGrouping.id);
        if (exists) {
          return prev.map((grouping) =>
            grouping.id === newGrouping.id ? { ...grouping, ...newGrouping } : grouping,
          );
        }

        return [newGrouping, ...prev];
      });
    },
    onUpdate: (payload) => {
      const newRow = payload.new as {
        id: string;
        subject_id: string;
        title: string;
        locked: boolean | null;
      } | null;

      if (!newRow) {
        return;
      }

      setGroupings((prev) =>
        prev.map((grouping) =>
          grouping.id === newRow.id
            ? {
                ...grouping,
                subjectId: newRow.subject_id,
                title: newRow.title,
                locked: newRow.locked ?? undefined,
              }
            : grouping,
        ),
      );
    },
    onDelete: (payload) => {
      const oldRow = payload.old as {
        id: string;
        subject_id: string;
      } | null;

      if (!oldRow) {
        return;
      }

      setGroupings((prev) => prev.filter((grouping) => grouping.id !== oldRow.id));
      setGroups((prev) => prev.filter((group) => group.groupingId !== oldRow.id));
      setCurrentPage((prev) => {
        if (prev.type === "grouping" && prev.groupingId === oldRow.id) {
          return { type: "subject", subjectId: oldRow.subject_id };
        }

        return prev;
      });
    },
  });

  useRealtime({
    table: "groups",
    onInsert: (payload) => {
      const newRow = payload.new as {
        id: string;
        grouping_id: string;
        name: string;
        member_limit: number;
        representative: string | null;
      } | null;

      if (!newRow) {
        return;
      }

      const newGroup: Group = {
        id: newRow.id,
        groupingId: newRow.grouping_id,
        name: newRow.name,
        members: [],
        memberLimit: newRow.member_limit,
        representative: newRow.representative ?? undefined,
      };

      setGroups((prev) => {
        const existing = prev.find((group) => group.id === newGroup.id);
        if (existing) {
          return prev.map((group) =>
            group.id === newGroup.id
              ? {
                  ...existing,
                  groupingId: newGroup.groupingId,
                  name: newGroup.name,
                  memberLimit: newGroup.memberLimit,
                  representative: newGroup.representative,
                }
              : group,
          );
        }

        return [...prev, newGroup];
      });
    },
    onUpdate: (payload) => {
      const newRow = payload.new as {
        id: string;
        grouping_id: string;
        name: string;
        member_limit: number;
        representative: string | null;
      } | null;

      if (!newRow) {
        return;
      }

      setGroups((prev) =>
        prev.map((group) =>
          group.id === newRow.id
            ? {
                ...group,
                groupingId: newRow.grouping_id,
                name: newRow.name,
                memberLimit: newRow.member_limit,
                representative: newRow.representative ?? undefined,
              }
            : group,
        ),
      );
    },
    onDelete: (payload) => {
      const oldRow = payload.old as { id: string } | null;
      if (!oldRow) {
        return;
      }

      setGroups((prev) => prev.filter((group) => group.id !== oldRow.id));
    },
  });

  useRealtime({
    table: "group_members",
    onInsert: (payload) => {
      const newRow = payload.new as {
        id: string;
        group_id: string;
        member_name: string;
      } | null;

      if (!newRow) {
        return;
      }

      setGroups((prev) =>
        prev.map((group) => {
          if (group.id !== newRow.group_id) {
            return group;
          }

          if (group.members.includes(newRow.member_name)) {
            return group;
          }

          return {
            ...group,
            members: [...group.members, newRow.member_name],
          };
        }),
      );
    },
    onUpdate: (payload) => {
      const newRow = payload.new as {
        id: string;
        group_id: string;
        member_name: string;
      } | null;
      const oldRow = payload.old as {
        id: string;
        group_id: string;
        member_name: string;
      } | null;

      if (!newRow || !oldRow) {
        return;
      }

      setGroups((prev) =>
        prev.map((group) => {
          let members = group.members;

          if (group.id === oldRow.group_id) {
            members = members.filter((member) => member !== oldRow.member_name);
          }

          if (group.id === newRow.group_id) {
            const withoutDuplicate = members.filter(
              (member) => member !== newRow.member_name,
            );
            members = [...withoutDuplicate, newRow.member_name];
          }

          if (members !== group.members) {
            return {
              ...group,
              members,
            };
          }

          return group;
        }),
      );
    },
    onDelete: async (payload) => {
      const oldRow = payload.old as {
        group_id: string;
        member_name?: string | null;
      } | null;

      if (!oldRow?.group_id) {
        return;
      }

      if (oldRow.member_name) {
        setGroups((prev) =>
          prev.map((group) =>
            group.id === oldRow.group_id
              ? {
                  ...group,
                  members: group.members.filter((member) => member !== oldRow.member_name),
                }
              : group,
          ),
        );
        return;
      }

      const members = await db.fetchGroupMembers(oldRow.group_id);
      if (!members) {
        return;
      }

      setGroups((prev) =>
        prev.map((group) =>
          group.id === oldRow.group_id
            ? {
                ...group,
                members,
              }
            : group,
        ),
      );
    },
  });

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
      setCurrentPage({ type: "home" });
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
  ) => {
    const newGrouping = await db.createGrouping(
      subjectId,
      title,
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
      setGroups([...groups, newGroup]);
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
      setGroups(
        groups.map((g) =>
          g.id === groupId
            ? { ...g, members: [...g.members, memberName] }
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
      setGroups(
        groups.map((g) =>
          g.id === groupId
            ? { ...g, members: [...g.members, ...memberNames] }
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
      setGroups(
        groups.map((g) =>
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
      setGroups((prev) =>
        prev.map((g) =>
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
      setGroups(groups.filter((g) => g.id !== groupId));
    } else {
      toast.error("Failed to delete group");
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        isAdmin={isAdmin}
        onToggleAdmin={(value) => setIsAdmin(value)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={(value) => setIsDarkMode(value)}
        onNavigateHome={() => setCurrentPage({ type: "home" })}
      />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {currentPage.type === "home" && (
          <SubjectsPage
            subjects={subjects}
            onNavigate={(page) => setCurrentPage(page)}
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
              setCurrentPage({ type: "home" });
              return null;
            }

            return (
              <SubjectPage
                subject={subject}
                groupings={subjectGroupings}
                onNavigate={(page) => setCurrentPage(page)}
                onCreateGrouping={handleCreateGrouping}
                onBack={() => setCurrentPage({ type: "home" })}
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
            const groupingGroups = groups.filter(
              (g) => g.groupingId === currentPage.groupingId,
            );

            if (!subject || !grouping) {
              setCurrentPage({
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
                onBack={() =>
                  setCurrentPage({
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
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;