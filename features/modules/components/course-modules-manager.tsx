"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CaptchaDeleteModal } from "@/components/ui/captcha-delete-modal";
import { ArrowRight, Lock, Trash2 } from "lucide-react";
import { deleteModuleAction } from "../actions/module.actions";

export interface ModuleItem {
  id: string;
  title: string;
  orderIndex: number;
  description?: string | null;
  isFinalReport: boolean;
}

interface CourseModulesManagerProps {
  courseId: string;
  modules: ModuleItem[];
  isApproved: boolean;
  isAdmin: boolean;
}

export function CourseModulesManager({
  courseId,
  modules,
  isApproved,
  isAdmin,
}: CourseModulesManagerProps) {
  const router = useRouter();
  const [moduleToDelete, setModuleToDelete] = useState<ModuleItem | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`neo-box p-3 flex items-center justify-between text-xs font-black ${
            feedback.success ? "bg-[#4CAF50] text-black" : "bg-[#FF5252] text-white"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold underline text-xs ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const isFinal = mod.isFinalReport;
          const headerBg = isFinal ? "bg-[#FF5252] text-white" : "bg-white text-black";

          return (
            <Card key={mod.id} className="flex flex-col justify-between">
              <div>
                <div className={`p-3.5 border-b-3 border-black flex items-center justify-between ${headerBg}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 border-2 border-black bg-white text-black flex items-center justify-center font-mono font-black text-xs shrink-0">
                      {mod.orderIndex}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider">
                      {isFinal ? "Laporan Akhir" : `Modul ${mod.orderIndex}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isFinal && (
                      <span className="neo-box-sm text-[9px] px-1.5 py-0.5 bg-black text-white font-black uppercase">
                        Final
                      </span>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setModuleToDelete(mod)}
                        title="Hapus Modul Ini"
                        className="p-1 neo-box-sm bg-[#FF5252] text-white hover:bg-red-700 transition-colors border border-black cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-base font-black text-black leading-snug">
                    {mod.title}
                  </h3>
                  <p className="text-xs font-medium text-neutral-600">
                    {mod.description || "Asistensi kode sumber dan pemeriksaan laporan resmi."}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t-3 border-black bg-neutral-50 flex items-center gap-2">
                {isApproved ? (
                  <Link href={`/${courseId}/penilaian/${mod.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full text-xs">
                      <span>Mulai Penilaian</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/${courseId}/praktikan`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full text-xs opacity-75">
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      <span>Terkunci</span>
                    </Button>
                  </Link>
                )}

                {isAdmin && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="text-xs px-2.5 py-1.5 bg-[#FF5252] text-white hover:bg-red-700"
                    onClick={() => setModuleToDelete(mod)}
                    title="Hapus Modul Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* MODAL KONFIRMASI HAPUS MODUL DENGAN CAPTCHA */}
      {moduleToDelete && (
        <CaptchaDeleteModal
          isOpen={!!moduleToDelete}
          onClose={() => setModuleToDelete(null)}
          title="Konfirmasi Hapus Modul"
          action="DELETE_MODULE"
          targetId={moduleToDelete.id}
          confirmButtonText="Ya, Hapus Modul Ini"
          targetDescription={
            <p>
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-black underline">{moduleToDelete.title}</span>?
            </p>
          }
          warningNotice={
            <>
              Seluruh riwayat tugas pengumpulan mahasiswa, file yang telah diunggah, dan lembar nilai
              asistensi untuk modul ini akan{" "}
              <span className="font-black underline">DIHAPUS PERMANEN</span> dan tidak dapat dipulihkan.
            </>
          }
          onConfirm={(token, input) =>
            deleteModuleAction(moduleToDelete.id, token, input)
          }
          onSuccess={(message) => {
            setFeedback({ success: true, message });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
