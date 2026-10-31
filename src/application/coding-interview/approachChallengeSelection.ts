import { createArtifactSha256 } from "../../domain/learning/contentItemRef";
import type { PackageCompletionState } from "../../domain/learning/packageCompletionRule";
import {
  APPROACH_CHALLENGE_TRACK_ID,
  validateApproachChallengeProblem,
  validateApproachChallengeProblemRef,
  type ApproachChallengeProblem,
  type ApproachChallengeProblemRef,
} from "../../content/canonical/approachChallengeProblem";
import { APPROACH_CHALLENGE_MODE_ID } from "../../tracks/coding-interview/domain/algorithmModes";
import { algorithmTaxonomyStructure } from "../../tracks/coding-interview/generated/algorithmTaxonomyStructure.generated";

export type ApproachChallengeDifficulty = "easy" | "medium" | "hard";
export type ApproachChallengeRequestedCount = 5 | 10 | 20;
export type ApproachChallengeAccess = "free" | "premium" | "unknown";

export type ApproachChallengeBlueprint = Readonly<{
  blueprintId: "coding-interview-approach-challenge-v1";
  blueprintVersion: "1";
  modeId: typeof APPROACH_CHALLENGE_MODE_ID;
  trackId: typeof APPROACH_CHALLENGE_TRACK_ID;
  requestedProblemCounts: readonly ApproachChallengeRequestedCount[];
  defaultRequestedProblemCount: ApproachChallengeRequestedCount;
  occurrencesPerProblem: 2;
  supportedDifficulties: readonly ApproachChallengeDifficulty[];
  defaultDifficulties: readonly ["easy", "medium"];
  timerKind: "none";
  selectionModes: readonly ["auto", "manual"];
  defaultSelectionMode: "auto";
  autoRule: "all_required_families_mapped_and_completed";
  manualRule: "all_required_families_selected";
  deduplicateBy: "problemId";
  freeNodeId: "complexity_and_constraints";
  freeProblemCount: 6;
  premiumProblemCount: 30;
  emptyPool: "unavailable";
  shortening: "explicit_confirmation";
  resumeAccessPolicy: "session_scoped_start_grant_exact_pins";
}>;

/** Runtime owner of the whole-task mode; kept separate from legacy single-question modes. */
export const APPROACH_CHALLENGE_BLUEPRINT: ApproachChallengeBlueprint = Object.freeze({
  blueprintId: "coding-interview-approach-challenge-v1",
  blueprintVersion: "1",
  modeId: APPROACH_CHALLENGE_MODE_ID,
  trackId: APPROACH_CHALLENGE_TRACK_ID,
  requestedProblemCounts: Object.freeze([5, 10, 20] as const),
  defaultRequestedProblemCount: 5,
  occurrencesPerProblem: 2,
  supportedDifficulties: Object.freeze(["easy", "medium", "hard"] as const),
  defaultDifficulties: Object.freeze(["easy", "medium"] as const),
  timerKind: "none",
  selectionModes: Object.freeze(["auto", "manual"] as const),
  defaultSelectionMode: "auto",
  autoRule: "all_required_families_mapped_and_completed",
  manualRule: "all_required_families_selected",
  deduplicateBy: "problemId",
  freeNodeId: "complexity_and_constraints",
  freeProblemCount: 6,
  premiumProblemCount: 30,
  emptyPool: "unavailable",
  shortening: "explicit_confirmation",
  resumeAccessPolicy: "session_scoped_start_grant_exact_pins",
});

/** Dedicated registry keeps the whole-task mode out of legacy single-question mode routing. */
export const APPROACH_CHALLENGE_MODE_REGISTRY = Object.freeze({
  [APPROACH_CHALLENGE_MODE_ID]: APPROACH_CHALLENGE_BLUEPRINT,
});

export function getApproachChallengeBlueprint(modeId: string): ApproachChallengeBlueprint | undefined {
  return modeId === APPROACH_CHALLENGE_MODE_ID ? APPROACH_CHALLENGE_MODE_REGISTRY[APPROACH_CHALLENGE_MODE_ID] : undefined;
}

export type ApproachChallengeSource = Readonly<{
  problem: ApproachChallengeProblem;
}>;

