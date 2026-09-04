import { UnknownTrackError, UnknownTrackFamilyError, type TrackFamilyId, type TrackId } from "../learning";
import type { TrackDisplay, TrackRegistration } from "./trackMetadata";

export const GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID = "google-cloud-associate-cloud-engineer";
export const MICROSOFT_AZURE_ADMINISTRATOR_ASSOCIATE_AZ_104_TRACK_ID = "microsoft-azure-administrator-associate-az-104";
export const CODING_INTERVIEW_TRACK_ID = "coding-interview-dsa-problem-solving";
export const BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID = "backend-system-design-interview";
export const FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID = "frontend-system-design-interview";
export const OBJECT_ORIENTED_DESIGN_INTERVIEW_TRACK_ID = "object-oriented-design-interview";
export const AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID = "aws-certified-solutions-architect-associate";
export const MICROSOFT_AZURE_AI_FUNDAMENTALS_AI_901_TRACK_ID = "microsoft-azure-ai-fundamentals-ai-901";
export const CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID = "claude-certified-architect-professional-certification";

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
    id: BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
    familyId: "design_interview",
    metadata: { accentColor: "#0F766E", accentMutedColor: "#E6FFFB", description: "Requirements, capacity, architecture boundaries, and explicit backend tradeoffs for system-design interviews.", legalNote: "Original training content for backend system-design interview practice.", shortTitle: "Backend System Design", status: "active", title: "Backend System Design Interview" },
  },
  {
    id: OBJECT_ORIENTED_DESIGN_INTERVIEW_TRACK_ID,
    familyId: "design_interview",
    metadata: { accentColor: "#9333EA", accentMutedColor: "#FAF5FF", description: "Domain vocabulary, responsibilities, collaborations, invariants, and extensibility tradeoffs.", legalNote: "Original training content for object-oriented design interview practice.", shortTitle: "Object-Oriented Design", status: "active", title: "Object-Oriented Design Interview" },
  },
  {
    id: FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
    familyId: "design_interview",
    metadata: { accentColor: "#C2410C", accentMutedColor: "#FFF7ED", description: "User journeys, client boundaries, state, delivery, accessibility, and frontend architecture tradeoffs.", legalNote: "Original training content for frontend system-design interview practice.", shortTitle: "Frontend System Design", status: "active", title: "Frontend System Design Interview" },
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
  {
    id: AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID,
    familyId: "certification",
    metadata: { accentColor: "#B45309", accentMutedColor: "#FFFBEB", description: "Independent scenario practice for AWS Certified Solutions Architect - Associate concepts.", legalNote: "Independent study content. Not affiliated with or endorsed by Amazon Web Services.", shortTitle: "AWS Solutions Architect", status: "active", title: "AWS Certified Solutions Architect - Associate" },
  },
  {
    id: MICROSOFT_AZURE_ADMINISTRATOR_ASSOCIATE_AZ_104_TRACK_ID,
    familyId: "certification",
    metadata: {
      accentColor: "#2563EB",
      accentMutedColor: "#E8F0FE",
      description: "Scenario practice for Microsoft Azure Administrator Associate AZ-104, with identity-focused review and administration decisions.",
      legalNote: "Independent study content. Not affiliated with or endorsed by Microsoft.",
      shortTitle: "Azure Administrator AZ-104",
      status: "active",
      title: "Microsoft Azure Administrator Associate AZ-104",
    },
  },
  {
    id: MICROSOFT_AZURE_AI_FUNDAMENTALS_AI_901_TRACK_ID,
    familyId: "certification",
    metadata: {
      accentColor: "#0369A1",
      accentMutedColor: "#F0F9FF",
      description: "Independent scenario practice for Microsoft Azure AI Fundamentals AI-901 concepts.",
      legalNote: "Independent study content. Not affiliated with or endorsed by Microsoft.",
      shortTitle: "Azure AI Fundamentals",
      status: "active",
      title: "Microsoft Azure AI Fundamentals AI-901",
    },
  },
  {
    id: CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID,
    familyId: "certification",
    metadata: {
      accentColor: "#C2410C",
      accentMutedColor: "#FFF7ED",
      description: "Independent practice for designing and operating production Claude systems, from solution architecture and evaluation to governance and delivery.",
      legalNote: "Independent study content. Not affiliated with or endorsed by Anthropic.",
      shortTitle: "Claude Architect Professional",
      status: "active",
      title: "Claude Certified Architect – Professional",
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
