import { useState } from "react";
import { Plus, Edit2, Trash2, Search, X, UserPlus } from "lucide-react";
import * as Icons from "lucide-react";
import { Subject, Student } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner@2.0.3";
import { Badge } from "./ui/badge";
import { StudentManagement } from "./StudentManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface SubjectManagementProps {
  subjects: Subject[];
  onCreateSubject: (subject: Subject) => void;
  onUpdateSubject: (id: string, updated: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
}

// Popular icon options from lucide-react
const ICON_OPTIONS = [
  "calculator", "atom", "book-open", "laptop", "flask-conical", "pen-tool",
  "beaker", "microscope", "globe", "brain", "palette", "music", 
  "dumbbell", "building-2", "scale", "landmark", "languages", "code",
  "cpu", "database", "git-branch", "terminal", "file-code", "graduation-cap",
  "library", "flask-round", "test-tube", "coins", "chart-line", "briefcase"
];

const COLOR_OPTIONS = [
  { name: "Blue", class: "bg-blue-500" },
  { name: "Purple", class: "bg-purple-500" },
  { name: "Amber", class: "bg-amber-500" },
  { name: "Emerald", class: "bg-emerald-500" },
  { name: "Pink", class: "bg-pink-500" },
  { name: "Indigo", class: "bg-indigo-600" },
  { name: "Red", class: "bg-red-500" },
  { name: "Green", class: "bg-green-500" },
  { name: "Yellow", class: "bg-yellow-500" },
  { name: "Cyan", class: "bg-cyan-500" },
  { name: "Orange", class: "bg-orange-500" },
  { name: "Teal", class: "bg-teal-500" },
];

export function SubjectManagement({ subjects, onCreateSubject, onUpdateSubject, onDeleteSubject }: SubjectManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-indigo-600");
  const [selectedIcon, setSelectedIcon] = useState("book-open");
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  const filteredIcons = ICON_OPTIONS.filter(icon =>
    icon.toLowerCase().includes(iconSearchQuery.toLowerCase())
  );

  const resetForm = () => {
    setName("");
    setSelectedColor("bg-indigo-600");
    setSelectedIcon("book-open");
    setIconSearchQuery("");
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a subject name");
      return;
    }

    const newSubject: Subject = {
      id: Date.now().toString(),
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
      students: [],
    };

    onCreateSubject(newSubject);
    toast.success(`${name} created successfully!`);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedSubject) return;
    if (!name.trim()) {
      toast.error("Please enter a subject name");
      return;
    }

    onUpdateSubject(selectedSubject.id, {
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });
    toast.success(`${name} updated successfully!`);
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedSubject) return;
    onDeleteSubject(selectedSubject.id);
    toast.success(`${selectedSubject.name} has been deleted`);
    setIsDeleteDialogOpen(false);
    setSelectedSubject(null);
  };

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setName(subject.name);
    setSelectedColor(subject.color);
    setSelectedIcon(subject.icon);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const renderIconPreview = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName.split('-').map((word, i) => 
      i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')];
    
    if (!IconComponent) return null;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <>
      <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-slate-100">
            <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Subject Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md"
          >
            Create New Subject
          </Button>
          
          {subjects.length > 0 && (
            <div className="space-y-2">
              <p className="text-slate-600 dark:text-slate-400">Existing Subjects:</p>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${subject.color} rounded-lg flex items-center justify-center shadow-md`}>
                        <span className="text-white">
                          {renderIconPreview(subject.icon)}
                        </span>
                      </div>
                      <span className="text-slate-900 dark:text-slate-100">{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 dark:hover:bg-slate-700"
                        onClick={() => openEditDialog(subject)}
                      >
                        <Edit2 className="w-4 h-4 dark:text-slate-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-slate-700"
                        onClick={() => openDeleteDialog(subject)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Subject Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] mx-4 max-h-[90vh] overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Create New Subject</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Add a new subject with a custom icon and color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Biology"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.class}
                    onClick={() => setSelectedColor(color.class)}
                    className={`h-12 rounded-lg ${color.class} cursor-pointer ${
                      selectedColor === color.class ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100" : ""
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={iconSearchQuery}
                    onChange={(e) => setIconSearchQuery(e.target.value)}
                    placeholder="Search icons..."
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-[200px] border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                  <div className="grid grid-cols-6 gap-2">
                    {filteredIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setSelectedIcon(icon)}
                        className={`h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer ${
                          selectedIcon === icon
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                        title={icon}
                      >
                        {renderIconPreview(icon)}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              <div className={`w-full h-24 ${selectedColor} rounded-lg flex items-center justify-center gap-3`}>
                <span className="text-white text-2xl">
                  {renderIconPreview(selectedIcon)}
                </span>
                <span className="text-white">{name || "Subject Name"}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
              Create Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl w-[calc(100%-2rem)] mx-4 max-h-[90vh] overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Edit Subject - {selectedSubject?.name}</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Update subject details and manage enrolled students.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Subject Details</TabsTrigger>
              <TabsTrigger value="students">Enrolled Students</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="flex-1 overflow-y-auto space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject-name">Subject Name</Label>
                <Input
                  id="edit-subject-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Biology"
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.class}
                      onClick={() => setSelectedColor(color.class)}
                      className={`h-12 rounded-lg ${color.class} cursor-pointer ${
                        selectedColor === color.class ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100" : ""
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={iconSearchQuery}
                      onChange={(e) => setIconSearchQuery(e.target.value)}
                      placeholder="Search icons..."
                      className="pl-9"
                    />
                  </div>
                  <ScrollArea className="h-[200px] border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                    <div className="grid grid-cols-6 gap-2">
                      {filteredIcons.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setSelectedIcon(icon)}
                          className={`h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer ${
                            selectedIcon === icon
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                          title={icon}
                        >
                          {renderIconPreview(icon)}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview</Label>
                <div className={`w-full h-24 ${selectedColor} rounded-lg flex items-center justify-center gap-3`}>
                  <span className="text-white text-2xl">
                    {renderIconPreview(selectedIcon)}
                  </span>
                  <span className="text-white">{name || "Subject Name"}</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="students" className="flex-1 overflow-y-auto py-4">
              {selectedSubject && (
                <StudentManagement
                  students={selectedSubject.students}
                  onUpdateStudents={(updatedStudents) => {
                    if (selectedSubject) {
                      onUpdateSubject(selectedSubject.id, { students: updatedStudents });
                      setSelectedSubject({ ...selectedSubject, students: updatedStudents });
                    }
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Close
            </Button>
            <Button onClick={handleEdit} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedSubject?.name}" and all associated groupings and groups. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Subject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
