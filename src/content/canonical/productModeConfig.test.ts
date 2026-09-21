import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolve } from "node:path";

import awsArtifact from "../generated/canonical-content/aws-certified-solutions-architect-associate.json";
import backendDesignArtifact from "../generated/canonical-content/backend-system-design-interview.json";
import claudeArtifact from "../generated/canonical-content/claude-certified-architect-professional-certification.json";
import codingArtifact from "../generated/canonical-content/coding-interview-dsa-problem-solving.json";
import frontendDesignArtifact from "../generated/canonical-content/frontend-system-design-interview.json";
import gcpArtifact from "../generated/canonical-content/google-cloud-associate-cloud-engineer.json";
import az104Artifact from "../generated/canonical-content/microsoft-azure-administrator-associate-az-104.json";
import ai901Artifact from "../generated/canonical-content/microsoft-azure-ai-fundamentals-ai-901.json";
import objectDesignArtifact from "../generated/canonical-content/object-oriented-design-interview.json";
import {
  PRODUCT_MODE_CONFIGS,
  ProductModeUnavailableError,
  getProductModeConfig,
  validateProductModeConfigs,
  validateProductModeConfigsAgainstArtifacts,
  type ProductModeArtifact,
  type ProductModeConfig,
} from "./productModeConfig";

const coding = "coding-interview-dsa-problem-solving";
const gcp = "google-cloud-associate-cloud-engineer";
const artifacts = [codingArtifact, backendDesignArtifact, objectDesignArtifact, frontendDesignArtifact, gcpArtifact, awsArtifact, az104Artifact, ai901Artifact, claudeArtifact] as readonly ProductModeArtifact[];
const designTracks = [
  { trackId: "backend-system-design-interview", profileId: "backend-system-design-interview-free-node-v1", freeNodeId: "requirements_capacity_and_architecture_decomposition" },
  { trackId: "object-oriented-design-interview", profileId: "object-oriented-design-interview-free-node-v1", freeNodeId: "requirements_use_cases_domain_vocabulary_and_model_boundaries" },
  { trackId: "frontend-system-design-interview", profileId: "frontend-system-design-interview-free-node-v1", freeNodeId: "requirements_user_journeys_constraints_and_frontend_decomposition" },
] as const;

type ProducerProfile = Readonly<{
  schemaVersion: string;
  profileId: string;
  profileVersion: string;
  trackId: string;
  familyId: string;
  freeNodeId: string;
  primaryEntry: Readonly<{ modeId: string; requestedLength: number }>;
  modes: readonly Readonly<{
    configurationId: string;
    configurationVersion: string;
    modeId: string;
    blueprintModeId: string;
    availability: string;
    requestedLengths: readonly number[];
    defaultRequestedLength: number;
    selection: Readonly<{
      kind: string;
      freeNodeId: string;
      itemSource: string;
      requireUniqueItemIds: boolean;
      reviewSources?: readonly string[];
      emptyEligibility?: string;
      shortening?: string;
    }>;
    reinsertPolicy: string;
  }>[];
}>;

test("ProductModeConfig preserves the complete available 9-track mode matrix", () => {
  const expected = [
    [coding, "coding-interview-learn-approach", [10]],
    [coding, "coding-interview-guided-practice", [10, 20, 40]],
    [coding, "coding-interview-custom-practice", [10, 20, 40]],
    [coding, "coding-interview-weak-area-review", [10, 20]],
    ...["backend-system-design-interview", "object-oriented-design-interview", "frontend-system-design-interview"].flatMap((trackId) => [
      [trackId, "design-interview-learn-framework", [1, 10]],
      [trackId, "design-interview-tradeoff-practice", [10, 20, 40]],
      [trackId, "design-interview-weak-area-review", [1, 10, 20]],
    ]),
    [gcp, "certification-diagnostic-baseline", [40]],
    [gcp, "certification-focus-practice", [10, 20, 40]],
    [gcp, "certification-weak-area-review", [10, 20]],
    [gcp, "certification-quick-review", [10]],
    ...([
      ["aws-certified-solutions-architect-associate", [10, 20, 40]],
      ["microsoft-azure-administrator-associate-az-104", [10, 20, 40]],
      ["microsoft-azure-ai-fundamentals-ai-901", [10, 20, 40]],
      ["claude-certified-architect-professional-certification", [10, 20, 40]],
    ] as const).flatMap(([trackId, focusLengths]) => [
      [trackId, "certification-focus-practice", focusLengths],
      [trackId, "certification-weak-area-review", [10, 20]],
      [trackId, "certification-quick-review", [focusLengths[0]]],
    ]),
  ];
  assert.deepEqual(PRODUCT_MODE_CONFIGS.map(({ trackId, modeId, requestedLengths }) => [trackId, modeId, [...requestedLengths]]), expected);
  assert.equal(PRODUCT_MODE_CONFIGS.length, 29);
  assert.equal(new Set(PRODUCT_MODE_CONFIGS.map(({ trackId }) => trackId)).size, 9);
  for (const entry of PRODUCT_MODE_CONFIGS) assert.deepEqual(Object.keys(entry).sort(), ["availability", "defaultRequestedLength", "feedbackTiming", "minimumActualLength", "modeId", "reinsertPolicy", "requestedLengths", "selection", "timer", "trackId"]);
});

