import type { TrackFamilyId, TrackId } from "../learning";

export type TrackStatus = "active" | "archived";

export type TrackMetadata = Readonly<{
  title: string;
  shortTitle: string;
  description: string;
  status: TrackStatus;
  accentColor: string;
  accentMutedColor: string;
  legalNote?: string;
}>;

export type TrackRegistration = Readonly<{
  id: TrackId;
  familyId: TrackFamilyId;
  metadata: TrackMetadata;
}>;

export type TrackDisplay = TrackMetadata & Readonly<{
  id: TrackId;
  familyId: TrackFamilyId;
}>;
