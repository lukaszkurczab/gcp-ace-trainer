import type { AppLocale } from "../../preferences";
import { targetDateToLocalIso } from "./goalTargetDatePicker";

export function formatGoalCalendarMonth(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

export function formatGoalCalendarWeekdayLabels(locale: AppLocale): readonly string[] {
  const weekStartsOn = goalCalendarWeekStartsOn(locale);
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  return Array.from({ length: 7 }, (_, index) => {
    const weekday = (weekStartsOn + index) % 7;
    return formatter.format(new Date(Date.UTC(2023, 0, 1 + weekday)));
  });
}

export function formatGoalCalendarAccessibleWeekday(index: number, locale: AppLocale): string {
  const weekday = (goalCalendarWeekStartsOn(locale) + index) % 7;
  const date = new Date(Date.UTC(2023, 0, 1 + weekday));
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date);
}

export function formatGoalCalendarAccessibleDate(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(date);
}

export function goalCalendarWeekStartsOn(locale: AppLocale): number {
  return locale === "en" ? 0 : 1;
}

export function shiftGoalCalendarMonth(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

export function buildGoalCalendarWeeks(month: Date, locale: AppLocale): readonly (readonly (Date | null)[])[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const weekStartsOn = goalCalendarWeekStartsOn(locale);
  const firstWeekday = new Date(year, monthIndex, 1, 12).getDay();
  const leadingDays = (firstWeekday - weekStartsOn + 7) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0, 12).getDate();
  const weekCount = Math.ceil((leadingDays + daysInMonth) / 7);
  const cells = Array.from({ length: weekCount * 7 }, (_, index): Date | null => {
    const day = index - leadingDays + 1;
    return day < 1 || day > daysInMonth ? null : new Date(year, monthIndex, day, 12);
  });
  return Array.from({ length: weekCount }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

export function isSameGoalCalendarDate(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

export function goalCalendarDateId(date: Date): string {
  return targetDateToLocalIso(date);
}
