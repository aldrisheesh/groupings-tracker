import { useState } from "react";
import { Users, Edit2, Trash2, X, Settings, Crown } from "lucide-react";
import { Group } from "../App";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface GroupCardProps {
  group: Group;
  onJoinGroup: (groupId: string, memberName: string) => void;
  onUpdateGroup: (groupId: string, updatedGroup: Partial<Group>) => void;
  onRemoveMember: (groupId: string, memberName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  isAdmin: boolean;
  highlighted?: boolean;
}

// Helper function to validate name format: Last Name, First Name
const validateNameFormat = (name: string): boolean => {
  const regex = /^[A-Za-z\s]+,\s*[A-Za-z\s]+$/;
  return regex.test(name.trim());
};

export function GroupCard({ 
  group, 
  onJoinGroup, 
  onUpdateGroup, 
  onRemoveMember, 
  onDeleteGroup,
  isAdmin,
  highlighted
}: GroupCardProps) {
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [editGroupName, setEditGroupName] = useState(group.name);
  const [editMemberLimit, setEditMemberLimit] = useState(group.memberLimit.toString());

  const isFull = group.members.length >= group.memberLimit;

  const handleJoinGroup = () => {
    if (!memberName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!validateNameFormat(memberName)) {
      toast.error("Please use the format: Last Name, First Name (e.g., Santos, Roi Aldrich)");
      return;
    }

    if (isFull) {
      toast.error("This group is full");
      return;
    }

    onJoinGroup(group.id, memberName.trim());
    // Success toast removed from here - will be shown in parent component after validation
    setIsJoinDialogOpen(false);
    setMemberName("");
  };

  const handleUpdateGroup = () => {
    if (!editGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const limit = parseInt(editMemberLimit);
    if (isNaN(limit) || limit < 1) {
      toast.error("Please enter a valid member limit (at least 1)");
      return;
    }

    if (limit < group.members.length) {
      toast.error(`Member limit cannot be less than current member count (${group.members.length})`);
      return;
    }

    onUpdateGroup(group.id, {
      name: editGroupName.trim(),
      memberLimit: limit,
    });
    toast.success("Group updated successfully!");
    setIsEditDialogOpen(false);
  };

  const handleRemoveMember = (memberName: string) => {
    // If removing the representative, clear the representative field
    if (group.representative === memberName) {
      onUpdateGroup(group.id, { representative: undefined });
    }
    onRemoveMember(group.id, memberName);
    toast.success(`Removed ${memberName} from ${group.name}`);
  };

  const handleToggleRepresentative = (memberName: string) => {
    if (group.representative === memberName) {
      // Unmark as representative
      onUpdateGroup(group.id, { representative: undefined });
      toast.success(`${memberName} is no longer the group representative`);
    } else {
      // Mark as representative
      onUpdateGroup(group.id, { representative: memberName });
      toast.success(`${memberName} is now the group representative`);
    }
  };

  const handleDeleteGroup = () => {
    onDeleteGroup(group.id);
    toast.success(`${group.name} has been deleted`);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card 
        id={`group-${group.id}`}
        className={`flex flex-col h-full gap-0 ${ 
          isFull 
            ? "border-slate-300 dark:border-slate-700 dark:bg-slate-900" 
            : "border-indigo-200 dark:border-indigo-900 dark:bg-slate-900 shadow-md dark:shadow-slate-900/50"
        } ${
          highlighted 
            ? "ring-4 ring-indigo-500 dark:ring-indigo-400 ring-opacity-50 animate-pulse" 
            : ""
        } transition-all duration-300`}
      >
        <CardHeader className="pb-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {group.name}
              </CardTitle>
              <Badge variant={isFull ? "secondary" : "default"} className={`text-xs px-2 py-0.5 ${isFull ? "bg-red-500 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-600"}`}>
                {isFull ? "Full" : "Available"}
              </Badge>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 dark:hover:bg-slate-800"
                  onClick={() => {
                    setEditGroupName(group.name);
                    setEditMemberLimit(group.memberLimit.toString());
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit2 className="w-4 h-4 dark:text-slate-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-slate-800"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="space-y-2">
            <p className="text-slate-600 dark:text-slate-400">
              Members ({group.members.length}/{group.memberLimit}):
            </p>
            <ul className="space-y-1">
              {group.members.map((member, index) => {
                const isRepresentative = group.representative === member;
                return (
                  <li key={index} className="text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2 group">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 flex-shrink-0"></div>
                      <span className="flex-1 min-w-0 truncate">{member}</span>
                      {isRepresentative && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Badge className="bg-amber-500 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-600 flex-shrink-0">
                                  <Crown className="w-3 h-3" />
                                </Badge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Group Representative</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-6 w-6 dark:hover:bg-slate-800 ${isRepresentative ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}
                              onClick={() => handleToggleRepresentative(member)}
                            >
                              <Crown className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isRepresentative ? 'Remove Representative' : 'Make Representative'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 dark:hover:bg-slate-800"
                        onClick={() => handleRemoveMember(member)}
                      >
                        <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="mt-auto pt-4">
          <Button
            onClick={() => setIsJoinDialogOpen(true)}
            variant="outline"
            className={`w-full ${ 
              isFull
                ? "border-slate-300 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:text-slate-600"
                : "border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
            }`}
            disabled={isFull}
          >
            {isFull ? "Group Full" : "Join Group"}
          </Button>
        </CardFooter>
      </Card>

      {/* Join Group Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] mx-4 dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Join {group.name}</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Enter your name to join this group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Your Name</Label>
              <Input
                id="member-name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Last Name, First Name (e.g., Santos, Roi Aldrich)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleJoinGroup();
                  }
                }}
              />
              <p className="text-slate-500 dark:text-slate-500">Format: Last Name, First Name</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinGroup} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
              Join Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog (Admin Only) */}
      {isAdmin && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[calc(100%-2rem)] mx-4 dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="dark:text-slate-100">Edit Group</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Update the group name or member limit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-group-name">Group Name</Label>
                <Input
                  id="edit-group-name"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder="e.g., Group Delta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-member-limit">Member Limit</Label>
                <Input
                  id="edit-member-limit"
                  type="number"
                  min="1"
                  value={editMemberLimit}
                  onChange={(e) => setEditMemberLimit(e.target.value)}
                  placeholder="e.g., 5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateGroup} className="bg-indigo-600 hover:bg-indigo-700">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Group Dialog (Admin Only) */}
      {isAdmin && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{group.name}" and remove all {group.members.length} members. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Group
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}