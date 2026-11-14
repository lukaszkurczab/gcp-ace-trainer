import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getForegroundSessionTimerFacade } from "../trainingLifecycle";
import { getTrainingAttempts, getActiveMutationJournal } from "../../storage/repositories";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";
import { initializeStorageMetadata } from "../../storage/repositories/storageMetadataRepository";
import { productionTrackAdmissionContext as admission, productionLearningDataAdmissionContext as learningAdmission } from "../tracks/trackAdmissionContext";
import { recoverPendingMutation } from "../learningMutations";
import {
  PRACTICE_ANSWER_DRAFT_STORE_KEY,
  advanceAlgorithmsPracticeSession,
  clearAlgorithmsPracticeAnswerDraft,
  getAlgorithmsPracticeProjection,
  isOptimisticPracticeFeedbackEnabled,
  persistAlgorithmsPracticeAnswerDraft,
  previewAlgorithmsPracticeFeedback,
  readAlgorithmsPracticeAnswerDraft,
  resumeAlgorithmsPracticeAnswerDraft,
  startAlgorithmsSession,
  submitAlgorithmsPracticeResponse,
  type AlgorithmsPracticeProjection,
} from "./codingInterviewSessionFacade";
import {
  createPracticeAnswerDraft,
  decodePracticeAnswerDraft,
  encodePracticeAnswerDraft,
  gradePracticeAnswer,
  practiceAnswerDraftMatches,
  samePracticeAnswerGrade,
} from "../../domain/learning/practiceAnswerDraft";

// T2.2: optimistic practice feedback. The shown grade comes from the same
// exact-package evaluation as the command; D6 (a) keeps the answer durable as
// a draft before feedback renders, so a kill before or during the commit
// neither loses the answer nor stores a different result.

const PROFILE = { id: "t22-optimistic-profile", kind: "guest" as const, accountId: null };
let sequence = 0;
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 5));
const dependencies = { sessionIds: { create: async () => `t22-${++sequence}` }, premiumSessionAdmission: { authorize: async () => "allowed" as const } };

function install(storage: MemoryKeyValueStorage): void {
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE);
  composeTrainingLifecycleUseCases(dependencies);
}

async function fixture(t: TestContext) {
  const storage = new MemoryKeyValueStorage();
  install(storage);
  initializeStorageMetadata();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const { session } = await startAlgorithmsSession({ modeId: "coding-interview-learn-approach", requestedLength: 10 });
  const timer = getForegroundSessionTimerFacade();
  t.after(() => timer.runLocalLearningReset(async () => {}));
  await timer.enterForeground(session);
  await pause();
  return { storage, session };
}

/** A process death: the same bytes in a new storage owner and a new lifecycle, nothing in memory survives. */
async function restart(storage: MemoryKeyValueStorage): Promise<MemoryKeyValueStorage> {
  const next = new MemoryKeyValueStorage();
  for (const key of storage.getAllKeys()) next.setString(key, storage.getString(key)!);
  install(next);
  return next;
}

async function choiceOptions(projection: AlgorithmsPracticeProjection): Promise<readonly string[]> {
  const exact = await contentPackageRuntimeOwner.resolveItem(projection.item);
  return exact.interactions.controlIds(exact.question.questionId);
}

async function attemptsFor(sessionId: string) {
  return (await getTrainingAttempts(admission)).value.filter((attempt) => attempt.sessionId === sessionId);
}

const choice = (optionId: string) => ({ kind: "choice" as const, selectedOptionIds: [optionId] });

test("the kill-switch defaults to on and only the literal 0 turns it off", () => {
  const previous = process.env.EXPO_PUBLIC_PATTERNLY_PERF_OPT_OPTIMISTIC_FEEDBACK;
  try {
    delete process.env.EXPO_PUBLIC_PATTERNLY_PERF_OPT_OPTIMISTIC_FEEDBACK;
    assert.equal(isOptimisticPracticeFeedbackEnabled(), true);
    process.env.EXPO_PUBLIC_PATTERNLY_PERF_OPT_OPTIMISTIC_FEEDBACK = "0";
    assert.equal(isOptimisticPracticeFeedbackEnabled(), false);
    process.env.EXPO_PUBLIC_PATTERNLY_PERF_OPT_OPTIMISTIC_FEEDBACK = "1";
    assert.equal(isOptimisticPracticeFeedbackEnabled(), true);
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_PERF_OPT_OPTIMISTIC_FEEDBACK;
    else process.env.EXPO_PUBLIC_PATTERNLY_PERF_OPT_OPTIMISTIC_FEEDBACK = previous;
  }
});

