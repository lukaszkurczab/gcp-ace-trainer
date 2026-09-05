export type ActivityDateLabel =
  | Readonly<{ kind: "relative"; label: "Today" | "Yesterday"; timestamp: string }>
  | Readonly<{ kind: "calendar"; timestamp: string }>;

const MILLISECONDS_PER_DAY = 86_400_000;

export function modeLabel(modeId: string): string {
  const labels: Record<string, string> = {
    "coding-interview-guided-practice": "Guided Practice",
    "coding-interview-learn-approach": "Learn Approach",
    "certification-focus-practice": "Focus Practice",
    "certification-quick-review": "Quick Review",
    "design-interview-learn-framework": "Learn Framework",
    "design-interview-tradeoff-practice": "Tradeoff Practice",
    "design-interview-weak-area-review": "Weak Area Review",
  };
  return labels[modeId] ?? modeId.replace(/^(?:coding-interview|certification|design-interview)-/, "").replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function relativeDay(timestamp: string, now = new Date()): string {
  const difference = calendarDayDifference(timestamp, now);
  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  return `${difference} days ago`;
}

/** Difference between local calendar dates, independent of DST elapsed hours. */
export function calendarDayDifference(timestamp: string, now = new Date()): number {
  return Math.round((localCalendarDayKey(now) - localCalendarDayKey(new Date(timestamp))) / MILLISECONDS_PER_DAY);
}

/** Activity's “This week” group starts on Monday in the user's local calendar. */
export function isSameCalendarWeek(timestamp: string, now = new Date()): boolean {
  return localCalendarWeekKey(new Date(timestamp)) === localCalendarWeekKey(now);
}

export function formatActivityDateLabel(
  label: ActivityDateLabel,
  locale: "en" | "pl",
  translate: (value: string) => string,
): string {
  const time = activityTime(label.timestamp);
  if (label.kind === "relative") return `${translate(label.label)}, ${time}`;
  const date = new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "short" }).format(new Date(label.timestamp));
  return `${date}, ${time}`;
}

export function activityTime(timestamp: string): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function localCalendarDayKey(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function localCalendarWeekKey(date: Date): number {
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return localCalendarDayKey(date) - daysSinceMonday * MILLISECONDS_PER_DAY;
}
