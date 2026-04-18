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
  // FITUR BARU: State untuk tanggal mulai
  const [newHabitStartDate, setNewHabitStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<any>(null);
  const [missedReason, setMissedReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const days = getLast14Days();

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
    const interval = setInterval(fetchData, 5000); // Ubah ke 5 detik biar nggak terlalu berat
    return () => clearInterval(interval);
  }, [selectedHabitId]);

  const activeUsersMap = new Map();
  // PERBAIKAN: Gunakan nickname jika ada
  const myName = currentUser.nickname || currentUser.username || "User";
  activeUsersMap.set(currentUser.id, { id: currentUser.id, username: myName });
  
  entries.forEach((e) => {
    activeUsersMap.set(e.user_id, { id: e.user_id, username: e.username || "Member" });
  });
  const users = Array.from(activeUsersMap.values());

  const selectedHabit = habits.find((h) => h.id === selectedHabitId);

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) return;
    
    // Kirim start_date ke Supabase
    const { data } = await supabase.from("habits").insert([
      { 
        title: newHabitTitle, 
        created_by: currentUser.id,
        start_date: newHabitStartDate // Kolom baru kita
      }
    ]).select();

    if (data) {
      setHabits([...habits, data[0]]);
      setSelectedHabitId(data[0].id);
    }
    setNewHabitTitle("");
    setNewHabitStartDate(new Date().toISOString().split('T')[0]); // Reset ke hari ini
    setDialogOpen(false);
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm("Yakin mau hapus habit ini? Semua centangan tim akan hilang.")) {
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
        habit_id: activeCell.habitId,
        user_id: currentUser.id,
        username: myName,
        date: activeCell.date,
        status,
        reason
      }]);
    }
    
    setActiveCell(null);
    setShowReasonInput(false);
    setMissedReason("");
    fetchData();
  };

  const getCellEntry = (habitId: string, date: string, userId: string) => {
    return entries.find((e) => e.habit_id === habitId && e.date === date && e.user_id === userId);
  };

  const getUserCompletionRate = (userId: string, habitId: string) => {
    const userEntries = entries.filter((e) => e.user_id === userId && e.habit_id === habitId);
    if (userEntries.length === 0) return 0;
    const doneCount = userEntries.filter((e) => e.status === "done").length;
    return Math.round((doneCount / userEntries.length) * 100);
  };

  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (formatDate(date) === formatDate(today)) return "Today";
    if (formatDate(date) === formatDate(yesterday)) return "Yest.";
    return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Team Accountability</h1>
          <p className="text-muted-foreground text-sm mt-1">Track progress across all team members</p>
        </div>
        <div className="flex items-center gap-3">
          {habits.length > 0 && (
            <Select value={selectedHabitId || ""} onValueChange={setSelectedHabitId}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select a habit" /></SelectTrigger>
              <SelectContent>
                {habits.map((habit) => (
                  <SelectItem key={habit.id} value={habit.id}>{habit.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button>+ Add Habit</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Habit</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Habit Title</Label>
                  <Input value={newHabitTitle} onChange={(e) => setNewHabitTitle(e.target.value)} placeholder="e.g., Tahajud" />
                </div>
                
                {/* INPUT TANGGAL BARU */}
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input 
                    type="date" 
                    value={newHabitStartDate} 
                    onChange={(e) => setNewHabitStartDate(e.target.value)} 
                  />
                  <p className="text-[10px] text-muted-foreground">Habit akan dihitung mulai tanggal ini.</p>
                </div>

                <Button onClick={handleAddHabit} className="w-full">Create Habit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedHabit && (
        <Card className="border-0 shadow-sm bg-card">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base">Progress: {selectedHabit.title}</CardTitle>
                <p className="text-[10px] text-muted-foreground">Mulai: {new Date(selectedHabit.start_date).toLocaleDateString('id-ID')}</p>
              </div>
              {selectedHabit.created_by === currentUser.id && (
                <Button variant="ghost" size="sm" onClick={() => handleDeleteHabit(selectedHabit.id)} className="text-destructive">Delete</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user, i) => {
                const rate = getUserCompletionRate(user.id, selectedHabit.id);
                return (
                  <div key={user.id} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-5">{i + 1}</span>
                    <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-xs">{(user.username || "U").charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{user.username} {user.id === currentUser.id && "(you)"}</span>
                        <span>{rate}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedHabit && (
        <Card className="border-0 shadow-sm bg-card overflow-x-auto">
          <CardContent className="p-0">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-medium text-muted-foreground">Member</th>
                  {days.map((day) => (
                    <th key={day} className="p-2 text-center text-xs font-medium text-muted-foreground min-w-[50px]">{formatDayLabel(day)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrentUser = user.id === currentUser.id;
                  return (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-medium flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">{(user.username || "U").charAt(0).toUpperCase()}</div>
                        {user.username}
                      </td>
                      {days.map((day) => {
                        const entry = getCellEntry(selectedHabit.id, day, user.id);
                        const status = entry?.status;
                        const isActive = activeCell?.date === day && activeCell?.userId === user.id;

                        if (!isCurrentUser) {
                          return (
                            <td key={day} className="p-2 text-center">
                              <div className={`w-8 h-8 mx-auto rounded flex items-center justify-center ${status === 'done' ? 'bg-green-500 text-white' : status === 'missed' ? 'bg-red-500 text-white' : 'bg-secondary'}`}>
                                {status === 'done' && '✓'}
                                {status === 'missed' && '✕'}
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="p-2 text-center">
                            <Popover open={isActive} onOpenChange={(open) => !open && setActiveCell(null)}>
                              <PopoverTrigger asChild>
                                <button
                                  onClick={() => setActiveCell({ habitId: selectedHabit.id, date: day, userId: user.id })}
                                  className={`w-8 h-8 mx-auto rounded flex items-center justify-center transition hover:opacity-80 ${status === 'done' ? 'bg-green-500 text-white' : status === 'missed' ? 'bg-red-500 text-white' : 'bg-secondary border border-border'}`}
                                >
                                  {status === 'done' && '✓'}
                                  {status === 'missed' && '✕'}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-3">
                                {!showReasonInput ? (
                                  <div className="flex gap-2">
                                    <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600" onClick={() => handleSaveEntry("done")}>✓ Done</Button>
                                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => setShowReasonInput(true)}>✕ Missed</Button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Textarea value={missedReason} onChange={(e) => setMissedReason(e.target.value)} placeholder="Alasan nggak masuk..." className="text-sm h-16" />
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowReasonInput(false)}>Batal</Button>
                                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleSaveEntry("missed", missedReason)}>Simpan</Button>
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
    </div>
  );
}