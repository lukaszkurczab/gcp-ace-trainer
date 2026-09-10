export type CanonicalSerializable = null | boolean | number | string | readonly CanonicalSerializable[] | { readonly [key: string]: CanonicalSerializable };
export const CANONICAL_SERIALIZER_VERSION = "canonical-json-utf8-v1" as const;

/** Closed canonical-json-v1 profile for sync envelopes and protocol digests.
 *
 * The historical `canonicalSerialize` function remains unchanged because its
 * output is part of existing account-record fingerprints. New sync protocol
 * identities should use this stricter profile instead.
 */
export const CANONICAL_JSON_VERSION = "canonical-json-v1" as const;

function canonicalJsonNumber(value: number): string {
  if (!Number.isFinite(value)) throw new TypeError("canonical_json_non_finite_number");
  if (Object.is(value, -0)) return "0";
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new TypeError("canonical_json_number_invalid");
  return serialized.replace(/e\+?(-?)0+(\d+)/u, "e$1$2");
}

function canonicalJsonValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return canonicalJsonNumber(value);
  if (typeof value === "undefined" || typeof value === "bigint" || typeof value === "function" || typeof value === "symbol") throw new TypeError("canonical_json_unsupported_value");
  if (Array.isArray(value)) return `[${value.map(canonicalJsonValue).join(",")}]`;
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError("canonical_json_unsupported_value");
  const entries = Object.keys(value).map((key) => ({ key, normalized: key.normalize("NFC") }));
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.normalized)) throw new TypeError("canonical_json_duplicate_key");
    seen.add(entry.normalized);
  }
  entries.sort((left, right) => left.normalized < right.normalized ? -1 : left.normalized > right.normalized ? 1 : 0);
  return `{${entries.map(({ key, normalized }) => `${JSON.stringify(normalized)}:${canonicalJsonValue((value as Record<string, unknown>)[key])}`).join(",")}}`;
}

export function canonicalJsonV1(value: unknown): string {
  return canonicalJsonValue(value);
}

export function canonicalJsonV1ByteLength(value: unknown): number {
  return new TextEncoder().encode(canonicalJsonV1(value)).byteLength;
}

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
