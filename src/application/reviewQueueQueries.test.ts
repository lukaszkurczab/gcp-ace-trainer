import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  buildTrackReviewQueueViewModel,
  loadTrackReviewQueueViewModel,
} from "./reviewQueueQueries";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { createResolvedContentRef, GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, type ReviewQueueEntry } from "../domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../infrastructure/storage/mmkvClient";
import {
  createContentIdentityUnavailableReviewRecord,
  saveUnavailableReviewRecord,
} from "../storage/repositories/contentIdentityUnavailableRepository";
import type { ContentIdentityUnavailableReviewRecord } from "../storage/repositories/contentIdentityUnavailableRepository";

const TRACK_ID = "coding-interview-dsa-problem-solving" as const;

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("review view keeps unavailable entries separate and never makes them due", async () => {
  const record = unavailableReview("review-unavailable");
  const view = await buildTrackReviewQueueViewModel({
    now: "2026-08-23T12:00:00.000Z",
    reviewQueueItems: [],
    trackId: TRACK_ID,
    unavailableReviewRecords: [record],
  });

  assert.equal(view.totalItems, 1);
  assert.deepEqual(view.dueItems, []);
  assert.deepEqual(view.overdueItems, []);
  assert.deepEqual(view.upcomingItems, []);
  assert.equal(view.unavailableItems.length, 1);
  assert.equal(view.unavailableItems[0]?.kind, "unavailable");
  assert.equal(view.unavailableItems[0]?.isDue, false);
  assert.equal(view.unavailableItems[0]?.isOverdue, false);
  assert.equal(view.unavailableItems[0]?.prompt, undefined);
  assert.equal(view.unavailableItems[0]?.questionId, "question-1");
  assert.equal(view.unavailableItems[0]?.unavailableReason, "unknown_artifact_hash");
});

test("stored unavailable reviews are readable without resolving content metadata", async () => {
  await saveUnavailableReviewRecord(createContentIdentityUnavailableReviewRecord(unavailableReview("stored-review")));

  const view = await loadTrackReviewQueueViewModel({
    now: "2026-08-23T12:00:00.000Z",
    trackId: TRACK_ID,
  });

  assert.deepEqual(view.dueItems, []);
  assert.deepEqual(view.upcomingItems, []);
  assert.deepEqual(view.unavailableItems.map((item) => item.id), ["stored-review"]);
});

test("a future manual request is available in the real review queue without being labeled due", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, "certification");
  assert.ok(resolved.planningPolicyIdentity, "the policy successor pin is separate from the review source ref");
  const track = resolved.track;
  const question = track.getPool("certification-focus-practice")[0]!;
  const sourceItem = createResolvedContentRef({
    trackId: track.trackId,
    questionId: question.questionId,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
  });
  const entry: ReviewQueueEntry = {
    id: "review:manual-request-query",
    trackId: track.trackId,
    sourceAttemptId: "attempt:manual-request-query",
    sourceSessionId: "session:manual-request-query",
    sourceItem,
    taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }],
    reasons: ["manual_mark"],
    manualRequestId: `manual:${"a".repeat(64)}`,
    dueAt: "2026-10-09T12:00:00.000Z",
    createdAt: "2026-10-08T12:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
    policyVersion: "bizq04-v1",
    stage: "manual_requested",
    status: "active",
  };

  const view = await buildTrackReviewQueueViewModel({
    now: "2026-10-08T12:00:00.000Z",
    reviewQueueItems: [entry],
    trackId: track.trackId,
  });

  assert.equal(view.dueItems.length, 1);
  assert.equal(view.dueItems[0]?.id, entry.id);
  assert.equal(view.dueItems[0]?.isDue, false);
  assert.equal(view.dueItems[0]?.isManualRequest, true);
  assert.equal(view.upcomingItems.length, 0);
  assert.equal(view.dueItems[0]?.prompt, question.prompt);
});

