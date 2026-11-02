import type { JsonValue } from "../../content/canonical";

/** Flattens structured feedback to human-readable content without rendering schema metadata. */
export function detailLines(value: JsonValue): readonly string[] {
  if (value === null || typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (typeof value === "string") return value.trim() ? [value] : [];
  if (Array.isArray(value)) return (value as readonly JsonValue[]).flatMap(detailLines);
  const record = value as Readonly<Record<string, JsonValue>>;
  if (typeof record.text === "string" && record.text.trim()) return [record.text];
  return Object.values(record).flatMap(detailLines);
}

/** Q1 uses exact authored Details; old empty lessons keep the pinned method explanation. */
export function approachChallengeDetailLines(feedback: Readonly<{
  reason: string;
  details: JsonValue;
  approachExplanation: Readonly<{ reason: string; options: readonly Readonly<{ text: string; reason: string }>[] }> | null;
}>): readonly string[] {
  if (!feedback.approachExplanation) return detailLines(feedback.details);
  const authored = feedback.details === null ? [] : detailLines(feedback.details);
  if (authored.length) return authored.filter(line => line !== feedback.reason);
  return [feedback.approachExplanation.reason, ...feedback.approachExplanation.options.flatMap((option) => [option.text, option.reason])]
    .filter((line) => line !== feedback.reason);
}