export type ApproachChallengeSelectionSettings = Readonly<{
  mode: "auto" | "manual";
  requestedProblemCount: ApproachChallengeRequestedCount;
  difficulties: readonly ApproachChallengeDifficulty[];
  selectedFamilyIds?: readonly string[];
}>;
type NormalizedApproachChallengeSettings = Readonly<{
  mode: "auto" | "manual";
  requestedProblemCount: ApproachChallengeRequestedCount;
  difficulties: readonly ApproachChallengeDifficulty[];
  selectedFamilyIds: readonly string[];
}>;
type SelectorDiagnostics = Readonly<{
  invalidCandidateCount: number;
  missingFamilyMappings: readonly string[];
  missingManualFamilies: readonly string[];
}>;

export type ApproachChallengeSelectedProblem = Readonly<{
  problemId: string;
  primaryFamilyId: string;
  requiredFamilyIds: readonly string[];
  difficulty: ApproachChallengeDifficulty;
  problemRef: ApproachChallengeProblemRef;
}>;

export type ApproachChallengeSelection = Readonly<{
  status: "ready" | "confirmation_required" | "unavailable";
  reason?: "empty_pool" | "completion_unknown" | "unknown_access" | "invalid_settings" | "ambiguous_problem_id";
  access: ApproachChallengeAccess;
  requestedProblemCount: ApproachChallengeRequestedCount;
  actualProblemCount: number;
  occurrenceCount: number;
  problems: readonly ApproachChallengeSelectedProblem[];
  shortenedConfirmed: boolean;
  diagnostics: Readonly<{
    invalidCandidateCount: number;
    missingFamilyMappings: readonly string[];
    missingManualFamilies: readonly string[];
  }>;
}>;

export type ApproachChallengeSelectorInput = Readonly<{
  sources: readonly ApproachChallengeSource[];
  contentVersion: string;
  artifactSha256: string;
  completion: PackageCompletionState;
  access: ApproachChallengeAccess;
  settings?: Partial<ApproachChallengeSelectionSettings>;
}>;

type FamilyMapping = Readonly<{ familyId: string; nodeId: string }>;

/** Only one-to-one direct taxonomy ownership can map a required family to completion. */
export const APPROACH_CHALLENGE_FAMILY_COMPLETION_MAPPINGS: readonly FamilyMapping[] = Object.freeze(
  (() => {
    const byFamily = new Map<string, string[]>();
    for (const node of algorithmTaxonomyStructure.roadmapNodes) {
      if (node.contentOwnership !== "direct" || typeof node.primaryPatternFamilyId !== "string") continue;
      const nodes = byFamily.get(node.primaryPatternFamilyId) ?? [];
      nodes.push(node.id);
      byFamily.set(node.primaryPatternFamilyId, nodes);
    }
    return [...byFamily]
      .filter(([, nodes]) => nodes.length === 1)
      .map(([familyId, [nodeId]]) => Object.freeze({ familyId, nodeId: nodeId! }));
  })(),
);

const familyCompletionNode = new Map(APPROACH_CHALLENGE_FAMILY_COMPLETION_MAPPINGS.map(({ familyId, nodeId }) => [familyId, nodeId]));
const taxonomyFamilyIds: ReadonlySet<string> = new Set(algorithmTaxonomyStructure.patternFamilies.map(({ id }) => id));

