"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { claimCourseAction, unclaimCourseAction } from "../actions/course.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Check, Layers, Users, ExternalLink, AlertCircle, Clock, Lock } from "lucide-react";

interface CatalogCourseItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  scheduleDay?: string | null;
  scheduleTime?: string | null;
  academicPeriod: {
    name: string;
    courseInputStart?: Date | string | null;
    courseInputEnd?: Date | string | null;
  };
  isClaimedByMe: boolean;
  myProposalStatus?: string | null;
  modules: Array<{ id: string; title: string; orderIndex: number; isFinalReport: boolean }>;
  _count: {
    modules: number;
    enrollments: number;
    assistants: number;
  };
}

interface CourseCatalogProps {
  courses: CatalogCourseItem[];
  userRole: "ADMIN" | "ASISTEN";
  periodInfo?: {
    name: string;
    courseInputStart?: Date | string | null;
    courseInputEnd?: Date | string | null;
  } | null;
}

function formatIndoDateTime(val?: Date | string | null) {
  if (!val) return "-";
  const date = new Date(val);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRemainingDaysText(targetDate?: Date | string | null): string {
  if (!targetDate) return "";
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return "Telah ditutup";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24) {
    if (diffHours <= 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins} menit lagi`;
    }
    return `${diffHours} jam lagi`;
  }

  return `${diffDays} hari lagi`;
}

export function CourseCatalog({ courses, userRole, periodInfo }: CourseCatalogProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);

  async function handleClaim(courseId: string) {
    setLoadingId(courseId);
    setFeedback(null);

    try {
      const res = await claimCourseAction(courseId);
      if (res.success) {
        setFeedback({ id: courseId, success: true, message: res.message });
        router.refresh();
      } else {
        setFeedback({ id: courseId, success: false, message: res.message });
      }
    } catch {
      setFeedback({ id: courseId, success: false, message: "Terjadi kendala jaringan." });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleUnclaim(courseId: string) {
    if (!confirm("Apakah Anda yakin ingin melepaskan mata kuliah praktikum ini?")) return;

    setLoadingId(courseId);
    setFeedback(null);

    try {
      const res = await unclaimCourseAction(courseId);
      if (res.success) {
        setFeedback({ id: courseId, success: true, message: res.message });
        router.refresh();
      } else {
        setFeedback({ id: courseId, success: false, message: res.message });
      }
    } catch {
      setFeedback({ id: courseId, success: false, message: "Terjadi kendala jaringan." });
    } finally {
      setLoadingId(null);
    }
  }

  const now = new Date();
  const activeCourseEnd = periodInfo?.courseInputEnd || courses[0]?.academicPeriod?.courseInputEnd;
  const activeCourseStart = periodInfo?.courseInputStart || courses[0]?.academicPeriod?.courseInputStart;
  const isCourseOpen = Boolean(
    activeCourseEnd &&
    (!activeCourseStart || now >= new Date(activeCourseStart)) &&
    now <= new Date(activeCourseEnd)
  );

  return (
    <div className="space-y-6">
      {/* Banner Estimasi Ditutup saat Periode Pengambilan MK Dibuka */}
      {courses.length > 0 && isCourseOpen && activeCourseEnd && (
        <div className="neo-box p-4 border-3 border-black flex items-center justify-between flex-wrap gap-3 bg-[#E0F2FE]">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-700 shrink-0" />
            <div>
              <span className="text-xs font-black uppercase text-black block">
                Periode Pengambilan Mata Kuliah Sedang Dibuka
              </span>
              <span className="text-xs font-medium text-neutral-700">
                Batas akhir pemilihan s.d. {formatIndoDateTime(activeCourseEnd)}
              </span>
            </div>
          </div>

          <span className="neo-box-sm bg-amber-300 text-black px-3 py-1 text-xs font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            ⏳ Ditutup dalam {getRemainingDaysText(activeCourseEnd)}
          </span>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="neo-box bg-white p-12 text-center">
          {!isCourseOpen ? (
            <>
              <Lock className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-lg font-black uppercase">Periode Pengambilan Mata Kuliah Telah Ditutup</h3>
              <p className="text-xs font-bold text-neutral-600 max-w-md mx-auto">
                Periode pengambilan mata kuliah praktikum telah ditutup. Anda belum memiliki mata kuliah yang diampu pada semester ini. Silakan hubungi Koordinator Laboratorium jika diperlukan pembukaan susulan.
              </p>
            </>
          ) : (
            <>
              <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-lg font-black uppercase">Belum Ada Mata Kuliah Praktikum</h3>
              <p className="text-xs font-bold text-neutral-600">
                Koordinator Laboratorium belum membuka mata kuliah praktikum untuk semester aktif.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isProcessing = loadingId === course.id;

            return (
              <Card key={course.id} className="flex flex-col justify-between">
                <div>
                  <div className="p-4 border-b-3 border-black bg-[#FFF9F0] flex items-center justify-between">
                    <span className="neo-box-sm bg-black text-white px-2.5 py-1 text-xs font-mono font-black">
                      {course.code}
                    </span>

                    {course.isClaimedByMe ? (
                      <div className="flex items-center gap-1.5">
                        {course.myProposalStatus === "APPROVED" && (
                          <span className="neo-box-sm bg-[#4CAF50] text-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        {course.myProposalStatus === "PENDING_APPROVAL" && (
                          <span className="neo-box-sm bg-amber-400 text-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
                            Menunggu ACC
                          </span>
                        )}
                        {course.myProposalStatus === "REJECTED" && (
                          <span className="neo-box-sm bg-[#FF5252] text-white px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
                            Revisi
                          </span>
                        )}
                        {(!course.myProposalStatus || course.myProposalStatus === "DRAFT") && (
                          <span className="neo-box-sm bg-[#FFEB3B] text-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
                            Draft
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-neutral-500 uppercase">
                        {course.academicPeriod.name}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {(course.scheduleDay || course.scheduleTime) && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#E0F2FE] border-2 border-black text-xs font-black text-black">
                        <span>🗓️ {course.scheduleDay || "Hari ?"}</span>
                        {course.scheduleTime && <span>• ⏰ {course.scheduleTime}</span>}
                      </div>
                    )}
                    <h3 className="text-lg font-black tracking-tight text-black line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs font-medium text-neutral-600 line-clamp-2 min-h-[32px]">
                      {course.description || "Tidak ada deskripsi silabus."}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t-2 border-dashed border-neutral-300">
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase block">Modul</span>
                        <span className="text-sm font-black font-mono-numbers">{course._count.modules}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase block">Asprak</span>
                        <span className="text-sm font-black font-mono-numbers">{course._count.assistants}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase block">Praktikan</span>
                        <span className="text-sm font-black font-mono-numbers">{course._count.enrollments}</span>
                      </div>
                    </div>

                    {/* Preview Daftar Modul yang dirancang Admin */}
                    <div className="pt-2">
                      <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">
                        Daftar Modul ({course.modules.length}):
                      </span>
                      <ul className="text-xs font-medium text-neutral-700 space-y-1">
                        {course.modules.slice(0, 3).map((mod) => (
                          <li key={mod.id} className="truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-black rounded-none shrink-0" />
                            <span className="truncate">{mod.title}</span>
                            {mod.isFinalReport && (
                              <span className="neo-box-sm bg-[#FF5252] text-white text-[9px] px-1 font-black shrink-0">
                                Akhir
                              </span>
                            )}
                          </li>
                        ))}
                        {course.modules.length > 3 && (
                          <li className="text-[10px] font-bold text-neutral-500 italic">
                            +{course.modules.length - 3} modul lainnya...
                          </li>
                        )}
                      </ul>
                    </div>

                    {feedback?.id === course.id && (
                      <div
                        className={`neo-box-sm p-2 text-xs font-black ${feedback.success ? "bg-[#4CAF50] text-black" : "bg-[#FF5252] text-white"
                          }`}
                      >
                        {feedback.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t-3 border-black bg-neutral-50 flex items-center gap-2">
                  {course.isClaimedByMe || userRole === "ADMIN" ? (
                    <div className="w-full flex items-center gap-2">
                      <Link href={`/${course.id}/modul`} className="flex-1">
                        <Button variant="primary" size="sm" className="w-full text-xs">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Buka Ruang Praktikum
                        </Button>
                      </Link>
                      {userRole !== "ADMIN" && course.myProposalStatus !== "APPROVED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-neutral-600 hover:text-red-600"
                          onClick={() => handleUnclaim(course.id)}
                          disabled={isProcessing}
                          title="Batalkan pengambilan mata kuliah ini"
                        >
                          Batal
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleClaim(course.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Memproses..." : "+ Ambil / Bimbing Mata Kuliah Ini"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
