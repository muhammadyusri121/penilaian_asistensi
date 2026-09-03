"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { setupInitialAdminAction } from "../actions/admin-management.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, User, Mail, KeyRound, CheckCircle2 } from "lucide-react";

export function SetupAdminForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok!");
      setLoading(false);
      return;
    }

    try {
      const res = await setupInitialAdminAction({
        username,
        name,
        email: email || undefined,
        password,
      });

      if (res.success) {
        setSuccessMsg(res.message || "Akun Koordinator Lab berhasil dibuat!");
        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1500);
      } else {
        setErrorMsg(res.message || "Gagal membuat akun admin.");
      }
    } catch {
      setErrorMsg("Terjadi kendala jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="neo-box bg-white p-6 md:p-8 w-full max-w-md">
      <div className="flex items-center gap-3 border-b-3 border-black pb-4 mb-6">
        <div className="neo-box-sm bg-[#FFEB3B] p-2.5">
          <ShieldCheck className="w-7 h-7 text-black" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
            Inisialisasi Admin
          </h1>
          <p className="text-xs font-bold text-neutral-600 uppercase">
            Form Pembuatan Akun Koordinator Lab Pertama
          </p>
        </div>
      </div>

      <div className="neo-box-sm bg-[#FFF9F0] p-3 mb-5 text-xs font-bold leading-relaxed border-l-4 border-l-[#2196F3]">
        Sistem mendeteksi belum ada akun Administrator di database. Silakan isi form di bawah ini untuk membuat akun Koordinator Laboratorium pertama Anda.
      </div>

      {errorMsg && (
        <div className="neo-box-sm bg-[#FF5252] text-white p-3 mb-5 text-xs font-black uppercase tracking-wide">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div className="neo-box-sm bg-[#4CAF50] text-black p-4 text-xs font-black flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg} Mengalihkan ke halaman login...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="setup-name"
            label="Nama Lengkap Koordinator Lab"
            placeholder="cth: Dr. Hendra Wijaya, M.Kom."
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="setup-username"
            label="Username Admin"
            placeholder="cth: admin"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            id="setup-email"
            label="Email Resmi (Opsional)"
            type="email"
            placeholder="lab@kampus.ac.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            id="setup-password"
            label="Password Admin (Minimal 6 Karakter)"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            id="setup-confirm-password"
            label="Ulangi Password"
            type="password"
            placeholder="••••••••"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Simpan & Aktifkan Akun Admin"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
