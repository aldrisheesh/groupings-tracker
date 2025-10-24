import { useState, useEffect, useMemo } from "react";
import { History, UserPlus, UserMinus, Crown } from "lucide-react";
import { GroupHistory } from "../App";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

interface GroupHistoryProps {
  groupingId: string;
  history: GroupHistory[];
  isAdmin: boolean;
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "member_added":
      return <UserPlus className="w-4 h-4" />;
    case "member_removed":
      return <UserMinus className="w-4 h-4" />;
    case "representative_set":
      return <Crown className="w-4 h-4" />;
    default:
      return <History className="w-4 h-4" />;
  }
};

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case "member_added":
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
    case "member_removed":
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30";
    case "representative_set":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30";
    default:
      return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30";
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

interface ProcessedHistoryEntry {
  id: string;
  type: "single" | "batch";
  actionType: string;
  groupName: string;
  memberNames: string[];
  performedBy: string;
  createdAt: string;
}

export function GroupHistory({ groupingId, history, isAdmin }: GroupHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter and process history entries
  const processedHistory = useMemo(() => {
    // Filter out unwanted action types
    const filteredHistory = history.filter(
      (entry) =>
        entry.actionType === "member_added" ||
        entry.actionType === "member_removed" ||
        entry.actionType === "representative_set"
    );

    // Group consecutive similar actions within 5 seconds
    const processed: ProcessedHistoryEntry[] = [];
    let i = 0;

    while (i < filteredHistory.length) {
      const current = filteredHistory[i];

      // Try to batch member_added or member_removed actions
      if (current.actionType === "member_added" || current.actionType === "member_removed") {
        const batchMembers = [current.memberName!];
        let j = i + 1;

        const currentTime = new Date(current.createdAt).getTime();

        // Look ahead for similar consecutive actions
        while (j < filteredHistory.length) {
          const next = filteredHistory[j];
          const nextTime = new Date(next.createdAt).getTime();

          if (
            next.actionType === current.actionType && // Same action type (add or remove)
            next.groupName === current.groupName &&   // Same group
            currentTime - nextTime <= 5000            // Within 5 seconds
          ) {
            batchMembers.push(next.memberName!);
            j++;
          } else {
            break;
          }
        }

        // Create processed entry
        if (batchMembers.length > 1) {
          processed.push({
            id: current.id,
            type: "batch",
            actionType: current.actionType,
            groupName: current.groupName,
            memberNames: batchMembers,
            performedBy: current.performedBy,
            createdAt: current.createdAt,
          });
        } else {
          processed.push({
            id: current.id,
            type: "single",
            actionType: current.actionType,
            groupName: current.groupName,
            memberNames: [current.memberName!],
            performedBy: current.performedBy,
            createdAt: current.createdAt,
          });
        }

        i = j;
      } else {
        // Representative set or other action - add as single entry
        processed.push({
          id: current.id,
          type: "single",
          actionType: current.actionType,
          groupName: current.groupName,
          memberNames: current.memberName ? [current.memberName] : [],
          performedBy: current.performedBy,
          createdAt: current.createdAt,
        });
        i++;
      }
    }

    return processed;
  }, [history]);

  const getActionText = (entry: ProcessedHistoryEntry) => {
    // Batch member added
    if (entry.type === "batch" && entry.actionType === "member_added") {
      return (
        <div className="space-y-1">
          <p className="text-slate-900 dark:text-slate-100">
            <span className="font-medium">{entry.memberNames.length} members</span> joined "{entry.groupName}"
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {entry.memberNames.map((name, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"
              >
                {name}
              </Badge>
            ))}
          </div>
        </div>
      );
    }

    // Batch member removed
    if (entry.type === "batch" && entry.actionType === "member_removed") {
      return (
        <div className="space-y-1">
          <p className="text-slate-900 dark:text-slate-100">
            <span className="font-medium">{entry.memberNames.length} members</span> left "{entry.groupName}"
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {entry.memberNames.map((name, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-0"
              >
                {name}
              </Badge>
            ))}
          </div>
        </div>
      );
    }

    // Single actions
    switch (entry.actionType) {
      case "member_added":
        return (
          <p className="text-slate-900 dark:text-slate-100">
            <span className="font-medium">{entry.memberNames[0]}</span> joined "{entry.groupName}"
          </p>
        );
      case "member_removed":
        return (
          <p className="text-slate-900 dark:text-slate-100">
            <span className="font-medium">{entry.memberNames[0]}</span> left "{entry.groupName}"
          </p>
        );
      case "representative_set":
        return (
          <p className="text-slate-900 dark:text-slate-100">
            <span className="font-medium">{entry.memberNames[0]}</span> became representative of "{entry.groupName}"
          </p>
        );
      default:
        return <p className="text-slate-900 dark:text-slate-100">Unknown action</p>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <History className="w-4 h-4" />
          <span>History</span>
          {processedHistory.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 dark:bg-slate-700 dark:text-slate-300">
              {processedHistory.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-xl dark:bg-slate-900 dark:border-slate-800 p-0"
        side="right"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200 dark:border-slate-800">
            <SheetTitle className="flex items-center gap-2 dark:text-slate-100 text-base sm:text-lg">
              <History className="w-5 h-5" />
              Activity History
            </SheetTitle>
            <SheetDescription className="dark:text-slate-400 text-sm">
              Recent changes to groups and members
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {processedHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-slate-500 dark:text-slate-500">No activity yet</p>
                <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">
                  Changes will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {processedHistory.map((entry) => (
                  <Card
                    key={entry.id}
                    className="border-l-4 border-l-slate-300 dark:border-l-slate-700 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div
                          className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${getActionColor(
                            entry.actionType
                          )}`}
                        >
                          {getActionIcon(entry.actionType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          {getActionText(entry)}
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-500">
                            <span>{formatTimeAgo(entry.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}