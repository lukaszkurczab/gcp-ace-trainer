import { deepFreeze } from "./familyEnvelope";
import { createResolvedContentRef, type ResolvedContentRef } from "./resolvedContentRef";

/**
 * An occurrence is a durable position in a session, bound to one resolved
 * canonical question. Legacy package identities are intentionally not part of
 * this active-domain contract.
 */
export type ContentOccurrenceRef = Readonly<{
  occurrenceId: string;
  item: ResolvedContentRef;
}>;

export function createContentOccurrenceRef(input: ContentOccurrenceRef): ContentOccurrenceRef {
  if (typeof input.occurrenceId !== "string" || !input.occurrenceId.trim()) {
    throw new Error("A content occurrence reference requires an occurrence identity.");
  }
  return deepFreeze({
    occurrenceId: input.occurrenceId,
    item: createResolvedContentRef(input.item),
  });
}

/** Validates an aggregate-level artifact provenance value without normalization. */
export function createArtifactSha256(value: unknown): string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/u.test(value)) {
    throw new Error("artifactSha256 must be a lowercase 64-hex SHA-256.");
  }
  return value;
}

export function isArtifactSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}
