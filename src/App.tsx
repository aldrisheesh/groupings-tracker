import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { SubjectsPage } from "./components/SubjectsPage";
import { SubjectPage } from "./components/SubjectPage";
import { GroupingPage } from "./components/GroupingPage";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

export type Subject = {
  id: string;
  name: string;
  color: string;
  icon: string;
  students: Student[];
};

export type Grouping = {
  id: string;
  subjectId: string;
  title: string;
};

export type Group = {
  id: string;
  groupingId: string;
  name: string;
  members: string[];
  memberLimit: number;
  representative?: string;
};

export type Student = {
  id: string;
  name: string;
};

export type Page = 
  | { type: "home" }
  | { type: "subject"; subjectId: string }
  | { type: "grouping"; subjectId: string; groupingId: string };

function App() {
  const [currentPage, setCurrentPage] = useState<Page>({ type: "home" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply dark mode class to document
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Mock data
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "1", name: "Mathematics", color: "bg-blue-500", icon: "calculator", students: [] },
    { id: "2", name: "Physics", color: "bg-purple-500", icon: "atom", students: [] },
    { id: "3", name: "History", color: "bg-amber-500", icon: "book-open", students: [] },
    { id: "4", name: "Computer Science", color: "bg-emerald-500", icon: "laptop", students: [] },
    { id: "5", name: "Chemistry", color: "bg-pink-500", icon: "flask-conical", students: [] },
    { id: "6", name: "Literature", color: "bg-indigo-500", icon: "pen-tool", students: [] },
  ]);

  const [students] = useState<Student[]>([
    { id: "1", name: "Santos, Roi Aldrich" },
    { id: "2", name: "Chen, Alice" },
    { id: "3", name: "Smith, Bob" },
    { id: "4", name: "Zhang, Carol" },
    { id: "5", name: "Lee, David" },
    { id: "6", name: "Wilson, Emma" },
    { id: "7", name: "Miller, Frank" },
    { id: "8", name: "Park, Grace" },
    { id: "9", name: "Kim, Henry" },
    { id: "10", name: "Chen, Ivy" },
    { id: "11", name: "Doe, John" },
    { id: "12", name: "Smith, Jane" },
    { id: "13", name: "Johnson, Sarah" },
    { id: "14", name: "Brown, Mike" },
    { id: "15", name: "Garcia, Maria" },
    { id: "16", name: "Martinez, Carlos" },
    { id: "17", name: "Lopez, Ana" },
    { id: "18", name: "Rodriguez, Luis" },
  ]);

  const [groupings, setGroupings] = useState<Grouping[]>([
    { id: "1", subjectId: "1", title: "Final Project" },
    { id: "2", subjectId: "1", title: "Group Reporting" },
    { id: "3", subjectId: "1", title: "Study Groups" },
    { id: "4", subjectId: "2", title: "Lab Partners" },
    { id: "5", subjectId: "2", title: "Research Teams" },
    { id: "6", subjectId: "3", title: "Presentation Groups" },
    { id: "7", subjectId: "3", title: "Essay Workshops" },
    { id: "8", subjectId: "4", title: "Hackathon Teams" },
    { id: "9", subjectId: "4", title: "Project Groups" },
  ]);

  const [groups, setGroups] = useState<Group[]>([
    { id: "1", groupingId: "1", name: "Group Alpha", members: ["Chen, Alice", "Smith, Bob", "Zhang, Carol"], memberLimit: 4 },
    { id: "2", groupingId: "1", name: "Group Beta", members: ["Lee, David", "Wilson, Emma"], memberLimit: 5 },
    { id: "3", groupingId: "1", name: "Group Gamma", members: ["Miller, Frank", "Park, Grace", "Kim, Henry", "Chen, Ivy"], memberLimit: 4 },
    { id: "4", groupingId: "2", name: "Team 1", members: ["Doe, John", "Smith, Jane"], memberLimit: 3 },
    { id: "5", groupingId: "4", name: "Lab Group A", members: ["Johnson, Sarah", "Brown, Mike"], memberLimit: 4 },
  ]);

  const handleCreateGroup = (groupingId: string, groupName: string, memberLimit: number) => {
    const newGroup: Group = {
      id: Date.now().toString(),
      groupingId,
      name: groupName,
      members: [],
      memberLimit,
    };
    setGroups([...groups, newGroup]);
  };

  const handleJoinGroup = (groupId: string, memberName: string) => {
    // Find the group being joined
    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return;
    
    // Check if the member is already in ANY group within the same grouping
    const groupsInSameGrouping = groups.filter(g => g.groupingId === targetGroup.groupingId);
    const isAlreadyInGroup = groupsInSameGrouping.some(g => 
      g.members.some(m => m.toLowerCase() === memberName.toLowerCase())
    );
    
    if (isAlreadyInGroup) {
      toast.error(`${memberName} is already in a group in this grouping`);
      return;
    }
    
    setGroups(groups.map(group => 
      group.id === groupId 
        ? { ...group, members: [...group.members, memberName] }
        : group
    ));
  };

  const handleUpdateGroup = (groupId: string, updatedGroup: Partial<Group>) => {
    setGroups(groups.map(group => 
      group.id === groupId 
        ? { ...group, ...updatedGroup }
        : group
    ));
  };

  const handleRemoveMember = (groupId: string, memberName: string) => {
    setGroups(groups.map(group => 
      group.id === groupId 
        ? { ...group, members: group.members.filter(m => m !== memberName) }
        : group
    ));
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId));
  };

  const handleCreateGrouping = (subjectId: string, title: string) => {
    const newGrouping: Grouping = {
      id: Date.now().toString(),
      subjectId,
      title,
    };
    setGroupings([...groupings, newGrouping]);
  };

  const renderPage = () => {
    switch (currentPage.type) {
      case "home":
        return (
          <SubjectsPage 
            subjects={subjects} 
            onNavigate={setCurrentPage}
            isAdmin={isAdmin}
            onCreateSubject={(subject) => setSubjects([...subjects, subject])}
            onUpdateSubject={(id, updated) => setSubjects(subjects.map(s => s.id === id ? { ...s, ...updated } : s))}
            onDeleteSubject={(id) => setSubjects(subjects.filter(s => s.id !== id))}
          />
        );
      case "subject":
        return (
          <SubjectPage
            subject={subjects.find(s => s.id === currentPage.subjectId)!}
            groupings={groupings.filter(g => g.subjectId === currentPage.subjectId)}
            onNavigate={setCurrentPage}
            onBack={() => setCurrentPage({ type: "home" })}
            isAdmin={isAdmin}
            onCreateGrouping={handleCreateGrouping}
          />
        );
      case "grouping":
        const currentSubject = subjects.find(s => s.id === currentPage.subjectId)!;
        return (
          <GroupingPage
            subject={currentSubject}
            grouping={groupings.find(g => g.id === currentPage.groupingId)!}
            groups={groups.filter(g => g.groupingId === currentPage.groupingId)}
            students={currentSubject.students}
            onCreateGroup={handleCreateGroup}
            onJoinGroup={handleJoinGroup}
            onUpdateGroup={handleUpdateGroup}
            onRemoveMember={handleRemoveMember}
            onDeleteGroup={handleDeleteGroup}
            onBack={() => setCurrentPage({ type: "subject", subjectId: currentPage.subjectId })}
            isAdmin={isAdmin}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar 
        onNavigateHome={() => setCurrentPage({ type: "home" })} 
        isAdmin={isAdmin}
        onToggleAdmin={setIsAdmin}
        isDarkMode={isDarkMode}
        onToggleDarkMode={setIsDarkMode}
      />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {renderPage()}
      </main>
      <Toaster />
    </div>
  );
}

export default App;