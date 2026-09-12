import { isCanonicalSafeIdentity } from "./questionValidation";

export type ProductModeAvailability = "immediate" | "evidence_conditioned";
export type ProductFeedbackTiming =
  | Readonly<{ kind: "fixed"; value: "after_each_durable_submit" }>
  | Readonly<{
      kind: "learner_selectable";
      default: "after_each_durable_submit";
      options: readonly ["after_each_durable_submit", "after_session_completion"];
    }>;
export type ProductTimer = Readonly<{ kind: "elapsed_foreground" }>;
export type ProductReinsertPolicy = "disabled" | "conditional_after_incorrect";
export type ProductModeSelection =
  | Readonly<{ kind: "node"; nodeId: string; mentalUnitId?: string }>
  | Readonly<{ kind: "exact_ordered_questions"; questionIds: readonly string[] }>
  | Readonly<{
      kind: "evidence_conditioned";
      nodeId: string;
      evidenceSources: readonly ("due_queue" | "committed_session_misses")[];
    }>;

/** minimumActualLength is the nominal profile minimum; evidence modes may truthfully shorten to any non-empty eligible subset. */
export type ProductModeConfig = Readonly<{
  trackId: string;
  modeId: string;
  availability: ProductModeAvailability;
  requestedLengths: readonly number[];
  minimumActualLength: number;
  defaultRequestedLength: number;
  feedbackTiming: ProductFeedbackTiming;
  timer: ProductTimer;
  reinsertPolicy: ProductReinsertPolicy;
  selection: ProductModeSelection;
}>;

export type ProductModeArtifact = Readonly<{
  schemaVersion: string;
  trackId: string;
  contentVersion: string;
  questions: readonly Readonly<{
    trackId: string;
    nodeId: string;
    mentalUnitId: string;
    questionId: string;
    interaction: Readonly<{ type: string }>;
  }>[];
}>;

export class ProductModeUnavailableError extends Error {
  readonly code = "product_mode_unavailable" as const;
}

const FIXED_FEEDBACK = Object.freeze({ kind: "fixed", value: "after_each_durable_submit" } as const);
const SELECTABLE_FEEDBACK = Object.freeze({
  kind: "learner_selectable",
  default: "after_each_durable_submit",
  options: Object.freeze(["after_each_durable_submit", "after_session_completion"] as const),
} as const);
const ELAPSED_TIMER = Object.freeze({ kind: "elapsed_foreground" } as const);

const TRACKS = Object.freeze({
  coding: Object.freeze({ id: "coding-interview-dsa-problem-solving", freeNodeId: "complexity_and_constraints" }),
  backend: Object.freeze({ id: "backend-system-design-interview", freeNodeId: "requirements_capacity_and_architecture_decomposition" }),
  object: Object.freeze({ id: "object-oriented-design-interview", freeNodeId: "requirements_use_cases_domain_vocabulary_and_model_boundaries" }),
  frontend: Object.freeze({ id: "frontend-system-design-interview", freeNodeId: "requirements_user_journeys_constraints_and_frontend_decomposition" }),
  gcp: Object.freeze({ id: "google-cloud-associate-cloud-engineer", freeNodeId: "organization_projects_policies_services_quotas_and_assets" }),
  aws: Object.freeze({ id: "aws-certified-solutions-architect-associate", freeNodeId: "aws_secure_architecture_foundations" }),
  az104: Object.freeze({ id: "microsoft-azure-administrator-associate-az-104", freeNodeId: "entra_identity_lifecycle_and_authentication" }),
  ai901: Object.freeze({ id: "microsoft-azure-ai-fundamentals-ai-901", freeNodeId: "responsible_ai_model_foundations_and_deployment_choices" }),
  claude: Object.freeze({ id: "claude-certified-architect-professional-certification", freeNodeId: "solution_design_and_architecture" }),
} as const);

