import type { PrivacyRequestRightDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

const STORAGE_KEY = "patternly.guest-privacy-pending.v1";
const RIGHTS = new Set<PrivacyRequestRightDto>(["access", "rectification", "erasure", "restriction", "objection", "portability", "consent_withdrawal"]);

export type GuestPrivacyDraft = Readonly<{
  clientRequestId: string;
  email: string;
  right: PrivacyRequestRightDto;
  narrative?: string;
  requestId?: string;
}>;

type SecureStorePort = Readonly<{
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}>;

function secureStore(): SecureStorePort {
  return require("expo-secure-store") as SecureStorePort;
}

export async function loadGuestPrivacyDraft(store: SecureStorePort = secureStore()): Promise<GuestPrivacyDraft | null> {
  const raw = await store.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<GuestPrivacyDraft>;
    if (!value || typeof value.clientRequestId !== "string" || !/^[0-9a-f-]{36}$/u.test(value.clientRequestId)
      || typeof value.email !== "string" || !value.email.includes("@")
      || !RIGHTS.has(value.right as PrivacyRequestRightDto)
      || (value.narrative !== undefined && typeof value.narrative !== "string")
      || (value.requestId !== undefined && (typeof value.requestId !== "string" || !/^pr_[0-9a-f-]{36}$/u.test(value.requestId)))) return null;
    return value as GuestPrivacyDraft;
  } catch { return null; }
}

export async function saveGuestPrivacyDraft(draft: GuestPrivacyDraft, store: SecureStorePort = secureStore()): Promise<void> {
  await store.setItemAsync(STORAGE_KEY, JSON.stringify(draft));
}

export async function clearGuestPrivacyDraft(store: SecureStorePort = secureStore()): Promise<void> {
  await store.deleteItemAsync(STORAGE_KEY);
}

/** Does not parse or expose PII; reads only the exact guest privacy draft slot. */
export async function inspectQ13GuestPrivacyDraft(store?: SecureStorePort): Promise<Readonly<{ kind: "observed"; draft: "absent" | "present"; draftSha256: string | null } | { kind: "unavailable" }>> {
  try {
    const raw = await (store ?? secureStore()).getItemAsync(STORAGE_KEY);
    return Object.freeze({ kind: "observed", draft: raw === null ? "absent" : "present", draftSha256: raw === null ? null : sha256Utf8(raw) });
  } catch { return Object.freeze({ kind: "unavailable" }); }
}
