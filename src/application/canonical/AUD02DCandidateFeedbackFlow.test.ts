import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { parseAllDocuments } from "yaml";
import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";
import { selectPracticeQuestions } from "./practiceQuestionSelector";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";

const ROOT = process.cwd();
const TRACK_ID = "coding-interview-dsa-problem-solving";
const MODE_ID = "coding-interview-custom-practice";
const EXPECTED_IDS = [
  "alg-complexity-amortized-001",
  "alg-complexity-output-001",
  "alg-complexity-preprocess-001",
  "alg-complexity-reject-001",
  "alg-complexity-review-001",
  "alg-complexity-scaling-001",
  "alg-complexity-space-001",
  "alg-complexity-time-001",
  "alg-complexity-time-002",
  "alg-complexity-output-002",
] as const;

function optionTaps(source: string): readonly (readonly [string, string])[] {
  const commands = parseAllDocuments(source)[1]?.toJSON();
  const found: [string, string][] = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    const tap = (value as Record<string, unknown>).tapOn;
    if (tap && typeof tap === "object" && "id" in tap) {
      const match = /^patternly:session:option:([^:]+):([^:]+)$/u.exec(String((tap as { id: unknown }).id));
      if (match) found.push([match[1]!, match[2]!]);
    }
    Object.values(value).forEach(visit);
  };
  visit(commands);
  return found;
}

test("AUD-02D feedback flows match canonical selected answers and conditional reinsert plan", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(TRACK_ID);
  const pool = track.getPool(MODE_ID);
  const selected = selectPracticeQuestions(pool, [], track, 10);
  assert.deepEqual(selected.map(({ questionId }) => questionId), EXPECTED_IDS);

  const prepared = await new CanonicalTrainingRuntime(track).prepare({
    trackId: TRACK_ID,
    modeId: MODE_ID,
    request: { sessionId: "aud02d-contract", requestedLength: 10, feedbackTiming: "after_each_durable_submit" },
    attempts: [],
    reviews: [],
    now: "2026-09-28T00:00:00.000Z",
  });
  assert.deepEqual(prepared.session.itemOrder.map(({ item }) => item.questionId), EXPECTED_IDS);
  const slot = prepared.session.conditionalReinsertSlots?.[0];
  assert.ok(slot, "custom practice should reserve a conditional reinsert for the first occurrence");
  assert.equal(slot.resolutionRule, "incorrect_or_partial_after_three_materialized_submissions");
  assert.equal(slot.exactSourceBranch?.occurrence.item.questionId, EXPECTED_IDS[0]);
  assert.equal(slot.ordinaryBranch.occurrence.item.questionId, EXPECTED_IDS[4]);

  const atEnd = await readFile(path.join(ROOT, ".maestro/aud02d-feedback-at-session-end.yaml"), "utf8");
  const afterEach = await readFile(path.join(ROOT, ".maestro/aud02d-feedback-after-each-answer.yaml"), "utf8");
  const answerTaps = selected.map((question) => {
    assert.equal(question.answer.type, "choice_single");
    return [question.questionId, question.answer.optionId] as const;
  });
  assert.deepEqual(optionTaps(atEnd), answerTaps.slice(1));
  assert.deepEqual(optionTaps(afterEach), [
    ...answerTaps.slice(1, 4),
    answerTaps[0]!,
    ...answerTaps.slice(5),
  ]);
});
