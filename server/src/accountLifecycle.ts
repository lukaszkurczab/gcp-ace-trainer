import { createHash } from "node:crypto";

export type AccountLifecycleTombstone = Readonly<{
  generation: string;
  requestId: string;
  requestedAt: string;
  state: "tombstoned";
  version: 1;
}>;

export interface AccountLifecyclePort {
  assertWritable(uid: string): Promise<void>;
  writeDeletionIntent(uid: string, requestId: string, requestedAt: string): Promise<void>;
}

export const accountLifecycleGeneration = (uid: string, requestId: string): string =>
  createHash("sha256")
    .update("patternly-account-tombstone-v1\u0000")
    .update(uid)
    .update("\u0000")
    .update(requestId)
    .digest("hex");

export const isAccountLifecycleTombstone = (value: unknown): value is AccountLifecycleTombstone => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Partial<AccountLifecycleTombstone>;
  return Object.keys(value).sort().join(":") === "generation:requestId:requestedAt:state:version"
    && typeof candidate.generation === "string"
    && /^[a-f0-9]{64}$/u.test(candidate.generation)
    && typeof candidate.requestId === "string"
    && /^[A-Za-z0-9_-]{16,128}$/u.test(candidate.requestId)
    && typeof candidate.requestedAt === "string"
    && !Number.isNaN(new Date(candidate.requestedAt).valueOf())
    && new Date(candidate.requestedAt).toISOString() === candidate.requestedAt
    && candidate.state === "tombstoned"
    && candidate.version === 1;
};
