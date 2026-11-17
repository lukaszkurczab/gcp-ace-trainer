import type { CanonicalContentLockRecord } from "./questionTypes";

/**
 * Content trust manifest (T1.4, owner decision D5): the build script runs the full runtime verification
 * (structural validation, SHA-256 against the lock, successor-ledger predecessor reconstruction and the
 * retained Claude proofs) once per binary and records what it proved. At start the runtime only checks
 * that the bundled lock, ledger and retained identities are byte-for-byte the ones that were proven.
 */
export const CONTENT_TRUST_MANIFEST_SCHEMA = "patternly-content-trust-manifest-v1";

export type ContentTrustManifest = Readonly<{
  schemaVersion: typeof CONTENT_TRUST_MANIFEST_SCHEMA;
  /** sha256(JSON.stringify(content-lock.json)); binds every current artifact SHA-256. */
  lockSha: string;
  /** sha256(JSON.stringify(content-successor-ledger.json)); binds the verified predecessor identities. */
  ledgerSha: string;
  /** Bundle import order; `sha` is the lock SHA-256 the build re-hashed from the artifact itself. */
  artifacts: readonly Readonly<{ trackId: string; sha: string }>[];
  /** Retained Claude packages whose proofs passed at build; `sha` binds their lock and ledger. */
  retained: readonly Readonly<{ id: string; sha: string }>[];
}>;

export type RetainedTrustBinding = Readonly<{ lock: unknown; ledger: unknown }>;

export type TrustedContent = Readonly<{
  /** Returns true only for a retained package whose exact lock and ledger were proven at build time. */
  retainedProven(id: string, retained: RetainedTrustBinding): Promise<boolean>;
}>;

const HASH = /^[a-f0-9]{64}$/u;

export function contentTrustBindingSha(value: unknown, sha256Utf8: (value: string) => Promise<string>): Promise<string> {
  return sha256Utf8(JSON.stringify(value));
}

export function retainedTrustBindingSha(retained: RetainedTrustBinding, sha256Utf8: (value: string) => Promise<string>): Promise<string> {
  return contentTrustBindingSha({ lock: retained.lock, ledger: retained.ledger }, sha256Utf8);
}

function isManifest(value: unknown): value is ContentTrustManifest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const manifest = value as Record<string, unknown>;
  return manifest.schemaVersion === CONTENT_TRUST_MANIFEST_SCHEMA && typeof manifest.lockSha === "string" && HASH.test(manifest.lockSha)
    && typeof manifest.ledgerSha === "string" && HASH.test(manifest.ledgerSha)
    && Array.isArray(manifest.artifacts) && manifest.artifacts.every((row) => row && typeof row === "object" && typeof row.trackId === "string" && typeof row.sha === "string" && HASH.test(row.sha))
    && Array.isArray(manifest.retained) && manifest.retained.every((row) => row && typeof row === "object" && typeof row.id === "string" && typeof row.sha === "string" && HASH.test(row.sha));
}

/**
 * Cheap runtime gate (two ~5 KB hashes). Any mismatch returns undefined and the caller falls back to the
 * full per-start verification, so a stale or missing manifest costs time, never integrity.
 */
export async function matchContentTrustManifest(manifest: unknown, inputs: Readonly<{
  lockFile: unknown;
  ledgerFile: unknown;
  artifacts: readonly unknown[];
  locks: ReadonlyMap<string, CanonicalContentLockRecord>;
  sha256Utf8: (value: string) => Promise<string>;
}>): Promise<TrustedContent | undefined> {
  if (!isManifest(manifest) || manifest.artifacts.length !== inputs.artifacts.length) return undefined;
  for (const [index, artifact] of inputs.artifacts.entries()) {
    const trackId = artifact && typeof artifact === "object" && !Array.isArray(artifact) ? (artifact as Record<string, unknown>).trackId : undefined;
    const row = manifest.artifacts[index];
    if (typeof trackId !== "string" || row?.trackId !== trackId || inputs.locks.get(trackId)?.sha256 !== row.sha) return undefined;
  }
  if (await contentTrustBindingSha(inputs.lockFile, inputs.sha256Utf8) !== manifest.lockSha) return undefined;
  if (await contentTrustBindingSha(inputs.ledgerFile, inputs.sha256Utf8) !== manifest.ledgerSha) return undefined;
  const retained = new Map(manifest.retained.map((row) => [row.id, row.sha]));
  return Object.freeze({
    async retainedProven(id: string, binding: RetainedTrustBinding) {
      const expected = retained.get(id);
      return expected !== undefined && await retainedTrustBindingSha(binding, inputs.sha256Utf8) === expected;
    },
  });
}
