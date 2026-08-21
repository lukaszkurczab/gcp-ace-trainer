import { CODING_INTERVIEW_TRACK_ID, type ContentItemRef, type TrackId, type TrainingSession } from "../../domain";
import {
  ALGORITHM_MODE_IDS,
  getAlgorithmSessionNodeById,
  getAlgorithmMode,
  isAlgorithmModeId,
  type AlgorithmModeId,
} from "../../tracks/coding-interview";
import type { AlgorithmSelectionScope } from "../../tracks/coding-interview/algorithmSessionSelection";
import { CERTIFICATION_PRACTICE_MODE_IDS, getCertificationMode, isCertificationPracticeModeId, type CertificationDomain, type CertificationPracticeModeId } from "../../tracks/certification";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { isDesignInterviewModeId, type DesignInterviewModeId } from "../../tracks/design-interview";

export type PracticeSessionSource =
  | "home"
  | "practiceHub"
  | "practiceSetup"
  | "modeShortcut";

export type CertificationPracticeSessionMode = CertificationPracticeModeId;
export type PracticeSessionMode = AlgorithmModeId | CertificationPracticeSessionMode | DesignInterviewModeId;

export type PracticeSessionLength = number;

export type PracticeFeedbackMode = "afterEachAnswer" | "atSessionEnd";

export type PracticeReviewSource = "due_queue" | "session_misses";

export type PracticeSessionRouteParams = {
  algorithmScope?: AlgorithmSelectionScope;
  competencyId?: string;
  feedbackMode: PracticeFeedbackMode;
  mode: PracticeSessionMode;
  reviewBehaviorEnabled: boolean;
  reviewItemRefs?: readonly ContentItemRef[];
  reviewSource?: PracticeReviewSource;
  sessionLength: PracticeSessionLength;
  source: PracticeSessionSource;
  topicId: string;
  trackId: TrackId;
  expectedSessionId?: string;
};

export type PracticeSessionConfigInput = Partial<Omit<PracticeSessionRouteParams, "expectedSessionId">> & {
  topicId: string;
  trackId: TrackId;
};

export const DEFAULT_PRACTICE_SESSION_LENGTH: PracticeSessionLength = 20;
export const DEFAULT_FEEDBACK_MODE: PracticeFeedbackMode = "afterEachAnswer";

const cloudDomainTopicIds: readonly CertificationDomain[] = [
  "setup_environment",
  "planning_implementation",
  "operations",
  "access_security",
];
const certificationPracticeModes: readonly CertificationPracticeSessionMode[] = CERTIFICATION_PRACTICE_MODE_IDS;

