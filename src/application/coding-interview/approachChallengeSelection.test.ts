import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { PackageCompletionState } from "../../domain/learning/packageCompletionRule";
import type { ApproachChallengeProblem } from "../../content/canonical/approachChallengeProblem";
import { requiresPremiumProductMode } from "../trainingLifecycle/premiumProductModePolicy";
import {
  APPROACH_CHALLENGE_BLUEPRINT,
  APPROACH_CHALLENGE_FAMILY_COMPLETION_MAPPINGS,
  getApproachChallengeBlueprint,
  confirmApproachChallengeShortening,
  selectApproachChallengeProblems,
  type ApproachChallengeSource,
} from "./approachChallengeSelection";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const contentFixtures = path.resolve(appDirectory, "../../../../patternly-content/tests/fixtures/approach-challenge");
const contentConfigPath = path.resolve(appDirectory, "../../../../patternly-content/config/tracks/coding-interview-dsa-problem-solving.json");
const pin = { contentVersion: "acm-selector-test-v1", artifactSha256: "a".repeat(64) };

function fixture(name: "W01" | "W02" | "W03" | "W04"): ApproachChallengeProblem {
  return JSON.parse(readFileSync(path.join(contentFixtures, `${name}.json`), "utf8")) as ApproachChallengeProblem;
}

const base = [fixture("W01"), fixture("W02"), fixture("W03"), fixture("W04")];
const sources = (problems: readonly ApproachChallengeProblem[] = base): readonly ApproachChallengeSource[] => problems.map((problem) => ({ problem }));

function completion(completedNodeIds: readonly string[] = [], kind: "in_progress" | "completed" = "in_progress"): PackageCompletionState {
  return {
    kind,
    chapters: completedNodeIds.map((nodeId) => ({ nodeId, status: "completed" })),
  } as unknown as PackageCompletionState;
}

function syntheticFreePool(count: number): readonly ApproachChallengeProblem[] {
  const template = fixture("W01");
  return Array.from({ length: count }, (_, index) => {
    const suffix = String(index + 1).padStart(2, "0");
    return {
      ...template,
      problemId: `ACM-SELECTOR-FREE-${suffix}`,
      primaryFamilyId: "complexity_and_constraints",
      requiredFamilyIds: ["complexity_and_constraints"],
      approachQuestion: {
        ...template.approachQuestion,
        questionId: `ACM-SELECTOR-FREE-${suffix}-Q1`,
        nodeId: "complexity_and_constraints",
      },
      complexityQuestion: {
        ...template.complexityQuestion,
        questionId: `ACM-SELECTOR-FREE-${suffix}-Q2`,
        nodeId: "complexity_and_constraints",
      },
    };
  });
}

function syntheticFamilyPool(count: number, familyId: string): readonly ApproachChallengeProblem[] {
  const template = fixture("W01");
  return Array.from({ length: count }, (_, index) => {
    const suffix = String(index + 1).padStart(2, "0");
    return {
      ...template,
      problemId: `ACM-SELECTOR-${familyId}-${suffix}`,
      primaryFamilyId: familyId,
      requiredFamilyIds: [familyId],
      approachQuestion: { ...template.approachQuestion, questionId: `ACM-SELECTOR-${familyId}-${suffix}-Q1` },
      complexityQuestion: { ...template.complexityQuestion, questionId: `ACM-SELECTOR-${familyId}-${suffix}-Q2` },
    };
  });
}

function select(problems: readonly ApproachChallengeProblem[], overrides: Readonly<Record<string, unknown>> = {}) {
  return selectApproachChallengeProblems({
    sources: sources(problems),
    ...pin,
    completion: completion(),
    access: "premium",
    ...overrides,
  } as Parameters<typeof selectApproachChallengeProblems>[0]);
}

test("APP selector blueprint is the registered CONTENT blueprint and keeps legacy modes separate", () => {
  const contentConfig = JSON.parse(readFileSync(contentConfigPath, "utf8"));
  assert.deepEqual(contentConfig.modeConfiguration.approachChallengeBlueprint, APPROACH_CHALLENGE_BLUEPRINT);
  assert.deepEqual(APPROACH_CHALLENGE_BLUEPRINT.requestedProblemCounts, [5, 10, 20]);
  assert.equal(APPROACH_CHALLENGE_BLUEPRINT.defaultRequestedProblemCount, 5);
  assert.equal(APPROACH_CHALLENGE_BLUEPRINT.occurrencesPerProblem, 2);
  assert.deepEqual(APPROACH_CHALLENGE_BLUEPRINT.defaultDifficulties, ["easy", "medium"]);
  assert.equal(APPROACH_CHALLENGE_BLUEPRINT.timerKind, "none");
  assert.equal(APPROACH_CHALLENGE_BLUEPRINT.defaultSelectionMode, "auto");
  assert.equal(getApproachChallengeBlueprint(APPROACH_CHALLENGE_BLUEPRINT.modeId), APPROACH_CHALLENGE_BLUEPRINT);
  assert.equal(getApproachChallengeBlueprint("coding-interview-guided-practice"), undefined);
  assert.equal(requiresPremiumProductMode(APPROACH_CHALLENGE_BLUEPRINT.modeId), false);
});

