import { UnknownTrackError, UnknownTrackFamilyError, type TrackFamilyId, type TrackId } from "../learning";
import type { TrackDisplay, TrackRegistration } from "./trackMetadata";

export const CLOUD_CERTIFICATION_TRACK_ID = "cloud-certification";
export const ALGORITHMS_TRACK_ID = "algorithms";

const registrationDefinitions = [
  {
    id: ALGORITHMS_TRACK_ID,
    familyId: "algorithms",
    metadata: {
      accentColor: "#7C3AED",
      accentMutedColor: "#F1ECFF",
      categoryLabel: "Algorithmic problem solving",
      description: "Pattern recognition, strategy choice, and complexity reasoning for algorithmic problem solving.",
      legalNote: "Original training content for algorithmic problem solving.",
      shortTitle: "Algorithms",
      status: "active",
      title: "Algorithms",
    },
  },
  {
    id: CLOUD_CERTIFICATION_TRACK_ID,
    familyId: "certification",
    metadata: {
      accentColor: "#0369A1",
      accentMutedColor: "#E7F5FD",
      categoryLabel: "Certification",
      description: "Scenario practice for Google Cloud Associate Cloud Engineer, with domain review and exam simulation.",
      legalNote: "Independent study content. Not affiliated with or endorsed by Google.",
      shortTitle: "Google Cloud ACE",
      status: "active",
      title: "Google Cloud Associate Cloud Engineer",
    },
  },
] as const satisfies readonly TrackRegistration[];

export class TrackRegistry {
  private readonly registrations: readonly TrackRegistration[];

  constructor(registrations: readonly TrackRegistration[]) {
    if (new Set(registrations.map((registration) => registration.id)).size !== registrations.length) {
      throw new Error("Track registrations must have unique track IDs.");
    }
    this.registrations = Object.freeze(registrations.map((registration) => Object.freeze({
      ...registration,
      metadata: Object.freeze({ ...registration.metadata }),
    })));
  }

  getTracks(): readonly TrackRegistration[] { return this.registrations; }

  getTrackRegistration(trackId: TrackId): TrackRegistration {
    const registration = this.registrations.find((candidate) => candidate.id === trackId);
    if (!registration) throw new UnknownTrackError(trackId);
    return registration;
  }

  getTrackFamilyRegistration(familyId: TrackFamilyId): readonly TrackRegistration[] {
    const familyTracks = this.registrations.filter((candidate) => candidate.familyId === familyId);
    if (familyTracks.length === 0) throw new UnknownTrackFamilyError(familyId);
    return familyTracks;
  }

  isRegisteredTrackId(value: string): boolean {
    return this.registrations.some((candidate) => candidate.id === value);
  }
}

const registry = new TrackRegistry(registrationDefinitions);

export function getTracks(): readonly TrackRegistration[] {
  return registry.getTracks();
}

export function getTrackDisplays(): readonly TrackDisplay[] {
  return getTracks().map((registration) => ({ id: registration.id, familyId: registration.familyId, ...registration.metadata }));
}

export function getTrackDisplay(trackId: TrackId): TrackDisplay {
  const registration = getTrackRegistration(trackId);
  return { id: registration.id, familyId: registration.familyId, ...registration.metadata };
}

export function getTrackRegistration(trackId: TrackId): TrackRegistration {
  return registry.getTrackRegistration(trackId);
}

export function getTrackFamilyRegistration(familyId: TrackFamilyId): readonly TrackRegistration[] {
  return registry.getTrackFamilyRegistration(familyId);
}

export function isRegisteredTrackId(value: string): boolean {
  return registry.isRegisteredTrackId(value);
}
