import { Grouping } from "../App";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { FolderOpen } from "lucide-react";

interface GroupingCardProps {
  grouping: Grouping;
  onViewGroups: () => void;
}

export function GroupingCard({ grouping, onViewGroups }: GroupingCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:shadow-xl dark:hover:shadow-slate-900/50 dark:hover:border-slate-700">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-md">
            <FolderOpen className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-slate-900 dark:text-slate-50">{grouping.title}</h3>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onViewGroups} variant="outline" className="w-full dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">
          View Groups
        </Button>
      </CardFooter>
    </Card>
  );
}