test("the grade and draft codec are strict and pure", () => {
  assert.equal(gradePracticeAnswer({ complete: false, result: null }), null);
  assert.equal(gradePracticeAnswer({ complete: true, result: null }), null);
  const grade = gradePracticeAnswer({ complete: true, result: { kind: "partial", earnedPoints: 1, maxPoints: 2 } })!;
  assert.deepEqual(grade, { kind: "partial", earnedPoints: 1, maxPoints: 2 });
  assert.equal(samePracticeAnswerGrade(grade, { kind: "partial", earnedPoints: 1, maxPoints: 2 }), true);
  assert.equal(samePracticeAnswerGrade(grade, { kind: "partial", earnedPoints: 1, maxPoints: 3 }), false);
  const target = { sessionId: "s", occurrenceId: "o", questionId: "q", contentVersion: "v", artifactSha256: "a".repeat(64) };
  const draft = createPracticeAnswerDraft({ target, response: choice("x"), grade, capturedAt: "2026-11-14T00:00:00.000Z" });
  const encoded = encodePracticeAnswerDraft(draft);
  assert.deepEqual(decodePracticeAnswerDraft(encoded), draft);
  assert.ok(Object.isFrozen(decodePracticeAnswerDraft(encoded)!.response));
  assert.equal(practiceAnswerDraftMatches(draft, target), true);
  for (const key of Object.keys(target) as (keyof typeof target)[]) assert.equal(practiceAnswerDraftMatches(draft, { ...target, [key]: "other" }), false, key);
  const parsed = JSON.parse(encoded);
  const corrupt = [
    undefined, "", "{", "null", "[]",
    JSON.stringify({ ...parsed, schema: 2 }),
    JSON.stringify({ ...parsed, extra: 1 }),
    JSON.stringify({ ...parsed, capturedAt: "never" }),
    JSON.stringify({ ...parsed, target: { ...parsed.target, sessionId: "" } }),
    JSON.stringify({ ...parsed, grade: { ...parsed.grade, kind: "maybe" } }),
    JSON.stringify({ ...parsed, grade: { ...parsed.grade, earnedPoints: 3 } }),
    JSON.stringify({ ...parsed, response: "x" }),
  ];
  for (const raw of corrupt) assert.equal(decodePracticeAnswerDraft(raw), null, String(raw));
  assert.throws(() => createPracticeAnswerDraft({ target, response: "x", grade, capturedAt: "2026-11-14T00:00:00.000Z" }));
});

test("the preview equals the committed feedback for every option of the first three questions", async (t) => {
  // One session per option of question 1; questions 2 and 3 are reached by answering option 0.
  const firstOptions = await (async () => { await fixture(t); return choiceOptions(await getAlgorithmsPracticeProjection()); })();
  assert.ok(firstOptions.length >= 2);
  const compared: string[] = [];
  for (const [depth, optionCount] of [[0, firstOptions.length], [1, Infinity], [2, Infinity]] as const) {
    for (let option = 0; option < optionCount; option += 1) {
      await fixture(t);
      for (let step = 0; step < depth; step += 1) {
        const current = await getAlgorithmsPracticeProjection();
        await submitAlgorithmsPracticeResponse(choice((await choiceOptions(current))[0]!));
        await advanceAlgorithmsPracticeSession();
      }
      const before = await getAlgorithmsPracticeProjection();
      const options = await choiceOptions(before);
      if (option >= options.length) break;
      const response = choice(options[option]!);
      const preview = await previewAlgorithmsPracticeFeedback(before, response);
      assert.ok(preview, `preview depth=${depth} option=${option}`);
      await submitAlgorithmsPracticeResponse(response);
      const committed = await getAlgorithmsPracticeProjection();
      assert.equal(committed.operation.kind, "feedback");
      assert.deepEqual(preview.projection.feedback, committed.feedback, `feedback depth=${depth} option=${option}`);
      assert.deepEqual(preview.projection.interaction, committed.interaction);
      assert.deepEqual(preview.projection.response?.value, committed.response?.value);
      const [attempt] = (await attemptsFor(committed.session.id)).filter((candidate) => candidate.occurrenceId === committed.occurrenceId);
      assert.ok(attempt);
      assert.deepEqual(preview.draft.grade, { kind: attempt.result.kind, earnedPoints: attempt.result.earnedPoints, maxPoints: attempt.result.maxPoints });
      compared.push(`${depth}:${option}:${attempt.result.kind}`);
      if (optionCount === Infinity && option >= 3) break;
    }
  }
  assert.ok(compared.some((entry) => entry.endsWith("correct")) && compared.some((entry) => !entry.endsWith(":correct")), compared.join(","));
});