const GCP_DIAGNOSTIC_QUESTION_IDS = Object.freeze([
  "gcp-ace-gcpace-n01-b02-001", "gcp-ace-gcpace-n01-b02-002", "gcp-ace-gcpace-n01-b02-003", "gcp-ace-gcpace-n01-b02-004",
  "gcp-ace-gcpace-n01-b02-005", "gcp-ace-gcpace-n01-b02-006", "gcp-ace-gcpace-n01-b02-007", "gcp-ace-gcpace-n01-b02-008",
  "gcp-ace-gcpace-n01-b02-009", "gcp-ace-gcpace-n01-b02-010", "gcp-ace-gcpace-n01-b02-011", "gcp-ace-gcpace-n01-b02-012",
  "gcp-ace-gcpace-n01-b02-013", "gcp-ace-gcpace-n01-b02-014", "gcp-ace-gcpace-n01-b02-015", "gcp-ace-gcpace-n01-b02-016",
  "gcp-ace-gcpace-n01-b02-017", "gcp-ace-gcpace-n01-b02-018", "gcp-ace-gcpace-n01-b03-001", "gcp-ace-gcpace-n01-b03-002",
  "gcp-ace-gcpace-n01-b03-003", "gcp-ace-gcpace-n01-b03-004", "gcp-ace-gcpace-n01-b03-005", "gcp-ace-gcpace-n01-b03-006",
  "gcp-ace-gcpace-n01-b03-007", "gcp-ace-gcpace-n01-b03-008", "gcp-ace-gcpace-n01-b03-009", "gcp-ace-gcpace-n01-b03-010",
  "gcp-ace-gcpace-n01-b03-011", "gcp-ace-gcpace-n01-b03-012", "gcp-ace-gcpace-n01-b03-013", "gcp-ace-gcpace-n01-b03-014",
  "gcp-ace-gcpace-n01-b03-015", "gcp-ace-gcpace-n01-b03-016", "gcp-ace-gcpace-n01-b03-017", "gcp-ace-gcpace-n01-b03-018",
  "gcp-ace-gcpace-n01-b03-019", "gcp-ace-gcpace-n01-b03-020", "gcp-ace-gcpace-n01-b04-001", "gcp-ace-gcpace-n01-b04-002",
] as const);

const nodeSelection = (nodeId: string): ProductModeSelection => ({ kind: "node", nodeId });
const reviewSelection = (nodeId: string, coding = false): ProductModeSelection => ({
  kind: "evidence_conditioned",
  nodeId,
  evidenceSources: coding ? ["due_queue", "committed_session_misses"] : ["due_queue"],
});

type ConfigInput = Omit<ProductModeConfig, "feedbackTiming" | "timer"> & Readonly<{ feedbackTiming?: ProductFeedbackTiming }>;
const config = (input: ConfigInput): ProductModeConfig => ({ ...input, feedbackTiming: input.feedbackTiming ?? FIXED_FEEDBACK, timer: ELAPSED_TIMER });

const designConfigs = (trackId: string, nodeId: string): readonly ProductModeConfig[] => [
  config({ trackId, modeId: "design-interview-learn-framework", availability: "immediate", requestedLengths: [1, 10], minimumActualLength: 1, defaultRequestedLength: 10, reinsertPolicy: "disabled", selection: nodeSelection(nodeId) }),
  config({ trackId, modeId: "design-interview-tradeoff-practice", availability: "immediate", requestedLengths: [1, 10], minimumActualLength: 1, defaultRequestedLength: 10, reinsertPolicy: "disabled", selection: nodeSelection(nodeId) }),
  config({ trackId, modeId: "design-interview-weak-area-review", availability: "evidence_conditioned", requestedLengths: [1, 10], minimumActualLength: 1, defaultRequestedLength: 10, reinsertPolicy: "disabled", selection: reviewSelection(nodeId) }),
];

const certificationConfigs = (trackId: string, nodeId: string, lengths: readonly number[], minimum: number): readonly ProductModeConfig[] => [
  config({ trackId, modeId: "certification-focus-practice", availability: "immediate", requestedLengths: lengths, minimumActualLength: minimum, defaultRequestedLength: minimum, reinsertPolicy: "disabled", selection: nodeSelection(nodeId) }),
  config({ trackId, modeId: "certification-weak-area-review", availability: "evidence_conditioned", requestedLengths: lengths.length === 1 ? lengths : [10, 20], minimumActualLength: minimum, defaultRequestedLength: minimum, reinsertPolicy: "disabled", selection: reviewSelection(nodeId) }),
  config({ trackId, modeId: "certification-quick-review", availability: "evidence_conditioned", requestedLengths: [minimum], minimumActualLength: minimum, defaultRequestedLength: minimum, reinsertPolicy: "disabled", selection: reviewSelection(nodeId) }),
];

