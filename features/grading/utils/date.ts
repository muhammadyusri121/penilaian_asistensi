/**
 * Utility konversi dan pemformatan tanggal asistensi
 * Memastikan format standar Indonesia: DD/MM/YYYY (bukan MM/DD/YYYY)
 */

export function formatDateDMY(dateInput?: Date | string | null): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function isoToDmy(isoString?: string): string {
  if (!isoString) return "";
  const parts = isoString.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return formatDateDMY(isoString);
}

export function dmyToIso(dmyString: string): string | null {
  if (!dmyString) return null;
  const cleaned = dmyString.trim().replace(/[-.]/g, "/");
  const parts = cleaned.split("/");
  if (parts.length === 3) {
    let [d, m, y] = parts;
    d = d.padStart(2, "0");
    m = m.padStart(2, "0");
    if (y.length === 2) y = "20" + y;
    if (y.length === 4) {
      const dayNum = parseInt(d, 10);
      const monthNum = parseInt(m, 10);
      const yearNum = parseInt(y, 10);
      if (
        monthNum >= 1 &&
        monthNum <= 12 &&
        dayNum >= 1 &&
        dayNum <= 31 &&
        yearNum >= 2000 &&
        yearNum <= 2100
      ) {
        return `${y}-${m}-${d}`;
      }
    }
  }
  return null;
}
