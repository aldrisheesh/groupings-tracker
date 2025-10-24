import { useState, useEffect } from "react";
import { ChevronLeft, Lock, Unlock, Download } from "lucide-react";
import { Subject, Grouping, Group, Student, GroupHistory as GroupHistoryType } from "../App";
import { GroupCard } from "./GroupCard";
import { CreateGroupForm } from "./CreateGroupForm";
import { StudentAvailability } from "./StudentAvailability";
import { GroupHistory } from "./GroupHistory";
import { Button } from "./ui/button";
import { toast } from "sonner@2.0.3";
import { Badge } from "./ui/badge";
import { exportGroupsToCSV } from "../utils/csvExport";
import * as db from "../utils/supabase/database";
import { supabase } from "../utils/supabase/client";

interface GroupingPageProps {
  subject: Subject;
  grouping: Grouping;
  groups: Group[];
  students: Student[];
  onCreateGroup: (groupingId: string, groupName: string, memberLimit: number) => void;
  onJoinGroup: (groupId: string, memberName: string) => void;
  onBatchJoinGroup: (groupId: string, memberNames: string[]) => void;
  onUpdateGroup: (groupId: string, updatedGroup: Partial<Group>) => void;
  onRemoveMember: (groupId: string, memberName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onBack: () => void;
  isAdmin: boolean;
  onToggleGroupingLock: (groupingId: string) => void;
}

// Helper function to normalize text for fuzzy matching
const normalizeForMatching = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};

// Fuzzy matching: check if two names are similar
// "Santos, Roi" should match "Santos, Roi Aldrich"
const fuzzyMatchNames = (name1: string, name2: string): boolean => {
  const normalized1 = normalizeForMatching(name1);
  const normalized2 = normalizeForMatching(name2);
  
  // Split by comma to get last name and first name
  const parts1 = normalized1.split(',').map(p => p.trim());
  const parts2 = normalized2.split(',').map(p => p.trim());
  
  // Both must have last name and first name
  if (parts1.length !== 2 || parts2.length !== 2) {
    // Fallback to simple string matching
    return normalized1 === normalized2;
  }
  
  const [last1, first1] = parts1;
  const [last2, first2] = parts2;
  
  // Last names must match exactly
  if (last1 !== last2) {
    return false;
  }
  
  // First names: check if one contains the other (bidirectional)
  // This handles "Roi" matching "Roi Aldrich" and vice versa
  return first1.includes(first2) || first2.includes(first1);
};

export function GroupingPage({
  subject,
  grouping,
  groups,
  students,
  onCreateGroup,
  onJoinGroup,
  onBatchJoinGroup,
  onUpdateGroup,
  onRemoveMember,
  onDeleteGroup,
  onBack,
  isAdmin,
  onToggleGroupingLock,
}: GroupingPageProps) {
  const [highlightedGroupId, setHighlightedGroupId] = useState<string | null>(null);
  const [groupHistory, setGroupHistory] = useState<GroupHistoryType[]>([]);

  useEffect(() => {
    const fetchGroupHistory = async () => {
      const history = await db.fetchGroupHistory(grouping.id);
      setGroupHistory(history);
    };

    fetchGroupHistory();

    // Set up real-time subscription for group_history
    const historyChannel = supabase
      .channel(`group-history-${grouping.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'group_history',
          filter: `grouping_id=eq.${grouping.id}`
        },
        (payload: any) => {
          console.log('Group history change received:', payload);
          // Add new history entry to the list
          const newEntry = {
            id: payload.new.id,
            groupingId: payload.new.grouping_id,
            groupId: payload.new.group_id,
            actionType: payload.new.action_type,
            groupName: payload.new.group_name,
            memberName: payload.new.member_name,
            details: payload.new.details,
            performedBy: payload.new.performed_by,
            createdAt: payload.new.created_at,
          };
          setGroupHistory((prev) => [newEntry, ...prev].slice(0, 100)); // Keep only last 100 entries
        }
      )
      .subscribe((status) => {
        console.log('History subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from history channel');
      historyChannel.unsubscribe();
    };
  }, [grouping.id]);

  // Refetch history when groups change (as a fallback for real-time)
  useEffect(() => {
    const refetchHistory = async () => {
      const history = await db.fetchGroupHistory(grouping.id);
      setGroupHistory(history);
    };
    refetchHistory();
  }, [groups, grouping.id]);

  const handleJoinGroup = (groupId: string, memberName: string) => {
    // Check if member is already in ANY group using fuzzy matching
    for (const group of groups) {
      for (const existingMember of group.members) {
        if (fuzzyMatchNames(memberName, existingMember)) {
          // Highlight the existing group
          setHighlightedGroupId(group.id);
          
          // Show improved error toast with icon
          toast.error(
            `${memberName} is already in ${group.name} (as "${existingMember}")`,
            {
              duration: 6000,
              icon: "⚠️",
            }
          );

          // Scroll to the highlighted group
          setTimeout(() => {
            const element = document.getElementById(`group-${group.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);

          // Remove highlight after 6 seconds
          setTimeout(() => {
            setHighlightedGroupId(null);
          }, 6000);

          return;
        }
      }
    }

    // If not in any group, proceed with joining
    const joinedGroup = groups.find(g => g.id === groupId);
    if (joinedGroup) {
      toast.success(`Successfully joined ${joinedGroup.name}! ${memberName} has been added to the group.`);
    }
    onJoinGroup(groupId, memberName);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2 -ml-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to {subject.name}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-500 flex-wrap">
              <span>{subject.name}</span>
              <span>—</span>
              <span>{grouping.title}</span>
              {grouping.locked && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Locked
                </Badge>
              )}
            </div>
            <StudentAvailability students={students} groups={groups} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* History Button for all users */}
            <GroupHistory 
              groupingId={grouping.id}
              history={groupHistory}
              isAdmin={isAdmin}
            />

            {/* Admin-only buttons */}
            {isAdmin && (
              <>
                <Button
                  onClick={() => {
                    if (groups.length === 0) {
                      toast.error("No groups to export");
                      return;
                    }
                    exportGroupsToCSV(groups, subject.name, grouping.title);
                    toast.success("Groups exported to CSV successfully!");
                  }}
                  variant="outline"
                  className="gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>

                <Button
                  onClick={() => {
                    onToggleGroupingLock(grouping.id);
                    toast.success(grouping.locked ? "Grouping unlocked" : "Grouping locked");
                  }}
                  variant="outline"
                  className="gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {grouping.locked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Lock
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-slate-700 dark:text-slate-300">Existing Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group.id} id={`group-${group.id}`}>
                <GroupCard
                  group={group}
                  students={students}
                  allGroups={groups}
                  onJoinGroup={handleJoinGroup}
                  onBatchJoinGroup={onBatchJoinGroup}
                  onUpdateGroup={onUpdateGroup}
                  onRemoveMember={onRemoveMember}
                  onDeleteGroup={onDeleteGroup}
                  isAdmin={isAdmin}
                  isLocked={grouping.locked || false}
                  highlighted={highlightedGroupId === group.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
          <CreateGroupForm
            groupingId={grouping.id}
            onCreateGroup={onCreateGroup}
          />
        </div>
      )}
    </div>
  );
}