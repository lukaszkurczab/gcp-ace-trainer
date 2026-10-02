import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { createInstance } from "i18next";
import { createTrainingAttempt, createTrainingSession, type TrainingAttempt } from "../domain";
import { loadCanonicalRuntimeCatalog } from "../content/canonical/runtimeCatalog";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { loadActivitySessionRecords, projectWeeklyAnsweredActivity, projectWeeklySessionActivity } from "./activityReadModels";
import { buildHomeOverviewMetrics } from "../features/home/tabs/homeOverviewPresentation";
import { addTrainingAttempt, getTrainingAttempts, saveTrainingSession } from "../storage/repositories";
import { installMemoryStorage } from "../testing/journalTestSupport";

const TRACK = "coding-interview-dsa-problem-solving";
const NOW = "2026-10-02T12:00:00.000Z";
const CONTEXT = { trackId: TRACK, now: NOW, timezone: "Europe/Warsaw" };
beforeEach(() => installMemoryStorage());

async function recordedAnswer(id: string, answeredAt = "2026-10-01T10:00:00.000Z", options: { trackId?: string; sessionId?: string; historical?: boolean } = {}) {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const trackId = options.trackId ?? TRACK;
  const track = contentPackageRuntimeOwner.getPreparedDiscovery(trackId).track;
  const item = { trackId, questionId: track.questions[0]!.questionId, contentVersion: options.historical ? "historical-fixture" : track.contentVersion, artifactSha256: options.historical ? "e".repeat(64) : track.artifactSha256 };
  const attempt = createTrainingAttempt({
    id, trackId, sessionId: options.sessionId ?? id, modeId: track.modes[0]!.modeId, occurrenceId: id,
    item, response: { answer: "fixture" }, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt, committedAt: answeredAt,
  });
  await addTrainingAttempt(attempt);
  return attempt;
}

async function weeklyMetric(context: typeof CONTEXT & { activeSessionId?: string } = CONTEXT) {
  return buildHomeOverviewMetrics({ ...context, reviewQueueItems: [], trainingAttempts: (await getTrainingAttempts()).value })[0]!;
}

function count(attempts: readonly TrainingAttempt[], context: typeof CONTEXT & { activeSessionId?: string } = CONTEXT) {
  const result = projectWeeklyAnsweredActivity(attempts, context);
  assert.equal(result.kind, "ready");
  return result.kind === "ready" ? result.answeredCount : -1;
}

test("actual artifact→repository→Home presenter includes local Monday before UTC Monday and excludes future answers", async () => {
  await recordedAnswer("local-monday", "2026-09-27T22:10:00.000Z");
  assert.deepEqual(await weeklyMetric({ ...CONTEXT, now: "2026-09-28T07:00:00.000Z" }), { label: "This week", value: "home.week.answersRecorded", count: 1 });
  installMemoryStorage();
  await recordedAnswer("future", "2026-10-03T12:00:00.000Z");
  assert.deepEqual(await weeklyMetric(), { label: "This week", value: "No activity yet" });
  await recordedAnswer("at-now", NOW);
  assert.equal((await weeklyMetric()).count, 1);
});

test("all nine canonical tracks use the same activity count without turning it into completion", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.equal(catalog.tracks.length, 9);
  for (const trackId of catalog.tracks) await recordedAnswer(trackId, undefined, { trackId });
  for (const trackId of catalog.tracks) assert.equal((await weeklyMetric({ ...CONTEXT, trackId })).count, 1, trackId);
});

