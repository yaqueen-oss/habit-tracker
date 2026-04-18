"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase"; // Import Supabase Client
import type { Note, User } from "@/lib/types";

interface NotesViewProps {
  currentUser: User;
}

export function NotesView({ currentUser }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    tags: "",
  });

  // AMBIL DATA DARI SUPABASE
  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Sesuaikan format data Supabase ke format Note di UI
      const formattedNotes = data.map((n: any) => ({
        id: n.id,
        title: n.title || "Untitled",
        content: n.content,
        tags: n.tags || [],
        createdBy: n.user_id,
        createdAt: n.created_at,
      }));
      setNotes(formattedNotes);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [notes, searchQuery]);

  // SIMPAN KE SUPABASE
  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const tagsArray = newNote.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          title: newNote.title,
          content: newNote.content,
          tags: tagsArray,
          user_id: currentUser.id,
        },
      ])
      .select();

    if (!error) {
      fetchNotes(); // Refresh data setelah simpan
      setNewNote({ title: "", content: "", tags: "" });
      setDialogOpen(false);
    }
  };

  // HAPUS DARI SUPABASE
  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);

    if (!error) {
      setNotes(notes.filter((n) => n.id !== noteId));
    } else {
      alert("Gagal menghapus: Kamu bukan pemilik catatan ini!");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Team Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Shared ideas, evaluations, and insights
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Note title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-tags">Tags</Label>
                <Input
                  id="note-tags"
                  value={newNote.tags}
                  onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                  placeholder="idea, review, important (comma separated)"
                />
              </div>
              <Button onClick={handleCreateNote} className="w-full">
                Create Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes by title, content, or tags..."
          className="pl-10 h-11"
        />
      </div>

      {loading ? (
        <p className="text-center py-10 text-muted-foreground text-sm">Loading notes...</p>
      ) : filteredNotes.length === 0 ? (
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-foreground">
              {searchQuery ? "No notes found" : "No notes yet"}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {searchQuery ? "Try a different search term" : "Create your first note to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 pb-20">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="border-0 shadow-sm bg-card break-inside-avoid">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-medium leading-tight">{note.title}</CardTitle>
                  
                  {/* TOMBOL HAPUS SAKTI (Hanya pemilik yang bisa lihat) */}
                  {note.createdBy === currentUser.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}