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
  onCreateGrouping: (subjectId: string, title: string, color: string) => void;
  onUpdateGrouping: (groupingId: string, updates: { title?: string; color?: string }) => void;
  onDeleteGrouping: (groupingId: string) => void;
}

const COLOR_OPTIONS = [
  { value: "bg-red-500", label: "Red", class: "bg-red-500" },
  { value: "bg-orange-500", label: "Orange", class: "bg-orange-500" },
  { value: "bg-amber-500", label: "Amber", class: "bg-amber-500" },
  { value: "bg-yellow-500", label: "Yellow", class: "bg-yellow-500" },
  { value: "bg-lime-500", label: "Lime", class: "bg-lime-500" },
  { value: "bg-green-500", label: "Green", class: "bg-green-500" },
  { value: "bg-emerald-500", label: "Emerald", class: "bg-emerald-500" },
  { value: "bg-teal-500", label: "Teal", class: "bg-teal-500" },
  { value: "bg-cyan-500", label: "Cyan", class: "bg-cyan-500" },
  { value: "bg-sky-500", label: "Sky", class: "bg-sky-500" },
  { value: "bg-blue-500", label: "Blue", class: "bg-blue-500" },
  { value: "bg-indigo-500", label: "Indigo", class: "bg-indigo-500" },
  { value: "bg-violet-500", label: "Violet", class: "bg-violet-500" },
  { value: "bg-purple-500", label: "Purple", class: "bg-purple-500" },
  { value: "bg-fuchsia-500", label: "Fuchsia", class: "bg-fuchsia-500" },
  { value: "bg-pink-500", label: "Pink", class: "bg-pink-500" },
  { value: "bg-rose-500", label: "Rose", class: "bg-rose-500" },
  { value: "bg-slate-500", label: "Slate", class: "bg-slate-500" },
];

export function SubjectPage({ subject, groupings, onNavigate, onBack, isAdmin, onCreateGrouping, onUpdateGrouping, onDeleteGrouping }: SubjectPageProps) {
  const [groupingTitle, setGroupingTitle] = useState("");
  const [groupingColor, setGroupingColor] = useState("bg-indigo-500");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGrouping = () => {
    if (!groupingTitle.trim()) {
      toast.error("Please enter a grouping title");
      return;
    }

    onCreateGrouping(subject.id, groupingTitle.trim(), groupingColor);
    toast.success(`${groupingTitle} created successfully!`);
    setGroupingTitle("");
    setGroupingColor("bg-indigo-500");
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
              <Label htmlFor="grouping-title" className="dark:text-slate-200">Grouping Title</Label>
              <Input
                id="grouping-title"
                value={groupingTitle}
                onChange={(e) => setGroupingTitle(e.target.value)}
                placeholder="e.g., Midterm Project"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-200">Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setGroupingColor(color.value)}
                    className={`h-12 rounded-lg transition-all ${color.class} ${
                      groupingColor === color.value
                        ? "ring-2 ring-slate-900 dark:ring-slate-100 ring-offset-2 dark:ring-offset-slate-950 scale-110"
                        : "hover:scale-105"
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreateGrouping}
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
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
              onUpdateGrouping={onUpdateGrouping}
              onDeleteGrouping={onDeleteGrouping}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-500">No groupings available for this subject yet.</p>
        </div>
      )}
    </div>
  );
}