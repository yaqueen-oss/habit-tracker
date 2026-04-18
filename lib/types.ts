export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  startDate: string;
  createdBy: string;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  userId: string;
  status: "done" | "missed" | null;
  reason?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
}

export type View = "habits" | "notes";
