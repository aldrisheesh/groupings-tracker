import { useState } from "react";
import { Grouping } from "../App";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { FolderOpen, Trash2, Edit2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";

interface GroupingCardProps {
  grouping: Grouping;
  onViewGroups: () => void;
  onUpdateGrouping?: (groupingId: string, updates: { title?: string; color?: string }) => void;
  onDeleteGrouping?: (groupingId: string) => void;
  isAdmin: boolean;
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

export function GroupingCard({ grouping, onViewGroups, onUpdateGrouping, onDeleteGrouping, isAdmin }: GroupingCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(grouping.title);
  const [editColor, setEditColor] = useState(grouping.color);

  const handleDeleteGrouping = () => {
    if (onDeleteGrouping) {
      onDeleteGrouping(grouping.id);
      setIsDeleteDialogOpen(false);
      toast.success("Grouping category deleted successfully");
    }
  };

  const handleUpdateGrouping = () => {
    if (!editTitle.trim()) {
      toast.error("Grouping title cannot be empty");
      return;
    }

    if (onUpdateGrouping) {
      onUpdateGrouping(grouping.id, { title: editTitle.trim(), color: editColor });
      setIsEditDialogOpen(false);
      toast.success("Grouping category updated successfully");
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:shadow-xl dark:hover:shadow-slate-900/50 dark:hover:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg ${grouping.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-slate-900 dark:text-slate-50 flex-1">{grouping.title}</h3>
            {isAdmin && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {onUpdateGrouping && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 dark:hover:bg-slate-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditTitle(grouping.title);
                      setEditColor(grouping.color);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4 dark:text-slate-400" />
                  </Button>
                )}
                {onDeleteGrouping && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-slate-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onViewGroups} variant="outline" className="w-full dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">
            View Groups
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Grouping Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Edit Grouping Category</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Update the title or color of this grouping category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="dark:text-slate-200">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g., Midterm Project"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-200">Color</Label>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setEditColor(color.value)}
                    className={`w-10 h-10 rounded-md transition-all ${color.class} ${
                      editColor === color.value
                        ? "ring-2 ring-slate-900 dark:ring-slate-100 ring-offset-2 dark:ring-offset-slate-950 scale-110"
                        : "hover:scale-105"
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
              Cancel
            </Button>
            <Button onClick={handleUpdateGrouping} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Grouping Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-slate-100">Delete Grouping Category</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to delete "{grouping.title}"? This will also delete all groups within this category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGrouping} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}