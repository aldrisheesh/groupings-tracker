import { useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { Subject, Grouping, Page } from "../App";
import { GroupingCard } from "./GroupingCard";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";
import { LoadingScreen } from "./LoadingScreen";

interface SubjectPageProps {
  subject: Subject;
  groupings: Grouping[];
  onNavigate: (page: Page) => void;
  onBack: () => void;
  isAdmin: boolean;
  onCreateGrouping: (subjectId: string, title: string) => void;
}

export function SubjectPage({ subject, groupings, onNavigate, onBack, isAdmin, onCreateGrouping }: SubjectPageProps) {
  const [groupingTitle, setGroupingTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGrouping = () => {
    if (!groupingTitle.trim()) {
      toast.error("Please enter a grouping title");
      return;
    }

    onCreateGrouping(subject.id, groupingTitle.trim());
    toast.success(`${groupingTitle} created successfully!`);
    setGroupingTitle("");
  };

  const handleViewGroups = (grouping: Grouping) => {
    setIsLoading(true);
    
    // Simulate database fetch delay
    setTimeout(() => {
      onNavigate({
        type: "grouping",
        subjectId: subject.id,
        groupingId: grouping.id,
      });
      setIsLoading(false);
    }, 800); // 800ms delay to simulate fetching
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
          Back to Subjects
        </Button>

        <div className="space-y-2">
          <h1 className="text-slate-900 dark:text-slate-50">{subject.name}</h1>
          <p className="text-slate-600 dark:text-slate-400">Select a grouping category</p>
        </div>
      </div>

      {isAdmin && (
        <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Create New Grouping Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grouping-title">Grouping Title</Label>
              <Input
                id="grouping-title"
                value={groupingTitle}
                onChange={(e) => setGroupingTitle(e.target.value)}
                placeholder="e.g., Midterm Project"
              />
            </div>
            <Button
              onClick={handleCreateGrouping}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Create Grouping
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <LoadingScreen />
      ) : groupings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupings.map((grouping) => (
            <GroupingCard
              key={grouping.id}
              grouping={grouping}
              onViewGroups={() => handleViewGroups(grouping)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500">No groupings available for this subject yet.</p>
        </div>
      )}
    </div>
  );
}