import type { AccountDataRecordFingerprintInput } from "../account/accountDataRecordIdentity";
import { sha256Utf8 } from "./sha256";

/** Static byte profile; deliberately absent from the preimage to retain existing APP identities. */
export const RECORD_FINGERPRINT_PROFILE = "record-fingerprint-json-utf8-v1" as const;

export type RecordFingerprintInput = Readonly<{
  recordId: string;
  recordType: string;
  state: Readonly<Record<string, unknown>>;
  trackId: string;
}>;

/** Exact strings, raw UTF-16 key ordering, finite ECMAScript JSON numbers, ordered dense arrays.
 * NFC is used only to detect ambiguous keys, never to rewrite payload bytes.
 * Other protocol digests have their own serializers.
 */
export function recordFingerprintPayload(record: RecordFingerprintInput): string {
  return accelerated("payload", record) ?? referenceRecordFingerprintPayload(record);
}

/** The byte-contract oracle (unchanged logic). */
export function referenceRecordFingerprintPayload(record: RecordFingerprintInput): string {
  const ancestors = new Set<object>();
  const serialize = (value: unknown): string => {
    if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
    if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
    if (typeof value !== "object" || value === null || ancestors.has(value)) throw new TypeError("record_fingerprint_unsupported_value");
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        if (Object.keys(value).length !== value.length || Object.getOwnPropertySymbols(value).length > 0) throw new TypeError("record_fingerprint_unsupported_value");
        for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) throw new TypeError("record_fingerprint_unsupported_value");
        return `[${value.map(serialize).join(",")}]`;
      }
      if (Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length > 0) throw new TypeError("record_fingerprint_unsupported_value");
      const keys = Object.keys(value).sort();
      if (new Set(keys.map((key) => key.normalize("NFC"))).size !== keys.length) throw new TypeError("record_fingerprint_duplicate_key");
      return `{${keys.map((key) => `${JSON.stringify(key)}:${serialize((value as Record<string, unknown>)[key])}`).join(",")}}`;
    } finally {
      ancestors.delete(value);
    }
  };
  return serialize({ recordId: record.recordId, recordType: record.recordType, state: record.state, trackId: record.trackId });
}

/** Canonical account record identity, shared by persistence and application diagnostics. */
export function accountDataRecordFingerprint(record: AccountDataRecordFingerprintInput): string {
  return accelerated("fingerprint", record) ?? sha256Utf8(recordFingerprintPayload(record));
}

/**
 * Optional accelerator (B0, Plan T1.1): `payload` returns the exact
 * `recordFingerprintPayload` bytes, `fingerprint` the SHA-256 hex of them, or
 * `undefined` to let the reference run. A throw removes it. Never installed in Node tests.
 */
export type RecordFingerprintAccelerator = (kind: "payload" | "fingerprint", record: RecordFingerprintInput) => string | undefined;
let accelerator: RecordFingerprintAccelerator | null = null;
const PROBES: readonly RecordFingerprintInput[] = Object.freeze([
  { recordId: "r", recordType: "training_session_result", trackId: "t", state: {} },
  { recordId: "r\ud800", recordType: "x", trackId: "\u2028", state: { b: [1, 0.5, -0, 1e21, null, true], a: { "\ue000": "é", "\ud83d\ude00": "e\u0301" }, "10": "2", "2": 1 } },
]);

/** Installs `candidate` only when every probe it answers equals the reference; `null` removes it. */
export function installRecordFingerprintAccelerator(candidate: RecordFingerprintAccelerator | null): boolean {
  accelerator = null;
  if (!candidate) return false;
  try {
    for (const probe of PROBES) {
      const payload = referenceRecordFingerprintPayload(probe);
      const fingerprint = sha256Utf8(payload);
      const actualPayload = candidate("payload", probe);
      const actualFingerprint = candidate("fingerprint", probe);
      if (actualPayload !== undefined && actualPayload !== payload) return false;
      if (actualFingerprint !== undefined && actualFingerprint !== fingerprint) return false;
    }
  } catch { return false; }
  accelerator = candidate;
  return true;
}

export function isRecordFingerprintAccelerated(): boolean {
  return accelerator !== null;
}

function accelerated(kind: "payload" | "fingerprint", record: RecordFingerprintInput): string | undefined {
  if (!accelerator) return undefined;
  try {
    return accelerator(kind, record);
  } catch {
    accelerator = null;
    return undefined;
  }
}