function unavailableReview(reviewId: string): ContentIdentityUnavailableReviewRecord {
  return {
    schemaVersion: 1,
    kind: "unavailable_review",
    reviewId,
    review: {
      id: reviewId,
      trackId: TRACK_ID,
      sourceAttemptId: `${reviewId}:attempt`,
      sourceSessionId: `${reviewId}:session`,
      sourceItem: {
        kind: "unavailable_review",
        reviewId,
        trackId: TRACK_ID,
        questionId: "question-1",
        contentVersion: "content-v0",
        reason: "unknown_artifact_hash",
      },
      taxonomyOrSkillRefs: [{ axisId: "roadmap_node", nodeId: "complexity_and_constraints" }],
      reasons: ["incorrect"],
      dueAt: "2026-08-20T12:00:00.000Z",
      createdAt: "2026-08-19T12:00:00.000Z",
      persistent: true,
    },
  };
}


test("unit review uses current B after A disappears and missing U remains visible without old content",async()=>{
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const {track}=await contentPackageRuntimeOwner.resolveForDiscovery(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,"certification");
  const b=track.questions[0]!;
  const entry:ReviewQueueEntry={id:"unit-review",trackId:track.trackId,sourceItem:{trackId:track.trackId,questionId:"removed-A",contentVersion:"unavailable-old",artifactSha256:"e".repeat(64)},sourceAttemptId:"old-attempt",sourceSessionId:"old-session",taxonomyOrSkillRefs:[{axisId:"node",nodeId:b.nodeId},{axisId:"mental_unit",nodeId:b.mentalUnitId}],reasons:["incorrect"],dueAt:"2026-10-01T00:00:00.000Z",createdAt:"2026-09-30T00:00:00.000Z",consecutiveAfterDueSuccesses:0,persistent:true,status:"active",policyVersion:"bizq04-v1",stage:"repair24"};
  const noMaterial={...entry,id:"missing-unit",taxonomyOrSkillRefs:[{axisId:"node",nodeId:b.nodeId},{axisId:"mental_unit",nodeId:"missing-U"}]};
  const noAttribution={...entry,id:"missing-attribution",taxonomyOrSkillRefs:[]};
  const inputs=[entry,noMaterial,noAttribution];const before=structuredClone(inputs);
  const view=await buildTrackReviewQueueViewModel({trackId:track.trackId,now:"2026-10-21T00:00:00.000Z",reviewQueueItems:inputs});
  assert.equal(view.totalItems,3);
  assert.equal(view.dueItems.length,1);
  assert.equal(view.dueItems[0]!.questionId,b.questionId);
  assert.equal(view.dueItems[0]!.prompt,b.prompt);
  assert.equal(view.dueItems[0]!.dueAt,entry.dueAt);
  assert.deepEqual(view.unavailableItems.map(row=>row.id).sort(),["missing-attribution","missing-unit"]);
  assert.deepEqual(inputs,before);
});

// Count actual catalog visits in the production builder. These fixtures model
// catalog/queue size, not a measured production distribution or device latency.
async function countedCatalog(questionCount: number) {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const runtime = await contentPackageRuntimeOwner.resolveForDiscovery(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, "certification");
  const template = runtime.track.questions[0]!;
  const questions = Array.from({ length: questionCount }, (_, index) => ({
    ...template, questionId: `q:${index}`, nodeId: `node:${Math.floor(index / 8)}`,
    mentalUnitId: `unit:${Math.floor(index / 2)}`, prompt: `prompt:${index}`,
  }));
  const byId = new Map(questions.map(question => [question.questionId, question]));
  let visits = 0;
  const track = { ...runtime.track, questions: new Proxy(questions, {
    get(target, key, receiver) {
      if (typeof key === "string" && /^\d+$/u.test(key)) visits++;
      return Reflect.get(target, key, receiver);
    },
  }), getQuestion: (id: string) => byId.get(id) };
  return { runtime: { ...runtime, track }, questions, visits: () => visits };
}
function materialEntry(track: Awaited<ReturnType<typeof countedCatalog>>["runtime"]["track"], index: number, question = track.questions[0]!): ReviewQueueEntry {
  return { id: `review:${index}`, trackId: track.trackId, sourceAttemptId: `attempt:${index}`, sourceSessionId: "source-session",
    sourceItem: { trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId }, { axisId: "mental_unit", nodeId: question.mentalUnitId }],
    reasons: ["incorrect"], dueAt: "2026-10-25T12:00:00.000Z", createdAt: "2026-10-24T12:00:00.000Z",
    consecutiveAfterDueSuccesses: 0, persistent: true, policyVersion: "bizq04-v1", stage: "repair24", status: "active" };
}