test("no preview when the occurrence is not an unanswered afterEachAnswer question or the response is incomplete", async (t) => {
  await fixture(t);
  const before = await getAlgorithmsPracticeProjection();
  assert.equal(await previewAlgorithmsPracticeFeedback(before, { kind: "choice", selectedOptionIds: [] }), null);
  assert.equal(await previewAlgorithmsPracticeFeedback(before, { kind: "ordering", orderedSubgoalIds: ["x"] }), null);
  assert.equal(await previewAlgorithmsPracticeFeedback({ ...before, session: { ...before.session, configurationSnapshot: { ...before.session.configurationSnapshot, feedbackMode: "atSessionEnd" } } }, choice((await choiceOptions(before))[0]!)), null);
  await submitAlgorithmsPracticeResponse(choice((await choiceOptions(before))[0]!));
  assert.equal(await previewAlgorithmsPracticeFeedback(await getAlgorithmsPracticeProjection(), choice((await choiceOptions(before))[0]!)), null);
});

test("the draft is durable before render and is replaced only for its own occurrence", async (t) => {
  const { storage } = await fixture(t);
  const before = await getAlgorithmsPracticeProjection();
  const preview = (await previewAlgorithmsPracticeFeedback(before, choice((await choiceOptions(before))[0]!)))!;
  assert.equal(persistAlgorithmsPracticeAnswerDraft(preview.draft), true);
  assert.deepEqual(decodePracticeAnswerDraft(storage.getString(PRACTICE_ANSWER_DRAFT_STORE_KEY)), preview.draft);
  clearAlgorithmsPracticeAnswerDraft({ ...preview.draft.target, occurrenceId: "another" });
  assert.deepEqual(readAlgorithmsPracticeAnswerDraft(), preview.draft);
  clearAlgorithmsPracticeAnswerDraft(preview.draft.target);
  assert.equal(storage.getString(PRACTICE_ANSWER_DRAFT_STORE_KEY), undefined);
  storage.setFailurePlan({ kind: "fail_on_key_write", key: PRACTICE_ANSWER_DRAFT_STORE_KEY });
  // A draft that cannot be written means no optimistic render (the screen takes the regular path).
  assert.equal(persistAlgorithmsPracticeAnswerDraft(preview.draft), false);
  storage.setFailurePlan(null);
  assert.equal(await resumeAlgorithmsPracticeAnswerDraft(), "none");
});

