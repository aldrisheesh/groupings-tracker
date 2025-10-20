import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 mx-auto text-indigo-600 dark:text-indigo-400 animate-spin" />
        <div className="space-y-2">
          <p className="text-slate-700 dark:text-slate-300">Loading groups...</p>
          <p className="text-slate-500 dark:text-slate-500">Please wait</p>
        </div>
      </div>
    </div>
  );
}
