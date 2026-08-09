export type CertificationModeDefinition = Readonly<{
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  defaultQuestionCount?: number;
}>;

export const CERTIFICATION_PRACTICE_MODE_IDS = [
  "certification-diagnostic-baseline",
  "certification-focus-practice",
  "certification-scenario-practice",
  "certification-weak-area-review",
  "certification-mixed-practice",
  "certification-quick-review",
] as const;

export type CertificationPracticeModeId = (typeof CERTIFICATION_PRACTICE_MODE_IDS)[number];

export const CERTIFICATION_MODE_IDS = [
  ...CERTIFICATION_PRACTICE_MODE_IDS,
  "certification-exam-simulation",
] as const;

export type CertificationModeId = (typeof CERTIFICATION_MODE_IDS)[number];

export const CERTIFICATION_MODES: readonly CertificationModeDefinition[] = [
  { id: "certification-diagnostic-baseline", title: "Diagnostic Baseline", enabled: true, order: 0, defaultQuestionCount: 40 },
  { id: "certification-focus-practice", title: "Focus Practice", enabled: true, order: 1, defaultQuestionCount: 10 },
  { id: "certification-scenario-practice", title: "Scenario Practice", enabled: true, order: 2, defaultQuestionCount: 10 },
  { id: "certification-weak-area-review", title: "Weak Area Review", enabled: true, order: 3, defaultQuestionCount: 10 },
  { id: "certification-mixed-practice", title: "Mixed Practice", enabled: true, order: 4, defaultQuestionCount: 10 },
  { id: "certification-quick-review", title: "Quick Review", enabled: true, order: 5, defaultQuestionCount: 10 },
  { id: "certification-exam-simulation", title: "Exam Simulation", enabled: true, order: 6, defaultQuestionCount: 50 },
];

export function getCertificationMode(modeId: string): CertificationModeDefinition {
  const mode = CERTIFICATION_MODES.find((candidate) => candidate.id === modeId);
  if (!mode) throw new Error(`Unknown Certification mode id: ${modeId}`);
  return mode;
}

export function isCertificationPracticeModeId(modeId: string): modeId is CertificationPracticeModeId {
  return CERTIFICATION_PRACTICE_MODE_IDS.some((candidate) => candidate === modeId);
}
