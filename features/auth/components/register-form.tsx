"use client";

import React, { useState } from "react";
import Link from "next/link";
import { registerAction } from "../actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import { AuthBanner } from "./auth-banner";

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
      const formData = new FormData();
      formData.append("username", username);
      formData.append("name", name);
      if (email) formData.append("email", email);
      formData.append("password", password);

      const res = await registerAction(formData);

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
    <div className="w-full max-w-4xl bg-white border-3 border-black shadow-[8px_8px_0px_#000000] rounded-2xl md:rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 relative">
      {/* Left Column: Geometric Bauhaus Mosaic Banner */}
      <div className="md:col-span-5 h-full">
        <AuthBanner />
      </div>

      {/* Right Column: Form Area */}
      <div className="md:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-center relative bg-[#FDFBF7]">
        {/* Decorative Sparkle Accent */}
        <div className="absolute top-6 right-6 text-[#2196F3] select-none text-2xl font-black hidden sm:block">
          ✦
        </div>

        <div className="mb-6">
          <span className="neo-box-sm bg-[#00E5FF] text-black text-[10px] font-black uppercase px-2 py-0.5 inline-block mb-2">
            Registrasi Baru
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Selamat bergabung, sobat!
          </h1>
          <p className="text-xs font-bold text-neutral-600 mt-1">
            Silahkan isi form dibawah ini untuk membuat akun asisten praktikum.
          </p>
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
                <Button variant="primary" className="w-full py-3">
                  Kembali ke Halaman Login (Sign In)
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
              {/* 2-Column Grid for Name & Username, matching reference design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-name"
                    className="text-xs font-black uppercase tracking-wider text-black block mb-1"
                  >
                    Nama Lengkap
                  </label>
                  <Input
                    id="reg-name"
                    placeholder="cth: Budi Santoso"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-username"
                    className="text-xs font-black uppercase tracking-wider text-black block mb-1"
                  >
                    Username
                  </label>
                  <Input
                    id="reg-username"
                    placeholder="cth: budisantoso"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="text-xs font-black uppercase tracking-wider text-black block mb-1"
                >
                  Email (Opsional)
                </label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="budi@kampus.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="text-xs font-black uppercase tracking-wider text-black block mb-1"
                >
                  Password (Min. 6 Karakter)
                </label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-white"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full text-xs font-black uppercase tracking-wider py-3 shadow-[4px_4px_0px_#000000]"
                  disabled={loading}
                >
                  {loading ? "Mendaftarkan..." : "Ajukan Pendaftaran (Sign Up)"}
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-4 border-t-2 border-dashed border-neutral-300 flex items-center justify-between text-xs font-bold flex-wrap gap-2">
              <span className="text-neutral-600">Sudah punya akun asisten?</span>
              <Link
                href="/login"
                className="text-black font-black underline hover:text-[#FF5252] transition-colors"
              >
                Login di sini (Sign In) →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