export function buildPracticeSessionConfig(
  input: PracticeSessionConfigInput,
): PracticeSessionRouteParams {
  if (input.trackId === CODING_INTERVIEW_TRACK_ID) {
    const packageProfile = contentPackageRuntimeOwner.getPreparedDiscovery(input.trackId).profile;
    const mode = input.mode ?? packageProfile.primaryEntry.modeId as AlgorithmModeId;
    if (!isAlgorithmModeId(mode)) {
      throw new Error(`Unknown Algorithms mode id: ${mode}`);
    }

    const profile = getAlgorithmMode(mode).profile;
    const packageMode = packageProfile.getMode(mode);
    const sessionLength = input.sessionLength ?? packageMode.defaultRequestedLength as PracticeSessionLength;
    if (!packageMode.requestedLengths.includes(sessionLength)) {
      throw new Error(`Algorithms mode ${mode} does not support session length ${sessionLength}.`);
    }
    if (mode === ALGORITHM_MODE_IDS.customPractice && input.feedbackMode === undefined) {
      throw new Error("Algorithms Custom Practice requires an explicit feedback mode.");
    }
    const feedbackMode = input.feedbackMode ?? profile.feedbackMode;
    if (!profile.supportedFeedbackModes.includes(feedbackMode)) {
      throw new Error(`Algorithms mode ${mode} does not support feedback mode ${feedbackMode}.`);
    }
    if (input.reviewBehaviorEnabled !== undefined && input.reviewBehaviorEnabled !== profile.reinsertEnabled) {
      throw new Error(`Algorithms mode ${mode} owns reinsert setting ${profile.reinsertEnabled}.`);
    }
    if ((input.reviewSource || input.reviewItemRefs) && mode !== ALGORITHM_MODE_IDS.weakAreaReview) {
      throw new Error(`Algorithms review source requires mode ${ALGORITHM_MODE_IDS.weakAreaReview}.`);
    }
    if (mode === ALGORITHM_MODE_IDS.weakAreaReview && !input.reviewSource) {
      throw new Error("Algorithms Weak Area Review requires due_queue or session_misses source.");
    }
    if (input.reviewItemRefs && input.reviewSource !== "session_misses") {
      throw new Error("Algorithms review item refs require session_misses source.");
    }
    const topicId = getAlgorithmSessionNodeById(input.topicId).id;

    return {
      feedbackMode,
      algorithmScope: input.algorithmScope,
      mode,
      reviewBehaviorEnabled: profile.reinsertEnabled,
      reviewItemRefs: input.reviewItemRefs,
      reviewSource: input.reviewSource,
      sessionLength,
      source: input.source ?? "practiceHub",
      topicId,
      trackId: input.trackId,
    };
  }

  const packageProfile = contentPackageRuntimeOwner.getPreparedDiscovery(input.trackId).profile;
  const mode = input.mode ?? packageProfile.primaryEntry.modeId as CertificationPracticeSessionMode;
  if (isDesignInterviewModeId(mode)) {
    const packageMode = packageProfile.getMode(mode);
    const sessionLength = input.sessionLength ?? packageMode.defaultRequestedLength;
    if (!packageMode.requestedLengths.includes(sessionLength)) throw new Error(`Design Interview mode ${mode} length is unavailable in this package.`);
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: mode === "design-interview-weak-area-review" ? "" : input.topicId || packageProfile.freeNodeId, trackId: input.trackId };
  }
  if (!certificationPracticeModes.some((candidate) => candidate === mode)) {
    throw new Error(`Unknown Certification practice mode id: ${mode}`);
  }

  const definition = getCertificationMode(mode);
  const packageMode = packageProfile.getMode(mode);
  if (mode === "certification-diagnostic-baseline") {
    if (input.sessionLength !== undefined || input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined) throw new Error("Certification Diagnostic Baseline does not render or accept optional setup controls.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength: 40, source: input.source ?? "practiceHub", topicId: input.topicId, trackId: input.trackId };
  }
  if (mode === "certification-focus-practice") {
    if (!isCloudTopicId(input.topicId) && input.topicId !== packageProfile.freeNodeId) throw new Error("Certification Focus Practice requires an explicitly selected installed topic.");
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined) throw new Error("Certification Focus Practice does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? packageMode.defaultRequestedLength as PracticeSessionLength;
    if (!sessionLength || !packageMode.requestedLengths.includes(sessionLength)) throw new Error("Certification Focus Practice length is unavailable in this package.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: input.topicId, trackId: input.trackId };
  }
  if (mode === "certification-scenario-practice") {
    if (!input.competencyId?.trim()) throw new Error("Certification Scenario Practice requires an explicitly selected competency.");
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined) throw new Error("Certification Scenario Practice does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? packageMode.defaultRequestedLength as PracticeSessionLength;
    if (!sessionLength || !packageMode.requestedLengths.includes(sessionLength)) throw new Error("Certification Scenario Practice length is unavailable in this package.");
    return { competencyId: input.competencyId, feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: input.topicId, trackId: input.trackId };
  }
  if (mode === "certification-weak-area-review") {
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined || input.competencyId !== undefined || input.topicId) throw new Error("Certification Weak Area Review does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? packageMode.defaultRequestedLength as PracticeSessionLength;
    if (!sessionLength || !packageMode.requestedLengths.includes(sessionLength)) throw new Error("Certification Weak Area Review length is unavailable in this package.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: "", trackId: input.trackId };
  }
  if (mode === "certification-mixed-practice") {
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined || input.competencyId !== undefined || input.topicId) throw new Error("Certification Mixed Practice does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? packageMode.defaultRequestedLength as PracticeSessionLength;
    if (!sessionLength || !packageMode.requestedLengths.includes(sessionLength)) throw new Error("Certification Mixed Practice length is unavailable in this package.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: "", trackId: input.trackId };
  }
  if (mode === "certification-quick-review") {
    if (input.sessionLength !== undefined || input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined || input.competencyId !== undefined || input.topicId) throw new Error("Certification Quick Review does not render or accept optional setup controls.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength: packageMode.defaultRequestedLength, source: input.source ?? "practiceHub", topicId: "", trackId: input.trackId };
  }
  throw new Error(`Certification mode ${mode} has no canonical setup configuration.`);
}

/** Reconstructs only an exact active ordinary Certification route from its durable immutable snapshot. */
export function buildCertificationPracticeResumeRoute(session: TrainingSession): PracticeSessionRouteParams {
  if (session.status !== "active") throw new Error("Only an active Certification Practice session can be resumed.");
  if (!isCertificationPracticeModeId(session.modeId)) throw new Error("Certification Practice resume requires an ordinary Certification session.");
  if (!session.id.trim()) throw new Error("Certification Practice resume requires an exact session identity.");
  const packageProfile = contentPackageRuntimeOwner.getPreparedDiscovery(session.trackId).profile;
  if (packageProfile.familyId !== "certification") throw new Error("Certification Practice resume requires a Certification package.");
  const packageMode = packageProfile.getMode(session.modeId);
  assertOrdinaryCertificationConfiguration(session);

  const exact = (params: PracticeSessionRouteParams): PracticeSessionRouteParams => Object.freeze({
    ...params,
    expectedSessionId: session.id,
  });

  if (session.modeId === "certification-diagnostic-baseline") {
    if (session.configurationSnapshot.kind !== "certificationDiagnosticBaseline" || session.requestedLength !== 40 || session.actualLength !== 40) {
      throw new Error("Certification Diagnostic Baseline resume requires its immutable 40-item configuration.");
    }
    return exact(buildPracticeSessionConfig({ mode: session.modeId, source: "home", topicId: "", trackId: session.trackId }));
  }

  if (session.modeId === "certification-focus-practice") {
    const domain = session.configurationSnapshot.domain;
    if (session.configurationSnapshot.kind !== "certificationFocusPractice" || typeof domain !== "string" || domain !== packageProfile.freeNodeId || !packageMode.requestedLengths.includes(session.requestedLength)) {
      throw new Error("Certification Focus Practice resume requires its immutable installed node and supported length.");
    }
    return exact(buildPracticeSessionConfig({ mode: session.modeId, sessionLength: session.requestedLength as PracticeSessionLength, source: "home", topicId: domain, trackId: session.trackId }));
  }

  if (session.modeId === "certification-scenario-practice") {
    const competencyId = session.configurationSnapshot.competencyId;
    if (session.configurationSnapshot.kind !== "certificationScenarioPractice" || typeof competencyId !== "string" || !competencyId.trim() || !packageMode.requestedLengths.includes(session.requestedLength)) {
      throw new Error("Certification Scenario Practice resume requires its immutable competency and supported length.");
    }
    return exact(buildPracticeSessionConfig({ competencyId, mode: session.modeId, sessionLength: session.requestedLength as PracticeSessionLength, source: "home", topicId: "", trackId: session.trackId }));
  }

  if (session.modeId === "certification-weak-area-review") {
    if (session.configurationSnapshot.kind !== "certificationWeakAreaReview" || !packageMode.requestedLengths.includes(session.requestedLength)) {
      throw new Error("Certification Weak Area Review resume requires its immutable supported length.");
    }
    return exact(buildPracticeSessionConfig({ mode: session.modeId, sessionLength: session.requestedLength as PracticeSessionLength, source: "home", topicId: "", trackId: session.trackId }));
  }

  if (session.modeId === "certification-mixed-practice") {
    if (session.configurationSnapshot.kind !== "certificationMixedPractice" || !packageMode.requestedLengths.includes(session.requestedLength)) {
      throw new Error("Certification Mixed Practice resume requires its immutable supported length.");
    }
    return exact(buildPracticeSessionConfig({ mode: session.modeId, sessionLength: session.requestedLength as PracticeSessionLength, source: "home", topicId: "", trackId: session.trackId }));
  }

  if (session.configurationSnapshot.kind !== "certificationQuickReview" || session.configurationSnapshot.maximumLength !== packageMode.defaultRequestedLength || session.requestedLength !== packageMode.defaultRequestedLength) {
    throw new Error("Certification Quick Review resume requires its immutable package configuration.");
  }
  return exact(buildPracticeSessionConfig({ mode: session.modeId, source: "home", topicId: "", trackId: session.trackId }));
}

/** Reconstructs only an exact active Design Interview route from its durable immutable snapshot. */
export function buildDesignInterviewPracticeResumeRoute(session: TrainingSession): PracticeSessionRouteParams {
  if (session.status !== "active") throw new Error("Only an active Design Interview session can be resumed.");
  if (!isDesignInterviewModeId(session.modeId)) throw new Error("Design Interview resume requires an ordinary Design Interview session.");
  if (!session.id.trim()) throw new Error("Design Interview resume requires an exact session identity.");
  const packageProfile = contentPackageRuntimeOwner.getPreparedDiscovery(session.trackId).profile;
  if (packageProfile.familyId !== "design_interview") throw new Error("Design Interview resume requires a Design Interview package.");
  const packageMode = packageProfile.getMode(session.modeId);
  if (!packageMode.requestedLengths.includes(session.requestedLength) || !Number.isInteger(session.actualLength) || session.actualLength < 1 || session.actualLength > session.requestedLength) {
    throw new Error("Design Interview resume requires its immutable supported session length.");
  }
  if (session.configurationSnapshot.navigation !== "linear" || session.configurationSnapshot.submission !== "perItem" || session.configurationSnapshot.feedbackMode !== "afterEachAnswer" || session.configurationSnapshot.answerChanges !== "none" || session.configurationSnapshot.timer !== "elapsedForeground") {
    throw new Error("Design Interview resume requires its canonical immutable interaction configuration.");
  }
  return Object.freeze({
    ...buildPracticeSessionConfig({
      mode: session.modeId,
      sessionLength: session.requestedLength,
      source: "home",
      topicId: session.modeId === "design-interview-weak-area-review" ? "" : packageProfile.freeNodeId,
      trackId: session.trackId,
    }),
    expectedSessionId: session.id,
  });
}

function assertOrdinaryCertificationConfiguration(session: TrainingSession): void {
  const configuration = session.configurationSnapshot;
  if (configuration.navigation !== "linear" || configuration.submission !== "perItem" || configuration.feedbackMode !== "afterEachAnswer" || configuration.answerChanges !== "none" || configuration.timer !== "elapsedForeground") {
    throw new Error("Certification Practice resume requires its canonical immutable interaction configuration.");
  }
  if (!Number.isInteger(session.requestedLength) || session.actualLength < 1 || session.actualLength > session.requestedLength) {
    throw new Error("Certification Practice resume requires a valid immutable session length.");
  }
}

export function getGeneralPracticeReviewSource(
  mode: PracticeSessionMode,
): PracticeReviewSource | undefined {
  return mode === ALGORITHM_MODE_IDS.weakAreaReview ? "due_queue" : undefined;
}

export function isCloudTopicId(topicId: string): topicId is CertificationDomain {
  return cloudDomainTopicIds.some((domain) => domain === topicId);
}

export function getCertificationTopicIdForRoute(topicId: string): string {
  if (!topicId.trim()) throw new Error("Certification route requires a non-empty topic identity.");
  return topicId;
}
