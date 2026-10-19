import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import path from "node:path";
import test from "node:test";
import { createCanonicalQuestionCatalog } from "../../content/canonical/questionCatalog";
import { isCanonicalResponseComplete, scoreCanonicalQuestion } from "../../content/canonical/questionScoring";
import { validateQuestion } from "../../content/canonical/questionValidation";
import type { Question, CanonicalContentLockRecord } from "../../content/canonical/questionTypes";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { prepareCanonicalOptionOrder, projectCanonicalQuestionInSessionOrder } from "./canonicalOptionOrder";
import { buildCanonicalInteractionViewModel, composeCanonicalFeedback } from "./canonicalInteractionPresentation";
import { toCanonicalQuestionViewModel } from "../../features/practice/canonicalQuestionViewModel";
import { detailLines } from "../../features/practice/feedbackDetails";

const trackId = "google-cloud-associate-cloud-engineer";
const contentRoot = process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? process.env.PATTERNLY_CONTENT_ROOT ?? path.resolve(process.cwd(), "../patternly-content");
const nodeId = "cloud_identity_workforce_federation_and_human_access";
const questions = [1, 2, 3, 4, 5, 6, 7].flatMap(unit => JSON.parse(readFileSync(path.join(contentRoot, "content", trackId, nodeId, `GCPACE-N02-B0${unit}.json`), "utf8")) as Question[]);
// Exact original audit ledger; b05-010 alone has a new semantic identity.
const expectedIds = [
  "gcp-ace-gcpace-n02-b01-001",
  "gcp-ace-gcpace-n02-b01-002",
  "gcp-ace-gcpace-n02-b01-003",
  "gcp-ace-gcpace-n02-b01-004",
  "gcp-ace-gcpace-n02-b01-005",
  "gcp-ace-gcpace-n02-b01-006",
  "gcp-ace-gcpace-n02-b01-007",
  "gcp-ace-gcpace-n02-b01-008",
  "gcp-ace-gcpace-n02-b01-009",
  "gcp-ace-gcpace-n02-b01-010",
  "gcp-ace-gcpace-n02-b01-011",
  "gcp-ace-gcpace-n02-b01-012",
  "gcp-ace-gcpace-n02-b01-013",
  "gcp-ace-gcpace-n02-b01-014",
  "gcp-ace-gcpace-n02-b01-015",
  "gcp-ace-gcpace-n02-b01-016",
  "gcp-ace-gcpace-n02-b01-017",
  "gcp-ace-gcpace-n02-b01-018",
  "gcp-ace-gcpace-n02-b02-001",
  "gcp-ace-gcpace-n02-b02-002",
  "gcp-ace-gcpace-n02-b02-003",
  "gcp-ace-gcpace-n02-b02-004",
  "gcp-ace-gcpace-n02-b02-005",
  "gcp-ace-gcpace-n02-b02-006",
  "gcp-ace-gcpace-n02-b02-007",
  "gcp-ace-gcpace-n02-b02-008",
  "gcp-ace-gcpace-n02-b02-009",
  "gcp-ace-gcpace-n02-b02-010",
  "gcp-ace-gcpace-n02-b02-011",
  "gcp-ace-gcpace-n02-b02-012",
  "gcp-ace-gcpace-n02-b02-013",
  "gcp-ace-gcpace-n02-b02-014",
  "gcp-ace-gcpace-n02-b02-015",
  "gcp-ace-gcpace-n02-b02-016",
  "gcp-ace-gcpace-n02-b02-017",
  "gcp-ace-gcpace-n02-b02-018",
  "gcp-ace-gcpace-n02-b03-001",
  "gcp-ace-gcpace-n02-b03-002",
  "gcp-ace-gcpace-n02-b03-003",
  "gcp-ace-gcpace-n02-b03-004",
  "gcp-ace-gcpace-n02-b03-005",
  "gcp-ace-gcpace-n02-b03-006",
  "gcp-ace-gcpace-n02-b03-007",
  "gcp-ace-gcpace-n02-b03-008",
  "gcp-ace-gcpace-n02-b03-009",
  "gcp-ace-gcpace-n02-b03-010",
  "gcp-ace-gcpace-n02-b03-011",
  "gcp-ace-gcpace-n02-b03-012",
  "gcp-ace-gcpace-n02-b03-013",
  "gcp-ace-gcpace-n02-b03-014",
  "gcp-ace-gcpace-n02-b03-015",
  "gcp-ace-gcpace-n02-b03-016",
  "gcp-ace-gcpace-n02-b03-017",
  "gcp-ace-gcpace-n02-b03-018",
  "gcp-ace-gcpace-n02-b04-001",
  "gcp-ace-gcpace-n02-b04-002",
  "gcp-ace-gcpace-n02-b04-003",
  "gcp-ace-gcpace-n02-b04-004",
  "gcp-ace-gcpace-n02-b04-005",
  "gcp-ace-gcpace-n02-b04-006",
  "gcp-ace-gcpace-n02-b04-007",
  "gcp-ace-gcpace-n02-b04-008",
  "gcp-ace-gcpace-n02-b04-009",
  "gcp-ace-gcpace-n02-b04-010",
  "gcp-ace-gcpace-n02-b04-011",
  "gcp-ace-gcpace-n02-b04-012",
  "gcp-ace-gcpace-n02-b04-013",
  "gcp-ace-gcpace-n02-b04-014",
  "gcp-ace-gcpace-n02-b04-015",
  "gcp-ace-gcpace-n02-b04-016",
  "gcp-ace-gcpace-n02-b04-017",
  "gcp-ace-gcpace-n02-b04-018",
  "gcp-ace-gcpace-n02-b04-019",
  "gcp-ace-gcpace-n02-b04-020",
  "gcp-ace-gcpace-n02-b05-001",
  "gcp-ace-gcpace-n02-b05-002",
  "gcp-ace-gcpace-n02-b05-003",
  "gcp-ace-gcpace-n02-b05-004",
  "gcp-ace-gcpace-n02-b05-005",
  "gcp-ace-gcpace-n02-b05-006",
  "gcp-ace-gcpace-n02-b05-007",
  "gcp-ace-gcpace-n02-b05-008",
  "gcp-ace-gcpace-n02-b05-009",
  "gcp-ace-gcpace-n02-b05-019",
  "gcp-ace-gcpace-n02-b05-011",
  "gcp-ace-gcpace-n02-b05-012",
  "gcp-ace-gcpace-n02-b05-013",
  "gcp-ace-gcpace-n02-b05-014",
  "gcp-ace-gcpace-n02-b05-015",
  "gcp-ace-gcpace-n02-b05-016",
  "gcp-ace-gcpace-n02-b05-017",
  "gcp-ace-gcpace-n02-b05-018",
  "gcp-ace-gcpace-n02-b06-001",
  "gcp-ace-gcpace-n02-b06-002",
  "gcp-ace-gcpace-n02-b06-003",
  "gcp-ace-gcpace-n02-b06-004",
  "gcp-ace-gcpace-n02-b06-005",
  "gcp-ace-gcpace-n02-b06-006",
  "gcp-ace-gcpace-n02-b06-007",
  "gcp-ace-gcpace-n02-b06-008",
  "gcp-ace-gcpace-n02-b06-009",
  "gcp-ace-gcpace-n02-b06-010",
  "gcp-ace-gcpace-n02-b06-011",
  "gcp-ace-gcpace-n02-b06-012",
  "gcp-ace-gcpace-n02-b06-013",
  "gcp-ace-gcpace-n02-b06-014",
  "gcp-ace-gcpace-n02-b06-015",
  "gcp-ace-gcpace-n02-b06-016",
  "gcp-ace-gcpace-n02-b06-017",
  "gcp-ace-gcpace-n02-b06-018",
  "gcp-ace-gcpace-n02-b06-019",
  "gcp-ace-gcpace-n02-b06-020",
  "gcp-ace-gcpace-n02-b07-001",
  "gcp-ace-gcpace-n02-b07-002",
  "gcp-ace-gcpace-n02-b07-003",
  "gcp-ace-gcpace-n02-b07-004",
  "gcp-ace-gcpace-n02-b07-005",
  "gcp-ace-gcpace-n02-b07-006",
  "gcp-ace-gcpace-n02-b07-007",
  "gcp-ace-gcpace-n02-b07-008",
  "gcp-ace-gcpace-n02-b07-009",
  "gcp-ace-gcpace-n02-b07-010",
  "gcp-ace-gcpace-n02-b07-011",
  "gcp-ace-gcpace-n02-b07-012",
  "gcp-ace-gcpace-n02-b07-013",
  "gcp-ace-gcpace-n02-b07-014",
  "gcp-ace-gcpace-n02-b07-015",
  "gcp-ace-gcpace-n02-b07-016",
  "gcp-ace-gcpace-n02-b07-017",
  "gcp-ace-gcpace-n02-b07-018",
] as const;
const sourceVersion = JSON.parse(readFileSync(path.join(contentRoot, "content/catalog.json"), "utf8")).tracks.find((entry: { trackId: string }) => entry.trackId === trackId).contentVersion as string;

