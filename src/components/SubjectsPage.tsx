import { Subject, Page } from "../App";
import { SubjectCard } from "./SubjectCard";
import { SubjectManagement } from "./SubjectManagement";

interface SubjectsPageProps {
  subjects: Subject[];
  onNavigate: (page: Page) => void;
  isAdmin: boolean;
  onCreateSubject: (subject: Subject) => void;
  onUpdateSubject: (id: string, updated: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
}

export function SubjectsPage({ subjects, onNavigate, isAdmin, onCreateSubject, onUpdateSubject, onDeleteSubject }: SubjectsPageProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-slate-900 dark:text-slate-50">All Subjects</h1>
        <p className="text-slate-600 dark:text-slate-400">Select a subject to view available groupings</p>
      </div>

      {isAdmin && (
        <SubjectManagement
          subjects={subjects}
          onCreateSubject={onCreateSubject}
          onUpdateSubject={onUpdateSubject}
          onDeleteSubject={onDeleteSubject}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onViewGroupings={() =>
              onNavigate({ type: "subject", subjectId: subject.id })
            }
          />
        ))}
      </div>
    </div>
  );
}