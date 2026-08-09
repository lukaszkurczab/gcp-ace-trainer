import { installationIdentity, type GuestInstallationIdentityPort } from "../../infrastructure/identity/installationIdentity";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";

export type GuestInstallation = Readonly<{
  installationId: string;
  localDatasetId: string;
  bindingState: "guest" | "adoption_pending" | "account_bound";
}>;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isGuestInstallation(value: unknown): value is GuestInstallation {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).length !== 3) return false;
  const { installationId, localDatasetId, bindingState } = value as Record<string, unknown>;
  return typeof installationId === "string"
    && typeof localDatasetId === "string"
    && typeof bindingState === "string"
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
    const record: GuestInstallation = Object.freeze({ ...generated, bindingState: "guest" });
    if (!isGuestInstallation(record)) throw new Error("Guest installation identity is invalid.");
    writeCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, record, null);
    const verified = await getGuestInstallation();
    if (!verified || verified.installationId !== record.installationId || verified.localDatasetId !== record.localDatasetId || verified.bindingState !== "guest") {
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