const CANDIDATE_CONFIGS: readonly ProductModeConfig[] = [
  config({ trackId: TRACKS.coding.id, modeId: "coding-interview-learn-approach", availability: "immediate", requestedLengths: [10], minimumActualLength: 10, defaultRequestedLength: 10, reinsertPolicy: "disabled", selection: nodeSelection(TRACKS.coding.freeNodeId) }),
  config({ trackId: TRACKS.coding.id, modeId: "coding-interview-guided-practice", availability: "immediate", requestedLengths: [10, 20, 40], minimumActualLength: 10, defaultRequestedLength: 10, reinsertPolicy: "conditional_after_incorrect", selection: nodeSelection(TRACKS.coding.freeNodeId) }),
  config({ trackId: TRACKS.coding.id, modeId: "coding-interview-custom-practice", availability: "immediate", requestedLengths: [10, 20, 40], minimumActualLength: 10, defaultRequestedLength: 10, feedbackTiming: SELECTABLE_FEEDBACK, reinsertPolicy: "conditional_after_incorrect", selection: nodeSelection(TRACKS.coding.freeNodeId) }),
  config({ trackId: TRACKS.coding.id, modeId: "coding-interview-weak-area-review", availability: "evidence_conditioned", requestedLengths: [10, 20], minimumActualLength: 10, defaultRequestedLength: 10, reinsertPolicy: "conditional_after_incorrect", selection: reviewSelection(TRACKS.coding.freeNodeId, true) }),
  ...designConfigs(TRACKS.backend.id, TRACKS.backend.freeNodeId),
  ...designConfigs(TRACKS.object.id, TRACKS.object.freeNodeId),
  ...designConfigs(TRACKS.frontend.id, TRACKS.frontend.freeNodeId),
  config({ trackId: TRACKS.gcp.id, modeId: "certification-diagnostic-baseline", availability: "immediate", requestedLengths: [40], minimumActualLength: 40, defaultRequestedLength: 40, reinsertPolicy: "disabled", selection: { kind: "exact_ordered_questions", questionIds: GCP_DIAGNOSTIC_QUESTION_IDS } }),
  ...certificationConfigs(TRACKS.gcp.id, TRACKS.gcp.freeNodeId, [10, 20, 40], 10),
  ...certificationConfigs(TRACKS.aws.id, TRACKS.aws.freeNodeId, [4], 4),
  ...certificationConfigs(TRACKS.az104.id, TRACKS.az104.freeNodeId, [10, 20, 40], 10),
  ...certificationConfigs(TRACKS.ai901.id, TRACKS.ai901.freeNodeId, [10, 20, 40], 10),
  ...certificationConfigs(TRACKS.claude.id, TRACKS.claude.freeNodeId, [10, 20, 40], 10),
];

const EXPECTED_CONFIG_BY_KEY = new Map(CANDIDATE_CONFIGS.map((entry) => [key(entry.trackId, entry.modeId), entry]));
const CONFIG_KEYS = ["availability", "defaultRequestedLength", "feedbackTiming", "minimumActualLength", "modeId", "reinsertPolicy", "requestedLengths", "selection", "timer", "trackId"].sort();
const ARTIFACT_KEYS = ["contentVersion", "questions", "schemaVersion", "trackId"].sort();
const SUPPORTED_INTERACTIONS = new Set(["choice_single", "choice_multiple", "ordering", "complexity", "decision_matrix"]);

export function validateProductModeConfigs(configs: readonly ProductModeConfig[]): readonly ProductModeConfig[] {
  const seen = new Set<string>();
  for (const entry of configs) validateConfigPolicy(entry, seen);
  if (seen.size !== EXPECTED_CONFIG_BY_KEY.size || [...EXPECTED_CONFIG_BY_KEY.keys()].some((entryKey) => !seen.has(entryKey))) throw new Error("ProductModeConfig catalog is missing a required available mode.");
  return deepFreeze(JSON.parse(JSON.stringify(configs)) as ProductModeConfig[]);
}

export function validateProductModeConfigsAgainstArtifacts(configs: readonly ProductModeConfig[], artifacts: readonly ProductModeArtifact[]): readonly ProductModeConfig[] {
  const validatedConfigs = validateProductModeConfigs(configs);
  const artifactByTrack = new Map<string, ProductModeArtifact>();
  for (const artifact of artifacts) {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact) || Object.keys(artifact).sort().join("|") !== ARTIFACT_KEYS.join("|") || artifact.schemaVersion !== "patternly-content-artifact-v1" || !isCanonicalSafeIdentity(artifact.trackId) || !isCanonicalSafeIdentity(artifact.contentVersion) || artifactByTrack.has(artifact.trackId) || !Array.isArray(artifact.questions) || artifact.questions.length === 0) throw new Error("Product mode artifacts must contain nine exact, unique, non-empty canonical tracks with safe identities.");
    artifactByTrack.set(artifact.trackId, artifact);
  }
  if (artifactByTrack.size !== 9 || Object.values(TRACKS).some((track) => !artifactByTrack.has(track.id))) throw new Error("Product mode artifacts are missing a canonical launch track.");

  for (const entry of validatedConfigs) {
    const entryKey = key(entry.trackId, entry.modeId);
    const artifact = artifactByTrack.get(entry.trackId);
    if (!artifact) throw new Error(`ProductModeConfig ${entryKey} references a foreign track.`);
    validateArtifactQuestions(artifact);
    const pool = selectionPool(entry.selection, artifact);
    if (pool.length === 0) throw new Error(`ProductModeConfig ${entryKey} has an empty canonical pool.`);
    if (entry.selection.kind === "exact_ordered_questions" && pool.some((question) => question.nodeId !== TRACKS.gcp.freeNodeId)) throw new Error("GCP Diagnostic questions must belong to its canonical Free node.");
    if (entry.requestedLengths.some((length) => length > pool.length)) throw new Error(`ProductModeConfig ${entryKey} has a requested length larger than its canonical pool.`);
  }
  return validatedConfigs;
}