test("ODK-097 app Design modes stay in parity with the current producer profiles", () => {
  const contentRoot = process.env.PATTERNLY_CONTENT_ROOT ?? resolve(process.cwd(), "../patternly-content");
  const modeIds = ["design-interview-learn-framework", "design-interview-tradeoff-practice", "design-interview-weak-area-review"] as const;

  for (const expected of designTracks) {
    const profile = JSON.parse(readFileSync(resolve(contentRoot, "config/free-node-experience-profiles", `${expected.trackId}.json`), "utf8")) as ProducerProfile;
    assert.equal(profile.schemaVersion, "patternly-free-node-experience-profile-v1");
    assert.equal(profile.profileId, expected.profileId);
    assert.equal(profile.profileVersion, "2");
    assert.equal(profile.trackId, expected.trackId);
    assert.equal(profile.familyId, "design_interview");
    assert.equal(profile.freeNodeId, expected.freeNodeId);
    assert.deepEqual(profile.primaryEntry, { modeId: modeIds[0], requestedLength: 10 });
    assert.deepEqual(profile.modes.map((mode) => mode.modeId), modeIds);
    assert.equal(new Set(profile.modes.map((mode) => mode.configurationId)).size, profile.modes.length);

    for (const producerMode of profile.modes) {
      const appMode = getProductModeConfig(expected.trackId, producerMode.modeId);
      assert.equal(appMode.trackId, expected.trackId);
      assert.equal(appMode.modeId, producerMode.modeId);
      assert.equal(producerMode.blueprintModeId, producerMode.modeId);
      assert.equal(producerMode.configurationVersion, producerMode.modeId === modeIds[0] ? "1" : "2");
      assert.equal(appMode.availability, producerMode.availability);
      assert.deepEqual(appMode.requestedLengths, producerMode.requestedLengths);
      assert.equal(appMode.defaultRequestedLength, producerMode.defaultRequestedLength);
      assert.equal(appMode.reinsertPolicy, producerMode.reinsertPolicy);
      assert.deepEqual(appMode.timer, { kind: "elapsed_foreground" });
      assert.equal(producerMode.selection.itemSource, "package_items");
      assert.equal(producerMode.selection.requireUniqueItemIds, true);
      assert.equal(producerMode.selection.freeNodeId, expected.freeNodeId);

      if (producerMode.selection.kind === "exact_free_node") {
        assert.equal(appMode.selection.kind, "node");
        if (appMode.selection.kind !== "node") throw new Error("Expected an exact app node selection.");
        assert.equal(appMode.selection.nodeId, producerMode.selection.freeNodeId);
      } else {
        assert.equal(producerMode.selection.kind, "free_node_review_evidence");
        assert.equal(appMode.selection.kind, "evidence_conditioned");
        if (appMode.selection.kind !== "evidence_conditioned") throw new Error("Expected an evidence-conditioned app selection.");
        assert.equal(appMode.selection.nodeId, producerMode.selection.freeNodeId);
        assert.deepEqual(appMode.selection.evidenceSources, producerMode.selection.reviewSources);
        assert.equal(appMode.minimumActualLength, 1);
        assert.equal(producerMode.selection.emptyEligibility, "unavailable");
        assert.equal(producerMode.selection.shortening, "truthful_to_eligible_count");
      }
    }
  }
});

