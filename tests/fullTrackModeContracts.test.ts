import assert from "node:assert/strict";
import test from "node:test";

import type { ReviewQueueEntry } from "../src/domain";
import { selectAlgorithmSessionPlan, ALGORITHM_MODE_IDS } from "../src/tracks/coding-interview";
import type { CertificationRuntimeCatalog } from "../src/tracks/certification";
import { createCertificationFullTrackTestRuntime, createCodingFullTrackTestRuntime, FULL_TRACK_INDEPENDENT_SCOPE_ID } from "./fullTrackRuntimeTestSupport";

const NOW = "2026-07-24T10:00:00.000Z";
const CERTIFICATION_TRACK_ID = "google-cloud-associate-cloud-engineer";
const GCP_FREE_NODE_ID = "organization_projects_policies_services_quotas_and_assets";

test("Independent Practice uses one declared scope, supports ten or twenty items, and never substitutes a scope", async () => {
  const { catalog } = await createCodingFullTrackTestRuntime();
  const prepare = (sessionLength: number, interleavedScopeId = FULL_TRACK_INDEPENDENT_SCOPE_ID) => selectAlgorithmSessionPlan({
    contentCatalog: catalog,
    mode: ALGORITHM_MODE_IDS.independentPractice,
    sessionLength,
    scope: { interleavedScopeId },
  });
  assert.equal(prepare(10).actualLength, 10);
  assert.equal(prepare(20).actualLength, 20);
  assert.throws(() => prepare(40), /does not support requested length 40/u);
  assert.throws(() => prepare(10, "unknown-scope"), /Unknown Algorithms interleaved scope/u);
  assert.throws(() => selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: ALGORITHM_MODE_IDS.independentPractice, sessionLength: 10 }), /requires an explicit declared structure identity/u);
});

