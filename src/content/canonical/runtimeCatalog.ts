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
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { getProductModeConfig, PRODUCT_MODE_CONFIGS, validateProductModeConfigsAgainstArtifacts, type ProductModeConfig } from "./productModeConfig";
import { createCanonicalQuestionCatalog, type CanonicalQuestionCatalog } from "./questionCatalog";
import type { CanonicalContentLockRecord, Question } from "./questionTypes";

const artifacts: readonly unknown[] = Object.freeze([aws, backend, claude, coding, frontend, gcp, az104, ai901, objectDesign]);
const locks = new Map((lockFile.tracks as CanonicalContentLockRecord[]).map((entry) => [entry.trackId, entry]));

export type CanonicalTrackRuntime = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  packagePin: CanonicalQuestionCatalog["packagePin"];
  questions: readonly Question[];
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
  getTrackByPin(pin: CanonicalQuestionCatalog["packagePin"]): CanonicalTrackRuntime;
}>;
export type CanonicalRuntimeBuildDependencies = Readonly<{ artifacts?: readonly unknown[]; locks?: readonly CanonicalContentLockRecord[]; sha256Utf8?: (value: string) => Promise<string> }>;

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
  const sourceArtifacts = dependencies.artifacts ?? artifacts;
  const sourceLocks = new Map((dependencies.locks ?? [...locks.values()]).map((entry) => [entry.trackId, entry]));
  const catalogs = await Promise.all(sourceArtifacts.map(async (artifact) => {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact) || typeof (artifact as Record<string, unknown>).trackId !== "string") throw new Error("Canonical artifact is unavailable; restart to load canonical content.");
    const trackId = (artifact as Record<string, unknown>).trackId as string;
    const lock = sourceLocks.get(trackId);
    if (!lock) throw new Error(`Canonical content lock is missing for ${trackId}.`);
    return createCanonicalQuestionCatalog(artifact, lock, trackId, dependencies.sha256Utf8 ?? (async (value) => sha256Utf8(value)));
  }));
  const projections = catalogs.map((catalog) => ({ schemaVersion: "patternly-content-artifact-v1", trackId: catalog.trackId, contentVersion: catalog.contentVersion, questions: catalog.questions.map((question) => ({ trackId: question.trackId, nodeId: question.nodeId, mentalUnitId: question.mentalUnitId, questionId: question.questionId, interaction: { type: question.interaction.type } })) }));
  const modeConfigs = validateProductModeConfigsAgainstArtifacts(PRODUCT_MODE_CONFIGS, projections);
  const byTrack = new Map(catalogs.map((catalog) => [catalog.trackId, createTrackRuntime(catalog, modeConfigs)]));
  return Object.freeze({
    tracks: Object.freeze(catalogs.map((catalog) => catalog.trackId)),
    getTrack(trackId: string) { const result = byTrack.get(trackId); if (!result) throw new Error(`Canonical track ${trackId} is unavailable; restart to load canonical content.`); return result; },
    getQuestion(trackId: string, questionId: string) { return this.getTrack(trackId).getQuestion(questionId); },
    getNode(trackId: string, nodeId: string) { return this.getTrack(trackId).getQuestionsForNode(nodeId); },
    getMentalUnit(trackId: string, mentalUnitId: string) { return this.getTrack(trackId).getQuestionsForMentalUnit(mentalUnitId); },
    getMode(trackId: string, modeId: string) { return this.getTrack(trackId).getMode(modeId); },
    getPool(trackId: string, modeId: string) { return this.getTrack(trackId).getPool(modeId); },
    getTrackByPin(pin: CanonicalQuestionCatalog["packagePin"]) {
      const result = catalogs.find((candidate) => candidate.packagePin.packageIdentity === pin.packageIdentity && candidate.packagePin.packageVersion === pin.packageVersion && candidate.packagePin.contentReleaseId === pin.contentReleaseId);
      if (!result) throw new Error("Canonical package pin is unavailable; restart to load canonical content.");
      return byTrack.get(result.trackId)!;
    },
  });
}

function createTrackRuntime(catalog: CanonicalQuestionCatalog, configs: readonly ProductModeConfig[]): CanonicalTrackRuntime {
  const modes = Object.freeze(configs.filter((config) => config.trackId === catalog.trackId));
  const pools = new Map(modes.map((mode) => [mode.modeId, resolvePool(catalog, mode)]));
  return Object.freeze({
    trackId: catalog.trackId,
    contentVersion: catalog.contentVersion,
    artifactSha256: catalog.artifactSha256,
    packagePin: catalog.packagePin,
    questions: catalog.questions,
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
