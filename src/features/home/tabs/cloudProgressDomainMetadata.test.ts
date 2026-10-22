import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  createTrainingAttempt,
  type TrainingAttempt,
} from "../../../domain";
import { findTrackDescriptor, resolveTrackDomainMetadata } from "../../../domain/tracks/trackAdmission";
const CLAUDE_PROGRESS_DOMAIN_IDS = findTrackDescriptor(CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID)!.presentation.progressDomains.map(value => value.id);
const GOOGLE_CLOUD_PROGRESS_DOMAIN_IDS = findTrackDescriptor(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID)!.presentation.progressDomains.map(value => value.id);
function resolveCloudProgressDomainMetadata(trackId: string, id: string) { return resolveTrackDomainMetadata(findTrackDescriptor(trackId), id); }
import { contentPackageRuntimeOwner } from "../../../application/contentPackageRuntimeOwner";
import { buildProgressTabModel } from "./progressTabModel";
import { composeTrainingLifecycleUseCases } from "../../../application/bootstrap/trainingLifecycleComposition";
import { openCertificationPracticeSession, submitCertificationPracticeResponse } from "../../../application/certification/certificationSessionFacade";
import { projectProgressEvidence } from "../../../application/learningPlan/progressReadProjection";
import { productionTrackAdmissionContext } from "../../../application/tracks/trackAdmissionContext";
import { getReviewQueueItems, getTrainingAttempts } from "../../../storage/repositories";
import { installMemoryStorage } from "../../../testing/journalTestSupport";
import type { TrainingCatalog, TrainingQuestionSummary } from "../../../application/trainingLifecycle/contracts";

function domainAttempt(track: TrainingCatalog, question: TrainingQuestionSummary, id: string, kind: "correct" | "incorrect" | "partial" = "correct"): TrainingAttempt {
  const item = { trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  return createTrainingAttempt({ id, sessionId: "domain-session", trackId: track.trackId,
    modeId: "certification-focus-practice", occurrenceId: id, item, response: {},
    result: { kind, earnedPoints: kind === "correct" ? 1 : kind === "partial" ? 0.5 : 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [
      { axisId: "node", nodeId: question.nodeId }, { axisId: "mental_unit", nodeId: question.mentalUnitId },
    ] }, answeredAt: "2026-10-15T09:00:00.000Z", committedAt: "2026-10-15T09:00:00.000Z" });
}

function gcpProgress(attempts: readonly TrainingAttempt[]) {
  return projectProgressEvidence({ activeTrackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
    trainingAttempts: attempts, reviewQueueItems: [], now: "2026-10-15T12:00:00.000Z" });
}

const expectedClaudeTitles = [
  "Solution Design & Architecture",
  "Claude Models, Prompting & Context Engineering",
  "Integration",
  "Evaluation, Testing & Optimization",
  "Governance, Safety & Risk Management",
  "Stakeholder Communication & Lifecycle Management",
  "Developer Productivity & Operational Enablement",
] as const;

test("GCP production Focus answer contributes durable current-package Performance evidence", async () => {
  const storage = installMemoryStorage();
  const trackId = GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID;
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery(trackId).track;
  composeTrainingLifecycleUseCases({ sessionIds: { create: async () => "gcp-progress-production-session" } });
  const opened = await openCertificationPracticeSession({ trackId, modeId: "certification-focus-practice", requestedLength: 10, source: "gcp-progress-regression" });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") throw new Error("Expected a fresh isolated Focus session.");
  const item = opened.projection.session.itemOrder[0]!.item;
  const resolved = await contentPackageRuntimeOwner.resolveItem(item);
  const review = resolved.interactions.presentReview(resolved.question.questionId, null);
  const options = (review.model as { renderer?: { options?: readonly { id: string; selected: boolean }[] } }).renderer?.options ?? [];
  const selected = options.filter(option => option.selected).map(option => option.id);
  assert.ok(selected.length > 0, "The exact interaction must provide a legal correct response.");
  await submitCertificationPracticeResponse(resolved.question.interactionType === "choice_multiple"
    ? { type: "choice_multiple", optionIds: selected }
    : { type: "choice_single", optionId: selected[0]! });
  const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value;
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0]!.result.kind, "correct");
  assert.deepEqual(attempts[0]!.item, item);
  assert.equal(item.trackId, trackId);
  assert.equal(item.contentVersion, track.contentVersion);
  assert.equal(item.artifactSha256, track.artifactSha256);
  const question = track.getQuestion(item.questionId)!;
  assert.equal(question.contentDomainId, "gcp-ace-standard-domain-1");
  assert.equal(question.nodeId, attempts[0]!.reviewEvidence.taxonomyOrSkillRefs.find(ref => ref.axisId === "node")?.nodeId);
  assert.equal(attempts[0]!.reviewEvidence.taxonomyOrSkillRefs.some(ref => ref.axisId === "cloud-domain"), false);
  const input = { activeTrackId: trackId, activityRecords: [], trainingAttempts: attempts,
    reviewQueueItems: (await getReviewQueueItems(productionTrackAdmissionContext)).value, now: new Date().toISOString() };
  const before = [...storage.snapshot()];
  const projection = projectProgressEvidence(input);
  const model = buildProgressTabModel({ ...input, timezone: "UTC" });
  assert.deepEqual([...storage.snapshot()], before, "Progress reads preserve all durable records and journals.");
  assert.equal(projection.hasRecordedActivity, true);
  assert.deepEqual(projection.metrics.filter(metric => ["Total attempts", "Practice answers"].includes(metric.label)).map(metric => metric.value), [1, 1]);
  const metadata = resolveTrackDomainMetadata(findTrackDescriptor(trackId), "setup_environment");
  assert.equal(metadata.kind, "available");
  if (metadata.kind !== "available") throw new Error("Expected authored GCP domain metadata.");
  assert.deepEqual(projection.performanceScores, [{ id: "setup_environment", label: metadata.metadata.title,
    description: metadata.metadata.description, total: 1, correct: 1, percent: 100 }]);
  assert.deepEqual(model.performanceScores, projection.performanceScores);
});

