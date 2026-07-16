export type CanonicalSerializable = null | boolean | number | string | readonly CanonicalSerializable[] | { readonly [key: string]: CanonicalSerializable };
export const CANONICAL_SERIALIZER_VERSION = "canonical-json-utf8-v1" as const;

/** The only byte representation permitted as an input to a durable identity. */
export function canonicalFingerprintPayload(value: unknown): string {
  return canonicalSerialize({ serializerVersion: CANONICAL_SERIALIZER_VERSION, value });
}
export function canonicalSerialize(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new TypeError("Canonical values cannot contain non-finite numbers."); return JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map(canonicalSerialize).join(",")}]`;
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError("Canonical values cannot contain unsupported values.");
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalSerialize((value as Record<string, unknown>)[key])}`).join(",")}}`;
}