for (const questionCount of [4, 128, 4096]) for (const reviewCount of [1, 4, 64]) {
  test(`review material discovery/scans stay bounded for Q=${questionCount}, R=${reviewCount}`, async t => {
    const fixture = await countedCatalog(questionCount);
    let discovery = 0;
    t.mock.method(contentPackageRuntimeOwner, "resolveForDiscovery", async () => { discovery++; return fixture.runtime; });
    const entries = Array.from({ length: reviewCount }, (_, index) => materialEntry(fixture.runtime.track, index, fixture.questions[(questionCount - 1 - index * 2 % questionCount)]!));
    const before = JSON.stringify(entries), startVisits = fixture.visits();
    const begin = performance.now();
    const view = await buildTrackReviewQueueViewModel({ trackId: fixture.runtime.track.trackId, now: "2026-10-25T12:00:00.000Z", reviewQueueItems: entries });
    const visits = fixture.visits() - startVisits;
    t.diagnostic(JSON.stringify({ questionCount, reviewCount, discovery, questionVisits: visits, elapsedMs: performance.now() - begin }));
    assert.equal(discovery, 1);
    assert.ok(visits <= questionCount, `one catalog pass, saw ${visits}`);
    assert.equal(view.dueItems.length, reviewCount);
    for (const row of view.dueItems) {
      const entry = entries.find(entry => entry.id === row.id)!;
      const source = fixture.questions.find(question => question.questionId === entry.sourceItem.questionId)!;
      const first = fixture.questions.find(question => question.nodeId === source.nodeId && question.mentalUnitId === source.mentalUnitId)!;
      assert.equal(row.questionId, first.questionId, "same first question as the former find resolver");
      assert.equal(row.prompt, first.prompt);
      assert.equal(row.isDue, true); assert.equal(row.isOverdue, false);
    }
    assert.deepEqual(view.dueItems.map(row => row.id), entries.map(entry => entry.id).sort((a, b) => a.localeCompare(b)));
    assert.equal(JSON.stringify(entries), before);
  });
}

