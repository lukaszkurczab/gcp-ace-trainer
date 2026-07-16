import type { TrainingSession } from "../../domain";
import { canonicalFingerprintPayload } from "../../infrastructure/identity/canonicalSerialization";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import type { AvailableBundledTrack } from "./validateBundledContent";

/** Persisted with a prepared session; it never substitutes a newer artifact. */
export type ContentSessionIdentity = Readonly<{
  taxonomyVersion: string;
  planFingerprint: string;
}>;

export async function createContentSessionPlanFingerprint(session: Pick<TrainingSession, "trackId" | "modeId" | "contentVersion" | "configurationSnapshot" | "itemOrder" | "optionOrderByOccurrence" | "conditionalReinsertSlots"> & Pick<ContentSessionIdentity, "taxonomyVersion">): Promise<string> {
  return contentHasher.sha256(canonicalFingerprintPayload({
    trackId: session.trackId,
    modeId: session.modeId,
    contentVersion: session.contentVersion,
    taxonomyVersion: session.taxonomyVersion,
    configurationSnapshot: session.configurationSnapshot,
    itemOrder: session.itemOrder,
    optionOrderByOccurrence: session.optionOrderByOccurrence,
    conditionalReinsertSlots: session.conditionalReinsertSlots ?? [],
  }));
}

/**
 * A legacy session without this identity is explicitly non-resumable. It is
 * never translated onto a later artifact or a different immutable plan.
 */
export async function assertSessionMatchesBundledTrack(
  session: TrainingSession,
  track: AvailableBundledTrack,
): Promise<void> {
  if (!session.taxonomyVersion || !session.planFingerprint) throw new Error("Active session has no immutable taxonomy and plan identity.");
  if (session.trackId !== track.trackId || session.contentVersion !== track.contentVersion || session.taxonomyVersion !== track.taxonomyVersion) {
    throw new Error("Active session content identity does not match its pinned artifact.");
  }
  if (session.itemOrder.some((occurrence) => !track.itemIds.includes(occurrence.item.itemId))) {
    throw new Error("Active session item identities are absent from its pinned artifact.");
  }
  const expected = await createContentSessionPlanFingerprint(session as TrainingSession & ContentSessionIdentity);
  if (session.planFingerprint !== expected) throw new Error("Active session plan fingerprint does not match its immutable item plan.");
}
