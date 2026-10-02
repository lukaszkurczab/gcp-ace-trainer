import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { createTrainingSession, createTrainingAttempt, type TrainingSession, type ResolvedContentRef } from "../domain";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { readFileSync } from "node:fs";
import { createInstance } from "i18next";
import { loadCanonicalRuntimeCatalog } from "../content/canonical/runtimeCatalog";
import { loadCloudCertificationProgress } from "./learningReadModels";
import { createActivityReadOwner, loadActivityRecords, projectWeeklySessionActivity, loadActivitySessionRecords } from "./activityReadModels";
import { addTrainingAttempt, getTrainingAttempts, saveTrainingSession } from "../storage/repositories";
import { installMemoryStorage } from "../testing/journalTestSupport";
import { buildProgressTabModel } from "../features/home/tabs/progressTabModel";

const TRACK = "coding-interview-dsa-problem-solving";
const NOW = "2026-10-02T12:00:00.000Z";
beforeEach(() => installMemoryStorage());

async function durableSession(id: string, status: TrainingSession["status"], completedAt = "2026-10-01T10:00:00.000Z", trackId = TRACK, contentVersionOverride?: string, artifactSha256Override?: string) {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const profile = contentPackageRuntimeOwner.getPreparedDiscovery(trackId).track;
  const contentVersion = contentVersionOverride ?? profile.contentVersion;
  const artifactSha256 = artifactSha256Override ?? profile.artifactSha256;
  const refs = profile.questions.slice(0, 3).map(question => ({ trackId, questionId: question.questionId, contentVersion, artifactSha256 } satisfies ResolvedContentRef));
  const session = createTrainingSession({
    id, trackId, modeId: "coding-interview-guided-practice", configurationSnapshot: { kind: "practice" },
    requestedLength: 3, actualLength: 3, currentItemIndex: status === "completed" ? 2 : 0,
    itemOrder: refs.map((item, index) => ({ occurrenceId: `${id}:${index}`, item })), optionOrderByOccurrence: {}, activeForegroundMs: 1000,
    contentVersion, artifactSha256,
    status, startedAt: "2026-09-01T08:00:00.000Z", ...(status === "active" ? {} : { completedAt }),
  });
  await saveTrainingSession(session);
  return { session, refs };
}

async function recordAnswers(id: string, refs: readonly ResolvedContentRef[]) {
  for (const [index, item] of refs.entries()) await addTrainingAttempt(createTrainingAttempt({
    id: `${id}:attempt:${index}`, sessionId: id, trackId: item.trackId, modeId: "coding-interview-guided-practice", occurrenceId: `${id}:${index}`,
    item, response: { answer: "fixture" }, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    answeredAt: "2026-10-01T09:00:00.000Z", committedAt: "2026-10-01T09:00:00.000Z",
  }));
}

test("Progress week counts durable completed sessions, not distinct answers or earlier sessions", async () => {
  const current = await durableSession("current", "completed");
  await recordAnswers(current.session.id, current.refs);
  await durableSession("earlier", "completed", "2026-09-20T10:00:00.000Z");
  const records = await loadActivitySessionRecords();
  const model = buildProgressTabModel({ activeTrackId: TRACK, activityRecords: records, analytics: {} as never, attempts: [], practiceHistory: [], trainingAttempts: (await getTrainingAttempts()).value, reviewQueueItems: [], now: NOW, timezone: "Europe/Warsaw" });
  assert.equal(model.weeklyActivity.kind, "ready");
  if (model.weeklyActivity.kind === "ready") assert.equal(model.weeklyActivity.completedSessionCount, 1);
});

test("A durable completed session without answers remains one completed session", async () => {
  await durableSession("without-answers", "completed");
  const model = buildProgressTabModel({ activeTrackId: TRACK, activityRecords: await loadActivitySessionRecords(), analytics: {} as never, attempts: [], practiceHistory: [], trainingAttempts: [], reviewQueueItems: [], now: NOW, timezone: "Europe/Warsaw" });
  assert.equal(model.weeklyActivity.kind, "ready");
  if (model.weeklyActivity.kind === "ready") assert.equal(model.weeklyActivity.completedSessionCount, 1);
});

function count(records: Awaited<ReturnType<typeof loadActivitySessionRecords>>, now = NOW, timezone = "Europe/Warsaw") {
  const value = projectWeeklySessionActivity(records, { trackId: TRACK, now, timezone });
  assert.equal(value.kind, "ready");
  return value.kind === "ready" ? value.completedSessionCount : -1;
}

