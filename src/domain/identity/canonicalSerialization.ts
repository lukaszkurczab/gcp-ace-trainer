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
  return accelerated("canonicalJsonV1", value) ?? canonicalJsonValue(value);
}

export function canonicalJsonV1ByteLength(value: unknown): number {
  return new TextEncoder().encode(canonicalJsonV1(value)).byteLength;
}

/** Versioned preimage for session and learning mutation identities; account records use recordFingerprintPayload. */
export function canonicalFingerprintPayload(value: unknown): string {
  return accelerated("canonicalFingerprintPayload", value) ?? referenceCanonicalSerialize({ serializerVersion: CANONICAL_SERIALIZER_VERSION, value });
}
export function canonicalSerialize(value: unknown): string {
  return accelerated("canonicalSerialize", value) ?? referenceCanonicalSerialize(value);
}
/** The byte-contract oracle of the historical profile (unchanged logic). */
export function referenceCanonicalSerialize(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new TypeError("Canonical values cannot contain non-finite numbers."); return JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map(referenceCanonicalSerialize).join(",")}]`;
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError("Canonical values cannot contain unsupported values.");
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${referenceCanonicalSerialize((value as Record<string, unknown>)[key])}`).join(",")}}`;
}
/** The byte-contract oracle of canonical-json-v1 (unchanged logic). */
export function referenceCanonicalJsonV1(value: unknown): string {
  return canonicalJsonValue(value);
}

/**
 * Optional accelerator (B0, Plan T1.1). Returns the exact reference bytes, or
 * `undefined` to let the reference run (unsupported input, error, NFC not
 * available). It must never throw for a supported input; a throw removes it.
 * Never installed in Node tests.
 */
export type CanonicalSerializationProfile = "canonicalSerialize" | "canonicalFingerprintPayload" | "canonicalJsonV1";
export type CanonicalSerializationAccelerator = (profile: CanonicalSerializationProfile, value: unknown) => string | undefined;
let accelerator: CanonicalSerializationAccelerator | null = null;
const PROBES: readonly unknown[] = Object.freeze([
  0, -0, 1e21, 1e-7, 5e-324, 0.1, Number.MAX_SAFE_INTEGER, "", "\u2028\"\\\u0000\ud800", [], {}, [1, [2, {}]],
  { b: 1, a: [true, false, null], "\ue000": "x", "\ud83d\ude00": "y", __proto__: null },
  JSON.parse('{"__proto__":1,"10":2,"2":3,"é":"e\u0301","nested":{"z":-0.5,"y":"ł"}}'),
]);
const REFERENCES: Readonly<Record<CanonicalSerializationProfile, (value: unknown) => string>> = Object.freeze({
  canonicalSerialize: referenceCanonicalSerialize,
  canonicalFingerprintPayload: (value: unknown) => referenceCanonicalSerialize({ serializerVersion: CANONICAL_SERIALIZER_VERSION, value }),
  canonicalJsonV1: referenceCanonicalJsonV1,
});

/** Installs `candidate` only when every probe it answers equals the reference; `null` removes it. */
export function installCanonicalSerializationAccelerator(candidate: CanonicalSerializationAccelerator | null): boolean {
  accelerator = null;
  if (!candidate) return false;
  try {
    for (const profile of Object.keys(REFERENCES) as CanonicalSerializationProfile[]) {
      for (const probe of PROBES) {
        let expected: string;
        try { expected = REFERENCES[profile](probe); } catch { continue; }
        const actual = candidate(profile, probe);
        if (actual !== undefined && actual !== expected) return false;
      }
    }
  } catch { return false; }
  accelerator = candidate;
  return true;
}

export function isCanonicalSerializationAccelerated(): boolean {
  return accelerator !== null;
}

function accelerated(profile: CanonicalSerializationProfile, value: unknown): string | undefined {
  if (!accelerator) return undefined;
  try {
    return accelerator(profile, value);
  } catch {
    accelerator = null;
    return undefined;
  }
}
