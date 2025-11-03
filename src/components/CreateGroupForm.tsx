import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner@2.0.3";
import { Group } from "../App";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface CreateGroupFormProps {
  groupingId: string;
  groups: Group[];
  onCreateGroup: (groupingId: string, groupName: string, memberLimit: number) => void;
  onDeleteAllGroups: (groupingId: string) => void;
}

export function CreateGroupForm({ groupingId, groups, onCreateGroup, onDeleteAllGroups }: CreateGroupFormProps) {
  const [numberOfGroups, setNumberOfGroups] = useState("");
  const [memberLimit, setMemberLimit] = useState("");

  const handleCreateGroups = async () => {
    if (!numberOfGroups.trim()) {
      toast.error("Please enter the number of groups");
      return;
    }

    if (!memberLimit.trim()) {
      toast.error("Please enter a member limit");
      return;
    }

    const count = parseInt(numberOfGroups);
    if (isNaN(count) || count < 1) {
      toast.error("Please enter a valid number of groups (at least 1)");
      return;
    }

    if (count > 50) {
      toast.error("Maximum 50 groups can be created at once");
      return;
    }

    const limit = parseInt(memberLimit);
    if (isNaN(limit) || limit < 1) {
      toast.error("Please enter a valid member limit (at least 1)");
      return;
    }

    // Dismiss any existing toasts to prevent spam
    toast.dismiss();

    // Show loading toast
    const loadingToast = toast.loading(`Creating ${count} group${count > 1 ? 's' : ''}...`);

    let successCount = 0;
    
    try {
      // Create multiple groups with incremented names
      for (let i = 1; i <= count; i++) {
        const groupName = `Group ${i}`;
        // The onCreateGroup already handles the database call and shows individual toasts
        // We'll suppress those by dismissing right after
        await onCreateGroup(groupingId, groupName, limit);
        toast.dismiss(); // Dismiss the individual success toast
        successCount++;
      }

      toast.dismiss(loadingToast);
      if (successCount === count) {
        toast.success(`Successfully created ${count} group${count > 1 ? 's' : ''}! (Group 1 - Group ${count})`);
      } else if (successCount > 0) {
        toast.warning(`Created ${successCount} out of ${count} groups`);
      } else {
        toast.error("Failed to create groups");
      }
      
      setNumberOfGroups("");
      setMemberLimit("");
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`Failed to create groups. Created ${successCount} out of ${count}.`);
    }
  };

  // If there are existing groups, show the remove all button instead
  if (groups.length > 0) {
    return (
      <Card className="border-2 border-dashed border-red-300 bg-red-50/50 dark:bg-red-950/30 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-slate-100">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            Remove All Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {groups.length} group{groups.length !== 1 ? 's' : ''} currently exist in this grouping. 
            Remove all groups to create a new batch.
          </p>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
              >
                Remove All Groups
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {groups.length} group{groups.length !== 1 ? 's' : ''} and their members in this grouping.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteAllGroups(groupingId)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  }

  // Show create form if no groups exist
  return (
    <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-slate-100">
          <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Create New Groups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="number-of-groups">Number of Groups</Label>
          <Input
            id="number-of-groups"
            type="text"
            value={numberOfGroups}
            onChange={(e) => setNumberOfGroups(e.target.value)}
            placeholder="e.g., 9"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Groups will be named: Group 1, Group 2, Group 3, ...
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="member-limit">Member Limit (per group)</Label>
          <Input
            id="member-limit"
            type="text"
            value={memberLimit}
            onChange={(e) => setMemberLimit(e.target.value)}
            placeholder="e.g., 6"
          />
        </div>

        <Button
          onClick={handleCreateGroups}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          Create Groups
        </Button>
      </CardContent>
    </Card>
  );
}