import { markStartup } from "../../infrastructure/diagnostics/startupTrace";
import type { PackageCompletionRule } from "../../domain/learning/packageCompletionRule";
import aws from "../generated/canonical-content/aws-certified-solutions-architect-associate.json";
import backend from "../generated/canonical-content/backend-system-design-interview.json";
import claude from "../generated/canonical-content/claude-certified-architect-professional-certification.json";
import coding from "../generated/canonical-content/coding-interview-dsa-problem-solving.json";
import frontend from "../generated/canonical-content/frontend-system-design-interview.json";
import gcp from "../generated/canonical-content/google-cloud-associate-cloud-engineer.json";
import az104 from "../generated/canonical-content/microsoft-azure-administrator-associate-az-104.json";
import ai901 from "../generated/canonical-content/microsoft-azure-ai-fundamentals-ai-901.json";
import objectDesign from "../generated/canonical-content/object-oriented-design-interview.json";
import lockFile from "../generated/canonical-content/content-lock.json";
import successorLedgerFile from "../generated/canonical-content/content-successor-ledger.json";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { getProductModeConfig, PRODUCT_MODE_CONFIGS, validateProductModeConfigsAgainstArtifacts, type ProductModeConfig } from "./productModeConfig";
import { createCanonicalQuestionCatalog, type CanonicalQuestionCatalog } from "./questionCatalog";
import type { CanonicalContentLockRecord, CanonicalProductSimulationProfile, Question } from "./questionTypes";
import { validateLearningPlanningPolicy, type LearningPlanningPolicy } from "./planningPolicy";
import { assertValidContentSuccessorLedger, contentSuccessorLedgerEntry, type ContentPlanningPolicyIdentity, type ContentTrackIdentity, type ContentSuccessorLedger } from "./contentSuccessorLedger";
import { canonicalInteractionRegistry, type CanonicalInteractionRegistry } from "./interactions/registry";

const artifacts: readonly unknown[] = Object.freeze([aws, backend, claude, coding, frontend, gcp, az104, ai901, objectDesign]);
const locks = new Map((lockFile.tracks as CanonicalContentLockRecord[]).map((entry) => [entry.trackId, entry]));

export type CanonicalTrackRuntime = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  contentReleaseId: string;
  questions: readonly Question[];
  interactions: CanonicalInteractionRegistry;
  completionRule?: PackageCompletionRule;
  simulationProfiles?: readonly CanonicalProductSimulationProfile[];
  planningPolicy?: LearningPlanningPolicy;
  trainingIdentity?: ContentTrackIdentity;
  planningPolicyIdentity?: ContentPlanningPolicyIdentity;
  modes: readonly ProductModeConfig[];
  getQuestion(questionId: string): Question | undefined;
  getQuestionsForNode(nodeId: string): readonly Question[];
  getQuestionsForMentalUnit(mentalUnitId: string): readonly Question[];
  getMode(modeId: string): ProductModeConfig;
  getPool(modeId: string): readonly Question[];
}>;

export type CanonicalRuntimeCatalog = Readonly<{
  tracks: readonly string[];
  getTrack(trackId: string): CanonicalTrackRuntime;
  getQuestion(trackId: string, questionId: string): Question | undefined;
  getNode(trackId: string, nodeId: string): readonly Question[];
  getMentalUnit(trackId: string, mentalUnitId: string): readonly Question[];
  getMode(trackId: string, modeId: string): ProductModeConfig;
  getPool(trackId: string, modeId: string): readonly Question[];
}>;
export type CanonicalRuntimeBuildDependencies = Readonly<{ artifacts?: readonly unknown[]; locks?: readonly CanonicalContentLockRecord[]; sha256Utf8?: (value: string) => Promise<string>; successorLedger?: unknown; interactionRegistry?: CanonicalInteractionRegistry }>;

let activeCatalog: Promise<CanonicalRuntimeCatalog> | undefined;

export async function loadCanonicalRuntimeCatalog(): Promise<CanonicalRuntimeCatalog> {
  return loadWithCache();
}

export type CanonicalRuntimeCatalogOwner = Readonly<{ load(): Promise<CanonicalRuntimeCatalog> }>;

export function createCanonicalRuntimeCatalogOwner(dependencies: CanonicalRuntimeBuildDependencies = {}): CanonicalRuntimeCatalogOwner {
  let cached: Promise<CanonicalRuntimeCatalog> | undefined;
  return Object.freeze({
    load() {
      if (cached) return cached;
      cached = buildCatalog(dependencies).catch((error) => { cached = undefined; throw error; });
      return cached;
    },
  });
}

