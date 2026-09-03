"use client";

import React, { useState } from "react";
import Link from "next/link";
import { registerAction } from "../actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, User, KeyRound, Mail, CheckCircle2 } from "lucide-react";

export function RegisterForm() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await registerAction({
        username,
        name,
        email: email || undefined,
        password,
      });

      if (res.success) {
        setSuccessMsg(
          res.message ||
            "Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan (ACC) dari Koordinator Laboratorium."
        );
        setUsername("");
        setName("");
        setEmail("");
        setPassword("");
      } else {
        setErrorMsg(res.message || "Pendaftaran gagal.");
      }
    } catch {
      setErrorMsg("Terjadi kendala koneksi ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="neo-box bg-white p-6 md:p-8 w-full max-w-md">
      <div className="flex items-center gap-3 border-b-3 border-black pb-4 mb-6">
        <div className="neo-box-sm bg-[#00E5FF] p-2.5">
          <UserPlus className="w-7 h-7 text-black" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
            Daftar Asisten
          </h1>
          <p className="text-xs font-bold text-neutral-600 uppercase">
            Registrasi Akun Asprak Baru
          </p>
        </div>
      </div>

      {successMsg ? (
        <div className="space-y-4">
          <div className="neo-box-sm bg-[#4CAF50] text-black p-4 text-sm font-bold flex flex-col gap-2">
            <div className="flex items-center gap-2 font-black">
              <CheckCircle2 className="w-5 h-5" />
              <span>PENDAFTARAN BERHASIL</span>
            </div>
            <p className="text-xs leading-relaxed">{successMsg}</p>
          </div>

          <div className="text-center pt-2">
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Kembali ke Halaman Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {errorMsg && (
            <div className="neo-box-sm bg-[#FF5252] text-white p-3 mb-5 text-xs font-black uppercase tracking-wide">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="reg-name"
              label="Nama Lengkap"
              placeholder="cth: Budi Santoso, S.Kom."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              id="reg-username"
              label="Username Akun"
              placeholder="cth: asprak_budi"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Input
              id="reg-email"
              label="Email (Opsional)"
              type="email"
              placeholder="budi@kampus.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              id="reg-password"
              label="Password (Minimal 6 Karakter)"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? "Mendaftarkan..." : "Ajukan Pendaftaran Akun"}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t-3 border-black text-center text-xs font-bold">
            <span className="text-neutral-600">Sudah punya akun? </span>
            <Link href="/login" className="underline font-black hover:text-[#FF5252]">
              Login di sini
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
