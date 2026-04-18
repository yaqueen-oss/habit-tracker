import type { User, Habit, HabitEntry, Note } from "./types";

const KEYS = {
  USERS: "habit_tracker_users",
  CURRENT_USER: "habit_tracker_current_user",
  HABITS: "habit_tracker_habits",
  ENTRIES: "habit_tracker_entries",
  NOTES: "habit_tracker_notes",
};

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback;
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Users
export function getUsers(): User[] {
  return getItem<User[]>(KEYS.USERS, []);
}

export function saveUser(user: User): void {
  const users = getUsers();
  users.push(user);
  setItem(KEYS.USERS, users);
}

export function findUser(username: string): User | undefined {
  return getUsers().find((u) => u.username === username);
}

export function getCurrentUser(): User | null {
  return getItem<User | null>(KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
  setItem(KEYS.CURRENT_USER, user);
}

// Habits
export function getHabits(): Habit[] {
  return getItem<Habit[]>(KEYS.HABITS, []);
}

export function saveHabit(habit: Habit): void {
  const habits = getHabits();
  habits.push(habit);
  setItem(KEYS.HABITS, habits);
}

export function deleteHabit(habitId: string): void {
  const habits = getHabits().filter((h) => h.id !== habitId);
  setItem(KEYS.HABITS, habits);
  // Also delete related entries
  const entries = getEntries().filter((e) => e.habitId !== habitId);
  setItem(KEYS.ENTRIES, entries);
}

// Habit Entries
export function getEntries(): HabitEntry[] {
  return getItem<HabitEntry[]>(KEYS.ENTRIES, []);
}

export function saveEntry(entry: HabitEntry): void {
  const entries = getEntries();
  const existingIndex = entries.findIndex(
    (e) =>
      e.habitId === entry.habitId &&
      e.date === entry.date &&
      e.userId === entry.userId
  );
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  setItem(KEYS.ENTRIES, entries);
}

export function getEntry(
  habitId: string,
  date: string,
  userId: string
): HabitEntry | undefined {
  return getEntries().find(
    (e) => e.habitId === habitId && e.date === date && e.userId === userId
  );
}

// Notes
export function getNotes(): Note[] {
  return getItem<Note[]>(KEYS.NOTES, []);
}

export function saveNote(note: Note): void {
  const notes = getNotes();
  notes.push(note);
  setItem(KEYS.NOTES, notes);
}

export function deleteNote(noteId: string): void {
  const notes = getNotes().filter((n) => n.id !== noteId);
  setItem(KEYS.NOTES, notes);
}

// Utility
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getLast14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(formatDate(date));
  }
  return days;
}

export function getConsecutiveMisses(
  habitId: string,
  userId: string,
  entries: HabitEntry[]
): number {
  const userEntries = entries
    .filter((e) => e.habitId === habitId && e.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let consecutive = 0;
  const today = formatDate(new Date());

  for (let i = 0; i < 14; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = formatDate(checkDate);

    if (dateStr > today) continue;

    const entry = userEntries.find((e) => e.date === dateStr);
    if (entry?.status === "missed") {
      consecutive++;
    } else if (entry?.status === "done") {
      break;
    } else {
      break;
    }
  }

  return consecutive;
}
