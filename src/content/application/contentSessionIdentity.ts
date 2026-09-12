import type { TrainingSession, TrainingSessionConditionalReinsertBranch } from "../../domain";
import { canonicalFingerprintPayload } from "../../infrastructure/identity/canonicalSerialization";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
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
