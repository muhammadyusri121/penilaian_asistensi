"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { Input } from "./input";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { getCaptchaChallengeAction } from "@/features/auth/actions/captcha.actions";

export interface CaptchaDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: "DELETE_PERIOD" | "DELETE_COURSE" | "DELETE_MODULE";
  targetId: string | null;
  targetDescription: React.ReactNode;
  warningNotice?: React.ReactNode;
  confirmButtonText?: string;
  onConfirm: (token: string, input: string) => Promise<{ success: boolean; message: string }>;
  onSuccess?: (message: string) => void;
}

export function CaptchaDeleteModal({
  isOpen,
  onClose,
  title,
  action,
  targetId,
  targetDescription,
  warningNotice,
  confirmButtonText = "Ya, Hapus Data",
  onConfirm,
  onSuccess,
}: CaptchaDeleteModalProps) {
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadCaptcha(id: string) {
    setIsLoadingCaptcha(true);
    setCaptchaCode("");
    setCaptchaToken("");
    setCaptchaInput("");
    setDeleteError(null);
    try {
      const res = await getCaptchaChallengeAction(action, id);
      if (res.success && res.code && res.token) {
        setCaptchaCode(res.code);
        setCaptchaToken(res.token);
      } else {
        setDeleteError(res.message || "Gagal memuat kode verifikasi server.");
      }
    } catch {
      setDeleteError("Gagal menghubungi server untuk meminta kode verifikasi.");
    } finally {
      setIsLoadingCaptcha(false);
    }
  }

  useEffect(() => {
    if (isOpen && targetId) {
      loadCaptcha(targetId);
    } else {
      setCaptchaCode("");
      setCaptchaToken("");
      setCaptchaInput("");
      setDeleteError(null);
      setIsDeleting(false);
    }
  }, [isOpen, targetId]);

  function handleRefresh() {
    if (targetId) {
      loadCaptcha(targetId);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetId) return;

    if (!captchaToken) {
      setDeleteError("Kode verifikasi belum siap. Silakan klik tombol muat ulang kode.");
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.trim().toUpperCase()) {
      setDeleteError("Kode captcha verifikasi tidak cocok. Silakan periksa kembali.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await onConfirm(captchaToken, captchaInput);
      if (res.success) {
        onSuccess?.(res.message);
        onClose();
      } else {
        setDeleteError(res.message || "Gagal memproses permintaan hapus.");
        handleRefresh();
      }
    } catch {
      setDeleteError("Terjadi kendala jaringan saat memproses tindakan.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isOpen) return null;

  const isMatched =
    captchaInput.trim().length === 6 &&
    captchaInput.trim().toUpperCase() === captchaCode.toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isDeleting && onClose()}
      title={title}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Alert Box */}
        <div className="p-3 bg-[#FFEBEE] border-2 border-[#FF5252] text-black space-y-2">
          <div className="flex items-center gap-2 text-[#D32F2F] font-black text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>PERINGATAN: Tindakan Permanen!</span>
          </div>

          <div className="text-xs text-neutral-800 leading-relaxed font-medium">
            {targetDescription}
          </div>

          {warningNotice && (
            <div className="text-[11px] text-[#B71C1C] font-semibold bg-white p-2 border border-[#FFCDD2] rounded">
              {warningNotice}
            </div>
          )}
        </div>

        {deleteError && (
          <div className="p-2.5 bg-[#FF5252] text-white text-xs font-bold neo-box-sm">
            {deleteError}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-bold text-black">
            Ketik 6 karakter kode verifikasi di bawah ini untuk mengonfirmasi:
          </label>

          {/* Captcha Box */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-neutral-900 border-2 border-black p-3 text-center rounded select-none tracking-[0.4em] font-mono text-xl font-black text-[#00E5FF] shadow-inner">
              {isLoadingCaptcha ? "..." : captchaCode}
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 border-2 border-black bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
              title="Ganti Kode Captcha"
              disabled={isDeleting || isLoadingCaptcha}
            >
              <RotateCcw
                className={`w-4 h-4 text-black ${isLoadingCaptcha ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <Input
            type="text"
            placeholder="Masukkan 6 karakter kode di atas"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
            maxLength={6}
            required
            disabled={isDeleting || isLoadingCaptcha}
            className="font-mono text-center tracking-widest text-base font-black uppercase"
            autoFocus
          />
          <span className="text-[10px] text-neutral-500 font-bold block">
            *Huruf besar/kecil tidak sensitif. Masukkan persis 6 karakter.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t-2 border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            disabled={isDeleting}
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={isDeleting || isLoadingCaptcha || !captchaToken || !isMatched}
            className="bg-[#FF5252] text-white hover:bg-[#D32F2F] disabled:opacity-50"
          >
            {isDeleting ? "Menghapus..." : confirmButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
