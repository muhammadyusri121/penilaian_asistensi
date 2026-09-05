"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "../actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, KeyRound, User } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginAction({ username, password });
      if (res.success) {
        if (res.role === "ADMIN") {
          router.push("/admin/matakuliah");
        } else {
          router.push("/praktikum");
        }
        router.refresh();
      } else {
        setErrorMsg(res.message || "Login gagal, silakan coba lagi.");
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
        <div className="neo-box-sm bg-[#FFEB3B] p-2.5">
          <ShieldCheck className="w-7 h-7 text-black" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
            Portal Asistensi
          </h1>
          <p className="text-xs font-bold text-neutral-600 uppercase">
            Laboratorium Komputer & Teknik
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="neo-box-sm bg-[#FF5252] text-white p-3 mb-5 text-xs font-black uppercase tracking-wide">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <User className="w-4 h-4 text-black" />
            <label htmlFor="username" className="text-xs font-black uppercase tracking-wider text-black">
              Username / Kode Asprak
            </label>
          </div>
          <Input
            id="username"
            type="text"
            required
            placeholder="Contoh: asprak1 atau admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <KeyRound className="w-4 h-4 text-black" />
            <label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-black">
              Password
            </label>
          </div>
          <Input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full text-sm"
            disabled={loading}
          >
            {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
          </Button>
        </div>
      </form>

      <div className="mt-5 text-center text-xs font-bold">
        <span className="text-neutral-600">Belum punya akun asisten? </span>
        <a href="/register" className="underline font-black hover:text-[#FF5252]">
          Daftar di sini (Menunggu ACC)
        </a>
      </div>
    </div>
  );
}