test("mode policies preserve feedback, elapsed timer, reinsert and evidence behavior", () => {
  const custom = getProductModeConfig(coding, "coding-interview-custom-practice");
  assert.deepEqual(custom.feedbackTiming, { kind: "learner_selectable", default: "after_each_durable_submit", options: ["after_each_durable_submit", "after_session_completion"] });
  const claudeFocus = getProductModeConfig("claude-certified-architect-professional-certification", "certification-focus-practice");
  assert.deepEqual(claudeFocus.feedbackTiming, { kind: "learner_selectable", default: "after_each_durable_submit", options: ["after_each_durable_submit", "after_session_completion"] });
  for (const trackId of [gcp, "aws-certified-solutions-architect-associate", "microsoft-azure-administrator-associate-az-104", "microsoft-azure-ai-fundamentals-ai-901"] as const) {
    assert.deepEqual(getProductModeConfig(trackId, "certification-focus-practice").feedbackTiming, { kind: "fixed", value: "after_each_durable_submit" });
  }
  assert.equal(custom.reinsertPolicy, "conditional_after_incorrect");
  assert.deepEqual(custom.timer, { kind: "elapsed_foreground" });

  const codingWeak = getProductModeConfig(coding, "coding-interview-weak-area-review");
  assert.deepEqual(codingWeak.selection, { kind: "evidence_conditioned", nodeId: "complexity_and_constraints", evidenceSources: ["due_queue", "committed_session_misses"] });
  for (const entry of PRODUCT_MODE_CONFIGS.filter(({ availability, modeId }) => availability === "evidence_conditioned" && !(modeId === "coding-interview-weak-area-review"))) {
    assert.equal(entry.selection.kind, "evidence_conditioned");
    if (entry.selection.kind === "evidence_conditioned") assert.deepEqual(entry.selection.evidenceSources, ["due_queue"]);
  }
});

test("selection pools are non-empty, local, and large enough for every requested length", () => {
  assert.deepEqual(validateProductModeConfigsAgainstArtifacts(PRODUCT_MODE_CONFIGS, artifacts), PRODUCT_MODE_CONFIGS);
  const artifactByTrack = new Map(artifacts.map((artifact) => [artifact.trackId, artifact]));
  const expectedFreePoolSizes = new Map<string, number>([
    [coding, 158], ["backend-system-design-interview", 145], ["object-oriented-design-interview", 136],
    ["frontend-system-design-interview", 150], [gcp, 136], ["aws-certified-solutions-architect-associate", 40],
    ["microsoft-azure-administrator-associate-az-104", 132], ["microsoft-azure-ai-fundamentals-ai-901", 144],
    ["claude-certified-architect-professional-certification", 48],
  ]);
  for (const entry of PRODUCT_MODE_CONFIGS) {
    const artifact = artifactByTrack.get(entry.trackId)!;
    const selection = entry.selection;
    const selected = selection.kind === "exact_ordered_questions"
      ? selection.questionIds.map((id) => artifact.questions.find((question) => question.questionId === id)!)
      : artifact.questions.filter((question) => question.nodeId === selection.nodeId);
    assert.equal(selected.length, entry.selection.kind === "exact_ordered_questions" ? 40 : expectedFreePoolSizes.get(entry.trackId));
    assert.ok(selected.every((question) => question.trackId === entry.trackId));
    assert.ok(Math.max(...entry.requestedLengths) <= selected.length);
  }
});

test("GCP Diagnostic preserves the verified exact ordered 40-question plan", () => {
  const diagnostic = getProductModeConfig(gcp, "certification-diagnostic-baseline");
  assert.equal(diagnostic.selection.kind, "exact_ordered_questions");
  if (diagnostic.selection.kind !== "exact_ordered_questions") throw new Error("Expected exact selection.");
  assert.equal(diagnostic.selection.questionIds.length, 40);
  assert.equal(new Set(diagnostic.selection.questionIds).size, 40);
  assert.deepEqual(diagnostic.selection.questionIds.slice(0, 3), ["gcp-ace-gcpace-n01-b02-001", "gcp-ace-gcpace-n01-b02-002", "gcp-ace-gcpace-n01-b02-003"]);
  assert.deepEqual(diagnostic.selection.questionIds.slice(-3), ["gcp-ace-gcpace-n01-b03-020", "gcp-ace-gcpace-n01-b04-001", "gcp-ace-gcpace-n01-b04-002"]);
});

