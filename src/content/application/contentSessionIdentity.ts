import type { TrainingSession, TrainingSessionConditionalReinsertBranch } from "../../domain";
import { canonicalFingerprintPayload } from "../../infrastructure/identity/canonicalSerialization";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import type { VerifiedContentPackage } from "../contracts";
import { createResolvedContentRef, type ResolvedContentRef } from "../../domain";

/** Persisted with a prepared session; it never substitutes a newer artifact. */
export type ContentSessionIdentity = Readonly<{
  taxonomyVersion: string;
  planFingerprint: string;
}>;

export type ContentSessionPlanFingerprintInput = Pick<TrainingSession, "trackId" | "modeId" | "contentVersion" | "artifactSha256" | "configurationSnapshot" | "itemOrder" | "optionOrderByOccurrence" | "conditionalReinsertSlots"> & Readonly<{ taxonomyVersion: string }>;

export async function createContentSessionPlanFingerprint(session: ContentSessionPlanFingerprintInput): Promise<string> {
  return contentHasher.sha256(canonicalFingerprintPayload({
    trackId: session.trackId,
    modeId: session.modeId,
    contentVersion: session.contentVersion,
    artifactSha256: session.artifactSha256,
    taxonomyVersion: session.taxonomyVersion,
    configurationSnapshot: session.configurationSnapshot,
    itemOrder: session.itemOrder.map((occurrence) => ({
      occurrenceId: occurrence.occurrenceId,
      item: contentRefPayload(occurrence.item),
    })),
    optionOrderByOccurrence: session.optionOrderByOccurrence,
    conditionalReinsertSlots: (session.conditionalReinsertSlots ?? []).map((slot) => ({
      slotId: slot.slotId,
      sourceOccurrenceId: slot.sourceOccurrenceId,
      ordinaryBranch: branchPayload(slot.ordinaryBranch),
      ...(slot.reviewedVariantBranch ? { reviewedVariantBranch: branchPayload(slot.reviewedVariantBranch) } : {}),
      ...(slot.exactSourceBranch ? { exactSourceBranch: branchPayload(slot.exactSourceBranch) } : {}),
      resolutionRule: slot.resolutionRule,
    })),
  }));
}

/**
 * A legacy session without this identity is explicitly non-resumable. It is
 * never translated onto a later artifact or a different immutable plan.
 */
export async function assertSessionMatchesContentPackage(
  session: TrainingSession,
  pkg: VerifiedContentPackage,
): Promise<void> {
  if (!session.taxonomyVersion || !session.planFingerprint) throw new Error("Active session has no immutable taxonomy and plan identity.");
  if (session.artifactSha256 !== pkg.packagePin.packageIdentity || session.trackId !== pkg.trackId || session.contentVersion !== pkg.contentVersion || session.taxonomyVersion !== pkg.taxonomyVersion) {
    throw new Error("Active session content identity does not match its exact artifact.");
  }
  if (session.itemOrder.some((occurrence) => occurrence.item.artifactSha256 !== session.artifactSha256 || !pkg.catalog.itemIds.includes(occurrence.item.questionId))) {
    throw new Error("Active session item identities are absent from its exact package.");
  }
  const expected = await createContentSessionPlanFingerprint(session as TrainingSession & ContentSessionIdentity);
  if (session.planFingerprint !== expected) throw new Error("Active session plan fingerprint does not match its immutable item plan.");
}

function contentRefPayload(ref: ResolvedContentRef): ResolvedContentRef {
  return createResolvedContentRef(ref);
}

function branchPayload(branch: TrainingSessionConditionalReinsertBranch): Readonly<{ occurrence: Readonly<{ occurrenceId: string; item: ResolvedContentRef }>; optionOrder: readonly string[] }> {
  return {
    occurrence: {
      occurrenceId: branch.occurrence.occurrenceId,
      item: contentRefPayload(branch.occurrence.item),
    },
    optionOrder: [...branch.optionOrder],
  };
}