test("Certification Diagnostic Baseline uses its immutable 40-item blueprint and rejects selectors", async () => {
  const { catalog, runtime } = await createCertificationFullTrackTestRuntime();
  const prepared = await runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-diagnostic-baseline", request: { sessionId: "diagnostic" }, attempts: [], reviews: [], now: NOW });
  assert.equal(prepared.session.requestedLength, 40);
  assert.equal(prepared.session.actualLength, 40);
  assert.deepEqual(prepared.session.itemOrder.map((entry) => entry.item.itemId), catalog.getDiagnosticBaseline().itemIds);
  assert.equal(prepared.session.configurationSnapshot.timer, "elapsedForeground");
  assert.equal(prepared.session.configurationSnapshot.feedbackMode, "afterEachAnswer");
  await assert.rejects(() => runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-diagnostic-baseline", request: { sessionId: "diagnostic-selector", requestedLength: 10 }, attempts: [], reviews: [], now: NOW }), /does not accept selectors/u);
});

test("Certification Focus Practice requires its package domain and never fills from a sibling domain", async () => {
  const { catalog, runtime } = await createCertificationFullTrackTestRuntime();
  await assert.rejects(() => runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-focus-practice", request: { sessionId: "focus-missing", requestedLength: 10 }, attempts: [], reviews: [], now: NOW }), /requires an explicit topic/u);
  const prepared = await runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-focus-practice", request: { sessionId: "focus", requestedLength: 40, domain: GCP_FREE_NODE_ID }, attempts: [], reviews: [], now: NOW });
  assert.equal(prepared.session.actualLength, 40);
  assert.ok(prepared.session.itemOrder.every((entry) => catalog.getItemById(entry.item.itemId).nodeId === GCP_FREE_NODE_ID));
  await assert.rejects(() => runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-focus-practice", request: { sessionId: "focus-sibling", requestedLength: 10, domain: "operations" }, attempts: [], reviews: [], now: NOW }), /content configuration is invalid|requires one domain declared by its installed blueprint/u);
});

test("Certification Scenario Practice requires a competency and never widens its approved scenario scope", async () => {
  const { catalog, runtime } = await createCertificationFullTrackTestRuntime();
  await assert.rejects(() => runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-scenario-practice", request: { sessionId: "scenario-missing", requestedLength: 10 }, attempts: [], reviews: [], now: NOW }), /requires exactly one explicit competency/u);
  const competency = catalog.getScenarioPractice().competencies[0]!;
  const prepared = await runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-scenario-practice", request: { sessionId: "scenario", requestedLength: 40, competency: competency.id }, attempts: [], reviews: [], now: NOW });
  assert.equal(prepared.session.requestedLength, 40);
  assert.equal(prepared.session.actualLength, competency.scenarioItemIds.length);
  assert.ok(prepared.session.itemOrder.every((entry) => competency.scenarioItemIds.includes(entry.item.itemId)));
  await assert.rejects(() => runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-scenario-practice", request: { sessionId: "scenario-domain", requestedLength: 10, competency: competency.id, domain: "setup_environment" }, attempts: [], reviews: [], now: NOW }), /requires exactly one explicit competency/u);
});

test("Certification Weak Area Review selects exact-package due evidence and resolves after two due successes", async () => {
  const { catalog, runtime } = await createCertificationFullTrackTestRuntime();
  const exact = reviewEntry(catalog, 0, "exact", "2026-07-24T09:00:00.000Z");
  const future = reviewEntry(catalog, 1, "future", "2026-07-25T09:00:00.000Z");
  const wrongPin = { ...reviewEntry(catalog, 2, "wrong-pin", "2026-07-24T08:00:00.000Z"), sourceItem: { ...reviewEntry(catalog, 2, "wrong-pin-copy", "2026-07-24T08:00:00.000Z").sourceItem, packagePin: { ...catalog.getPackagePin(), contentReleaseId: `${catalog.getPackagePin().contentReleaseId}-future` } } } satisfies ReviewQueueEntry;
  const prepared = await runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-weak-area-review", request: { sessionId: "weak-one", requestedLength: 20 }, attempts: [], reviews: [wrongPin, future, exact], now: NOW });
  assert.equal(prepared.session.actualLength, 1);
  assert.equal(prepared.firstOccurrence.itemId, exact.sourceItem.itemId);
  const question = catalog.getItemById(exact.sourceItem.itemId);
  const first = await runtime.submitPractice({ session: prepared.session, response: { kind: "option_selection", selectedOptionIds: question.correctOptionIds }, attempts: [], reviews: [exact], now: NOW });
  assert.equal(first.reviewMutations[0]?.kind, "upsert");
  const afterFirst = first.reviewMutations[0]!.entry;
  assert.equal(afterFirst.consecutiveAfterDueSuccesses, 1);
  const secondSession = await runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-weak-area-review", request: { sessionId: "weak-two", requestedLength: 10 }, attempts: [first.attempt], reviews: [afterFirst], now: "2026-07-24T11:00:00.000Z" });
  const second = await runtime.submitPractice({ session: secondSession.session, response: { kind: "option_selection", selectedOptionIds: question.correctOptionIds }, attempts: [first.attempt], reviews: [afterFirst], now: "2026-07-24T11:00:00.000Z" });
  assert.equal(second.reviewMutations[0]?.kind, "remove");
});

test("Certification Mixed Practice uses a deterministic unique interleaved blueprint and may shorten only within it", async () => {
  const { catalog, runtime } = await createCertificationFullTrackTestRuntime();
  const prepare = (sessionId: string, requestedLength: number) => runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-mixed-practice", request: { sessionId, requestedLength }, attempts: [], reviews: [], now: NOW });
  const [first, second] = await Promise.all([prepare("mixed-a", 20), prepare("mixed-b", 20)]);
  const expected = catalog.getMixedPractice().itemIds.slice(0, 20);
  assert.deepEqual(first.session.itemOrder.map((entry) => entry.item.itemId), expected);
  assert.deepEqual(second.session.itemOrder.map((entry) => entry.item.itemId), expected);
  assert.equal(new Set(expected).size, 20);
  await assert.rejects(() => prepare("mixed-invalid", 5), /requested length is not installed in this package/u);
  await assert.rejects(() => runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-mixed-practice", request: { sessionId: "mixed-selector", requestedLength: 10, domain: "setup_environment" }, attempts: [], reviews: [], now: NOW }), /does not accept selectors/u);
});

test("Certification Quick Review selects at most ten exact-package current due items without substitution", async () => {
  const { catalog, runtime } = await createCertificationFullTrackTestRuntime();
  const due = Array.from({ length: 12 }, (_, index) => reviewEntry(catalog, index, `due-${index}`, `2026-07-24T09:${String(index).padStart(2, "0")}:00.000Z`));
  const future = reviewEntry(catalog, 12, "future", "2026-07-25T09:00:00.000Z");
  const wrongPin = { ...reviewEntry(catalog, 13, "wrong-pin", "2026-07-24T08:00:00.000Z"), sourceItem: { ...reviewEntry(catalog, 13, "wrong-pin-copy", "2026-07-24T08:00:00.000Z").sourceItem, packagePin: { ...catalog.getPackagePin(), packageVersion: `${catalog.getPackagePin().packageVersion}-future` } } } satisfies ReviewQueueEntry;
  const prepared = await runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-quick-review", request: { sessionId: "quick" }, attempts: [], reviews: [wrongPin, ...due, future], now: NOW });
  assert.equal(prepared.session.actualLength, 10);
  assert.deepEqual(prepared.session.itemOrder.map((entry) => entry.item.itemId), due.slice(0, 10).map((entry) => entry.sourceItem.itemId));
  await assert.rejects(() => runtime.prepare({ trackId: CERTIFICATION_TRACK_ID, modeId: "certification-quick-review", request: { sessionId: "quick-empty" }, attempts: [], reviews: [wrongPin, future], now: NOW }), /no eligible due items; no substitute practice session was created/u);
});

function reviewEntry(catalog: CertificationRuntimeCatalog, itemIndex: number, id: string, dueAt: string): ReviewQueueEntry {
  const question = catalog.getItems()[itemIndex]!;
  return Object.freeze({
    id,
    trackId: CERTIFICATION_TRACK_ID,
    sourceAttemptId: `${id}:attempt`,
    sourceSessionId: `${id}:session`,
    reasons: Object.freeze(["incorrect"] as const),
    dueAt,
    createdAt: "2026-07-20T10:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
    sourceItem: catalog.toContentItemRef(question),
    taxonomyOrSkillRefs: Object.freeze([{ axisId: "cloud-domain", nodeId: question.domain }]),
  });
}