export function selectApproachChallengeProblems(input: ApproachChallengeSelectorInput): ApproachChallengeSelection {
  const settings = normalizeSettings(input.settings);
  if (!settings) return unavailable("invalid_settings", input.access, input.settings?.requestedProblemCount ?? 5);
  if (input.access === "unknown") return unavailable("unknown_access", input.access, settings.requestedProblemCount);
  if (input.completion.kind === "unknown" && settings.mode === "auto") return unavailable("completion_unknown", input.access, settings.requestedProblemCount);
  if (settings.mode === "manual" && settings.selectedFamilyIds.some((familyId) => !taxonomyFamilyIds.has(familyId))) {
    return unavailable("invalid_settings", input.access, settings.requestedProblemCount);
  }

  const contentPin = Object.freeze({ contentVersion: input.contentVersion, artifactSha256: input.artifactSha256 });
  try {
    createArtifactSha256(contentPin.artifactSha256);
  } catch {
    return unavailable("invalid_settings", input.access, settings.requestedProblemCount);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(contentPin.contentVersion)) {
    return unavailable("invalid_settings", input.access, settings.requestedProblemCount);
  }

  const seenProblemIds = new Set<string>();
  const validSources: ApproachChallengeSource[] = [];
  let invalidCandidateCount = 0;
  for (const source of input.sources) {
    if (!source || validateApproachChallengeProblem(source.problem).length > 0) {
      invalidCandidateCount += 1;
      continue;
    }
    if (seenProblemIds.has(source.problem.problemId)) {
      return unavailable("ambiguous_problem_id", input.access, settings.requestedProblemCount, {
        invalidCandidateCount,
        missingFamilyMappings: [],
        missingManualFamilies: [],
      });
    }
    seenProblemIds.add(source.problem.problemId);
    const problemRef: ApproachChallengeProblemRef = Object.freeze({
      trackId: source.problem.trackId,
      problemId: source.problem.problemId,
      problemVersion: source.problem.problemVersion,
      contentVersion: contentPin.contentVersion,
      artifactSha256: contentPin.artifactSha256,
      approachQuestionId: source.problem.approachQuestion.questionId,
      complexityQuestionId: source.problem.complexityQuestion.questionId,
      analyzedApproachId: source.problem.analyzedApproachId,
    });
    if (validateApproachChallengeProblemRef(problemRef, source.problem, contentPin).length > 0) {
      invalidCandidateCount += 1;
      continue;
    }
    validSources.push(source);
  }

  const completedNodeIds = input.completion.kind === "unknown"
    ? new Set<string>()
    : new Set(input.completion.chapters.filter(({ status }) => status === "completed").map(({ nodeId }) => nodeId));
  const knownCompletionNodeIds = input.completion.kind === "unknown"
    ? new Set<string>()
    : new Set(input.completion.chapters.map(({ nodeId }) => nodeId));
  const missingFamilyMappings = new Set<string>();
  const selectedFamilyIds = new Set<string>(settings.selectedFamilyIds);
  const difficulties = new Set(settings.difficulties);
  const eligible = validSources.filter(({ problem }) => {
    if (!problem.requiredFamilyIds.every((familyId) => taxonomyFamilyIds.has(familyId))) {
      for (const familyId of problem.requiredFamilyIds) if (!taxonomyFamilyIds.has(familyId)) missingFamilyMappings.add(familyId);
      return false;
    }
    if (!difficulties.has(problem.difficulty)) return false;
    if (input.access === "free" && !isFreeApproachChallengeProblem(problem)) return false;
    if (settings.mode === "manual") return problem.requiredFamilyIds.every((familyId) => selectedFamilyIds.has(familyId));

    const mappedNodes = problem.requiredFamilyIds.map((familyId) => familyCompletionNode.get(familyId));
    if (mappedNodes.some((nodeId) => nodeId === undefined || !knownCompletionNodeIds.has(nodeId))) {
      for (const [index, nodeId] of mappedNodes.entries()) {
        if (nodeId === undefined || !knownCompletionNodeIds.has(nodeId)) missingFamilyMappings.add(problem.requiredFamilyIds[index]!);
      }
      return false;
    }
    return mappedNodes.every((nodeId) => completedNodeIds.has(nodeId!));
  });

  const missingManualFamilies = settings.mode === "manual"
    ? settings.selectedFamilyIds.filter((familyId) => !eligible.some(({ problem }) => problem.requiredFamilyIds.includes(familyId)))
    : [];

  const problems = eligible.slice(0, settings.requestedProblemCount).map(({ problem }) => toSelectedProblem(problem, contentPin));
  const diagnostics = Object.freeze({
    invalidCandidateCount,
    missingFamilyMappings: Object.freeze([...missingFamilyMappings].sort()),
    missingManualFamilies: Object.freeze(missingManualFamilies),
  });
  if (problems.length === 0) return unavailable("empty_pool", input.access, settings.requestedProblemCount, diagnostics);
  const actualProblemCount = problems.length;
  return Object.freeze({
    status: actualProblemCount < settings.requestedProblemCount ? "confirmation_required" : "ready",
    access: input.access,
    requestedProblemCount: settings.requestedProblemCount,
    actualProblemCount,
    occurrenceCount: actualProblemCount * APPROACH_CHALLENGE_BLUEPRINT.occurrencesPerProblem,
    problems: Object.freeze(problems),
    shortenedConfirmed: false,
    diagnostics,
  });
}

