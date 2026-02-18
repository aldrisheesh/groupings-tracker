import { useState } from "react";
import { UserCheck, UserX, Users as UsersIcon } from "lucide-react";
import { Student, Group } from "../App";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

interface StudentAvailabilityProps {
  students: Student[];
  groups: Group[];
}

// Fuzzy matching: normalize name for comparison
// "Santos, Roi" should match "Santos, Roi Aldrich" or "Santos, Roi Aldrich S."
// Also supports accent-insensitive matching: "Bañares" matches "Banares"
const normalizeNameForMatching = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/\s*-\s*/g, '-') // Normalize spacing around hyphens: "a - b" becomes "a-b"
    .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
};

const fuzzyMatch = (studentName: string, memberName: string): boolean => {
  const normalizedStudent = normalizeNameForMatching(studentName);
  const normalizedMember = normalizeNameForMatching(memberName);

  // Split by comma to get last name and first name
  const studentParts = normalizedStudent.split(',').map(p => p.trim());
  const memberParts = normalizedMember.split(',').map(p => p.trim());

  // Both must have last name and first name
  if (studentParts.length !== 2 || memberParts.length !== 2) {
    // Fallback to simple string matching
    return normalizedStudent.startsWith(normalizedMember) ||
      normalizedMember.startsWith(normalizedStudent);
  }

  const [studentLast, studentFirst] = studentParts;
  const [memberLast, memberFirst] = memberParts;

  // Last names must match exactly
  if (studentLast !== memberLast) {
    return false;
  }

  // First names: check if one contains the other (bidirectional)
  // This handles "Angelie" matching "Mary Angelie" and vice versa
  return studentFirst.includes(memberFirst) || memberFirst.includes(studentFirst);
};

export function StudentAvailability({ students, groups }: StudentAvailabilityProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get all students who are in groups using fuzzy matching
  const studentsInGroups = new Map<string, string>(); // studentName -> memberName in group
  students.forEach(student => {
    groups.forEach(group => {
      group.members.forEach(member => {
        if (fuzzyMatch(student.name, member)) {
          studentsInGroups.set(student.name, member);
        }
      });
    });
  });

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate available and unavailable students
  const availableStudents = filteredStudents
    .filter(student => !studentsInGroups.has(student.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const unavailableStudents = filteredStudents
    .filter(student => studentsInGroups.has(student.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Find which group a student belongs to
  const findStudentGroup = (studentName: string): string | null => {
    for (const group of groups) {
      if (group.members.some(member => fuzzyMatch(studentName, member))) {
        return group.name;
      }
    }
    return null;
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        className="flex items-center gap-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
      >
        <UsersIcon className="w-4 h-4" />
        View Student Availability
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-50">Student Availability</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              View which students are available or already in groups.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Search */}
            <div className="flex-shrink-0 px-0.5">
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 flex-shrink-0">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                  <span>Available</span>
                </div>
                <p className="text-emerald-900 dark:text-emerald-300 mt-1">{availableStudents.length} students</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400">
                  <UserX className="w-5 h-5" />
                  <span>In Groups</span>
                </div>
                <p className="text-slate-900 dark:text-slate-300 mt-1">{unavailableStudents.length} students</p>
              </div>
            </div>

            {/* Student Lists */}
            <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
              <div className="space-y-6">
                {/* Available Students */}
                <div className="space-y-2">
                  <h3 className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Available Students
                  </h3>
                  {availableStudents.length > 0 ? (
                    <ul className="space-y-2">
                      {availableStudents.map((student) => (
                        <li
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800"
                        >
                          <span className="text-slate-700 dark:text-slate-300">{student.name}</span>
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-950 border-emerald-200 dark:border-emerald-900">
                            Available
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-500 italic p-3">No available students found</p>
                  )}
                </div>

                {/* Students in Groups */}
                <div className="space-y-2">
                  <h3 className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <UserX className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    Students in Groups
                  </h3>
                  {unavailableStudents.length > 0 ? (
                    <ul className="space-y-2">
                      {unavailableStudents.map((student) => {
                        const groupName = findStudentGroup(student.name);
                        return (
                          <li
                            key={student.id}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex flex-col">
                              <span className="text-slate-700 dark:text-slate-300">{student.name}</span>
                              {groupName && (
                                <span className="text-slate-500 dark:text-slate-500">{groupName}</span>
                              )}
                            </div>
                            <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700">
                              In Group
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-500 italic p-3">No students in groups</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}