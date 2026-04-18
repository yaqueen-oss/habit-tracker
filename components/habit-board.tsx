"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { formatDate, getLast14Days } from "@/lib/storage"; 
import type { User } from "@/lib/types";

interface HabitBoardProps {
  currentUser: User;
}

export function HabitBoard({ currentUser }: HabitBoardProps) {
  const [habits, setHabits] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitStartDate, setNewHabitStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<any>(null);
  const [missedReason, setMissedReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  
  const all14Days = getLast14Days();
  const selectedHabit = habits.find((h) => h.id === selectedHabitId);

  // Filter hari agar mulai dari start_date
  const displayedDays = selectedHabit 
    ? all14Days.filter(day => {
        const d = new Date(day);
        const s = new Date(selectedHabit.start_date || selectedHabit.created_at);
        d.setHours(0,0,0,0);
        s.setHours(0,0,0,0);
        return d >= s;
      })
    : [];

  const fetchData = async () => {
    const { data: habitsData } = await supabase.from("habits").select("*").order("created_at", { ascending: true });
    const { data: entriesData } = await supabase.from("habit_entries").select("*");
    if (habitsData) setHabits(habitsData);
    if (entriesData) setEntries(entriesData);
    if (habitsData && habitsData.length > 0 && !selectedHabitId) {
      setSelectedHabitId(habitsData[0].id);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedHabitId]);

  // Handle nama "null" kamu yang unik itu
  const activeUsersMap = new Map();
  const myName = (currentUser as any).nickname || currentUser.username || "User";
  activeUsersMap.set(currentUser.id, { id: currentUser.id, username: myName });
  
  entries.forEach((e) => {
    if (e.username) activeUsersMap.set(e.user_id, { id: e.user_id, username: e.username });
  });
  const users = Array.from(activeUsersMap.values());

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) return;
    const { data } = await supabase.from("habits").insert([
      { title: newHabitTitle, created_by: currentUser.id, start_date: newHabitStartDate }
    ]).select();
    if (data) {
      setHabits([...habits, data[0]]);
      setSelectedHabitId(data[0].id);
    }
    setNewHabitTitle("");
    setDialogOpen(false);
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm("Hapus habit ini?")) {
      await supabase.from("habits").delete().eq("id", habitId);
      fetchData();
    }
  };

  const handleSaveEntry = async (status: string, reason: string = "") => {
    if (!activeCell) return;
    const existing = entries.find(e => e.habit_id === activeCell.habitId && e.date === activeCell.date && e.user_id === currentUser.id);
    if (existing) {
      await supabase.from("habit_entries").update({ status, reason }).eq("id", existing.id);
    } else {
      await supabase.from("habit_entries").insert([{
        habit_id: activeCell.habitId, user_id: currentUser.id, username: myName, date: activeCell.date, status, reason
      }]);
    }
    setActiveCell(null);
    setShowReasonInput(false);
    fetchData();
  };

  const getCellEntry = (habitId: string, date: string, userId: string) => {
    return entries.find((e) => e.habit_id === habitId && e.date === date && e.user_id === userId);
  };

  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (formatDate(date) === formatDate(new Date())) return "Today";
    return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Team Accountability</h1>
          <p className="text-muted-foreground text-sm mt-1">Satu visi, satu habit, satu tim.</p>
        </div>
        <div className="flex items-center gap-3">
          {habits.length > 0 && (
            <Select value={selectedHabitId || ""} onValueChange={setSelectedHabitId}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {habits.map((h) => <SelectItem key={h.id} value={h.id}>{h.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button>+ Add Habit</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Habit</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Judul Habit</Label><Input value={newHabitTitle} onChange={(e) => setNewHabitTitle(e.target.value)} placeholder="Tahajud" /></div>
                <div className="space-y-2"><Label>Mulai Tanggal</Label><Input type="date" value={newHabitStartDate} onChange={(e) => setNewHabitStartDate(e.target.value)} /></div>
                <Button onClick={handleAddHabit} className="w-full">Buat Habit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedHabit && (
        <Card className="border-0 shadow-sm bg-card overflow-x-auto">
          <CardContent className="p-0">
           <table className="w-auto border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-medium text-muted-foreground">Member</th>
                  {displayedDays.map((day) => (
  <th key={day} className="p-4 text-center text-xs font-medium text-muted-foreground min-w-[100px]"></th>
))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentUser = user.id === currentUser.id;
                  return (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-medium flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">{user.username.charAt(0).toUpperCase()}</div>
                        {user.username}
                      </td>
                      {displayedDays.map((day) => {
                        const entry = getCellEntry(selectedHabit.id, day, user.id);
                        const status = entry?.status;
                        const isActive = activeCell?.date === day && activeCell?.userId === user.id;

                        if (!isCurrentUser) {
                          return (
                            <td key={day} className="p-2 px-10 text-center">
                              <div className={`w-8 h-8 mx-auto rounded flex items-center justify-center ${status === 'done' ? 'bg-green-500 text-white' : status === 'missed' ? 'bg-red-500 text-white' : 'bg-secondary'}`}>
                                {status === 'done' && '✓'} {status === 'missed' && '✕'}
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="p-2 text-center">
                            <Popover open={isActive} onOpenChange={(o) => !o && setActiveCell(null)}>
                              <PopoverTrigger asChild>
                                <button onClick={() => setActiveCell({ habitId: selectedHabit.id, date: day, userId: user.id })}
                                  className={`w-8 h-8 mx-auto rounded flex items-center justify-center transition ${status === 'done' ? 'bg-green-500 text-white' : status === 'missed' ? 'bg-red-500 text-white' : 'bg-secondary border'}`}>
                                  {status === 'done' && '✓'} {status === 'missed' && '✕'}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-3">
                                {!showReasonInput ? (
                                  <div className="flex gap-2">
                                    <Button size="sm" className="flex-1 bg-green-500" onClick={() => handleSaveEntry("done")}>✓</Button>
                                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => setShowReasonInput(true)}>✕</Button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Textarea value={missedReason} onChange={(e) => setMissedReason(e.target.value)} placeholder="Alasan..." className="text-sm h-16" />
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" onClick={() => setShowReasonInput(false)}>Batal</Button>
                                      <Button size="sm" variant="destructive" onClick={() => handleSaveEntry("missed", missedReason)}>Simpan</Button>
                                    </div>
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {selectedHabit && selectedHabit.created_by === currentUser.id && (
        <div className="flex justify-end mt-4">
          <Button variant="ghost" size="sm" onClick={() => handleDeleteHabit(selectedHabit.id)} className="text-destructive">
            Hapus Habit Ini
          </Button>
        </div>
      )}
    </div>
  );
}