import { OrbitProgress } from "react-loading-indicators";

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <center>
          <OrbitProgress dense color="#4f46e5" size="small" text="" textColor="" />
        </center>
        <div className="space-y-2">
          <p className="text-slate-700 dark:text-slate-300">Loading groups...</p>
          <p className="text-slate-500 dark:text-slate-500">Please wait</p>
        </div>
      </div>
    </div>
  );
}
