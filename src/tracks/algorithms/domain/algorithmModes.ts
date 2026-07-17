
export const ALGORITHM_MODE_IDS = {
  learnApproach: "algorithms-learn-approach",
  guidedPractice: "algorithms-guided-practice",
  recognizePatterns: "algorithms-recognize-patterns",
  contrastPractice: "algorithms-contrast-practice",
  weakAreaReview: "algorithms-weak-area-review",
  independentPractice: "algorithms-independent-practice",
  interviewSimulation: "algorithms-interview-simulation",
} as const;

export type AlgorithmModeId = typeof ALGORITHM_MODE_IDS[keyof typeof ALGORITHM_MODE_IDS];
export type AlgorithmFeedbackMode = "afterEachAnswer" | "atSessionEnd";
export type AlgorithmTimerProfile =
  | Readonly<{ kind: "elapsedForeground" }>
  | Readonly<{ durationMs: 2_700_000; kind: "countdownForeground" }>;

export type AlgorithmModeProfile = Readonly<{
  answerChanges: "beforeSubmit" | "untilFinalSubmission";
  feedbackMode: AlgorithmFeedbackMode;
  navigation: "sequential" | "free";
  reinsertEnabled: boolean;
  sessionLength: 10 | 20 | 40;
  supportedLengths: readonly (10 | 20 | 40)[];
  shortening: "allowed" | "blueprintControlled" | "prohibited";
  submission: "perItem" | "manualOrForegroundTimeout";
  timer: AlgorithmTimerProfile;
}>;

export type AlgorithmModeDefinition = Readonly<{
  id: AlgorithmModeId;
  order: number;
  profile: AlgorithmModeProfile;
  title: string;
}>;

const elapsedForeground = Object.freeze({ kind: "elapsedForeground" } as const);
const interviewCountdown = Object.freeze({
  durationMs: 2_700_000,
  kind: "countdownForeground",
} as const);

function practiceProfile(
  sessionLength: 10 | 20,
  reinsertEnabled: boolean,
  supportedLengths: readonly (10 | 20 | 40)[],
  shortening: "allowed" | "blueprintControlled" = "allowed",
): AlgorithmModeProfile {
  return Object.freeze({
    answerChanges: "beforeSubmit",
    feedbackMode: "afterEachAnswer",
    navigation: "sequential",
    reinsertEnabled,
    sessionLength,
    supportedLengths: Object.freeze([...supportedLengths]),
    shortening,
    submission: "perItem",
    timer: elapsedForeground,
  });
}

export const ALGORITHM_MODES = Object.freeze([
  Object.freeze({ id: ALGORITHM_MODE_IDS.learnApproach, title: "Learn Approach", order: 1, profile: practiceProfile(10, false, [10]) }),
  Object.freeze({ id: ALGORITHM_MODE_IDS.guidedPractice, title: "Guided Practice", order: 2, profile: practiceProfile(20, true, [10, 20, 40]) }),
  Object.freeze({ id: ALGORITHM_MODE_IDS.recognizePatterns, title: "Recognize Patterns", order: 3, profile: practiceProfile(20, false, [10, 20, 40]) }),
  Object.freeze({ id: ALGORITHM_MODE_IDS.contrastPractice, title: "Contrast Practice", order: 4, profile: practiceProfile(20, false, [10, 20, 40]) }),
  Object.freeze({ id: ALGORITHM_MODE_IDS.weakAreaReview, title: "Weak Area Review", order: 5, profile: practiceProfile(10, true, [10, 20]) }),
  Object.freeze({ id: ALGORITHM_MODE_IDS.independentPractice, title: "Independent Practice", order: 6, profile: practiceProfile(20, false, [10, 20, 40], "blueprintControlled") }),
  Object.freeze({
    id: ALGORITHM_MODE_IDS.interviewSimulation,
    title: "Interview Simulation",
    order: 7,
    profile: Object.freeze({
      answerChanges: "untilFinalSubmission",
      feedbackMode: "atSessionEnd",
      navigation: "free",
      reinsertEnabled: false,
      sessionLength: 40,
      supportedLengths: Object.freeze([40] as const),
      shortening: "prohibited",
      submission: "manualOrForegroundTimeout",
      timer: interviewCountdown,
    }),
  }),
] as const satisfies readonly AlgorithmModeDefinition[]);

export function isAlgorithmModeId(modeId: string): modeId is AlgorithmModeId {
  return ALGORITHM_MODES.some((mode) => mode.id === modeId);
}

export function getAlgorithmMode(modeId: string): AlgorithmModeDefinition {
  const mode = ALGORITHM_MODES.find((candidate) => candidate.id === modeId);
  if (!mode) throw new Error(`Unknown Algorithms mode id: ${modeId}`);
  return mode;
}