test("auto selection uses only explicitly mapped completed chapters and pins complete unique pairs", () => {
  const selected = select(base, { completion: completion(["arrays_and_strings"]) });
  assert.equal(selected.status, "confirmation_required");
  assert.equal(selected.requestedProblemCount, 5);
  assert.equal(selected.actualProblemCount, 1);
  assert.equal(selected.occurrenceCount, 2);
  assert.equal(selected.problems[0]?.problemId, "ACM-B02-01");
  assert.deepEqual(selected.problems[0]?.problemRef, {
    trackId: "coding-interview-dsa-problem-solving",
    problemId: "ACM-B02-01",
    problemVersion: "1",
    ...pin,
    approachQuestionId: "ACM-B02-01-Q1",
    complexityQuestionId: "ACM-B02-01-Q2",
    analyzedApproachId: "scan-neighbors",
  });
  assert.equal(new Set(selected.problems.map(({ problemId }) => problemId)).size, selected.problems.length);
  assert.equal(confirmApproachChallengeShortening(selected, false).status, "confirmation_required");
  const confirmed = confirmApproachChallengeShortening(selected, true);
  assert.equal(confirmed.status, "ready");
  assert.equal(confirmed.shortenedConfirmed, true);
});

test("requested lengths count full tasks and always produce exactly two occurrences per task", () => {
  const pool = syntheticFamilyPool(20, "arrays_and_strings");
  for (const requestedProblemCount of APPROACH_CHALLENGE_BLUEPRINT.requestedProblemCounts) {
    const selected = select(pool, {
      completion: completion(["arrays_and_strings"]),
      settings: { requestedProblemCount },
    });
    assert.equal(selected.status, "ready");
    assert.equal(selected.actualProblemCount, requestedProblemCount);
    assert.equal(selected.occurrenceCount, requestedProblemCount * 2);
    assert.equal(new Set(selected.problems.map(({ problemId }) => problemId)).size, requestedProblemCount);
  }
});

test("manual selection allows an uncompleted family but applies required-family AND and difficulty filters", () => {
  const manualBase = select(base, {
    settings: { mode: "manual", selectedFamilyIds: ["arrays_and_strings"] },
  });
  assert.equal(manualBase.status, "confirmation_required");
  assert.equal(manualBase.problems[0]?.problemId, "ACM-B02-01");

  const multiFamily = {
    ...fixture("W03"),
    requiredFamilyIds: ["graph_traversal", "arrays_and_strings"],
  };
  const automaticRequiresAllFamilies = select([multiFamily], {
    completion: completion(["graph_traversal"]),
  });
  assert.equal(automaticRequiresAllFamilies.reason, "empty_pool");
  const onlyOneRequiredFamily = select([multiFamily], {
    settings: { mode: "manual", selectedFamilyIds: ["graph_traversal"] },
  });
  assert.equal(onlyOneRequiredFamily.status, "unavailable");
  assert.equal(onlyOneRequiredFamily.reason, "empty_pool");
  const allRequiredFamilies = select([multiFamily], {
    settings: { mode: "manual", selectedFamilyIds: ["graph_traversal", "arrays_and_strings"] },
  });
  assert.equal(allRequiredFamilies.actualProblemCount, 1);

  const distractorFamiliesDoNotBlock = select([fixture("W03")], {
    settings: { mode: "manual", selectedFamilyIds: ["graph_traversal"] },
  });
  assert.equal(distractorFamiliesDoNotBlock.actualProblemCount, 1);

  const hard = { ...fixture("W01"), difficulty: "hard" as const };
  const easyOnly = select([hard], { settings: { difficulties: ["easy"] } });
  assert.equal(easyOnly.reason, "empty_pool");
});

test("auto defaults can switch to manual with no selected families, then start after a family is chosen", () => {
  const automatic = { mode: "auto" as const, selectedFamilyIds: [] as const };
  const manual = { ...automatic, mode: "manual" as const };
  const empty = select(syntheticFamilyPool(5, "arrays_and_strings"), { settings: manual });
  assert.equal(empty.status, "unavailable");
  assert.equal(empty.reason, "empty_pool");

  const selected = select(syntheticFamilyPool(5, "arrays_and_strings"), {
    settings: { ...manual, selectedFamilyIds: ["arrays_and_strings"] },
  });
  assert.equal(selected.status, "ready");
  assert.equal(selected.actualProblemCount, 5);
  assert.equal(selected.occurrenceCount, 10);
});

