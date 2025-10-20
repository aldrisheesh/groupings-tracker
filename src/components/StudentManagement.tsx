import { useState } from "react";
import { UserPlus, X, Users } from "lucide-react";
import { Student } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner@2.0.3";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface StudentManagementProps {
  subjectId: string;
  students: Student[];
  onAddStudent: (studentName: string) => void;
  onBatchAddStudents: (studentNames: string[]) => void;
  onRemoveStudent: (studentId: string) => void;
}

// Helper function to validate name format: Last Name, First Name
const validateNameFormat = (name: string): boolean => {
  const regex = /^[A-Za-z\s]+,\s*[A-Za-z\s]+$/;
  return regex.test(name.trim());
};

export function StudentManagement({ subjectId, students, onAddStudent, onBatchAddStudents, onRemoveStudent }: StudentManagementProps) {
  const [newStudentName, setNewStudentName] = useState("");
  const [batchStudentNames, setBatchStudentNames] = useState("");

  const handleAddStudent = () => {
    const trimmedName = newStudentName.trim();
    
    if (!trimmedName) {
      toast.error("Please enter a student name");
      return;
    }

    if (!validateNameFormat(trimmedName)) {
      toast.error("Please use the format: Last Name, First Name");
      return;
    }

    // Check if student already exists (case-insensitive)
    const exists = students.some(s => s.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      toast.error("This student is already in the list");
      return;
    }

    // Call the handler
    onAddStudent(trimmedName);
    toast.success(`✓ ${trimmedName} added successfully`);
    setNewStudentName("");
  };

  const handleBatchAddStudents = () => {
    const names = batchStudentNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) {
      toast.error("Please enter at least one student name");
      return;
    }

    const validNames: string[] = [];
    const invalidNames: string[] = [];
    const duplicateNames: string[] = [];
    
    names.forEach(name => {
      // Check format
      if (!validateNameFormat(name)) {
        invalidNames.push(name);
        return;
      }
      
      // Check if already exists in current students list (case-insensitive)
      const existsInCurrent = students.some(s => s.name.toLowerCase() === name.toLowerCase());
      // Check if duplicate within the batch itself
      const existsInBatch = validNames.some(n => n.toLowerCase() === name.toLowerCase());
      
      if (existsInCurrent || existsInBatch) {
        duplicateNames.push(name);
        return;
      }
      
      validNames.push(name);
    });

    // Add all valid students
    if (validNames.length > 0) {
      onBatchAddStudents(validNames);
    }

    // Show results
    const results: string[] = [];
    if (validNames.length > 0) {
      results.push(`✓ ${validNames.length} student${validNames.length > 1 ? 's' : ''} added successfully`);
    }
    if (invalidNames.length > 0) {
      results.push(`⚠ ${invalidNames.length} invalid format${invalidNames.length > 1 ? 's' : ''}`);
    }
    if (duplicateNames.length > 0) {
      results.push(`⚠ ${duplicateNames.length} duplicate${duplicateNames.length > 1 ? 's' : ''} skipped`);
    }

    if (validNames.length > 0) {
      toast.success(results.join('\n'));
      setBatchStudentNames("");
    } else {
      toast.error("No valid students to add\n" + results.slice(1).join('\n'));
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      onRemoveStudent(studentId);
      toast.success(`${student.name} removed from the list`);
    }
  };

  return (
    <Card className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-slate-100">
          <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Enrolled Students
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Add Single</TabsTrigger>
            <TabsTrigger value="batch">Add Multiple</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="space-y-2 mt-4">
            <Label htmlFor="student-name">Student Name</Label>
            <div className="flex gap-2">
              <Input
                id="student-name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Last Name, First Name (e.g., Santos, Roi)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddStudent();
                  }
                }}
              />
              <Button
                onClick={handleAddStudent}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            <p className="text-slate-500 dark:text-slate-500">Format: Last Name, First Name</p>
          </TabsContent>

          <TabsContent value="batch" className="space-y-2 mt-4">
            <Label htmlFor="batch-student-names">Paste Multiple Names (One per Line)</Label>
            <Textarea
              id="batch-student-names"
              value={batchStudentNames}
              onChange={(e) => setBatchStudentNames(e.target.value)}
              placeholder="Santos, Roi Aldrich&#10;Chen, Alice&#10;Smith, Bob&#10;Zhang, Carol"
              className="min-h-[150px] font-mono"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleBatchAddStudents();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-500">
                Format: Last Name, First Name (one per line)
                <span className="block mt-1">Press Ctrl+Enter to add all</span>
              </p>
              <Button
                onClick={handleBatchAddStudents}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                <Users className="w-4 h-4 mr-2" />
                Add All
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {students.length > 0 ? (
          <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <p className="text-slate-600 dark:text-slate-400">
                Student List ({students.length})
              </p>
            </div>
            <ScrollArea className="h-[300px] border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-slate-700 dark:text-slate-300">{student.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-slate-700"
                      onClick={() => handleRemoveStudent(student.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            <p className="text-slate-500 dark:text-slate-500">
              No students enrolled yet. Add students to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}