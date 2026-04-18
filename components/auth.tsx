"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // <-- State baru untuk Nickname
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (mode === "register" && !username.trim()) {
      setError("Please enter a nickname");
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) setError(signInError.message);
      } else {
        // Register dengan menyimpan Nickname ke dalam metadata Supabase
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username, // <-- Nickname dititipkan di sini
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage("Registration successful! You can now sign in.");
          setMode("login");
          setUsername(""); // Reset form
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Team Habit Tracker</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Track habits together, stay accountable</p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); setMessage(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); setMessage(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Nickname khusus muncul saat Register */}
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Nickname (Tampil di Habit Board)</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., Budi, Captain, dll"
                  className="h-11"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password (min 6 chars)" className="h-11" required />
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            {message && <p className="text-sm text-green-600 bg-green-100 px-3 py-2 rounded-lg">{message}</p>}

            <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
              {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}