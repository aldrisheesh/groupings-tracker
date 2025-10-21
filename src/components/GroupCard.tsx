import { useState } from "react";
import { Users, Edit2, Trash2, X, Crown, UsersRound } from "lucide-react";
import { Group, Student } from "../App";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
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
  students: Student[];
  onJoinGroup: (groupId: string, memberName: string) => void;
  onBatchJoinGroup: (groupId: string, memberNames: string[]) => void;
  onUpdateGroup: (groupId: string, updatedGroup: Partial<Group>) => void;
  onRemoveMember: (groupId: string, memberName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  isAdmin: boolean;
  isLocked: boolean;
  highlighted?: boolean;
}

// Helper function to validate name format: Last Name, First Name
// Supports Unicode letters (ñ, á, é, etc.), hyphens, and apostrophes
const validateNameFormat = (name: string): boolean => {
  const regex = /^[\p{L}\s'-]+,\s*[\p{L}\s'-]+$/u;
  return regex.test(name.trim());
};

// Helper function to normalize text for accent-insensitive matching
// Converts "Bañares" to "banares", "José" to "jose", etc.
const normalizeForMatching = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritical marks
};

// Helper function for fuzzy matching enrolled students
// Matches if last names match and input first name is contained in enrolled first name
// Supports accent-insensitive matching (ñ matches n, á matches a, etc.)
const fuzzyMatchStudent = (inputName: string, students: Student[]): boolean => {
  const inputParts = inputName.trim().split(',').map(part => part.trim());
  if (inputParts.length !== 2) return false;
  
  const [inputLastName, inputFirstName] = inputParts.map(normalizeForMatching);
  
  return students.some(student => {
    const studentParts = student.name.trim().split(',').map(part => part.trim());
    if (studentParts.length !== 2) return false;
    
    const [studentLastName, studentFirstName] = studentParts.map(normalizeForMatching);
    
    // Last names must match (accent-insensitive)
    // First name: input must be contained in or equal to the enrolled name
    return studentLastName === inputLastName && 
           studentFirstName.includes(inputFirstName);
  });
};