test("declared but uninstalled modes fail closed with a stable unavailable error", () => {
  for (const [trackId, modeId] of [
    [coding, "coding-interview-recognize-patterns"],
    ["backend-system-design-interview", "design-interview-guided-case"],
    [gcp, "certification-mixed-practice"],
    ["aws-certified-solutions-architect-associate", "certification-diagnostic-baseline"],
  ]) {
    assert.throws(() => getProductModeConfig(trackId!, modeId!), (error: unknown) => error instanceof ProductModeUnavailableError && error.code === "product_mode_unavailable");
  }
});

test("validated production configuration is recursively immutable", () => {
  const custom = getProductModeConfig(coding, "coding-interview-custom-practice");
  assert.ok(Object.isFrozen(PRODUCT_MODE_CONFIGS));
  assert.ok(Object.isFrozen(custom));
  assert.ok(Object.isFrozen(custom.requestedLengths));
  assert.ok(Object.isFrozen(custom.feedbackTiming));
  assert.ok(Object.isFrozen(custom.selection));
});

test("validator rejects duplicate, missing, additional, and non-canonical config shapes", () => {
  const base = cloneConfigs();
  assert.throws(() => validateProductModeConfigs([...base, base[0]!]), /Duplicate/u);
  assert.throws(() => validateProductModeConfigs(base.slice(1)), /missing/u);
  assert.throws(() => validateProductModeConfigs([...base, { ...base[0]!, modeId: "declared-but-unavailable" }]), /Unexpected or unavailable/u);
  const extra = { ...base[0]!, unexpected: true } as unknown as ProductModeConfig;
  assert.throws(() => validateProductModeConfigs([extra, ...base.slice(1)]), /exactly the canonical fields/u);
});

test("validator rejects foreign identities, empty pools, bad lengths, and policy mismatches", () => {
  assertConfigMutationRejected(0, (entry) => ({ ...entry, trackId: "foreign-track" }), /Unexpected or unavailable/u);
  assertConfigMutationRejected(0, (entry) => ({ ...entry, selection: { kind: "node", nodeId: "foreign-node" } }), /empty canonical pool|product policy/u);
  assertConfigMutationRejected(0, (entry) => ({ ...entry, selection: { kind: "node", nodeId: "complexity_and_constraints", mentalUnitId: "foreign-mu" } }), /foreign mental unit|product policy/u);
  assertConfigMutationRejected(0, (entry) => ({ ...entry, requestedLengths: [] }), /invalid requested lengths|product policy/u);
  assertConfigMutationRejected(0, (entry) => ({ ...entry, requestedLengths: [999] }), /invalid default or minimum|product policy/u);
  assertConfigMutationRejected(0, (entry) => ({ ...entry, defaultRequestedLength: 20 }), /invalid default|product policy/u);
  assertConfigMutationRejected(0, (entry) => ({ ...entry, minimumActualLength: 0 }), /invalid default or minimum|product policy/u);
  assertConfigMutationRejected(0, (entry) => ({ ...entry, reinsertPolicy: "conditional_after_incorrect" }), /product policy/u);
  assertConfigMutationRejected(0, (entry) => ({ ...entry, availability: "evidence_conditioned" }), /mismatched availability|product policy/u);
});

