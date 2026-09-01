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
  students: { id: string; name: string }[];
  onCreateGroup: (groupingId: string, groupName: string, memberLimit: number) => Promise<void> | void;
  onCreateAutomaticGroups: (groupingId: string, numberOfGroups?: number, maxMembersPerGroup?: number) => Promise<void>;
  onDeleteAllGroups: (groupingId: string) => void;
}

export function CreateGroupForm({ groupingId, groups, students, onCreateGroup, onCreateAutomaticGroups, onDeleteAllGroups }: CreateGroupFormProps) {
  // Automatic creation state
  const [numberOfGroups, setNumberOfGroups] = useState("");
  const [batchMemberLimit, setBatchMemberLimit] = useState("");

  // Single creation state
  const [singleGroupName, setSingleGroupName] = useState("");
  const [singleMemberLimit, setSingleMemberLimit] = useState("");

  const handleCreateBatch = async () => {
    if (students.length === 0) {
      toast.error("Add enrolled students before creating groups automatically");
      return;
    }
    const count = numberOfGroups.trim() ? parseInt(numberOfGroups, 10) : undefined;
    const limit = batchMemberLimit.trim() ? parseInt(batchMemberLimit, 10) : undefined;
    if (count === undefined && limit === undefined) {
      toast.error("Enter a number of groups, a maximum member limit, or both");
      return;
    }
    if (count !== undefined && (!Number.isInteger(count) || count < 1 || count > 50)) {
      toast.error("Number of groups must be between 1 and 50");
      return;
    }
    if (count !== undefined && count > students.length) {
      toast.error(`Number of groups cannot exceed the ${students.length} enrolled students`);
      return;
    }
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
      toast.error("Maximum members per group must be at least 1");
      return;
    }
    if (count !== undefined && limit !== undefined && count * limit < students.length) {
      toast.error(`These settings can hold only ${count * limit} students; increase the limit or number of groups`);
      return;
    }
    try {
      await onCreateAutomaticGroups(groupingId, count, limit);
      setNumberOfGroups("");
    } catch {
      // Parent handler reports persistence errors.
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
            Create a single group or automatically create empty groups with fair member limits.
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
                Automatic Groups
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
                  Creates blank groups with member limits distributed as evenly as possible. Enter either value or both.
                  {students.length > 0 ? ` ${students.length} enrolled student${students.length === 1 ? "" : "s"} available.` : " No enrolled students are available yet."}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number-of-groups">Number of Groups (optional)</Label>
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
                  <Label htmlFor="batch-member-limit">Max Members per Group (optional)</Label>
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
                disabled={students.length === 0}
                className="w-full md:w-auto"
              >
                Create Empty Groups
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