test("active exclusion, ended-early history and old package facts remain distinct from completed sessions", async () => {
  const active = await recordedAnswer("active-answer", undefined, { sessionId: "active" });
  const ended = await recordedAnswer("ended-answer", undefined, { sessionId: "ended", historical: true });
  await recordedAnswer("earlier", "2026-09-20T10:00:00.000Z");
  for (const [id, status, item] of [["active", "active", active.item], ["ended", "abandoned", ended.item]] as const) {
    await saveTrainingSession(createTrainingSession({
      id, trackId: TRACK, modeId: active.modeId, status, configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0,
      itemOrder: [{ occurrenceId: `${id}-answer`, item }], optionOrderByOccurrence: {}, activeForegroundMs: 1000,
      contentVersion: item.contentVersion, artifactSha256: item.artifactSha256,
      startedAt: "2026-09-01T08:00:00.000Z", ...(status === "active" ? {} : { completedAt: "2026-10-01T10:01:00.000Z" }),
    }));
  }
  assert.equal((await weeklyMetric({ ...CONTEXT, activeSessionId: "active" })).count, 1);
  const sessions = projectWeeklySessionActivity(await loadActivitySessionRecords(), CONTEXT);
  assert.equal(sessions.kind, "ready");
  if (sessions.kind === "ready") assert.equal(sessions.completedSessionCount, 0);
});

test("civil Monday boundaries agree in Warsaw/Los Angeles and across both DST transitions", async () => {
  const cases = [
    ["2026-09-28T08:00:00.000Z", "2026-09-27T22:10:00.000Z", "Europe/Warsaw", 1],
    ["2026-09-28T08:00:00.000Z", "2026-09-27T22:10:00.000Z", "America/Los_Angeles", 0],
    ["2026-09-28T08:00:00.000Z", "2026-09-28T06:59:59.999Z", "America/Los_Angeles", 0],
    ["2026-09-28T08:00:00.000Z", "2026-09-28T07:00:00.000Z", "America/Los_Angeles", 1],
    ["2026-03-30T10:00:00.000Z", "2026-03-29T21:59:59.999Z", "Europe/Warsaw", 0],
    ["2026-03-30T10:00:00.000Z", "2026-03-29T22:00:00.000Z", "Europe/Warsaw", 1],
    ["2026-10-26T10:00:00.000Z", "2026-10-25T22:59:59.999Z", "Europe/Warsaw", 0],
    ["2026-10-26T10:00:00.000Z", "2026-10-25T23:00:00.000Z", "Europe/Warsaw", 1],
  ] as const;
  for (const [now, answeredAt, timezone, expected] of cases) {
    installMemoryStorage();
    await recordedAnswer("boundary", answeredAt);
    assert.equal(count((await getTrainingAttempts()).value, { ...CONTEXT, now, timezone }), expected, `${timezone}/${answeredAt}`);
  }
});

test("same question new attempts count separately, identical IDs once, conflicting IDs unavailable", async () => {
  const first = await recordedAnswer("first");
  const second = await recordedAnswer("second");
  assert.deepEqual(first.item, second.item);
  assert.equal(count([first, second, { ...first }]), 2);
  assert.deepEqual(projectWeeklyAnsweredActivity([first, { ...first, answeredAt: NOW }], CONTEXT), { kind: "unavailable", reason: "conflicting_attempt" });
});

test("invalid relevant record/context never becomes empty activity; repository corruption still throws", async () => {
  const first = await recordedAnswer("invalid");
  assert.deepEqual(projectWeeklyAnsweredActivity([first], { ...CONTEXT, now: "invalid" }), { kind: "unavailable", reason: "invalid_context" });
  assert.deepEqual(projectWeeklyAnsweredActivity([], { ...CONTEXT, timezone: "Mars/Olympus" }), { kind: "unavailable", reason: "invalid_context" });
  assert.deepEqual(projectWeeklyAnsweredActivity([{ ...first, answeredAt: "invalid" }], CONTEXT), { kind: "unavailable", reason: "invalid_record" });
  assert.deepEqual(buildHomeOverviewMetrics({ ...CONTEXT, trainingAttempts: [{ ...first, answeredAt: "invalid" }], reviewQueueItems: [] })[0], { label: "This week", value: "home.week.unavailable" });
  const invalidClock = buildHomeOverviewMetrics({ ...CONTEXT, now: "invalid", trainingAttempts: [first], reviewQueueItems: [] });
  assert.deepEqual(invalidClock.map(metric => metric.value), ["home.week.unavailable", "Review unavailable", "Activity unavailable"]);
  const storage = installMemoryStorage();
  await recordedAnswer("corrupt");
  const { STORAGE_KEYS } = await import("../storage/keys");
  storage.setString(STORAGE_KEYS.trainingAttempt("corrupt"), "{");
  await assert.rejects(getTrainingAttempts);
});

