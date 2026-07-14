import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

type ResultKind = "correct" | "partial" | "incorrect";

const fixtures = JSON.parse(
  readFileSync("recovery/target-contract-fixtures.json", "utf8"),
) as {
  canonicalResultClassification: Array<{ selected: string[]; correct: string[]; expected: ResultKind }>;
  adjacentOrdering: Array<{
    canonical: string[];
    submitted: string[];
    expected: { score: number; maxPoints: number; result: ResultKind };
  }>;
  complexityDimensions: Array<{
    dimensions: Array<{ id: string; accepted: string[] }>;
    response: Record<string, string>;
    expected: { score: number; maxPoints: number; result: ResultKind };
  }>;
  reviewSuccessRules: Array<{
    dueAt: string;
    initialConsecutiveSuccesses: number;
    attempt: { at: string; result: ResultKind; sameSessionCorrection: boolean };
    expected: { consecutiveSuccesses: number; resolved: boolean };
  }>;
  reinsertEligibility: Array<{
    events: Array<{ kind: "submitted" | "preparation_failed" | "unsubmitted" | "displayed_only" }>;
    alreadyReinserted: boolean;
    skipped: boolean;
    persistentReviewBefore: string;
    expected: { submittedInterveningItems: number; action: "reinsert" | "skip"; persistentReviewAfter: string };
  }>;
  journalIdempotency: Array<{
    journalId: string;
    deterministicOutcome: string;
    actions: string[];
    expected: { materializedOutcomes: string[]; journalPresent: boolean };
  }>;
};

function classifySelection(selected: readonly string[], correct: readonly string[]): ResultKind {
  const selectedSet = new Set(selected);
  const correctSet = new Set(correct);
  if (selectedSet.size === correctSet.size && [...selectedSet].every((id) => correctSet.has(id))) return "correct";
  if (selectedSet.size > 0 && [...selectedSet].every((id) => correctSet.has(id))) return "partial";
  return "incorrect";
}

function classifyScore(score: number, maxPoints: number): ResultKind {
  return score === maxPoints ? "correct" : score > 0 ? "partial" : "incorrect";
}

test("target contract fixtures preserve canonical result classification", () => {
  for (const fixture of fixtures.canonicalResultClassification) {
    assert.equal(classifySelection(fixture.selected, fixture.correct), fixture.expected);
  }
});

test("target contract fixtures score ordering by canonical adjacent relations", () => {
  for (const fixture of fixtures.adjacentOrdering) {
    assert.ok(fixture.canonical.length >= 2);
    const canonicalPairs = new Set(fixture.canonical.slice(0, -1).map((item, index) => `${item}:${fixture.canonical[index + 1]}`));
    const score = fixture.submitted
      .slice(0, -1)
      .filter((item, index) => canonicalPairs.has(`${item}:${fixture.submitted[index + 1]!}`)).length;
    assert.deepEqual(
      { score, maxPoints: fixture.canonical.length - 1, result: classifyScore(score, fixture.canonical.length - 1) },
      fixture.expected,
    );
  }
});

test("target contract fixtures use only item-declared complexity dimensions", () => {
  for (const fixture of fixtures.complexityDimensions) {
    const score = fixture.dimensions.filter((dimension) => {
      const response = fixture.response[dimension.id];
      if (response === undefined) throw new Error(`Missing response for ${dimension.id}.`);
      return dimension.accepted.includes(response);
    }).length;
    assert.deepEqual(
      { score, maxPoints: fixture.dimensions.length, result: classifyScore(score, fixture.dimensions.length) },
      fixture.expected,
    );
  }
});

test("target contract fixtures require two eligible review successes", () => {
  for (const fixture of fixtures.reviewSuccessRules) {
    const afterDue = new Date(fixture.attempt.at) >= new Date(fixture.dueAt);
    const eligibleSuccess = afterDue && !fixture.attempt.sameSessionCorrection && fixture.attempt.result === "correct";
    const consecutiveSuccesses = eligibleSuccess
      ? fixture.initialConsecutiveSuccesses + 1
      : afterDue && fixture.attempt.result !== "correct"
        ? 0
        : fixture.initialConsecutiveSuccesses;
    assert.deepEqual(
      { consecutiveSuccesses, resolved: eligibleSuccess && consecutiveSuccesses >= 2 },
      fixture.expected,
    );
  }
});

test("target contract fixtures gate one reinsert after two submitted intervening items", () => {
  for (const fixture of fixtures.reinsertEligibility) {
    const submittedInterveningItems = fixture.events.filter((event) => event.kind === "submitted").length;
    const action = submittedInterveningItems >= 2 && !fixture.alreadyReinserted && !fixture.skipped
      ? "reinsert"
      : "skip";
    assert.deepEqual(
      {
        submittedInterveningItems,
        action,
        persistentReviewAfter: fixture.persistentReviewBefore,
      },
      fixture.expected,
    );
  }
});

test("target contract fixtures model idempotent journal materialization", () => {
  for (const fixture of fixtures.journalIdempotency) {
    let journalPresent = false;
    const materialized = new Set<string>();
    for (const action of fixture.actions) {
      if (action === "persist") journalPresent = true;
      if (action === "materialize" && journalPresent) materialized.add(fixture.deterministicOutcome);
      if (action === "clear") journalPresent = false;
    }
    assert.deepEqual(
      { materializedOutcomes: [...materialized], journalPresent },
      fixture.expected,
    );
  }
});
