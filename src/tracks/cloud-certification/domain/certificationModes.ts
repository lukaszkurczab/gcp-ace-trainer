export type CertificationModeDefinition = Readonly<{
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  defaultQuestionCount?: number;
}>;

export const CERTIFICATION_MODES: readonly CertificationModeDefinition[] = [
  { id: "cloud-practice", title: "Practice", enabled: true, order: 1, defaultQuestionCount: 10 },
  { id: "cloud-exam-simulation", title: "Exam simulation", enabled: true, order: 2, defaultQuestionCount: 50 },
  { id: "cloud-review", title: "Review", enabled: true, order: 3 },
];

export function getCertificationMode(modeId: string): CertificationModeDefinition {
  const mode = CERTIFICATION_MODES.find((candidate) => candidate.id === modeId);
  if (!mode) throw new Error(`Unknown Certification mode id: ${modeId}`);
  return mode;
}
