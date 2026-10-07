import type { Q13PreservationSnapshot } from "./preservation";

export const Q13_ATTESTATION_STAGES = Object.freeze([
  "js_bundle_entry",
  "exact_resume_success",
  "identity_mismatch",
] as const);

export type Q13AttestationStage = (typeof Q13_ATTESTATION_STAGES)[number];
export type Q13CatalogIdentity = Readonly<{ contentVersion: string; artifactSha256: string }>;
export type Q13SessionPin = Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }>;

export const Q13_OOD_TRACK_ID = "object-oriented-design-interview";
export const Q13_OOD_V23: Q13CatalogIdentity = Object.freeze({
  contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
  artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
});
export const Q13_OOD_V24: Q13CatalogIdentity = Object.freeze({
  contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-24",
  artifactSha256: "9df476e414158da0f33e118c06ed7fbc476b53bc8f0a115a470f61f9c1bf1ea3",
});
export const Q13_EXACT_RESOLVER_MISS = "Exact canonical artifact identity does not match the verified catalog or retained node packages.";

export type Q13Receipt = Readonly<{
  schemaVersion: "bizq01-q13-runtime-receipt-v2";
  nonce: string;
  contentVersion: string;
  artifactSha256: string;
  stage: Q13AttestationStage;
  preservation?: Q13PreservationSnapshot;
}>;

export function isQ13Nonce(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

export function readQ13OodIdentity(lock: unknown): Q13CatalogIdentity | null {
  if (!lock || typeof lock !== "object" || Array.isArray(lock)) return null;
  const tracks = (lock as { tracks?: unknown }).tracks;
  if (!Array.isArray(tracks)) return null;
  const entry = tracks.find((candidate) => candidate && typeof candidate === "object"
    && !Array.isArray(candidate)
    && (candidate as { trackId?: unknown }).trackId === Q13_OOD_TRACK_ID) as
    | { contentVersion?: unknown; sha256?: unknown }
    | undefined;
  if (typeof entry?.contentVersion !== "string" || !entry.contentVersion.trim()
    || typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/u.test(entry.sha256)) return null;
  return Object.freeze({ contentVersion: entry.contentVersion, artifactSha256: entry.sha256 });
}

export function isQ13OldSessionPin(session: Q13SessionPin): boolean {
  return session.trackId === Q13_OOD_TRACK_ID
    && session.contentVersion === Q13_OOD_V23.contentVersion
    && session.artifactSha256 === Q13_OOD_V23.artifactSha256;
}

export function createQ13Receipt(
  nonce: string,
  current: Q13CatalogIdentity,
  stage: Q13AttestationStage,
  preservation?: Q13PreservationSnapshot,
): Q13Receipt | null {
  if (!isQ13Nonce(nonce)
    || typeof current.contentVersion !== "string"
    || current.contentVersion.length === 0
    || !/^[a-f0-9]{64}$/u.test(current.artifactSha256)
    || !Q13_ATTESTATION_STAGES.includes(stage)
    || (stage === "js_bundle_entry" ? preservation !== undefined : preservation?.schema !== "bizq01-q13-preservation-v1")) return null;
  return Object.freeze({
    schemaVersion: "bizq01-q13-runtime-receipt-v2",
    nonce,
    contentVersion: current.contentVersion,
    artifactSha256: current.artifactSha256,
    stage,
    ...(preservation ? { preservation } : {}),
  });
}

export function classifyQ13ResumeOutcome(
  session: Q13SessionPin,
  current: Q13CatalogIdentity,
  outcome: Readonly<{ kind: "success" } | { kind: "failure"; error: unknown }>,
  isExpectedExactMismatch: (error: unknown) => boolean,
): "exact_resume_success" | "identity_mismatch" | null {
  if (!isQ13OldSessionPin(session)) return null;
  if (outcome.kind === "success") {
    return sameIdentity(current, Q13_OOD_V23) ? "exact_resume_success" : null;
  }
  return sameIdentity(current, Q13_OOD_V24) && isExpectedExactMismatch(outcome.error)
    ? "identity_mismatch"
    : null;
}

export async function observeQ13Resume<T>(input: Readonly<{
  operation: () => Promise<T>;
  onSuccess: () => void;
  onFailure: (error: unknown) => void;
}>): Promise<T> {
  try {
    const result = await input.operation();
    try { input.onSuccess(); } catch { /* Attestation failure never changes the application result. */ }
    return result;
  } catch (error) {
    try { input.onFailure(error); } catch { /* Attestation failure never replaces the application error. */ }
    throw error;
  }
}

function sameIdentity(left: Q13CatalogIdentity, right: Q13CatalogIdentity): boolean {
  return left.contentVersion === right.contentVersion && left.artifactSha256 === right.artifactSha256;
}