test("validator rejects foreign questions, Diagnostic reordering, bad evidence and unsupported interactions", () => {
  const diagnosticIndex = cloneConfigs().findIndex(({ modeId }) => modeId === "certification-diagnostic-baseline");
  assertConfigMutationRejected(diagnosticIndex, (entry) => ({ ...entry, selection: { kind: "exact_ordered_questions", questionIds: ["foreign-question", ...((entry.selection as unknown as { questionIds: string[] }).questionIds.slice(1))] } }), /foreign question|product policy/u);
  assertConfigMutationRejected(diagnosticIndex, (entry) => { const ids = [...(entry.selection as unknown as { questionIds: string[] }).questionIds]; [ids[0], ids[1]] = [ids[1]!, ids[0]!]; return { ...entry, selection: { kind: "exact_ordered_questions", questionIds: ids } }; }, /product policy/u);
  const weakIndex = cloneConfigs().findIndex(({ trackId, modeId }) => trackId === gcp && modeId === "certification-weak-area-review");
  assertConfigMutationRejected(weakIndex, (entry) => ({ ...entry, selection: { ...(entry.selection as object), kind: "evidence_conditioned", evidenceSources: [] } as unknown as ProductModeConfig["selection"] }), /evidence sources|product policy/u);

  const invalidInteraction = structuredClone(artifacts) as ProductModeArtifact[];
  (invalidInteraction[0]!.questions[0]!.interaction as { type: string }).type = "unsupported";
  assert.throws(() => validateProductModeConfigsAgainstArtifacts(cloneConfigs(), invalidInteraction), /unsupported interaction/u);
  const foreignQuestions = structuredClone(artifacts) as ProductModeArtifact[];
  (foreignQuestions[0]!.questions[0] as { trackId: string }).trackId = "foreign-track";
  assert.throws(() => validateProductModeConfigsAgainstArtifacts(cloneConfigs(), foreignQuestions), /invalid question identity/u);
});

test("validator rejects missing, duplicate, empty and foreign canonical artifacts", () => {
  assert.throws(() => validateProductModeConfigsAgainstArtifacts(cloneConfigs(), artifacts.slice(1)), /missing a canonical launch track/u);
  assert.throws(() => validateProductModeConfigsAgainstArtifacts(cloneConfigs(), [...artifacts, artifacts[0]!]), /nine exact/u);
  const empty = structuredClone(artifacts) as ProductModeArtifact[];
  empty[0] = { ...empty[0]!, questions: [] };
  assert.throws(() => validateProductModeConfigsAgainstArtifacts(cloneConfigs(), empty), /non-empty/u);

  const extraTopLevel = structuredClone(artifacts) as unknown as Array<ProductModeArtifact & { extra?: boolean }>;
  extraTopLevel[0]!.extra = true;
  assert.throws(() => validateProductModeConfigsAgainstArtifacts(cloneConfigs(), extraTopLevel), /nine exact/u);

  for (const field of ["trackId", "questionId", "nodeId", "mentalUnitId"] as const) {
    const numericIdentity = structuredClone(artifacts) as unknown as ProductModeArtifact[];
    (numericIdentity[0]!.questions[0] as unknown as Record<string, unknown>)[field] = 42;
    assert.throws(() => validateProductModeConfigsAgainstArtifacts(cloneConfigs(), numericIdentity), /invalid question identity/u);
  }
  for (const unsafe of ["../unsafe", ".", "\u2000unsafe", "unsafe\u0000identity"]) {
    for (const field of ["trackId", "questionId", "nodeId", "mentalUnitId"] as const) {
      const unsafeQuestion = structuredClone(artifacts) as unknown as ProductModeArtifact[];
      (unsafeQuestion[0]!.questions[0] as unknown as Record<string, unknown>)[field] = unsafe;
      assert.throws(() => validateProductModeConfigsAgainstArtifacts(cloneConfigs(), unsafeQuestion), /invalid question identity/u);
    }
    const unsafeVersion = structuredClone(artifacts) as unknown as ProductModeArtifact[];
    (unsafeVersion[0] as unknown as Record<string, unknown>).contentVersion = unsafe;
    assert.throws(() => validateProductModeConfigsAgainstArtifacts(cloneConfigs(), unsafeVersion), /safe identities/u);
  }
});

function cloneConfigs(): ProductModeConfig[] { return structuredClone(PRODUCT_MODE_CONFIGS) as ProductModeConfig[]; }
function assertConfigMutationRejected(index: number, mutate: (entry: ProductModeConfig) => ProductModeConfig, pattern: RegExp): void {
  const configs = cloneConfigs();
  configs[index] = mutate(configs[index]!);
  assert.throws(() => validateProductModeConfigs(configs), pattern);
}