test("all nine tracks and all three Progress branches use the same durable weekly session facts", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  for (const trackId of catalog.tracks) {
    await durableSession(`all-nine:${trackId}`, "completed", "2026-10-01T10:00:00.000Z", trackId);
  }
  const records = await loadActivitySessionRecords();
  const cloudProgress = await loadCloudCertificationProgress({ now: NOW });
  for (const activeTrackId of catalog.tracks) {
    const model = buildProgressTabModel({ activeTrackId, activityRecords: records, analytics: {} as never, attempts: [], practiceHistory: [], trainingAttempts: [], reviewQueueItems: [], now: NOW, timezone: "Europe/Warsaw", ...(activeTrackId === "google-cloud-associate-cloud-engineer" ? { cloudProgress } : {}) });
    assert.equal(model.weeklyActivity.kind, "ready", activeTrackId);
    if (model.weeklyActivity.kind === "ready") assert.equal(model.weeklyActivity.completedSessionCount, 1, activeTrackId);
  }
});

test("active answers, abandoned activity, prior-week and future sessions never become completed this week", async () => {
  const active = await durableSession("active-with-answers", "active");
  await recordAnswers(active.session.id, active.refs);
  const abandoned = await durableSession("abandoned-with-answers", "abandoned");
  await recordAnswers(abandoned.session.id, abandoned.refs);
  await durableSession("before-week", "completed", "2026-09-27T21:59:59.999Z");
  await durableSession("after-now", "completed", "2026-10-02T12:00:00.001Z");
  await durableSession("at-now", "completed", NOW);
  assert.equal(count(await loadActivitySessionRecords()), 1);
});

test("Monday is a civil boundary in the supplied zone, independent of elapsed DST hours", async () => {
  await durableSession("monday-local", "completed", "2026-09-27T22:00:00.000Z");
  const records = await loadActivitySessionRecords();
  assert.equal(count(records, "2026-09-28T08:10:00.000Z", "Europe/Warsaw"), 1);
  assert.equal(count(records, "2026-09-28T08:10:00.000Z", "America/Los_Angeles"), 0);
  installMemoryStorage();
  await durableSession("before-spring-monday", "completed", "2026-03-29T21:59:59.999Z");
  await durableSession("at-spring-monday", "completed", "2026-03-29T22:00:00.000Z");
  assert.equal(count(await loadActivitySessionRecords(), "2026-04-01T12:00:00.000Z"), 1);
  installMemoryStorage();
  await durableSession("before-fall-monday", "completed", "2026-10-25T22:59:59.999Z");
  await durableSession("at-fall-monday", "completed", "2026-10-25T23:00:00.000Z");
  assert.equal(count(await loadActivitySessionRecords(), "2026-10-26T12:00:00.000Z"), 1);
});

test("history remains activity across valid content versions, and duplicate session IDs count once or fail conflict", async () => {
  const { session: historic } = await durableSession("historic-package", "completed", "2026-10-01T10:00:00.000Z", TRACK, "history-fixture-v0", "d".repeat(64));
  const records = await loadActivitySessionRecords();
  assert.equal(count(records), 1);
  assert.equal(count([...records, ...records]), 1);
  const changed = { ...records[0]!, session: { ...historic, completedAt: "2026-10-01T11:00:00.000Z" } };
  assert.deepEqual(projectWeeklySessionActivity([...records, changed], { trackId: TRACK, now: NOW, timezone: "Europe/Warsaw" }), { kind: "unavailable", reason: "conflicting_session" });
});

test("invalid calendar facts stay explicitly unavailable, and corrupt repository data is never zero activity", async () => {
  await durableSession("invalid-calendar-probe", "completed");
  const records = await loadActivitySessionRecords();
  const context = { trackId: TRACK, now: NOW, timezone: "Europe/Warsaw" };
  assert.deepEqual(projectWeeklySessionActivity(records, { ...context, now: "invalid" }), { kind: "unavailable", reason: "invalid_context" });
  assert.deepEqual(projectWeeklySessionActivity(records, { ...context, timezone: "Mars/Olympus" }), { kind: "unavailable", reason: "invalid_context" });
  for (const completedAt of [undefined, "invalid"]) assert.deepEqual(projectWeeklySessionActivity([{ ...records[0]!, session: { ...records[0]!.session, completedAt } }], context), { kind: "unavailable", reason: "invalid_record" });
  const { STORAGE_KEYS } = await import("../storage/keys");
  const storage = installMemoryStorage();
  await durableSession("corrupt", "completed");
  storage.setString(STORAGE_KEYS.trainingSession("corrupt"), "{");
  await assert.rejects(() => loadActivitySessionRecords());
});

