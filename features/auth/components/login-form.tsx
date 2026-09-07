"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "../actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, KeyRound } from "lucide-react";
import { AuthBanner } from "./auth-banner";

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
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const res = await loginAction(formData);
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
    <div className="w-full max-w-4xl bg-white border-3 border-black shadow-[8px_8px_0px_#000000] rounded-2xl md:rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 relative">
      {/* Left Column: Geometric Bauhaus Mosaic Banner */}
      <div className="md:col-span-5 h-full">
        <AuthBanner />
      </div>

      {/* Right Column: Form Area */}
      <div className="md:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-center relative bg-[#FDFBF7]">
        {/* Decorative Sparkle Accent */}
        <div className="absolute top-6 right-6 text-[#FF5252] select-none text-2xl font-black hidden sm:block">
          ✦
        </div>

        <div className="mb-6">
          <span className="neo-box-sm bg-[#FFEB3B] text-black text-[10px] font-black uppercase px-2 py-0.5 inline-block mb-2">
            Portal Asistensi
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Selamat Datang, Sobat!
          </h1>
          <p className="text-xs font-bold text-neutral-600 mt-1">
            Silakan login untuk mengakses modul dan penilaian praktikum.
          </p>
        </div>

        {errorMsg && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-3 mb-5 text-xs font-black uppercase tracking-wide">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-black" />
              <label
                htmlFor="username"
                className="text-xs font-black uppercase tracking-wider text-black"
              >
                Username
              </label>
            </div>
            <Input
              id="username"
              type="text"
              required
              placeholder="Contoh: username atau admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="bg-white"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <KeyRound className="w-3.5 h-3.5 text-black" />
              <label
                htmlFor="password"
                className="text-xs font-black uppercase tracking-wider text-black"
              >
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
              className="bg-white"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-xs font-black uppercase tracking-wider py-3 shadow-[4px_4px_0px_#000000]"
              disabled={loading}
            >
              {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-4 border-t-2 border-dashed border-neutral-300 flex items-center justify-between text-xs font-bold flex-wrap gap-2">
          <span className="text-neutral-600">Belum punya akun asisten?</span>
          <Link
            href="/register"
            className="text-black font-black underline hover:text-[#FF5252] transition-colors"
          >
            Daftar Sekarang (Sign Up) →
          </Link>
        </div>
      </div>
    </div>
  );
}