function verifyRuntime(items: readonly Question[], pin: { contentVersion: string; artifactSha256: string }) {
  assert.deepEqual(items.map(item => item.questionId).sort(), [...expectedIds].sort());
  assert.equal(new Set(expectedIds).size, 130);
  for (const question of items) {
    assert.deepEqual(validateQuestion(question), [], question.questionId);
    if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error(question.questionId);
    const snapshot = JSON.stringify(question);
    const preSubmit = toCanonicalQuestionViewModel(question);
    assert.equal("answer" in preSubmit, false);
    assert.equal("feedback" in preSubmit, false);
    const positions = new Set<number>();
    const orders = new Set<string>();
    for (let seed = 0; seed < 16; seed++) {
      const occurrence = `gcp-repair-20261018:${seed}:${question.questionId}`;
      const order = prepareCanonicalOptionOrder(question, occurrence, pin);
      assert.deepEqual(prepareCanonicalOptionOrder(question, occurrence, pin), order);
      positions.add(order.indexOf(question.answer.optionId));
      orders.add(order.join(","));
      const restoredOrder = JSON.parse(JSON.stringify(order));
      const displayed = projectCanonicalQuestionInSessionOrder(question, restoredOrder);
      const before = buildCanonicalInteractionViewModel(displayed, null).model as { renderer: { kind: string; options: readonly { id: string; text: string; selected: boolean }[] } };
      assert.deepEqual(Object.keys(before).sort(), ["accessibility", "renderer"]);
      assert.deepEqual(Object.keys(before.renderer).sort(), ["kind", "options"]);
      assert.deepEqual(before.renderer.options.map(option => option.id), order);
      assert.ok(before.renderer.options.every(option => !option.selected));
      for (const option of before.renderer.options) {
        assert.deepEqual(Object.keys(option).sort(), ["id", "selected", "text"]);
        const response = JSON.parse(JSON.stringify({ type: "choice_single" as const, optionId: option.id }));
        const score = scoreCanonicalQuestion(displayed, response);
        assert.deepEqual(score, scoreCanonicalQuestion(question, response));
        assert.equal(score.earnedPoints, option.id === question.answer.optionId ? 1 : 0);
        const feedback = composeCanonicalFeedback(displayed, response, score);
        const expected = question.feedback.messages!.filter(message => message.kind === "wrong_option" && message.targetId === option.id);
        assert.equal(expected.length, option.id === question.answer.optionId ? 0 : 1);
        assert.deepEqual(feedback.messages, expected);
        assert.equal(feedback.reason, question.feedback.reason);
        assert.deepEqual(feedback.details, question.feedback.details);
        assert.ok(detailLines(feedback.details).length > 0);
      }
      assert.throws(() => projectCanonicalQuestionInSessionOrder(question, order.map(() => order[0])), /Saved control order/);
      assert.throws(() => projectCanonicalQuestionInSessionOrder(question, [...order.slice(1), "foreign"]), /Saved control order/);
    }
    assert.ok(positions.size > 1, `${question.questionId}: key moves`);
    assert.ok(orders.size > 1, `${question.questionId}: orders vary`);
    assert.equal(JSON.stringify(question), snapshot);
  }
}

