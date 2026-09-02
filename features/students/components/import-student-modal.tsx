"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { importStudentsAction } from "../actions/student.actions";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedStudentRow {
  nim: string;
  name: string;
  classGroup?: string;
}

export function ImportStudentModal({ isOpen, onClose, onSuccess }: ImportStudentModalProps) {
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
          setErrorMsg("File Excel tidak memiliki data.");
          return;
        }

        // Cari header NIM, Nama, dan Kelas/Shift secara fleksibel
        const mapped: ParsedStudentRow[] = [];
        for (const row of rawData) {
          const keys = Object.keys(row);
          const nimKey = keys.find((k) => /nim|no\s*induk|id/i.test(k));
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
            "Kolom 'NIM' dan 'Nama' tidak ditemukan di lembar Excel. Pastikan ada baris judul 'NIM' dan 'Nama'."
          );
        } else {
          setParsedRows(mapped);
        }
      } catch (err) {
        setErrorMsg("Gagal membaca file: " + String(err));
      }
    };
    reader.readAsBinaryString(selectedFile);
  }

  async function handleImport() {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await importStudentsAction(parsedRows);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("Gagal mengimpor ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Praktikan (Excel/CSV)" maxWidth="xl">
      <div className="space-y-4">
        <p className="text-xs font-bold text-neutral-600">
          Unggah file spreadsheet (.xlsx, .xls, .csv) berisi daftar mahasiswa. Kolom utama yang dibutuhkan adalah <strong className="text-black">NIM</strong> dan <strong className="text-black">Nama Lengkap</strong> (opsional: <strong className="text-black">Kelas/Shift</strong>).
        </p>

        {errorMsg && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-3 text-xs font-black flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="neo-box-sm bg-[#4CAF50] text-black p-3 text-xs font-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Upload Zone */}
        <div className="border-3 border-dashed border-black p-6 bg-neutral-50 text-center hover:bg-neutral-100 transition-colors">
          <input
            type="file"
            id="excel-file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="excel-file" className="cursor-pointer block space-y-2">
            <div className="inline-flex p-3 neo-box-sm bg-[#FFEB3B] text-black">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-black uppercase tracking-tight text-black">
              {file ? file.name : "Pilih Berkas Excel (.xlsx, .csv)"}
            </p>
            <p className="text-xs font-medium text-neutral-500">
              Klik untuk memilih berkas dari komputer Anda
            </p>
          </label>
        </div>

        {/* Preview Data */}
        {parsedRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#2196F3]" />
                Terdeteksi: {parsedRows.length} Mahasiswa
              </span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase">
                Menampilkan 5 baris pertama
              </span>
            </div>

            <div className="border-2 border-black max-h-48 overflow-y-auto bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-black text-white font-mono uppercase sticky top-0">
                  <tr>
                    <th className="p-2 border-r border-neutral-700">No</th>
                    <th className="p-2 border-r border-neutral-700">NIM</th>
                    <th className="p-2 border-r border-neutral-700">Nama Lengkap</th>
                    <th className="p-2">Kelas / Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-mono-numbers">
                  {parsedRows.slice(0, 5).map((row, idx) => (
                    <tr key={row.nim} className="hover:bg-yellow-50">
                      <td className="p-2 border-r border-neutral-200">{idx + 1}</td>
                      <td className="p-2 font-bold border-r border-neutral-200">{row.nim}</td>
                      <td className="p-2 font-sans border-r border-neutral-200">{row.name}</td>
                      <td className="p-2 font-sans">{row.classGroup || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Batal
              </Button>
              <Button type="button" variant="primary" onClick={handleImport} disabled={loading}>
                {loading ? "Menyimpan..." : `Import ${parsedRows.length} Praktikan`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
