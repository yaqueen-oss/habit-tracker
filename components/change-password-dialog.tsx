"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ChangePasswordDialog() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [open, setOpen] = useState(false);

  const handleUpdatePassword = async () => {
    setMessage(null);

    // Validasi sederhana
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Sandi minimal 6 karakter ya!" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Konfirmasi sandi nggak cocok!" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Sandi berhasil diperbarui! 🚀" });
      setNewPassword("");
      setConfirmPassword("");
      // Tutup dialog otomatis setelah 2 detik
      setTimeout(() => setOpen(false), 2000);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Ganti Sandi</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Kata Sandi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Sandi Baru</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Sandi Baru</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang sandi"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-green-500" : "text-red-500"}`}>
              {message.text}
            </p>
          )}

          <Button 
            onClick={handleUpdatePassword} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Update Sandi Sekarang"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}