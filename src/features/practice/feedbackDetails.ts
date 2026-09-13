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