test("a known empty manual family is diagnostic and does not discard candidates from another selected family", () => {
  const arrays = syntheticFamilyPool(4, "arrays_and_strings");
  const mixed = select(arrays, {
    settings: {
      mode: "manual",
      selectedFamilyIds: ["arrays_and_strings", "linked_list"],
    },
  });
  assert.equal(mixed.status, "confirmation_required");
  assert.equal(mixed.actualProblemCount, 4);
  assert.equal(mixed.reason, undefined);
  assert.deepEqual(mixed.diagnostics.missingManualFamilies, ["linked_list"]);

  const onlyEmptyFamilies = select(arrays, {
    settings: {
      mode: "manual",
      selectedFamilyIds: ["linked_list", "tree_traversal"],
    },
  });
  assert.equal(onlyEmptyFamilies.status, "unavailable");
  assert.equal(onlyEmptyFamilies.reason, "empty_pool");
  assert.deepEqual(onlyEmptyFamilies.diagnostics.missingManualFamilies, ["linked_list", "tree_traversal"]);
});

test("manual family mapping is explicit; automatic selection refuses an unmapped specialized prerequisite", () => {
  assert.equal(APPROACH_CHALLENGE_FAMILY_COMPLETION_MAPPINGS.some(({ familyId }) => familyId === "monotonic_stack"), false);
  const specialized = { ...fixture("W03"), primaryFamilyId: "monotonic_stack", requiredFamilyIds: ["monotonic_stack"] };
  const automatic = select([specialized], { completion: completion(["stack"]) });
  assert.equal(automatic.status, "unavailable");
  assert.deepEqual(automatic.diagnostics.missingFamilyMappings, ["monotonic_stack"]);
  const manual = select([specialized], { settings: { mode: "manual", selectedFamilyIds: ["monotonic_stack"] } });
  assert.equal(manual.actualProblemCount, 1);
  const missingCompletionChapter = select([fixture("W01")], { completion: completion(["graph_traversal"]) });
  assert.equal(missingCompletionChapter.reason, "empty_pool");
  assert.deepEqual(missingCompletionChapter.diagnostics.missingFamilyMappings, ["arrays_and_strings"]);
});

test("empty/unknown completion, duplicate identities and malformed pairs fail closed", () => {
  assert.equal(select([], {}).reason, "empty_pool");
  assert.equal(select(base, { completion: { kind: "unknown" } }).reason, "completion_unknown");
  assert.equal(select([base[0]!, base[0]!]).reason, "ambiguous_problem_id");
  const orphaned = { ...fixture("W01"), complexityQuestion: undefined } as unknown as ApproachChallengeProblem;
  const invalid = select([orphaned]);
  assert.equal(invalid.reason, "empty_pool");
  assert.equal(invalid.diagnostics.invalidCandidateCount, 1);
  const unknownAccess = select(base, { access: "unknown" });
  assert.equal(unknownAccess.reason, "unknown_access");
  assert.equal(unknownAccess.access, "unknown");
});

test("Free admission is exact to the six Free family tasks; Premium retains the remaining pool", () => {
  const freeProblems = syntheticFreePool(APPROACH_CHALLENGE_BLUEPRINT.freeProblemCount);
  const free = select(freeProblems, {
    access: "free",
    settings: { mode: "manual", selectedFamilyIds: ["complexity_and_constraints"], requestedProblemCount: 10 },
  });
  assert.equal(free.status, "confirmation_required");
  assert.equal(free.actualProblemCount, 6);
  assert.equal(free.occurrenceCount, 12);
  assert.ok(free.problems.every(({ primaryFamilyId, requiredFamilyIds }) => primaryFamilyId === "complexity_and_constraints" && requiredFamilyIds.every((id) => id === "complexity_and_constraints")));

  const retaggedPaidStages = {
    ...freeProblems[0]!,
    approachQuestion: { ...freeProblems[0]!.approachQuestion, nodeId: "arrays_and_strings" },
    complexityQuestion: { ...freeProblems[0]!.complexityQuestion, nodeId: "arrays_and_strings" },
  };
  const retaggedFreeDenied = select([retaggedPaidStages], {
    access: "free",
    settings: { mode: "manual", selectedFamilyIds: ["complexity_and_constraints"] },
  });
  assert.equal(retaggedFreeDenied.status, "unavailable");
  assert.equal(retaggedFreeDenied.reason, "empty_pool");

  const premium = select(base, { access: "premium", settings: { mode: "manual", selectedFamilyIds: ["arrays_and_strings", "sliding_window", "graph_traversal", "dynamic_programming_intro"] } });
  assert.equal(premium.actualProblemCount, 4);
  const freeDenied = select([fixture("W01")], {
    access: "free",
    settings: { mode: "manual", selectedFamilyIds: ["arrays_and_strings"] },
  });
  assert.equal(freeDenied.reason, "empty_pool");
  assert.equal(APPROACH_CHALLENGE_BLUEPRINT.freeProblemCount + APPROACH_CHALLENGE_BLUEPRINT.premiumProblemCount, 36);
});