export const PRODUCT_MODE_CONFIGS = validateProductModeConfigs(CANDIDATE_CONFIGS);

const CONFIG_BY_KEY = new Map(PRODUCT_MODE_CONFIGS.map((entry) => [key(entry.trackId, entry.modeId), entry]));

export function getProductModeConfig(trackId: string, modeId: string): ProductModeConfig {
  const result = CONFIG_BY_KEY.get(key(trackId, modeId));
  if (!result) throw new ProductModeUnavailableError(`Product mode ${trackId}/${modeId} is unavailable.`);
  return result;
}

function validateArtifactQuestions(artifact: ProductModeArtifact): void {
  const ids = new Set<string>();
  for (const question of artifact.questions) {
    if (!question || typeof question !== "object" || Array.isArray(question) || !isCanonicalSafeIdentity(question.trackId) || question.trackId !== artifact.trackId || !isCanonicalSafeIdentity(question.questionId) || ids.has(question.questionId) || !isCanonicalSafeIdentity(question.nodeId) || !isCanonicalSafeIdentity(question.mentalUnitId)) throw new Error(`Canonical artifact ${artifact.trackId} has invalid question identity.`);
    if (!question.interaction || typeof question.interaction !== "object" || typeof question.interaction.type !== "string" || !SUPPORTED_INTERACTIONS.has(question.interaction.type)) throw new Error(`Canonical artifact ${artifact.trackId} requires an unsupported interaction.`);
    ids.add(question.questionId);
  }
}

function validateConfigPolicy(entry: ProductModeConfig, seen: Set<string>): void {
  if (!entry || typeof entry !== "object" || Array.isArray(entry) || Object.keys(entry).sort().join("|") !== CONFIG_KEYS.join("|")) throw new Error("ProductModeConfig must contain exactly the canonical fields.");
  const entryKey = key(entry.trackId, entry.modeId);
  if (seen.has(entryKey)) throw new Error(`Duplicate ProductModeConfig ${entryKey}.`);
  seen.add(entryKey);
  const expected = EXPECTED_CONFIG_BY_KEY.get(entryKey);
  if (!expected) throw new Error(`Unexpected or unavailable ProductModeConfig ${entryKey}.`);
  if (!entry.requestedLengths.length || entry.requestedLengths.some((length) => !Number.isSafeInteger(length) || length <= 0) || new Set(entry.requestedLengths).size !== entry.requestedLengths.length) throw new Error(`ProductModeConfig ${entryKey} has invalid requested lengths.`);
  if (!Number.isSafeInteger(entry.minimumActualLength) || entry.minimumActualLength <= 0 || entry.minimumActualLength > Math.min(...entry.requestedLengths) || !entry.requestedLengths.includes(entry.defaultRequestedLength)) throw new Error(`ProductModeConfig ${entryKey} has invalid default or minimum length.`);
  if ((entry.availability === "evidence_conditioned") !== (entry.selection.kind === "evidence_conditioned")) throw new Error(`ProductModeConfig ${entryKey} has mismatched availability and selection.`);
  if (JSON.stringify(entry) !== JSON.stringify(expected)) throw new Error(`ProductModeConfig ${entryKey} does not match its product policy.`);
}

function selectionPool(selection: ProductModeSelection, artifact: ProductModeArtifact): readonly ProductModeArtifact["questions"][number][] {
  if (selection.kind === "exact_ordered_questions") {
    if (!selection.questionIds.length || new Set(selection.questionIds).size !== selection.questionIds.length) throw new Error("Exact question selection must be non-empty and unique.");
    const byId = new Map(artifact.questions.map((question) => [question.questionId, question]));
    return selection.questionIds.map((questionId) => {
      const question = byId.get(questionId);
      if (!question) throw new Error(`Exact question selection references foreign question ${questionId}.`);
      return question;
    });
  }
  if (selection.kind === "evidence_conditioned" && (!selection.evidenceSources.length || new Set(selection.evidenceSources).size !== selection.evidenceSources.length)) throw new Error("Evidence-conditioned selection requires unique evidence sources.");
  const pool = artifact.questions.filter((question) => question.nodeId === selection.nodeId && (selection.kind !== "node" || selection.mentalUnitId === undefined || question.mentalUnitId === selection.mentalUnitId));
  if (selection.kind === "node" && selection.mentalUnitId !== undefined && !pool.length) throw new Error(`Selection references foreign mental unit ${selection.mentalUnitId}.`);
  return pool;
}

function key(trackId: string, modeId: string): string { return `${trackId}\u0000${modeId}`; }

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
