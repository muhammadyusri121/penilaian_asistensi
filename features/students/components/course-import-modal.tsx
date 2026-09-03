"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { importStudentsToCourseAction } from "../actions/student.actions";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

interface CourseImportModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedStudentRow {
  nim: string;
  name: string;
  classGroup?: string;
}

export function CourseImportModal({
  courseId,
  isOpen,
  onClose,
  onSuccess,
}: CourseImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const readerRef = useRef<FileReader | null>(null);
  const selectionIdRef = useRef(0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMsg(null);
    setSuccessMsg(null);
    setParsedRows([]);

    if (readerRef.current) {
      try {
        readerRef.current.abort();
      } catch {
        // ignore
      }
    }

    const currentSelectionId = ++selectionIdRef.current;
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    readerRef.current = reader;

    reader.onload = (evt) => {
      if (selectionIdRef.current !== currentSelectionId) return;
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        if (rawData.length === 0) {
          setErrorMsg("File Excel tidak memiliki baris data.");
          return;
        }

        const mapped: ParsedStudentRow[] = [];
        for (const row of rawData) {
          const keys = Object.keys(row);
          const nimKey = keys.find((k) => /nim|no\s*induk|\bid\b/i.test(k));
          const nameKey = keys.find((k) => /nama|name|mahasiswa/i.test(k));
          const classKey = keys.find((k) => /kelas|class|shift|kelompok/i.test(k));

          const rawNim = nimKey ? String(row[nimKey]).trim() : "";
          const rawName = nameKey ? String(row[nameKey]).trim() : "";
          const rawClass = classKey ? String(row[classKey]).trim() : "";

          if (rawNim && rawName) {
            mapped.push({
              nim: rawNim,
              name: rawName,
              classGroup: rawClass || undefined,
            });
          }
        }

        if (mapped.length === 0) {
          setErrorMsg(
            "Kolom 'NIM' dan 'Nama' tidak ditemukan di lembar Excel. Pastikan ada baris judul kolom 'NIM' dan 'Nama'."
          );
        } else {
          setParsedRows(mapped);
        }
      } catch (err) {
        console.error("Gagal membaca Excel", err);
        setErrorMsg("Format file tidak didukung atau berkas korup.");
      }
    };

    reader.onerror = () => {
      if (selectionIdRef.current !== currentSelectionId) return;
      setErrorMsg("Gagal membaca file Excel.");
    };

    reader.readAsBinaryString(selectedFile);
  }

  async function handleImportSubmit() {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await importStudentsToCourseAction(courseId, parsedRows);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1800);
      } else {
        setErrorMsg(res.message || "Gagal mengimpor data praktikan.");
      }
    } catch {
      setErrorMsg("Terjadi kendala saat mengirim data ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Praktikan (Excel / CSV)" maxWidth="md">
      <div className="space-y-4">
        <div className="neo-box-sm bg-[#FFF9F0] p-3 text-xs font-bold leading-relaxed border-l-4 border-l-[#2196F3]">
          <p className="text-black font-black uppercase mb-1">Aturan Integritas Laboratorium:</p>
          <p className="text-neutral-700">
            Mahasiswa yang Anda impor otomatis didaftarkan di bawah bimbingan Anda. Jika ada NIM yang sudah diampu oleh asisten lain pada mata kuliah ini, sistem akan <strong>menolaknya secara otomatis</strong>.
          </p>
        </div>

        {errorMsg && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-3 text-xs font-black">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="neo-box-sm bg-[#4CAF50] text-black p-3 text-xs font-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="border-2 border-dashed border-black p-6 text-center bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
            id="course-excel-upload"
          />
          <label htmlFor="course-excel-upload" className="cursor-pointer block">
            <Upload className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <span className="text-sm font-black uppercase text-black block">
              Pilih Berkas Excel (.xlsx, .xls, .csv)
            </span>
            <span className="text-xs text-neutral-500 font-medium">
              Pastikan terdapat kolom NIM dan Nama
            </span>
          </label>
        </div>

        {file && (
          <div className="neo-box-sm bg-white p-2.5 flex items-center justify-between text-xs font-mono font-bold">
            <span className="truncate max-w-[280px]">{file.name}</span>
            <span className="text-emerald-700 font-black">{parsedRows.length} Mahasiswa Terdeteksi</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t-2 border-neutral-200">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleImportSubmit}
            disabled={loading || parsedRows.length === 0}
          >
            {loading ? "Memproses..." : `Import ${parsedRows.length} Praktikan`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
