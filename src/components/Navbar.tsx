import { useState } from "react";
import { Menu, Users, ShieldCheck, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from "./ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";

interface NavbarProps {
  onNavigateHome: () => void;
  isAdmin: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
  isDarkMode: boolean;
  onToggleDarkMode: (isDarkMode: boolean) => void;
}

const ADMIN_PASSWORD = "wer124SantosPogi";

export function Navbar({ onNavigateHome, isAdmin, onToggleAdmin, isDarkMode, onToggleDarkMode }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");

  const handleAdminToggle = () => {
    if (isAdmin) {
      // If already admin, just toggle off
      onToggleAdmin(false);
      toast.success("Switched to User Mode");
    } else {
      // If not admin, show password dialog
      setIsPasswordDialogOpen(true);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      onToggleAdmin(true);
      setIsPasswordDialogOpen(false);
      setPassword("");
      toast.success("Admin Mode Activated");
    } else {
      toast.error("Incorrect password");
    }
  };

  return (
    <>
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-slate-900/50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-900 dark:text-slate-50">Groupings Tracker</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                onClick={() => onToggleDarkMode(!isDarkMode)}
                variant="ghost"
                size="icon"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button
                onClick={handleAdminToggle}
                variant={isAdmin ? "default" : "outline"}
                className={isAdmin ? "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md" : "dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"}
              >
                <ShieldCheck className="w-4 h-4" />
                {isAdmin ? "Admin Mode" : "User Mode"}
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 dark:bg-slate-900 dark:border-slate-800">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Access app settings and navigation options.</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <Button
                    onClick={() => {
                      onToggleDarkMode(!isDarkMode);
                      setIsOpen(false);
                    }}
                    variant="ghost"
                    className="flex items-center gap-2 justify-start text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                  </Button>
                  <Button
                    onClick={() => {
                      handleAdminToggle();
                      setIsOpen(false);
                    }}
                    variant={isAdmin ? "default" : "outline"}
                    className={isAdmin ? "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600" : "dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 justify-start"}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isAdmin ? "Admin Mode" : "User Mode"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Admin Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] mx-4 dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">Admin Authentication</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Please enter the admin password to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setPassword("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
              Authenticate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}