function localDateAtNoon(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date;
}

export function targetDatePickerValue(targetDate: string, now: Date): Date {
  if (targetDate === "") {
    return localDateAtNoon(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(targetDate);
  if (!match) throw new RangeError("Target date must use YYYY-MM-DD format.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const value = localDateAtNoon(year, month, day);
  if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== day) {
    throw new RangeError("Target date must be a valid calendar date.");
  }
  return value;
}

export function targetDateToLocalIso(value: Date): string {
  const year = String(value.getFullYear()).padStart(4, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