async function loadWithCache(): Promise<CanonicalRuntimeCatalog> {
  if (activeCatalog) return activeCatalog;
  activeCatalog = buildCatalog().catch((error) => { activeCatalog = undefined; throw error; });
  return activeCatalog;
}

export async function buildCanonicalRuntimeCatalog(dependencies: CanonicalRuntimeBuildDependencies = {}): Promise<CanonicalRuntimeCatalog> {
  return buildCatalog(dependencies);
}

async function buildCatalog(dependencies: CanonicalRuntimeBuildDependencies = {}): Promise<CanonicalRuntimeCatalog> {
  markStartup("catalog_build", "begin");
  try {
    const sourceArtifacts = dependencies.artifacts ?? artifacts;
    const sourceLocks = new Map((dependencies.locks ?? [...locks.values()]).map((entry) => [entry.trackId, entry]));
    const sha256 = dependencies.sha256Utf8 ?? contentHasher.sha256;
    const interactionRegistry = dependencies.interactionRegistry ?? canonicalInteractionRegistry;
    const successorLedger = dependencies.successorLedger ?? (dependencies.artifacts === undefined ? successorLedgerFile : undefined);
    if (successorLedger !== undefined) assertValidContentSuccessorLedger(successorLedger);
    const catalogs: CanonicalQuestionCatalog[] = [];
    for (const artifact of sourceArtifacts) {
      if (!artifact || typeof artifact !== "object" || Array.isArray(artifact) || typeof (artifact as Record<string, unknown>).trackId !== "string") throw new Error("Canonical artifact is unavailable; restart to load canonical content.");
      const trackId = (artifact as Record<string, unknown>).trackId as string;
      const lock = sourceLocks.get(trackId);
      if (!lock) throw new Error(`Canonical content lock is missing for ${trackId}.`);
      catalogs.push(await createCanonicalQuestionCatalog(artifact, lock, trackId, sha256, interactionRegistry));
      if (successorLedger !== undefined) {
        const entry = contentSuccessorLedgerEntry(successorLedger as ContentSuccessorLedger, trackId);
        const source = artifact as Record<string, unknown>;
        if (source.schemaVersion !== "patternly-content-artifact-v2" || source.contentVersion !== entry.planningPolicy.contentVersion || lock.sha256 !== entry.planningPolicy.artifactSha256 ||
          (source.planningPolicy as Record<string, unknown> | undefined)?.policyVersion !== entry.planningPolicy.policyVersion || !Array.isArray(source.questions) || source.questions.length !== entry.training.questionCount) {
          throw new Error(`Content successor ledger does not match the current v2 policy artifact for ${trackId}.`);
        }
        markStartup("predecessor_clone_stringify", "begin");
        // Only root fields change; nested generated JSON is read-only during serialization.
        const historical = { ...source };
        delete historical.planningPolicy;
        historical.schemaVersion = "patternly-content-artifact-v1";
        historical.contentVersion = entry.training.contentVersion;
        const serialized = JSON.stringify(historical);
        markStartup("predecessor_clone_stringify", "end");
        markStartup("predecessor_hash", "begin");
        let predecessorHash: string;
        try { predecessorHash = await sha256(serialized); }
        finally { markStartup("predecessor_hash", "end"); }
        if (predecessorHash !== entry.training.artifactSha256) throw new Error(`Content successor ledger does not reconstruct the exact training predecessor for ${trackId}.`);
      }
    }
    markStartup("catalog_projection", "begin");
    const projections = catalogs.map((catalog) => ({ schemaVersion: "patternly-content-artifact-v1", trackId: catalog.trackId, contentVersion: catalog.contentVersion, questions: catalog.questions.map((question) => ({ trackId: question.trackId, nodeId: question.nodeId, mentalUnitId: question.mentalUnitId, questionId: question.questionId, interaction: { type: question.interaction.type } })) }));
    const modeConfigs = validateProductModeConfigsAgainstArtifacts(PRODUCT_MODE_CONFIGS, projections);
    markStartup("catalog_projection", "end");
    markStartup("catalog_tracks", "begin");
    const byTrack = new Map(catalogs.map((catalog) => [catalog.trackId, createTrackRuntime(catalog, modeConfigs,
      successorLedger === undefined ? undefined : contentSuccessorLedgerEntry(successorLedger as ContentSuccessorLedger, catalog.trackId), interactionRegistry)]));
    markStartup("catalog_tracks", "end");
    return Object.freeze({
      tracks: Object.freeze(catalogs.map((catalog) => catalog.trackId)),
      getTrack(trackId: string) { const result = byTrack.get(trackId); if (!result) throw new Error(`Canonical track ${trackId} is unavailable; restart to load canonical content.`); return result; },
      getQuestion(trackId: string, questionId: string) { return this.getTrack(trackId).getQuestion(questionId); },
      getNode(trackId: string, nodeId: string) { return this.getTrack(trackId).getQuestionsForNode(nodeId); },
      getMentalUnit(trackId: string, mentalUnitId: string) { return this.getTrack(trackId).getQuestionsForMentalUnit(mentalUnitId); },
      getMode(trackId: string, modeId: string) { return this.getTrack(trackId).getMode(modeId); },
      getPool(trackId: string, modeId: string) { return this.getTrack(trackId).getPool(modeId); },
    });
  } finally { markStartup("catalog_build", "end"); }
}