test("a kill at every point between the draft and the cleared draft keeps the shown answer and grade (D6 a)", async (t) => {
  type Outcome = Readonly<{ resume: string; attempts: string; operation: string; correctness: string | undefined; draft: boolean; journal: boolean }>;
  const run = async (failAt: number | null, killAfterCommit: boolean): Promise<Outcome & { writes: number; shown: string }> => {
    let { storage } = await fixture(t);
    const before = await getAlgorithmsPracticeProjection();
    const options = await choiceOptions(before);
    const response = choice(options[options.length - 1]!);
    const preview = (await previewAlgorithmsPracticeFeedback(before, response))!;
    assert.equal(persistAlgorithmsPracticeAnswerDraft(preview.draft), true);
    storage.resetCounters();
    if (failAt !== null) storage.setFailurePlan({ kind: "fail_on_write_number", writeNumber: failAt });
    let killed = failAt !== null;
    try { await submitAlgorithmsPracticeResponse(response); } catch { killed = true; }
    storage.setFailurePlan(null);
    const writes = storage.operations.filter((operation) => operation.kind === "write").length;
    if (!killed && !killAfterCommit) clearAlgorithmsPracticeAnswerDraft(preview.draft.target);
    // Next launch: opening storage recovers a journaled command, then the session screen resumes the draft.
    storage = await restart(storage);
    await recoverPendingMutation();
    await getForegroundSessionTimerFacade().enterForeground((await getAlgorithmsPracticeProjection()).session);
    const resume = await resumeAlgorithmsPracticeAnswerDraft();
    const after = await getAlgorithmsPracticeProjection();
    const attempts = (await attemptsFor(after.session.id)).map((attempt) => `${attempt.occurrenceId.slice(after.session.id.length)}:${attempt.result.kind}:${JSON.stringify(attempt.response)}`);
    return {
      resume, writes, shown: preview.draft.grade.kind,
      attempts: JSON.stringify(attempts), operation: after.operation.kind, correctness: after.feedback?.correctness,
      draft: storage.getString(PRACTICE_ANSWER_DRAFT_STORE_KEY) !== undefined, journal: getActiveMutationJournal(learningAdmission) !== null,
    };
  };
  const reference = await run(null, false);
  assert.equal(reference.resume, "none");
  assert.ok(reference.writes >= 3, `writes ${reference.writes}`);
  const expected = { attempts: reference.attempts, operation: "feedback", correctness: reference.shown, draft: false, journal: false };
  assert.deepEqual({ attempts: reference.attempts, operation: reference.operation, correctness: reference.correctness, draft: reference.draft, journal: reference.journal }, expected);
  const committedBeforeKill = await run(null, true);
  assert.equal(committedBeforeKill.resume, "committed");
  assert.deepEqual({ attempts: committedBeforeKill.attempts, operation: committedBeforeKill.operation, correctness: committedBeforeKill.correctness, draft: committedBeforeKill.draft, journal: committedBeforeKill.journal }, expected);
  const resumes = new Set<string>();
  for (let failAt = 1; failAt <= reference.writes; failAt += 1) {
    const outcome = await run(failAt, false);
    resumes.add(outcome.resume);
    assert.ok(outcome.resume === "replayed" || outcome.resume === "committed", `failAt=${failAt} resume=${outcome.resume}`);
    assert.deepEqual({ attempts: outcome.attempts, operation: outcome.operation, correctness: outcome.correctness, draft: outcome.draft, journal: outcome.journal }, expected, `failAt=${failAt}`);
  }
  // Both sides of the journal write are exercised.
  assert.ok(resumes.has("replayed") && resumes.has("committed"), [...resumes].join(","));
  t.diagnostic(`command writes ${reference.writes}; resumes ${[...resumes].join(",")}`);
});

test("a draft for a session that is no longer active is dropped without a command", async (t) => {
  const { storage } = await fixture(t);
  const before = await getAlgorithmsPracticeProjection();
  const preview = (await previewAlgorithmsPracticeFeedback(before, choice((await choiceOptions(before))[0]!)))!;
  const foreign = createPracticeAnswerDraft({ target: { ...preview.draft.target, sessionId: "ended-session" }, response: choice("x"), grade: preview.draft.grade, capturedAt: preview.draft.capturedAt });
  assert.equal(persistAlgorithmsPracticeAnswerDraft(foreign), true);
  assert.equal(await resumeAlgorithmsPracticeAnswerDraft(), "discarded");
  assert.equal(storage.getString(PRACTICE_ANSWER_DRAFT_STORE_KEY), undefined);
  assert.equal((await attemptsFor(before.session.id)).length, 0);
  storage.setString(PRACTICE_ANSWER_DRAFT_STORE_KEY, "{corrupt");
  assert.equal(await resumeAlgorithmsPracticeAnswerDraft(), "discarded");
  assert.equal(storage.getString(PRACTICE_ANSWER_DRAFT_STORE_KEY), undefined);
});
