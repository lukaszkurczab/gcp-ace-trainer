import { deepFreeze } from "./familyEnvelope";
import type { TrackId } from "./trackIdentity";

export type ContentItemRef = Readonly<{
  trackId: TrackId;
  itemId: string;
  contentVersion: string;
}>;

export type ContentOccurrenceRef = Readonly<{
  occurrenceId: string;
  item: ContentItemRef;
}>;

export function createContentItemRef(input: ContentItemRef): ContentItemRef {
  if (!input.trackId.trim() || !input.itemId.trim() || !input.contentVersion.trim()) {
    throw new Error("A content item reference requires track, item, and content-version identities.");
  }
  return deepFreeze({ ...input });
}

export function createContentOccurrenceRef(input: ContentOccurrenceRef): ContentOccurrenceRef {
  if (!input.occurrenceId.trim()) throw new Error("A content occurrence reference requires an occurrence identity.");
  return deepFreeze({ occurrenceId: input.occurrenceId, item: createContentItemRef(input.item) });
}