test("GCP current question domains group correct, partial and incorrect answers once despite legacy refs", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID).track;
  const mapping = [
    ["gcp-ace-standard-domain-1", "setup_environment"],
    ["gcp-ace-standard-domain-2", "planning_implementation"],
    ["gcp-ace-standard-domain-3", "operations"],
    ["gcp-ace-standard-domain-4", "access_security"],
  ] as const;
  const questions = mapping.map(([source]) => {
    const question = track.questions.find(candidate => candidate.contentDomainId === source);
    assert.ok(question, `The installed package must contain ${source}.`);
    return question;
  });
  const correct = domainAttempt(track, questions[0]!, "domain-correct");
  const withLegacyRefs = createTrainingAttempt({ ...correct, reviewEvidence: { ...correct.reviewEvidence,
    taxonomyOrSkillRefs: [...correct.reviewEvidence.taxonomyOrSkillRefs,
      { axisId: "cloud-domain", nodeId: "operations", role: "primary" },
      { axisId: "cloud-domain", nodeId: "gcp-ace-standard-domain-4", role: "secondary" },
      { axisId: "cloud-domain", nodeId: "setup_environment", role: "legacy" }],
  } });
  const attempts = [withLegacyRefs, withLegacyRefs,
    domainAttempt(track, questions[0]!, "domain-partial", "partial"),
    domainAttempt(track, questions[0]!, "domain-incorrect", "incorrect"),
    ...questions.slice(1).map((question, index) => domainAttempt(track, question, `domain-${index + 2}`)),
  ];
  const before = JSON.stringify(attempts);
  const projection = gcpProgress(attempts);
  assert.equal(JSON.stringify(attempts), before, "Source evidence must remain unchanged.");
  assert.equal(projection.performanceScores.reduce((sum, score) => sum + score.total, 0), 6);
  assert.deepEqual(projection.performanceScores.map(({ id, correct, total, percent }) => ({ id, correct, total, percent })), [
    { id: "setup_environment", correct: 1, total: 3, percent: 33 },
    ...mapping.slice(1).map(([, id]) => ({ id, correct: 1, total: 1, percent: 100 })),
  ]);
  for (const score of projection.performanceScores) {
    const metadata = resolveCloudProgressDomainMetadata(track.trackId, score.id);
    assert.equal(metadata.kind, "available");
    if (metadata.kind !== "available") throw new Error("Expected authored GCP metadata.");
    assert.equal(score.label, metadata.metadata.title);
    assert.equal(score.description, metadata.metadata.description);
  }
  assert.throws(() => gcpProgress([correct, { ...correct, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } }]), /conflicting record identities/);
});

