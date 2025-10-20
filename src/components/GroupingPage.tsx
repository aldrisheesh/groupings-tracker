import { useState } from "react";
import { ChevronLeft, Lock, Unlock } from "lucide-react";
import { Subject, Grouping, Group, Student } from "../App";
import { GroupCard } from "./GroupCard";
import { CreateGroupForm } from "./CreateGroupForm";
import { StudentAvailability } from "./StudentAvailability";
import { Button } from "./ui/button";
import { toast } from "sonner@2.0.3";
import { Badge } from "./ui/badge";

interface GroupingPageProps {
  subject: Subject;
  grouping: Grouping;
  groups: Group[];
  students: Student[];
  onCreateGroup: (groupingId: string, groupName: string, memberLimit: number) => void;
  onJoinGroup: (groupId: string, memberName: string) => void;
  onUpdateGroup: (groupId: string, updatedGroup: Partial<Group>) => void;
  onRemoveMember: (groupId: string, memberName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onBack: () => void;
  isAdmin: boolean;
  onToggleGroupingLock: (groupingId: string) => void;
}

export function GroupingPage({
  subject,
  grouping,
  groups,
  students,
  onCreateGroup,
  onJoinGroup,
  onUpdateGroup,
  onRemoveMember,
  onDeleteGroup,
  onBack,
  isAdmin,
  onToggleGroupingLock,
}: GroupingPageProps) {
  const [highlightedGroupId, setHighlightedGroupId] = useState<string | null>(null);

  const handleJoinGroup = (groupId: string, memberName: string) => {
    // Check if member is already in another group
    const existingGroup = groups.find(g => 
      g.members.some(m => m.toLowerCase() === memberName.toLowerCase())
    );

    if (existingGroup) {
      // Highlight the existing group
      setHighlightedGroupId(existingGroup.id);
      
      // Show improved error toast with icon
      toast.error(
        `${memberName} is already in ${existingGroup.name}`,
        {
          duration: 6000,
          icon: "⚠️",
        }
      );

      // Scroll to the highlighted group
      setTimeout(() => {
        const element = document.getElementById(`group-${existingGroup.id}`);
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

    // If not in any group, proceed with joining
    onJoinGroup(groupId, memberName);
    
    // Show success toast
    const joinedGroup = groups.find(g => g.id === groupId);
    if (joinedGroup) {
      toast.success(`Successfully joined ${joinedGroup.name}!`, {
        description: `${memberName} has been added to the group.`,
        icon: "✓",
      });
    }
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
            {isAdmin && (
              <Button
                onClick={() => {
                  onToggleGroupingLock(grouping.id);
                  toast.success(grouping.locked ? "Grouping unlocked" : "Grouping locked");
                }}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                {grouping.locked ? (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Unlock Grouping
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Lock Grouping
                  </>
                )}
              </Button>
            )}
          </div>
          <StudentAvailability students={students} groups={groups} />
        </div>
      </div>

      {groups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-slate-700 dark:text-slate-300">Existing Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onJoinGroup={handleJoinGroup}
                onUpdateGroup={onUpdateGroup}
                onRemoveMember={onRemoveMember}
                onDeleteGroup={onDeleteGroup}
                isAdmin={isAdmin}
                isLocked={grouping.locked || false}
                highlighted={highlightedGroupId === group.id}
              />
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="border-t border-slate-200 pt-8">
          <CreateGroupForm
            groupingId={grouping.id}
            onCreateGroup={onCreateGroup}
          />
        </div>
      )}
    </div>
  );
}