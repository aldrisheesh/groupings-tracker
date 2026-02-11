import { useState } from "react";
import { PlusCircle, Trash2, Users, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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
  // Batch creation state
  const [numberOfGroups, setNumberOfGroups] = useState("");
  const [batchMemberLimit, setBatchMemberLimit] = useState("");

  // Single creation state
  const [singleGroupName, setSingleGroupName] = useState("");
  const [singleMemberLimit, setSingleMemberLimit] = useState("");

  const handleCreateBatch = async () => {
    if (!numberOfGroups.trim()) {
      toast.error("Please enter the number of groups");
      return;
    }

    if (!batchMemberLimit.trim()) {
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

    const limit = parseInt(batchMemberLimit);
    if (isNaN(limit) || limit < 1) {
      toast.error("Please enter a valid member limit (at least 1)");
      return;
    }

    // Dismiss any existing toasts
    toast.dismiss();

    // Show loading toast
    const loadingToast = toast.loading(`Creating ${count} group${count > 1 ? 's' : ''}...`);

    let successCount = 0;
    
    try {
      // Find the next available group number if we are following the "Group X" pattern
      // accessible via existing groups check is a bit complex, so we'll just append
      // actually, let's just stick to the requested simple logic for now
      // or... let's try to be smart about naming if possible, but the requirement was "Group 1, Group 2..."
      // If groups exist, we might want to continue numbering or just append.
      // The original code reset to Group 1 if no groups. 
      // Let's keep it simple: "Group X", "Group Y".
      // If the user wants to append, they can see the existing groups.
      // To avoid name collisions, we might want to check, but the DB likely handles duplicates or allows same names?
      // The DB schema wasn't fully checked for unique constraint on name per grouping, but `createGroup` probably handles it.
      
      let nextIndex = 1;
      // Simple heuristic: find max "Group N" and start from N+1
      const groupNameRegex = /^Group (\d+)$/;
      const existingIndices = groups
        .map(g => {
          const match = g.name.match(groupNameRegex);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);
      
      if (existingIndices.length > 0) {
        nextIndex = Math.max(...existingIndices) + 1;
      }

      for (let i = 0; i < count; i++) {
        const currentIndex = nextIndex + i; // Start from the next available number
        const groupName = `Group ${currentIndex}`;
        
        await onCreateGroup(groupingId, groupName, limit);
        toast.dismiss(); // Dismiss individual success toast
        successCount++;
      }

      toast.dismiss(loadingToast);
      if (successCount === count) {
        toast.success(`Successfully created ${count} group${count > 1 ? 's' : ''}!`);
      } else if (successCount > 0) {
        toast.warning(`Created ${successCount} out of ${count} groups`);
      } else {
        toast.error("Failed to create groups");
      }
      
      setNumberOfGroups("");
      // Keep member limit as it's likely to be reused
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`Failed to create groups. Created ${successCount} out of ${count}.`);
    }
  };

  const handleCreateSingle = async () => {
    if (!singleGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (!singleMemberLimit.trim()) {
      toast.error("Please enter a member limit");
      return;
    }

    const limit = parseInt(singleMemberLimit);
    if (isNaN(limit) || limit < 1) {
      toast.error("Please enter a valid member limit (at least 1)");
      return;
    }

    // Check for duplicate name locally to give fast feedback
    if (groups.some(g => g.name.toLowerCase() === singleGroupName.trim().toLowerCase())) {
      toast.error("A group with this name already exists");
      return;
    }

    await onCreateGroup(groupingId, singleGroupName.trim(), limit);
    setSingleGroupName("");
    // Keep member limit as it's likely to be reused
  };

  return (
    <div className="space-y-8">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-slate-100">
            <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Add Groups
          </CardTitle>
          <CardDescription>
            Create new groups for this grouping. You can add them one by one or in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Single Group
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Batch Create
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="single-group-name">Group Name</Label>
                  <Input
                    id="single-group-name"
                    value={singleGroupName}
                    onChange={(e) => setSingleGroupName(e.target.value)}
                    placeholder="e.g., Alpha Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="single-member-limit">Member Limit</Label>
                  <Input
                    id="single-member-limit"
                    type="number"
                    min="1"
                    value={singleMemberLimit}
                    onChange={(e) => setSingleMemberLimit(e.target.value)}
                    placeholder="e.g., 6"
                  />
                </div>
              </div>
              <Button 
                onClick={handleCreateSingle}
                className="w-full md:w-auto"
              >
                Add Group
              </Button>
            </TabsContent>
            
            <TabsContent value="batch" className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-sm text-slate-600 dark:text-slate-400 mb-4">
                <p>
                  This will create multiple groups named "Group X", "Group Y", etc. 
                  {groups.length > 0 ? " numbering will continue from the highest existing group number." : " starting from Group 1."}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number-of-groups">Number of Groups</Label>
                  <Input
                    id="number-of-groups"
                    type="number"
                    min="1"
                    max="50"
                    value={numberOfGroups}
                    onChange={(e) => setNumberOfGroups(e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-member-limit">Member Limit (per group)</Label>
                  <Input
                    id="batch-member-limit"
                    type="number"
                    min="1"
                    value={batchMemberLimit}
                    onChange={(e) => setBatchMemberLimit(e.target.value)}
                    placeholder="e.g., 6"
                  />
                </div>
              </div>
              <Button 
                onClick={handleCreateBatch}
                className="w-full md:w-auto"
              >
                Batch Create Groups
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {groups.length > 0 && (
        <Card className="border-2 border-dashed border-red-200 bg-red-50/30 dark:bg-red-950/20 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400 text-lg">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p className="font-medium text-slate-900 dark:text-slate-200">Remove all groups</p>
              <p>
                This will permanently delete all {groups.length} group{groups.length !== 1 ? 's' : ''} and remove all members.
                This action cannot be undone.
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="whitespace-nowrap shrink-0"
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
      )}
    </div>
  );
}