test("GCP historical, foreign-version, foreign-hash and foreign-track attempts cannot acquire current domain scores", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID).track;
  const current = domainAttempt(track, track.questions[0]!, "current");
  const foreignItems = [
    { ...current.item, contentVersion: "historical-version" },
    { ...current.item, artifactSha256: "0".repeat(64) },
    { ...current.item, contentVersion: "historical-version", artifactSha256: "0".repeat(64), questionId: "historical-only-question" },
  ];
  const historical = foreignItems.map((item, index) => createTrainingAttempt({ ...current, id: `foreign-pin-${index}`, item,
    reviewEvidence: { ...current.reviewEvidence, sourceItem: item } }));
  const foreignTrack = contentPackageRuntimeOwner.getPreparedDiscovery(CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID).track;
  const foreign = domainAttempt(foreignTrack, foreignTrack.questions[0]!, "foreign-track");
  assert.deepEqual(gcpProgress([...historical, foreign]).performanceScores, []);
  assert.deepEqual(gcpProgress([current, ...historical, foreign]).performanceScores, gcpProgress([current]).performanceScores);
  assert.throws(() => gcpProgress([{ ...current, item: { ...current.item, trackId: foreignTrack.trackId } }]), /Durable training attempt is invalid/);
});

test("GCP missing or unknown source domain has no fallback and a missing current question still refuses", async (context) => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const prepared = contentPackageRuntimeOwner.getPreparedDiscovery(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID);
  const question = prepared.track.questions[0]!;
  const attempt = domainAttempt(prepared.track, question, "domain-unavailable");
  let sourceQuestion: TrainingQuestionSummary | undefined = { ...question, contentDomainId: undefined };
  context.mock.method(contentPackageRuntimeOwner, "getPreparedDiscovery", () => ({ ...prepared,
    track: { ...prepared.track, getQuestion: (id: string) => id === question.questionId ? sourceQuestion : prepared.track.getQuestion(id) },
  }));
  assert.deepEqual(gcpProgress([attempt]).performanceScores, []);
  sourceQuestion = { ...question, contentDomainId: "unknown-domain" };
  assert.deepEqual(gcpProgress([attempt]).performanceScores, []);
  sourceQuestion = undefined;
  assert.throws(() => gcpProgress([attempt]), /absent from its verified package/);
});

test("Claude Progress metadata exactly covers the seven blueprint-linked node IDs", () => {
  assert.deepEqual(CLAUDE_PROGRESS_DOMAIN_IDS, [
    "solution_design_and_architecture",
    "model_prompt_and_context_decisions",
    "enterprise_tools_retrieval_and_integration",
    "evaluation_diagnosis_and_optimization",
    "governance_safety_and_risk_controls",
    "stakeholder_decisions_and_delivery_lifecycle",
    "team_workflows_and_operational_enablement",
  ]);
  assert.equal(new Set(CLAUDE_PROGRESS_DOMAIN_IDS).size, CLAUDE_PROGRESS_DOMAIN_IDS.length);
  assert.deepEqual(
    CLAUDE_PROGRESS_DOMAIN_IDS.map((id) => {
      const resolution = resolveCloudProgressDomainMetadata(CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID, id);
      assert.equal(resolution.kind, "available");
      return resolution.kind === "available" ? resolution.metadata.title : null;
    }),
    expectedClaudeTitles,
  );
});

test("Google Cloud Progress metadata exactly covers the four scoring domains", () => {
  assert.deepEqual(GOOGLE_CLOUD_PROGRESS_DOMAIN_IDS, [
    "setup_environment",
    "planning_implementation",
    "operations",
    "access_security",
  ]);
  for (const id of GOOGLE_CLOUD_PROGRESS_DOMAIN_IDS) {
    const resolution = resolveCloudProgressDomainMetadata(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, id);
    assert.equal(resolution.kind, "available");
    if (resolution.kind === "available") {
      assert.equal(resolution.metadata.id, id);
      assert.ok(resolution.metadata.title.length > 0);
      assert.ok(resolution.metadata.description.length > 0);
    }
  }
});

test("unknown, aliased, and cross-track IDs remain explicitly unavailable", () => {
  const cases = [
    [CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID, "ccarp-domain-1"],
    [CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID, "solution-design-and-architecture"],
    [CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID, "operations"],
    [GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, "solution_design_and_architecture"],
    [GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, "unknown"],
  ] as const;

  for (const [trackId, id] of cases) {
    assert.deepEqual(resolveCloudProgressDomainMetadata(trackId, id), { id, kind: "unavailable" });
  }
});

