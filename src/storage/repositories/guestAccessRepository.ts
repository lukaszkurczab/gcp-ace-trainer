import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";

type GuestAccessRecord = Readonly<{ mode: "guest" }>;

function isGuestAccessRecord(value: unknown): value is GuestAccessRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.keys(value).length === 1
    && (value as Record<string, unknown>).mode === "guest";
}

/** Whether this installation has explicitly chosen local-only learning. */
export function hasGuestAccess(): boolean {
  return readCanonicalJson(STORAGE_KEYS.GUEST_ACCESS, isGuestAccessRecord)?.mode === "guest";
}

export function grantGuestAccess(): void {
  const existing = readCanonicalJson(STORAGE_KEYS.GUEST_ACCESS, isGuestAccessRecord);
  if (existing?.mode === "guest") return;
  writeCanonicalJson(STORAGE_KEYS.GUEST_ACCESS, { mode: "guest" }, null);
}

/** Returning to account entry is explicit after a signed-out account session. */
export function revokeGuestAccess(): void {
  removeCanonicalValue(STORAGE_KEYS.GUEST_ACCESS);
}
