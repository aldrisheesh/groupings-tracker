import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner@2.0.3";

interface CreateGroupFormProps {
  groupingId: string;
  onCreateGroup: (groupingId: string, groupName: string, memberLimit: number) => void;
}

export function CreateGroupForm({ groupingId, onCreateGroup }: CreateGroupFormProps) {
  const [groupName, setGroupName] = useState("");
  const [memberLimit, setMemberLimit] = useState("");

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (!memberLimit.trim()) {
      toast.error("Please enter a member limit");
      return;
    }

    const limit = parseInt(memberLimit);
    if (isNaN(limit) || limit < 1) {
      toast.error("Please enter a valid member limit (at least 1)");
      return;
    }

    onCreateGroup(groupingId, groupName.trim(), limit);
    toast.success(`${groupName} created successfully!`);
    setGroupName("");
    setMemberLimit("");
  };

  return (
    <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-slate-100">
          <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Create a New Group
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="group-name">Group Name</Label>
          <Input
            id="group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., Group Delta"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="member-limit">Member Limit</Label>
          <Input
            id="member-limit"
            type="text"
            value={memberLimit}
            onChange={(e) => setMemberLimit(e.target.value)}
            placeholder="e.g., 5"
          />
        </div>

        <Button
          onClick={handleCreateGroup}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          Create Group
        </Button>
      </CardContent>
    </Card>
  );
}