function createTrackRuntime(catalog: CanonicalQuestionCatalog, configs: readonly ProductModeConfig[], predecessor?: ContentSuccessorLedger["tracks"][number], interactions: CanonicalInteractionRegistry = canonicalInteractionRegistry): CanonicalTrackRuntime {
  const modes = Object.freeze(configs.filter((config) => config.trackId === catalog.trackId));
  const planningPolicy = catalog.planningPolicy === undefined ? undefined : validateLearningPlanningPolicy(catalog.planningPolicy, catalog.questions, modes, catalog.completionRule);
  const pools = new Map(modes.map((mode) => [mode.modeId, resolvePool(catalog, mode)]));
  return Object.freeze({
    trackId: catalog.trackId,
    contentVersion: catalog.contentVersion,
    artifactSha256: catalog.artifactSha256,
    contentReleaseId: catalog.artifactMetadata.contentReleaseId,
    questions: catalog.questions,
    interactions,
    ...(catalog.completionRule ? { completionRule: catalog.completionRule } : {}),
    ...(catalog.simulationProfiles ? { simulationProfiles: catalog.simulationProfiles } : {}),
    ...(planningPolicy ? { planningPolicy } : {}),
    trainingIdentity: predecessor ? Object.freeze({ contentVersion: predecessor.training.contentVersion, artifactSha256: predecessor.training.artifactSha256 }) : Object.freeze({ contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 }),
    ...(predecessor ? { planningPolicyIdentity: Object.freeze({ contentVersion: predecessor.planningPolicy.contentVersion, artifactSha256: predecessor.planningPolicy.artifactSha256, policyVersion: predecessor.planningPolicy.policyVersion }) } : {}),
    modes,
    getQuestion: catalog.getQuestionById,
    getQuestionsForNode: catalog.getQuestionsByNodeId,
    getQuestionsForMentalUnit: catalog.getQuestionsByMentalUnitId,
    getMode(modeId: string) { const mode = modes.find((candidate) => candidate.modeId === modeId); if (!mode) throw new Error(`Canonical mode ${catalog.trackId}/${modeId} is unavailable; restart to load canonical content.`); return mode; },
    getPool(modeId: string) { const pool = pools.get(modeId); if (!pool) throw new Error(`Canonical mode ${catalog.trackId}/${modeId} is unavailable; restart to load canonical content.`); return pool; },
  });
}

function resolvePool(catalog: CanonicalQuestionCatalog, mode: ProductModeConfig): readonly Question[] {
  const selection = mode.selection;
  if (selection.kind === "exact_ordered_questions") {
    const questions = selection.questionIds.map((id) => catalog.getQuestionById(id));
    if (questions.some((question) => question === undefined) || questions.length !== new Set(selection.questionIds).size) throw new Error(`Canonical mode ${catalog.trackId}/${mode.modeId} has an invalid exact question pool.`);
    return Object.freeze(questions.map((question) => { if (!question) throw new Error(`Canonical mode ${catalog.trackId}/${mode.modeId} has an invalid exact question pool.`); return question; }));
  }
  const pool = catalog.getQuestionsByNodeId(selection.nodeId);
  if (selection.kind === "node" && selection.mentalUnitId !== undefined) return Object.freeze(pool.filter((question) => question.mentalUnitId === selection.mentalUnitId));
  return Object.freeze([...pool]);
}

export function getCanonicalModeConfig(trackId: string, modeId: string): ProductModeConfig { return getProductModeConfig(trackId, modeId); }