test("shared material lookup preserves current-unit, exact legacy, due/manual/order and unavailable contracts", async t => {
  const fixture = await countedCatalog(16), track = fixture.runtime.track;
  let discovery = 0;
  t.mock.method(contentPackageRuntimeOwner, "resolveForDiscovery", async (trackId: string, familyId: string) => {
    assert.equal(trackId, track.trackId); assert.equal(familyId, "certification"); discovery++; return fixture.runtime;
  });
  const base = materialEntry(track, 0, fixture.questions[1]!);
  const entries: ReviewQueueEntry[] = [
    { ...base, id: "due-now" },
    { ...base, id: "overdue", dueAt: "2026-10-24T12:00:00.000Z" },
    { ...base, id: "upcoming", dueAt: "2026-10-26T12:00:00.000Z" },
    { ...base, id: "manual", dueAt: "2026-10-27T12:00:00.000Z", reasons: ["manual_mark"], manualRequestId: `manual:${"b".repeat(64)}` },
    { ...base, id: "old-A-current-B", sourceItem: { ...base.sourceItem, questionId: "removed-A", contentVersion: "old", artifactSha256: "e".repeat(64) } },
    { ...base, id: "legacy-exact", taxonomyOrSkillRefs: [{ axisId: "node", nodeId: fixture.questions[1]!.nodeId }] },
    { ...base, id: "legacy-wrong-hash", sourceItem: { ...base.sourceItem, artifactSha256: "f".repeat(64) }, taxonomyOrSkillRefs: [] },
    { ...base, id: "legacy-wrong-version", sourceItem: { ...base.sourceItem, contentVersion: "old" }, taxonomyOrSkillRefs: [] },
    { ...base, id: "legacy-missing-question", sourceItem: { ...base.sourceItem, questionId: "missing" }, taxonomyOrSkillRefs: [] },
    { ...base, id: "legacy-conflicting-node", taxonomyOrSkillRefs: [{ axisId: "node", nodeId: "foreign-node" }] },
    { ...base, id: "partial-unit", taxonomyOrSkillRefs: [{ axisId: "mental_unit", nodeId: fixture.questions[1]!.mentalUnitId }] },
    { ...base, id: "missing-unit", taxonomyOrSkillRefs: [{ axisId: "node", nodeId: "missing" }, { axisId: "mental_unit", nodeId: "missing" }] },
    { ...base, id: "foreign-source", sourceItem: { ...base.sourceItem, trackId: TRACK_ID } },
    { ...base, id: "completed", status: "completed", completedAt: "2026-10-25T12:00:00.000Z", completedByAttemptId: "completion" },
    { ...base, id: "foreign-entry", trackId: TRACK_ID },
  ];
  const before = JSON.stringify(entries);
  const view = await buildTrackReviewQueueViewModel({ trackId: track.trackId, now: "2026-10-25T12:00:00.000Z", reviewQueueItems: entries });
  assert.equal(discovery, 1);
  assert.deepEqual(view.dueItems.map(row => row.id), ["overdue", "due-now", "legacy-exact", "old-A-current-B", "manual"]);
  assert.deepEqual(view.overdueItems.map(row => row.id), ["overdue"]);
  assert.deepEqual(view.upcomingItems.map(row => row.id), ["upcoming"]);
  assert.equal(view.dueItems.find(row => row.id === "manual")?.isDue, false);
  assert.equal(view.dueItems.find(row => row.id === "manual")?.isManualRequest, true);
  assert.ok(view.dueItems.every(row => row.questionId === fixture.questions[0]!.questionId));
  assert.deepEqual(view.unavailableItems.map(row => row.id), ["foreign-source", "legacy-conflicting-node", "legacy-missing-question", "legacy-wrong-hash", "legacy-wrong-version", "missing-unit", "partial-unit"]);
  assert.equal(JSON.stringify(entries), before);
});

test("catalog failure remains unavailable for each entry and an empty track does no discovery", async t => {
  const fixture = await countedCatalog(4), track = fixture.runtime.track;
  let discovery = 0;
  t.mock.method(contentPackageRuntimeOwner, "resolveForDiscovery", async () => { discovery++; throw new Error("catalog unavailable"); });
  const entries = [materialEntry(track, 1), materialEntry(track, 2)];
  const empty = await buildTrackReviewQueueViewModel({ trackId: TRACK_ID, reviewQueueItems: entries });
  assert.equal(empty.totalItems, 0); assert.equal(discovery, 0);
  const view = await buildTrackReviewQueueViewModel({ trackId: track.trackId, reviewQueueItems: entries });
  assert.equal(discovery, 1);
  assert.deepEqual(view.dueItems, []); assert.deepEqual(view.upcomingItems, []);
  assert.deepEqual(view.unavailableItems.map(row => row.questionId), entries.map(entry => entry.sourceItem.questionId));
  assert.ok(view.unavailableItems.every(row => row.unavailableReason === "unit_material_unavailable"));
});

