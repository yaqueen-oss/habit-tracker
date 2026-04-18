"use client";

import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "./change-password-dialog";
import type { View, User } from "@/lib/types";

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  user: User;
  onLogout: () => void;
}

export function Navigation({
  currentView,
  onViewChange,
  user,
  onLogout,
}: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg
                  className="h-4 w-4 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="font-semibold text-foreground hidden sm:block">
                Habit Tracker
              </span>
            </div>

            <nav className="flex items-center gap-1">
              <button
                onClick={() => onViewChange("habits")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === "habits"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <ChangePasswordDialog />
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <span className="hidden sm:inline">Habit Board</span>
                </span>
              </button>
              <button
                onClick={() => onViewChange("notes")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === "notes"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span className="hidden sm:inline">Team Notes</span>
                </span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {user.username}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="ml-2 hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