test("weekly text and accessibility label share real translated plural values in seven locales", async () => {
  for (const locale of ["en", "pl", "de", "fr", "es", "it", "et"]) {
    const dictionary = JSON.parse(readFileSync(`src/locales/${locale}/common.json`, "utf8"));
    const translator = createInstance();
    await translator.init({ lng: locale, fallbackLng: false, resources: { [locale]: { translation: dictionary } } });
    for (const count of [0, 1, 2, 5, 21, 22]) {
      const text = translator.t("home.week.answersRecorded", { count });
      assert.ok(text.includes(String(count)) && !text.includes("home.week") && !text.includes("{{"), `${locale}/${count}`);
    }
    assert.ok(!translator.t("home.week.unavailable").includes("home.week"));
    if (locale === "pl") {
      assert.equal(translator.t("home.week.answersRecorded", { count: 1 }), "1 zapisana odpowiedź");
      assert.equal(translator.t("home.week.answersRecorded", { count: 2 }), "2 zapisane odpowiedzi");
      assert.equal(translator.t("home.week.answersRecorded", { count: 5 }), "5 zapisanych odpowiedzi");
    }
  }
  const home = readFileSync("src/features/home/tabs/HomeTab.tsx", "utf8");
  assert.doesNotMatch(home, /startOfUtcWeek|weekAttempts|function buildOverviewMetrics/);
  assert.match(home, /buildHomeOverviewMetrics\(\{/);
  assert.match(home, /accessibilityLabel=\{`\$\{t\(metric.label\)\}: \$\{t\(metric.value, \{ count: metric.count \}\)\}`\}/);
  assert.match(home, /maxFontSizeMultiplier=\{2\}[^\n]*\{t\(metric.value, \{ count: metric.count \}\)\}/);
});

test("actual memory profile router separates A/B history and reconstructs A after storage reopening offline", async () => {
  const storageApi = await import("../infrastructure/storage/mmkvClient");
  const { openProfileStorageRouter } = await import("../infrastructure/storage/profileStorageRouter");
  const base = new storageApi.MemoryKeyValueStorage();
  const values = new Map<string, string>(); let sequence = 40;
  const control = { get: async (key: string) => values.get(key) ?? null, set: async (key: string, value: string) => { values.set(key, value); }, remove: async (key: string) => { values.delete(key); } };
  const identity = { create: async () => ({ installationId: "00000000-0000-4000-8000-000000000001", localDatasetId: `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}` }) };
  storageApi.setProfileStoragePreparationFactoryForTests(async () => ({ base, router: await openProfileStorageRouter(base, control, { identity }) }));
  async function select(account: string) {
    storageApi.closeActiveProfileStorage(); await storageApi.prepareProfileStorage();
    const { profile } = await storageApi.selectPreparedAccountProfile(account);
    return storageApi.activatePreparedProfile(profile.id, profile.kind);
  }
  try {
    await select("home-week-fixture-a");
    await recordedAnswer("a-answer");
    assert.equal((await weeklyMetric()).count, 1);
    await select("home-week-fixture-b");
    assert.deepEqual(await weeklyMetric(), { label: "This week", value: "No activity yet" });
    await recordedAnswer("b-one"); await recordedAnswer("b-two");
    assert.equal((await weeklyMetric()).count, 2);
    await select("home-week-fixture-a");
    assert.equal((await weeklyMetric()).count, 1);
    await select("home-week-fixture-a");
    assert.equal((await weeklyMetric()).count, 1);
  } finally { storageApi.closeActiveProfileStorage(); storageApi.setProfileStoragePreparationFactoryForTests(null); }
});
