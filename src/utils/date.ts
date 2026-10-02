export function formatIsoDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatDuration(totalSeconds: number): string {
  const safeTotalSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeTotalSeconds / 3600);
  const minutes = Math.floor((safeTotalSeconds % 3600) / 60);
  const seconds = safeTotalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

/** Civil calendar dates and Monday weeks; elapsed DST hours never define a week. */
export function createLocalCalendar(timezone?: string): Readonly<{ dayKey: (date: Date) => number; weekKey: (date: Date) => number }> {
  const formatter = timezone === undefined ? null : new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
  const dayKey = (date: Date): number => {
    if (!Number.isFinite(date.getTime())) throw new RangeError("Calendar instant is invalid.");
    if (!formatter) return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const parts = formatter.formatToParts(date);
    const part = (type: string) => Number(parts.find(value => value.type === type)?.value);
    const key = Date.UTC(part("year"), part("month") - 1, part("day"));
    if (!Number.isFinite(key)) throw new RangeError("Calendar date is invalid.");
    return key;
  };
  return Object.freeze({ dayKey, weekKey: (date: Date) => {
    const key = dayKey(date);
    return key - ((new Date(key).getUTCDay() + 6) % 7) * 86_400_000;
  } });
}
