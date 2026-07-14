import type { TrackId } from "./trackIdentity";

export type ContentItemRef = Readonly<{
  trackId: TrackId;
  itemId: string;
  contentVersion: string;
}>;