test("every authored title and description has exact EN and PL locale entries", () => {
  const en = JSON.parse(readFileSync("src/locales/en/common.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/common.json", "utf8")) as Record<string, string>;

  for (const [trackId, ids] of [
    [CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID, CLAUDE_PROGRESS_DOMAIN_IDS],
    [GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, GOOGLE_CLOUD_PROGRESS_DOMAIN_IDS],
  ] as const) {
    for (const id of ids) {
      const resolution = resolveCloudProgressDomainMetadata(trackId, id);
      assert.equal(resolution.kind, "available");
      if (resolution.kind !== "available") continue;
      for (const key of [resolution.metadata.title, resolution.metadata.description]) {
        assert.equal(en[key], key);
        assert.ok(typeof pl[key] === "string" && pl[key].length > 0, `Missing PL copy for ${key}`);
        assert.notEqual(pl[key], id);
      }
    }
  }

  for (const key of ["Domain metadata unavailable", "Domain metadata is unavailable for this evidence."]) {
    assert.equal(en[key], key);
    assert.ok(typeof pl[key] === "string" && pl[key].length > 0);
  }
});

test("Progress renders authored meaning in Current focus and Performance evidence", () => {
  const source = readFileSync("src/features/home/tabs/ProgressTab.tsx", "utf8");
  assert.match(source, /const focusDescription = focus \? undefined : model\.performanceScores\[0\]\?\.description/);
  assert.match(source, /focusDescription \? <Text[\s\S]*?t\(focusDescription\)/);
  assert.match(source, /score\.description \? <Text[\s\S]*?t\(score\.description\)/);
  assert.match(source, /largeTextLayout \? styles\.evidenceRowHeaderLargeText : null/);
  assert.match(source, /evidenceRowHeaderLargeText: \{ alignItems: "stretch", flexDirection: "column" \}/);
});

test("Claude Progress with zero attempts stays empty without inventing a score", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const model = buildProgressTabModel({
    activeTrackId: CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID,
    activityRecords: [],
    now: "2026-09-21T00:00:00.000Z",
    reviewQueueItems: [],
    trainingAttempts: [],
  });

  assert.equal(model.hasData, false);
  assert.deepEqual(model.performanceScores, []);
  assert.equal(model.weeklyActivity.kind, "ready");
  if (model.weeklyActivity.kind === "ready") assert.equal(model.weeklyActivity.completedSessionCount, 0);
});

test("all nine track Progress projections publish metadata before the shared UI", async () => {
  const { TRACK_DENSITY_DESCRIPTORS } = await import("../../../domain/tracks/trackAdmission");
  await contentPackageRuntimeOwner.verifyBundledPackages();
  for (const descriptor of TRACK_DENSITY_DESCRIPTORS) {
    const track = contentPackageRuntimeOwner.getPreparedDiscovery(descriptor.trackId).track;
    const question = track.questions[0]!;
    const item = { trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
    const attempt = createTrainingAttempt({
      id: `metadata:${track.trackId}`, sessionId: "metadata-session", trackId: track.trackId,
      modeId: track.modes[0]!.modeId, occurrenceId: "metadata-occurrence", item, response: {},
      result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
      reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [
        { axisId: "node", nodeId: question.nodeId, role: "primary" },
        ...(question.contentDomainId ? [{ axisId: "cloud-domain", nodeId: question.contentDomainId, role: "primary" as const }] : []),
      ] }, answeredAt: "2026-10-15T09:00:00.000Z", committedAt: "2026-10-15T09:00:00.000Z",
    });
    const input = { activeTrackId: descriptor.trackId, activityRecords: [], trainingAttempts: [attempt], reviewQueueItems: [], now: "2026-10-15T12:00:00.000Z", timezone: "UTC" };
    const evidence = projectProgressEvidence(input);
    const model = buildProgressTabModel(input);
    assert.deepEqual(model.performanceScores, evidence.performanceScores, "UI must preserve the application metadata");
    assert.ok(evidence.hasData, descriptor.trackId);
    for (const score of evidence.performanceScores) {
      const resolution = resolveTrackDomainMetadata(descriptor, score.id);
      assert.equal(score.label, resolution.kind === "available" ? resolution.metadata.title : "Domain metadata unavailable");
      if (resolution.kind === "unavailable") assert.equal(score.description, "Domain metadata is unavailable for this evidence.");
    }
    if (descriptor.internalFamily !== "coding_interview") assert.ok(evidence.performanceScores.length > 0, descriptor.trackId);
  }
});
