import { UnknownTrackError, UnknownTrackFamilyError, type TrackFamilyId, type TrackId } from "../learning";
import type { TrackDisplay, TrackRegistration } from "./trackMetadata";

export const CLOUD_CERTIFICATION_TRACK_ID = "cloud-certification";
export const ALGORITHMS_TRACK_ID = "algorithms";

const registrations: readonly TrackRegistration[] = [
  {
    id: CLOUD_CERTIFICATION_TRACK_ID,
    familyId: "certification",
    metadata: {
      accentColor: "#0369A1",
      accentMutedColor: "#E7F5FD",
      description: "Scenario-based cloud certification practice with domain review and exam simulation.",
      legalNote: "Independent study content. Not affiliated with or endorsed by Google.",
      nextActionLabel: "Continue cloud practice",
      shortTitle: "Cloud",
      status: "active",
      subtitle: "Certification track",
      title: "Cloud Certification",
    },
  },
  {
    id: ALGORITHMS_TRACK_ID,
    familyId: "algorithms",
    metadata: {
      accentColor: "#7C3AED",
      accentMutedColor: "#F1ECFF",
      description: "Pattern recognition, strategy choice, and complexity reasoning for algorithmic problem solving.",
      legalNote: "Original training content for algorithmic problem solving.",
      nextActionLabel: "Start algorithms practice",
      shortTitle: "Algorithms",
      status: "active",
      subtitle: "Pattern and strategy track",
      title: "Algorithms",
    },
  },
];

export function getTracks(): readonly TrackRegistration[] {
  return registrations;
}

export function getTrackDisplays(): readonly TrackDisplay[] {
  return registrations.map((registration) => ({ id: registration.id, familyId: registration.familyId, ...registration.metadata }));
}

export function getTrackDisplay(trackId: TrackId): TrackDisplay {
  const registration = getTrackRegistration(trackId);
  return { id: registration.id, familyId: registration.familyId, ...registration.metadata };
}

export function getTrackRegistration(trackId: TrackId): TrackRegistration {
  const registration = registrations.find((candidate) => candidate.id === trackId);
  if (!registration) throw new UnknownTrackError(trackId);
  return registration;
}

export function getTrackFamilyRegistration(familyId: TrackFamilyId): readonly TrackRegistration[] {
  const familyTracks = registrations.filter((candidate) => candidate.familyId === familyId);
  if (familyTracks.length === 0) throw new UnknownTrackFamilyError(familyId);
  return familyTracks;
}

export function isRegisteredTrackId(value: string): boolean {
  return registrations.some((candidate) => candidate.id === value);
}
