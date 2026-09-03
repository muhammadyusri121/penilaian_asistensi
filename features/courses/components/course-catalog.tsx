"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { claimCourseAction, unclaimCourseAction } from "../actions/course.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Check, Layers, Users, ExternalLink, AlertCircle } from "lucide-react";

interface CatalogCourseItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  academicPeriod: { name: string };
  isClaimedByMe: boolean;
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
}

export function CourseCatalog({ courses, userRole }: CourseCatalogProps) {
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

  return (
    <div className="space-y-6">
      {courses.length === 0 ? (
        <div className="neo-box bg-white p-12 text-center">
          <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-lg font-black uppercase">Belum Ada Mata Kuliah Praktikum</h3>
          <p className="text-xs font-bold text-neutral-600">
            Koordinator Laboratorium belum membuka mata kuliah praktikum untuk semester aktif.
          </p>
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
                      <span className="neo-box-sm bg-[#4CAF50] text-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Sedang Diampu
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-neutral-500 uppercase">
                        {course.academicPeriod.name}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
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
                        className={`neo-box-sm p-2 text-xs font-black ${
                          feedback.success ? "bg-[#4CAF50] text-black" : "bg-[#FF5252] text-white"
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
                      {userRole !== "ADMIN" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-neutral-600 hover:text-red-600"
                          onClick={() => handleUnclaim(course.id)}
                          disabled={isProcessing}
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
