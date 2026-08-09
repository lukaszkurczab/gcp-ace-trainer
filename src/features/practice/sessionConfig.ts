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

export type PracticeSessionSource =
  | "home"
  | "practiceHub"
  | "practiceSetup"
  | "modeShortcut";

export type CertificationPracticeSessionMode = CertificationPracticeModeId;
export type PracticeSessionMode = AlgorithmModeId | CertificationPracticeSessionMode;

export type PracticeSessionLength = 10 | 20 | 40;

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
    const mode = input.mode ?? ALGORITHM_MODE_IDS.guidedPractice;
    if (!isAlgorithmModeId(mode)) {
      throw new Error(`Unknown Algorithms mode id: ${mode}`);
    }

    const profile = getAlgorithmMode(mode).profile;
    const sessionLength = input.sessionLength ?? profile.sessionLength;
    if (!profile.supportedLengths.includes(sessionLength)) {
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

  const mode = input.mode ?? "certification-diagnostic-baseline";
  if (!certificationPracticeModes.some((candidate) => candidate === mode)) {
    throw new Error(`Unknown Certification practice mode id: ${mode}`);
  }

  const definition = getCertificationMode(mode);
  if (mode === "certification-diagnostic-baseline") {
    if (input.sessionLength !== undefined || input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined) throw new Error("Certification Diagnostic Baseline does not render or accept optional setup controls.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength: 40, source: input.source ?? "practiceHub", topicId: input.topicId, trackId: input.trackId };
  }
  if (mode === "certification-focus-practice") {
    if (!isCloudTopicId(input.topicId)) throw new Error("Certification Focus Practice requires an explicitly selected Cloud domain.");
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined) throw new Error("Certification Focus Practice does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? (definition.defaultQuestionCount as PracticeSessionLength | undefined);
    if (!sessionLength || ![10, 20, 40].includes(sessionLength)) throw new Error("Certification Focus Practice supports 10, 20, or 40 questions.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: input.topicId, trackId: input.trackId };
  }
  if (mode === "certification-scenario-practice") {
    if (!input.competencyId?.trim()) throw new Error("Certification Scenario Practice requires an explicitly selected competency.");
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined) throw new Error("Certification Scenario Practice does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? (definition.defaultQuestionCount as PracticeSessionLength | undefined);
    if (!sessionLength || ![10, 20, 40].includes(sessionLength)) throw new Error("Certification Scenario Practice supports 10, 20, or 40 questions.");
    return { competencyId: input.competencyId, feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: input.topicId, trackId: input.trackId };
  }
  if (mode === "certification-weak-area-review") {
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined || input.competencyId !== undefined || input.topicId) throw new Error("Certification Weak Area Review does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? (definition.defaultQuestionCount as PracticeSessionLength | undefined);
    if (!sessionLength || ![10, 20].includes(sessionLength)) throw new Error("Certification Weak Area Review supports 10 or 20 questions.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: "", trackId: input.trackId };
  }
  if (mode === "certification-mixed-practice") {
    if (input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined || input.competencyId !== undefined || input.topicId) throw new Error("Certification Mixed Practice does not render or accept undeclared setup controls.");
    const sessionLength = input.sessionLength ?? (definition.defaultQuestionCount as PracticeSessionLength | undefined);
    if (!sessionLength || ![10, 20, 40].includes(sessionLength)) throw new Error("Certification Mixed Practice supports 10, 20, or 40 questions.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength, source: input.source ?? "practiceHub", topicId: "", trackId: input.trackId };
  }
  if (mode === "certification-quick-review") {
    if (input.sessionLength !== undefined || input.feedbackMode !== undefined || input.reviewBehaviorEnabled !== undefined || input.reviewItemRefs !== undefined || input.reviewSource !== undefined || input.algorithmScope !== undefined || input.competencyId !== undefined || input.topicId) throw new Error("Certification Quick Review does not render or accept optional setup controls.");
    return { feedbackMode: "afterEachAnswer", mode, reviewBehaviorEnabled: false, sessionLength: 10, source: input.source ?? "practiceHub", topicId: "", trackId: input.trackId };
  }
  throw new Error(`Certification mode ${mode} has no canonical setup configuration.`);
}

/** Reconstructs only an exact active ordinary Certification route from its durable immutable snapshot. */
export function buildCertificationPracticeResumeRoute(session: TrainingSession): PracticeSessionRouteParams {
  if (session.status !== "active") throw new Error("Only an active Certification Practice session can be resumed.");
  if (session.trackId !== "google-cloud-associate-cloud-engineer" || !isCertificationPracticeModeId(session.modeId)) {
    throw new Error("Certification Practice resume requires an ordinary Cloud Certification session.");
  }
  if (!session.id.trim()) throw new Error("Certification Practice resume requires an exact session identity.");
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
    if (session.configurationSnapshot.kind !== "certificationFocusPractice" || typeof domain !== "string" || !isCloudTopicId(domain) || ![10, 20, 40].includes(session.requestedLength)) {
      throw new Error("Certification Focus Practice resume requires its immutable Cloud domain and supported length.");
    }
    return exact(buildPracticeSessionConfig({ mode: session.modeId, sessionLength: session.requestedLength as PracticeSessionLength, source: "home", topicId: domain, trackId: session.trackId }));
  }

  if (session.modeId === "certification-scenario-practice") {
    const competencyId = session.configurationSnapshot.competencyId;
    if (session.configurationSnapshot.kind !== "certificationScenarioPractice" || typeof competencyId !== "string" || !competencyId.trim() || ![10, 20, 40].includes(session.requestedLength)) {
      throw new Error("Certification Scenario Practice resume requires its immutable competency and supported length.");
    }
    return exact(buildPracticeSessionConfig({ competencyId, mode: session.modeId, sessionLength: session.requestedLength as PracticeSessionLength, source: "home", topicId: "", trackId: session.trackId }));
  }

  if (session.modeId === "certification-weak-area-review") {
    if (session.configurationSnapshot.kind !== "certificationWeakAreaReview" || ![10, 20].includes(session.requestedLength)) {
      throw new Error("Certification Weak Area Review resume requires its immutable supported length.");
    }
    return exact(buildPracticeSessionConfig({ mode: session.modeId, sessionLength: session.requestedLength as PracticeSessionLength, source: "home", topicId: "", trackId: session.trackId }));
  }

  if (session.modeId === "certification-mixed-practice") {
    if (session.configurationSnapshot.kind !== "certificationMixedPractice" || ![10, 20, 40].includes(session.requestedLength)) {
      throw new Error("Certification Mixed Practice resume requires its immutable supported length.");
    }
    return exact(buildPracticeSessionConfig({ mode: session.modeId, sessionLength: session.requestedLength as PracticeSessionLength, source: "home", topicId: "", trackId: session.trackId }));
  }

  if (session.configurationSnapshot.kind !== "certificationQuickReview" || session.configurationSnapshot.maximumLength !== 10 || session.requestedLength !== 10) {
    throw new Error("Certification Quick Review resume requires its immutable ten-item configuration.");
  }
  return exact(buildPracticeSessionConfig({ mode: session.modeId, source: "home", topicId: "", trackId: session.trackId }));
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

export function getCloudDomainForTopicId(topicId: string): CertificationDomain {
  if (!isCloudTopicId(topicId)) throw new Error(`Unknown Cloud Certification topic: ${topicId}`);
  return topicId;
}
