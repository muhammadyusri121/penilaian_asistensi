export function formatIndoDateTime(val?: Date | string | null) {
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

export function toLocalDatetimeInputString(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getRemainingDaysText(targetDate?: Date | string | null): string {
  if (!targetDate) return "-";
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
