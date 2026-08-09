import { UnknownTrackError, UnknownTrackFamilyError, type TrackFamilyId, type TrackId } from "../learning";
import type { TrackDisplay, TrackRegistration } from "./trackMetadata";

export const GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID = "google-cloud-associate-cloud-engineer";
export const CODING_INTERVIEW_TRACK_ID = "coding-interview-dsa-problem-solving";

const registrationDefinitions = [
  {
    id: CODING_INTERVIEW_TRACK_ID,
    familyId: "coding_interview",
    metadata: {
      accentColor: "#7C3AED",
      accentMutedColor: "#F1ECFF",
      description: "Pattern recognition, strategy choice, and complexity reasoning for algorithmic problem solving.",
      legalNote: "Original training content for algorithmic problem solving.",
      shortTitle: "Coding Interview",
      status: "active",
      title: "Coding Interview: DSA & Problem Solving",
    },
  },
  {
    id: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
    familyId: "certification",
    metadata: {
      accentColor: "#0369A1",
      accentMutedColor: "#E7F5FD",
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
