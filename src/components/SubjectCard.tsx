import * as Icons from "lucide-react";
import { Subject } from "../App";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";

interface SubjectCardProps {
  subject: Subject;
  onViewGroupings: () => void;
}

export function SubjectCard({ subject, onViewGroupings }: SubjectCardProps) {
  // Dynamically get icon from lucide-react
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName.split('-').map((word, i) => 
      i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')];
    
    return IconComponent || Icons.BookOpen;
  };

  const Icon = getIcon(subject.icon);

  return (
    <Card className="hover:shadow-lg transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:shadow-xl dark:hover:shadow-slate-900/50 dark:hover:border-slate-700">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg ${subject.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-slate-900 dark:text-slate-50">{subject.name}</h3>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onViewGroupings} className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md">
          View Groupings
        </Button>
      </CardFooter>
    </Card>
  );
}