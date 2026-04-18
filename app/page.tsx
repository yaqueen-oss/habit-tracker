"use client";

import { useState, useEffect } from "react";
import { Auth } from "@/components/auth";
import { Navigation } from "@/components/navigation";
import { HabitBoard } from "@/components/habit-board";
import { NotesView } from "@/components/notes-view";
import { supabase } from "@/lib/supabase";
import type { User, View } from "@/lib/types";

export default function Home() {
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>("habits");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView("habits");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!supabaseUser) {
    return <Auth />;
  }

  // 💡 INI KUNCI FIX-NYA: Kita ubah format Supabase jadi format User lama
  const appUser: User = {
    id: supabaseUser.id,
    // Cek metadata username dulu, kalau kosong baru potong dari email
    username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || "Member",
    password: "", // Dikosongkan karena keamanan sekarang diurus Supabase
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  };
  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        user={appUser}
        onLogout={handleLogout}
      />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {currentView === "habits" ? (
          <HabitBoard currentUser={appUser} />
        ) : (
          <NotesView currentUser={appUser} />
        )}
      </main>
    </div>
  );
}