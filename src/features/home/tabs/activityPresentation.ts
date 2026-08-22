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
  const day = new Date(timestamp);
  const dayKey = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  const todayKey = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const difference = Math.round((todayKey - dayKey) / 86_400_000);
  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  return `${difference} days ago`;
}

export function activityTime(timestamp: string): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