test("GCP repaired source presents exact authored options and feedback through production scoring and saved-order projection", () => {
  verifyRuntime(questions, { contentVersion: sourceVersion, artifactSha256: "a".repeat(64) });
});

test("GCP semantic successor rejects the historical option identity instead of silently accepting it", () => {
  assert.equal(questions.some(question => question.questionId === "gcp-ace-gcpace-n02-b05-010"), false);
  const successor = questions.find(question => question.questionId === "gcp-ace-gcpace-n02-b05-019");
  assert.ok(successor);
  assert.equal(isCanonicalResponseComplete(successor, { type: "choice_single", optionId: "A" }), false);
  assert.equal(isCanonicalResponseComplete(successor, { type: "choice_single", optionId: "revoke_subject_sessions" }), true);
});

test("current GCP source build passes APP integrity validation and matches all 130 repaired source questions", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "patternly-current-gcp-runtime-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const appPath = path.resolve("src/content/generated/canonical-content");
  const originalAppArtifact = readFileSync(path.join(appPath, `${trackId}.json`));
  const originalAppLock = readFileSync(path.join(appPath, "content-lock.json"));
  const { buildTrack } = await import(pathToFileURL(path.join(contentRoot, "scripts/build.mjs")).href);
  await buildTrack({ rootDirectory: contentRoot, trackId, outputRoot: root });
  const artifact = JSON.parse(readFileSync(path.join(root, `${trackId}.json`), "utf8"));
  const lock = JSON.parse(readFileSync(path.join(root, "content-lock.json"), "utf8")).tracks.find((entry: CanonicalContentLockRecord) => entry.trackId === trackId) as CanonicalContentLockRecord;
  const catalog = await createCanonicalQuestionCatalog(artifact, lock, trackId, async value => sha256Utf8(value));
  assert.equal(catalog.questions.length, 2981);
  assert.equal(catalog.contentVersion, sourceVersion);
  assert.equal(catalog.getQuestionById("gcp-ace-gcpace-n02-b05-010"), undefined);
  const selected = expectedIds.map(id => { const question = catalog.getQuestionById(id); assert.ok(question, id); return question; });
  const sourceConfig = JSON.parse(readFileSync(path.join(contentRoot, "config/tracks", `${trackId}.json`), "utf8"));
  // The existing producer enriches canonical questions with their exam domain.
  for (const source of questions) assert.deepEqual(catalog.getQuestionById(source.questionId), {
    ...source,
    contentDomainId: sourceConfig.profile.nodeDomainMap[source.nodeId],
  });
  verifyRuntime(selected, catalog);
  const appLock = JSON.parse(originalAppLock.toString("utf8")).tracks.find((entry: CanonicalContentLockRecord) => entry.trackId === trackId);
  assert.deepEqual(lock, appLock, "fresh current producer identity matches the installed APP lock");
  assert.equal(catalog.artifactSha256, appLock.sha256);
  assert.equal(catalog.contentVersion, appLock.contentVersion);
  assert.deepEqual(readFileSync(path.join(root, `${trackId}.json`)), originalAppArtifact, "current builder and APP have identical question bytes");
  assert.deepEqual(readFileSync(path.join(appPath, `${trackId}.json`)), originalAppArtifact, "read-only source check leaves APP unchanged");
  assert.deepEqual(readFileSync(path.join(appPath, "content-lock.json")), originalAppLock);
});
