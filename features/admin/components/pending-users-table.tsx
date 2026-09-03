"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { approveUserAction, rejectUserAction } from "../actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldCheck, User, Mail, Calendar } from "lucide-react";

interface PendingUserItem {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: "ADMIN" | "ASISTEN";
  createdAt: Date;
}

interface PendingUsersTableProps {
  users: PendingUserItem[];
}

export function PendingUsersTable({ users }: PendingUsersTableProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function handleApprove(userId: string) {
    setProcessingId(userId);
    try {
      const res = await approveUserAction(userId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message);
      }
    } catch {
      alert("Terjadi kendala jaringan.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(userId: string) {
    if (!confirm("Apakah Anda yakin ingin menolak pendaftaran akun ini?")) return;

    setProcessingId(userId);
    try {
      const res = await rejectUserAction(userId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message);
      }
    } catch {
      alert("Terjadi kendala jaringan.");
    } finally {
      setProcessingId(null);
    }
  }

  if (users.length === 0) {
    return (
      <div className="neo-box bg-white p-12 text-center">
        <ShieldCheck className="w-12 h-12 text-[#4CAF50] mx-auto mb-3" />
        <h3 className="text-lg font-black uppercase">Tidak Ada Antrean Pendaftaran</h3>
        <p className="text-xs font-bold text-neutral-600">
          Seluruh pendaftaran calon asisten praktikum telah diproses.
        </p>
      </div>
    );
  }

  return (
    <div className="neo-box bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-3 border-black bg-[#FFF9F0] text-xs font-black uppercase">
              <th className="p-3 border-r-3 border-black w-12 text-center">No</th>
              <th className="p-3 border-r-3 border-black">Nama Lengkap</th>
              <th className="p-3 border-r-3 border-black">Username</th>
              <th className="p-3 border-r-3 border-black">Email</th>
              <th className="p-3 border-r-3 border-black">Waktu Daftar</th>
              <th className="p-3 text-center w-48">Aksi Verifikasi</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-neutral-200 text-xs font-medium">
            {users.map((u, idx) => {
              const isWorking = processingId === u.id;

              return (
                <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-3 border-r-3 border-black font-mono font-bold text-center">
                    {idx + 1}
                  </td>
                  <td className="p-3 border-r-3 border-black font-bold text-black">
                    {u.name}
                  </td>
                  <td className="p-3 border-r-3 border-black font-mono font-black text-[#2196F3]">
                    {u.username}
                  </td>
                  <td className="p-3 border-r-3 border-black text-neutral-600">
                    {u.email || "-"}
                  </td>
                  <td className="p-3 border-r-3 border-black text-neutral-500 font-mono">
                    {new Date(u.createdAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-[#4CAF50] text-black text-xs px-3"
                        onClick={() => handleApprove(u.id)}
                        disabled={isWorking}
                        title="Setujui Akun (ACC)"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {isWorking ? "..." : "ACC"}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs px-3"
                        onClick={() => handleReject(u.id)}
                        disabled={isWorking}
                        title="Tolak Pendaftaran"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Tolak
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