export function GroupCard({ 
  group, 
  students,
  onJoinGroup,
  onBatchJoinGroup,
  onUpdateGroup, 
  onRemoveMember, 
  onDeleteGroup,
  isAdmin,
  isLocked,
  highlighted
}: GroupCardProps) {
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [batchMemberNames, setBatchMemberNames] = useState("");
  const [editGroupName, setEditGroupName] = useState(group.name);
  const [editMemberLimit, setEditMemberLimit] = useState(group.memberLimit.toString());

  const isFull = group.members.length >= group.memberLimit;

  // Single member join (for regular users)
  const handleJoinGroup = () => {
    if (!memberName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!validateNameFormat(memberName)) {
      toast.error("Please use the format: Last Name, First Name");
      return;
    }

    if (!fuzzyMatchStudent(memberName, students)) {
      toast.error("Name not found in enrolled students list");
      return;
    }

    if (
      group.members.some(
        (m) => normalizeForMatching(m.name) === normalizeForMatching(memberName.trim()),
      )
    ) {
      toast.error("You are already a member of this group");
      return;
    }

    if (isFull) {
      toast.error("This group is full");
      return;
    }

    onJoinGroup(group.id, memberName.trim());
    setMemberName("");
    setIsJoinDialogOpen(false);
  };

  // Batch add members (for admin)
  const handleBatchAddMembers = () => {
    if (!batchMemberNames.trim()) {
      toast.error("Please enter at least one name");
      return;
    }

    const names = batchMemberNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    // Validate all names first
    const invalidNames = names.filter(name => !validateNameFormat(name));
    if (invalidNames.length > 0) {
      toast.error(`Invalid name format: ${invalidNames[0]}\nPlease use: Last Name, First Name`);
      return;
    }

    // Check if names are in enrolled students list
    const notEnrolled = names.filter(name => !fuzzyMatchStudent(name, students));
    if (notEnrolled.length > 0) {
      toast.error(`Name not found in enrolled students: ${notEnrolled[0]}`);
      return;
    }

    // Check for duplicates within input
    const uniqueNames = new Set(names.map(normalizeForMatching));
    if (uniqueNames.size !== names.length) {
      toast.error("Duplicate names found in the list");
      return;
    }

    // Check if any names are already members
    const alreadyMembers = names.filter((name) =>
      group.members.some(
        (m) => normalizeForMatching(m.name) === normalizeForMatching(name),
      ),
    );
    if (alreadyMembers.length > 0) {
      toast.error(`Already a member: ${alreadyMembers[0]}`);
      return;
    }

    // Check if adding would exceed member limit
    if (group.members.length + names.length > group.memberLimit) {
      toast.error(`Cannot add ${names.length} members. Only ${group.memberLimit - group.members.length} spot(s) available.`);
      return;
    }

    // Add all members at once
    onBatchJoinGroup(group.id, names);

    setBatchMemberNames("");
    setIsJoinDialogOpen(false);
    toast.success(`Successfully added ${names.length} member(s)`);
  };

  const handleRemoveMember = (memberName: string) => {
    onRemoveMember(group.id, memberName);
  };

  const handleToggleRepresentative = (memberName: string) => {
    if (group.representative === memberName) {
      // Remove representative
      onUpdateGroup(group.id, { representative: null });
      toast.success("Representative removed");
    } else {
      // Set new representative
      onUpdateGroup(group.id, { representative: memberName });
      toast.success(`${memberName} is now the group representative`);
    }
  };

  const handleUpdateGroup = () => {
    if (!editGroupName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }

    const newLimit = parseInt(editMemberLimit);
    if (isNaN(newLimit) || newLimit < 1) {
      toast.error("Member limit must be at least 1");
      return;
    }

    if (newLimit < group.members.length) {
      toast.error(`Cannot set limit below current member count (${group.members.length})`);
      return;
    }

    onUpdateGroup(group.id, {
      name: editGroupName.trim(),
      memberLimit: newLimit,
    });

    setIsEditDialogOpen(false);
    toast.success("Group updated successfully");
  };

  const handleDeleteGroup = () => {
    onDeleteGroup(group.id);
    setIsDeleteDialogOpen(false);
    toast.success("Group deleted successfully");
  };

  return (
    <>
      {/* Main Group Card */}
      <Card 
        className={`flex flex-col h-full gap-0 hover:shadow-lg transition-shadow dark:border-slate-800 ${
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
              {[...group.members]
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((member) => {
                const isRepresentative = group.representative === member.name;
                return (
                  <li key={member.id} className="text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2 group">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 flex-shrink-0"></div>
                      <span className="flex-1 min-w-0 truncate">{member.name}</span>
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
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-6 w-6 dark:hover:bg-slate-800 ${isRepresentative ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}
                              onClick={() => handleToggleRepresentative(member.name)}
                            >
                              <Crown className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isRepresentative ? 'Remove Representative' : 'Make Representative'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {!isLocked && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 dark:hover:bg-slate-800"
                          onClick={() => handleRemoveMember(member.name)}
                        >
                          <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                        </Button>
                      )}
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
              isFull || isLocked
                ? "border-slate-300 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:text-slate-600"
                : "border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
            }`}
            disabled={isFull || (isLocked && !isAdmin)}
          >
            {isLocked && !isAdmin ? "Locked" : isFull ? "Group Full" : isAdmin ? "Add Members" : "Join Group"}
          </Button>
        </CardFooter>
      </Card>

      {/* Join Group / Add Members Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">
              {isAdmin ? "Add Members to Group" : "Join Group"}
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              {isAdmin 
                ? "Add one or multiple members to the group. Enter one name per line."
                : "Enter your name to join this group."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isAdmin ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="batchMembers" className="dark:text-slate-200">Member Names (one per line)</Label>
                  <Textarea
                    id="batchMembers"
                    value={batchMemberNames}
                    onChange={(e) => setBatchMemberNames(e.target.value)}
                    placeholder="Garcia, Maria&#10;Lopez, Carlos&#10;Saim, Niña Zairamar"
                    className="min-h-[150px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Format: Last Name, First Name
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="memberName" className="dark:text-slate-200">Your Name</Label>
                <Input
                  id="memberName"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Santos, Roi Aldrich"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Format: Last Name, First Name
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsJoinDialogOpen(false);
              setMemberName("");
              setBatchMemberNames("");
            }} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={isAdmin ? handleBatchAddMembers : handleJoinGroup}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              {isAdmin ? "Add Members" : "Join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Edit Group</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Update the group name or member limit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editGroupName" className="dark:text-slate-200">Group Name</Label>
              <Input
                id="editGroupName"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder="Group 1"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMemberLimit" className="dark:text-slate-200">Member Limit</Label>
              <Input
                id="editMemberLimit"
                type="number"
                min="1"
                value={editMemberLimit}
                onChange={(e) => setEditMemberLimit(e.target.value)}
                placeholder="5"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current members: {group.members.length}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600">
              Update Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-slate-100">Delete Group</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to delete "{group.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