test("weekly title plural forms are rendered by the actual translator in all seven locales", async () => {
  for (const locale of ["en", "pl", "de", "fr", "es", "it", "et"]) {
    const dictionary = JSON.parse(readFileSync(`src/locales/${locale}/common.json`, "utf8"));
    const translator = createInstance();
    await translator.init({ lng: locale, fallbackLng: false, resources: { [locale]: { translation: dictionary } } });
    for (const count of [0, 1, 2, 5, 21, 22]) {
      const text = translator.t("progress.week.completedSessions", { count });
      assert.ok(text.includes(String(count)), `${locale}/${count}`);
      assert.ok(!text.includes("progress.week") && !text.includes("{{"), `${locale}/${count}`);
    }
    assert.ok(!translator.t("progress.week.unavailable").includes("progress.week"));
  }
  const progress = readFileSync("src/features/home/tabs/ProgressTab.tsx", "utf8");
  assert.doesNotMatch(progress, /activitySummary|formatWeekTitle|progressRatio|miniBar/);
  assert.match(progress, /weeklyActivity\.completedSessionCount/);
  assert.match(progress, /accessibilityLiveRegion="polite" maxFontSizeMultiplier=\{2\} style=\{styles\.weekTitle\}/);
});


test("Activity read cannot publish account A sessions after an actual profile router switch to B", async () => {
  const storageApi = await import("../infrastructure/storage/mmkvClient");
  const { openProfileStorageRouter } = await import("../infrastructure/storage/profileStorageRouter");
  const base = new storageApi.MemoryKeyValueStorage();
  const values = new Map<string, string>(); let sequence = 10;
  const control = { get: async (key: string) => values.get(key) ?? null, set: async (key: string, value: string) => { values.set(key, value); }, remove: async (key: string) => { values.delete(key); } };
  const identity = { create: async () => ({ installationId: "00000000-0000-4000-8000-000000000001", localDatasetId: `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}` }) };
  storageApi.setProfileStoragePreparationFactoryForTests(async () => ({ base, router: await openProfileStorageRouter(base, control, { identity }) }));
  async function select(account: string) {
    storageApi.closeActiveProfileStorage(); await storageApi.prepareProfileStorage();
    const { profile } = await storageApi.selectPreparedAccountProfile(account);
    return storageApi.activatePreparedProfile(profile.id, profile.kind);
  }
  try {
    await select("weekly-fixture-a");
    await durableSession("a-session", "completed");
    assert.equal(count(await loadActivitySessionRecords()), 1);
    await assert.rejects(() => loadActivitySessionRecords({ getResult: async () => { await select("weekly-fixture-b"); return null; } }));
    assert.equal(count(await loadActivitySessionRecords()), 0);
    await select("weekly-fixture-a");
    assert.equal(count(await loadActivitySessionRecords()), 1);
    await assert.rejects(() => loadActivitySessionRecords({ getResult: async () => {
      await select("weekly-fixture-b");
      assert.equal(count(await loadActivitySessionRecords()), 0);
      await select("weekly-fixture-a");
      return null;
    } }));
    assert.equal(count(await loadActivitySessionRecords()), 1);
    // Hold only the archival read until all canonical read microtasks have drained.
    // This exercises the outer full-history fence after its nested reader succeeded.
    let releaseArchive!: () => void;
    const archiveGate = new Promise<void>(resolve => { releaseArchive = resolve; });
    let canonicalResultRead = false;
    const owner = createActivityReadOwner(() => loadActivityRecords({
      getResult: async () => { canonicalResultRead = true; return null; },
      getArchivalHistory: async () => { await archiveGate; await select("weekly-fixture-b"); return { ok: true, value: [] }; },
    }));
    const outcome = owner.resolve(owner.begin());
    await new Promise<void>(resolve => setImmediate(resolve));
    assert.equal(canonicalResultRead, true);
    releaseArchive();
    assert.equal((await outcome).kind, "error");
    assert.equal(count(await loadActivitySessionRecords()), 0);
  } finally { storageApi.closeActiveProfileStorage(); storageApi.setProfileStoragePreparationFactoryForTests(null); }
});