test("material is local to each build and a different profile catalog cannot reuse the previous question", async t => {
  const first = await countedCatalog(4), second = await countedCatalog(4);
  const replacement = { ...second.questions[0]!, questionId: "new-profile-first", prompt: "New profile material" };
  const nextRuntime = { ...second.runtime, track: { ...second.runtime.track, questions: [replacement] } };
  let discovery = 0;
  t.mock.method(contentPackageRuntimeOwner, "resolveForDiscovery", async () => ++discovery === 1 ? first.runtime : nextRuntime);
  const input = { trackId: first.runtime.track.trackId, reviewQueueItems: [materialEntry(first.runtime.track, 1), materialEntry(first.runtime.track, 2)], now: "2026-10-25T12:00:00.000Z" };
  const before = await buildTrackReviewQueueViewModel(input), after = await buildTrackReviewQueueViewModel(input);
  assert.ok(before.dueItems.every(row => row.questionId === first.questions[0]!.questionId));
  assert.ok(after.dueItems.every(row => row.questionId === replacement.questionId && row.prompt === replacement.prompt));
  assert.equal(discovery, 2, "each invocation discovers the current profile catalog afresh");
});

for (const reviewCount of [1, 2, 64]) test(`early-hit R=${reviewCount} stops after the first catalog question`, async t => {
  const fixture = await countedCatalog(4096), track = fixture.runtime.track;
  let discovery = 0;
  t.mock.method(contentPackageRuntimeOwner, "resolveForDiscovery", async () => { discovery++; return fixture.runtime; });
  const entry = materialEntry(track, 1, fixture.questions[0]!);
  // Include the same entry object twice as well as distinct rows for the same U.
  const entries = Array.from({ length: reviewCount }, (_, index) => index < 2 ? entry : { ...entry, id: `same-unit:${index}` });
  const startVisits = fixture.visits();
  const view = await buildTrackReviewQueueViewModel({ trackId: track.trackId, reviewQueueItems: entries });
  const visits = fixture.visits() - startVisits;
  t.diagnostic(JSON.stringify({ questionCount: 4096, reviewCount, discovery, questionVisits: visits, earlyHit: true }));
  assert.equal(discovery, 1); assert.equal(visits, 1);
  assert.equal(view.dueItems.length, reviewCount);
  assert.ok(view.dueItems.every(row => row.questionId === fixture.questions[0]!.questionId));
});

test("a bad per-entry legacy lookup is isolated and a foreign catalog cannot attribute material", async t => {
  const fixture = await countedCatalog(4), track = fixture.runtime.track;
  const ordinary = materialEntry(track, 1, fixture.questions[1]!);
  const badLegacy = { ...ordinary, id: "bad-legacy", taxonomyOrSkillRefs: [], sourceItem: { ...ordinary.sourceItem, questionId: "throws" } };
  const runtime = { ...fixture.runtime, track: { ...track, getQuestion: (id: string) => {
    if (id === "throws") throw new Error("invalid exact question");
    return track.getQuestion(id);
  } } };
  const resolver = t.mock.method(contentPackageRuntimeOwner, "resolveForDiscovery", async () => runtime);
  const view = await buildTrackReviewQueueViewModel({ trackId: track.trackId, reviewQueueItems: [badLegacy, ordinary] });
  assert.deepEqual(view.dueItems.map(row => row.id), [ordinary.id]);
  assert.deepEqual(view.unavailableItems.map(row => row.id), [badLegacy.id]);
  resolver.mock.mockImplementation(async () => ({ ...runtime, track: { ...runtime.track, trackId: TRACK_ID } }));
  const foreign = await buildTrackReviewQueueViewModel({ trackId: track.trackId, reviewQueueItems: [ordinary] });
  assert.deepEqual(foreign.dueItems, []);
  assert.deepEqual(foreign.unavailableItems.map(row => row.id), [ordinary.id]);
});
