import { installationIdentity, type GuestInstallationIdentityPort } from "../../infrastructure/identity/installationIdentity";
import { STORAGE_KEYS } from "../keys";
import { AccountDataFailure } from "../errors";
import { readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";

export type GuestInstallation = Readonly<{
  installationId: string;
  localDatasetId: string;
  bindingState: "guest" | "adoption_pending" | "account_bound";
  accountId: string | null;
}>;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isGuestInstallation(value: unknown): value is GuestInstallation {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).length !== 4) return false;
  const { installationId, localDatasetId, bindingState, accountId } = value as Record<string, unknown>;
  return typeof installationId === "string"
    && typeof localDatasetId === "string"
    && typeof bindingState === "string"
    && (accountId === null || typeof accountId === "string")
    && UUID_V4.test(installationId)
    && UUID_V4.test(localDatasetId)
    && installationId !== localDatasetId
    && (["guest", "adoption_pending", "account_bound"] as const).includes(bindingState as GuestInstallation["bindingState"]);
}

let provisioning: Promise<GuestInstallation> | null = null;

export async function getGuestInstallation(): Promise<GuestInstallation | null> {
  return readCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, isGuestInstallation);
}

/** Creates one verified local guest identity. Existing, corrupt, or unsupported records are never replaced. */
export async function provisionGuestInstallation(identity: GuestInstallationIdentityPort = installationIdentity): Promise<GuestInstallation> {
  const existing = await getGuestInstallation();
  if (existing) return existing;
  if (provisioning) return provisioning;
  provisioning = (async () => {
    const generated = await identity.create();
    const record: GuestInstallation = Object.freeze({ ...generated, accountId: null, bindingState: "guest" });
    if (!isGuestInstallation(record)) throw new Error("Guest installation identity is invalid.");
    writeCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, record, null);
    const verified = await getGuestInstallation();
    if (!verified || verified.installationId !== record.installationId || verified.localDatasetId !== record.localDatasetId || verified.bindingState !== "guest" || verified.accountId !== null) {
      throw new Error("Guest installation durable write could not be verified.");
    }
    return verified;
  })();
  try {
    return await provisioning;
  } finally {
    provisioning = null;
  }
}

export async function markGuestInstallationAdoptionPending(): Promise<GuestInstallation> {
  const current = await getGuestInstallation();
  if (!current) throw new AccountDataFailure("guest_installation_required");
  if (current.bindingState === "account_bound") return current;
  const next = { ...current, bindingState: "adoption_pending" as const };
  writeCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, next);
  return (await getGuestInstallation())!;
}

export async function bindGuestInstallationToAccount(accountId: string): Promise<GuestInstallation> {
  if (!accountId.trim()) throw new AccountDataFailure("account_id_required");
  const current = await getGuestInstallation();
  if (!current) throw new AccountDataFailure("guest_installation_required");
  if (current.accountId !== null && current.accountId !== accountId) throw new AccountDataFailure("account_binding_mismatch");
  if (current.accountId === accountId && current.bindingState === "account_bound") return current;
  const next = { ...current, accountId, bindingState: "account_bound" as const };
  writeCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, next);
  const verified = await getGuestInstallation();
  if (!verified || verified.accountId !== accountId || verified.bindingState !== "account_bound") throw new AccountDataFailure("guest_binding_write_unverified");
  return verified;
}

export async function clearGuestAccountBinding(): Promise<GuestInstallation> {
  const current = await getGuestInstallation();
  if (!current) throw new AccountDataFailure("guest_installation_required");
  const next = { ...current, accountId: null, bindingState: "guest" as const };
  writeCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, next);
  return (await getGuestInstallation())!;
}