/** A shortened proposal cannot become startable until the caller records explicit confirmation. */
export function confirmApproachChallengeShortening(
  selection: ApproachChallengeSelection,
  confirmed: boolean,
): ApproachChallengeSelection {
  if (selection.status !== "confirmation_required" || !confirmed) return selection;
  return Object.freeze({ ...selection, status: "ready", shortenedConfirmed: true });
}

function toSelectedProblem(problem: ApproachChallengeProblem, pin: Readonly<{ contentVersion: string; artifactSha256: string }>): ApproachChallengeSelectedProblem {
  return Object.freeze({
    problemId: problem.problemId,
    primaryFamilyId: problem.primaryFamilyId,
    requiredFamilyIds: Object.freeze([...problem.requiredFamilyIds]),
    difficulty: problem.difficulty,
    problemRef: Object.freeze({
      trackId: problem.trackId,
      problemId: problem.problemId,
      problemVersion: problem.problemVersion,
      contentVersion: pin.contentVersion,
      artifactSha256: pin.artifactSha256,
      approachQuestionId: problem.approachQuestion.questionId,
      complexityQuestionId: problem.complexityQuestion.questionId,
      analyzedApproachId: problem.analyzedApproachId,
    }),
  });
}

export function isFreeApproachChallengeProblem(problem: ApproachChallengeProblem): boolean {
  return problem.primaryFamilyId === APPROACH_CHALLENGE_BLUEPRINT.freeNodeId &&
    problem.approachQuestion.nodeId === APPROACH_CHALLENGE_BLUEPRINT.freeNodeId &&
    problem.complexityQuestion.nodeId === APPROACH_CHALLENGE_BLUEPRINT.freeNodeId &&
    problem.requiredFamilyIds.every((familyId) => familyId === APPROACH_CHALLENGE_BLUEPRINT.freeNodeId);
}

function normalizeSettings(settings: Partial<ApproachChallengeSelectionSettings> | undefined): NormalizedApproachChallengeSettings | undefined {
  const requestedProblemCount = settings?.requestedProblemCount ?? APPROACH_CHALLENGE_BLUEPRINT.defaultRequestedProblemCount;
  const mode = settings?.mode ?? APPROACH_CHALLENGE_BLUEPRINT.defaultSelectionMode;
  const difficulties = settings?.difficulties ?? APPROACH_CHALLENGE_BLUEPRINT.defaultDifficulties;
  const selectedFamilyIds = settings?.selectedFamilyIds ?? [];
  if (!APPROACH_CHALLENGE_BLUEPRINT.requestedProblemCounts.includes(requestedProblemCount) ||
    (mode !== "auto" && mode !== "manual") ||
    !Array.isArray(difficulties) || difficulties.length === 0 ||
    difficulties.some((difficulty) => !APPROACH_CHALLENGE_BLUEPRINT.supportedDifficulties.includes(difficulty)) ||
    new Set(difficulties).size !== difficulties.length ||
    !Array.isArray(selectedFamilyIds) || new Set(selectedFamilyIds).size !== selectedFamilyIds.length ||
    selectedFamilyIds.some((familyId) => typeof familyId !== "string" || !familyId.trim())) return undefined;
  return Object.freeze({ mode, requestedProblemCount, difficulties: Object.freeze([...difficulties]), selectedFamilyIds: Object.freeze([...selectedFamilyIds]) });
}

function unavailable(
  reason: NonNullable<ApproachChallengeSelection["reason"]>,
  access: ApproachChallengeAccess,
  requestedProblemCount: number,
  diagnostics: SelectorDiagnostics = Object.freeze({ invalidCandidateCount: 0, missingFamilyMappings: Object.freeze([] as string[]), missingManualFamilies: Object.freeze([] as string[]) }),
): ApproachChallengeSelection {
  return Object.freeze({
    status: "unavailable",
    reason,
    access,
    requestedProblemCount: APPROACH_CHALLENGE_BLUEPRINT.requestedProblemCounts.includes(requestedProblemCount as ApproachChallengeRequestedCount) ? requestedProblemCount as ApproachChallengeRequestedCount : 5,
    actualProblemCount: 0,
    occurrenceCount: 0,
    problems: Object.freeze([]),
    shortenedConfirmed: false,
    diagnostics,
  });
}
