import { beginStartupSpan, markStartup } from "../../infrastructure/diagnostics/startupTrace";
import type { PackageCompletionRule, VerifiedCompletionSource } from "../../domain/learning/packageCompletionRule";
import lockFile from "../generated/canonical-content/content-lock.json";
import successorLedgerFile from "../generated/canonical-content/content-successor-ledger.json";
import contentTrustManifestFile from "../generated/content-trust-manifest.json";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { bundledContentAssetSource, type ContentAsset, type ContentAssetSource } from "./contentAssetSource";
import { getProductModeConfig, PRODUCT_MODE_CONFIGS, validateProductModeConfigsAgainstArtifacts, validateTrackModeConfigsAgainstArtifact, type ProductModeConfig } from "./productModeConfig";
import { createCanonicalQuestionCatalog, createTrustedCanonicalQuestionCatalog, type CanonicalQuestionCatalog } from "./questionCatalog";
import { CONTENT_TRUST_MANIFEST_SCHEMA, contentTrustBindingSha, matchContentTrustManifest, retainedTrustBindingSha, type ContentTrustManifest, type TrustedContent } from "./contentTrustManifest";
import type { CanonicalContentLockRecord, CanonicalProductSimulationProfile, Question } from "./questionTypes";
import { validateLearningPlanningPolicy, type LearningPlanningPolicy } from "./planningPolicy";
import { assertValidContentSuccessorLedger, contentSuccessorLedgerEntry, type ContentPlanningPolicyIdentity, type ContentTrackIdentity, type ContentSuccessorLedger } from "./contentSuccessorLedger";
import { canonicalInteractionRegistry, type CanonicalInteractionRegistry } from "./interactions/registry";

/**
 * T2.4: the nine current artifacts (54 MB) and the four retained Claude packages (14 MB) are not part of
 * the JS bundle. They are app assets (`contentAssetSource`), read per track when a track is first needed.
 * Only the content lock, the successor ledger and the trust manifest (a few KB) stay in the bundle.
 */
const locks = new Map((lockFile.tracks as CanonicalContentLockRecord[]).map((entry) => [entry.trackId, entry]));
/** Lock order (sorted track ids): the order of the trust manifest, the verification plan and `catalog.tracks`. */
const CURRENT_TRACK_IDS: readonly string[] = Object.freeze((lockFile.tracks as CanonicalContentLockRecord[]).map((entry) => entry.trackId));
const RETAINED_TRACK_ID = "claude-certified-architect-professional-certification";
const RETAINED_FILES = Object.freeze(["claude-pre-qle-v2.json", "claude-qle-v2-first-cases.json", "claude-qle-v2-before-identity.json", "claude-qle-v2-active-before-exam.json"]);
const retainedVerificationIds = Object.freeze(RETAINED_FILES.map((file) => `retained:${file}`));
const trackAssetFile = (trackId: string) => `${trackId}.json`;

export type CanonicalTrackRuntime = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  contentReleaseId: string;
  questions: readonly Question[];
  interactions: CanonicalInteractionRegistry;
  completionRule?: PackageCompletionRule;
  completionSources?: readonly VerifiedCompletionSource[];
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
  /** Whole-task paired content is optional and must be resolved from this exact artifact. */
  approachChallengeProblems?: readonly import("./approachChallengeProblem").ApproachChallengeProblem[];
}>;

/**
 * `tracks` lists every current track. A track is built on first use: `loadTrack` reads its asset off the
 * JS thread (startup, track switch); `getTrack` is the synchronous path for callers that cannot wait and
 * reads the asset on the JS thread once. Both verify the asset bytes against the trust manifest first.
 */
export type CanonicalRuntimeCatalog = Readonly<{
  tracks: readonly string[];
  getTrack(trackId: string): CanonicalTrackRuntime;
  loadTrack(trackId: string): Promise<CanonicalTrackRuntime>;
  isTrackLoaded(trackId: string): boolean;
  getQuestion(trackId: string, questionId: string): Question | undefined;
  getNode(trackId: string, nodeId: string): readonly Question[];
  getMentalUnit(trackId: string, mentalUnitId: string): readonly Question[];
  getMode(trackId: string, modeId: string): ProductModeConfig;
  getPool(trackId: string, modeId: string): readonly Question[];
}>;
export type CanonicalRuntimeBuildDependencies = Readonly<{ artifacts?: readonly unknown[]; locks?: readonly CanonicalContentLockRecord[]; sha256Utf8?: (value: string) => Promise<string>; successorLedger?: unknown; interactionRegistry?: CanonicalInteractionRegistry; assets?: ContentAssetSource }>;

let activeCatalog: Promise<CanonicalRuntimeCatalog> | undefined;

export async function loadCanonicalRuntimeCatalog(): Promise<CanonicalRuntimeCatalog> {
  return loadWithCache();
}

export type VerificationWorkPlan = Readonly<{
  build: object;
  units: readonly Readonly<{ id: string; kind: "current_artifact" | "retained_pair" }>[];
}>;
export type VerifiedUnit = Readonly<{ build: object; unitId: string }>;
export type VerificationObserver = Readonly<{
  onWorkPlan(plan: VerificationWorkPlan): void;
  onVerifiedUnit(proof: VerifiedUnit): void;
}>;
export type CanonicalRuntimeCatalogOwner = Readonly<{
  load(): Promise<CanonicalRuntimeCatalog>;
  subscribeVerification(observer: VerificationObserver): () => void;
}>;
type VerificationUnits = VerificationWorkPlan["units"];
/** Full verification announces its units before it starts; the trusted lazy catalog has no eager units. */
type BuildObserver = Readonly<{ plan(units: VerificationUnits): void; verified(unitId: string): void }>;

function createVerificationUnits(sourceArtifacts: readonly unknown[], includeRetained: boolean): VerificationUnits | undefined {
  if (sourceArtifacts.length > 9) return undefined;
  const trackIds = sourceArtifacts.map((artifact) => artifact && typeof artifact === "object" && !Array.isArray(artifact)
    ? (artifact as Record<string, unknown>).trackId : undefined);
  if (trackIds.some((id) => typeof id !== "string" || id.length === 0) || new Set(trackIds).size !== trackIds.length) return undefined;
  const units: VerificationUnits[number][] = trackIds.map((id, index) => Object.freeze({ id: `current:${index}:${id}`, kind: "current_artifact" }));
  if (includeRetained) for (const id of retainedVerificationIds) units.push(Object.freeze({ id, kind: "retained_pair" }));
  return Object.freeze(units);
}

export function createCanonicalRuntimeCatalogOwner(dependencies: CanonicalRuntimeBuildDependencies = {}): CanonicalRuntimeCatalogOwner {
  type Run = { promise: Promise<CanonicalRuntimeCatalog>; plan: VerificationWorkPlan | undefined; completed: Set<string> };
  let cached: Run | undefined;
  const subscribers = new Set<Readonly<{ observer: VerificationObserver }>>();
  const notify = (subscriber: Readonly<{ observer: VerificationObserver }>, event: () => void) => {
    if (!subscribers.has(subscriber)) return;
    try { event(); } catch { /* Observation cannot change content validation or its result. */ }
  };
  return Object.freeze({
    load() {
      if (cached) return cached.promise;
      const sourceArtifacts = dependencies.artifacts === undefined ? undefined : Object.freeze([...dependencies.artifacts]);
      const snapshot = { ...dependencies, ...(sourceArtifacts === undefined ? {} : { artifacts: sourceArtifacts }),
        ...(dependencies.locks === undefined ? {} : { locks: Object.freeze([...dependencies.locks]) }) };
      let resolve!: (catalog: CanonicalRuntimeCatalog) => void;
      let reject!: (error: unknown) => void;
      const promise = new Promise<CanonicalRuntimeCatalog>((yes, no) => { resolve = yes; reject = no; });
      const run: Run = { promise, plan: undefined, completed: new Set() };
      // Install the run before reentrant observers or the builder can call load().
      cached = run;
      const build = Object.freeze({});
      const observer: BuildObserver = {
        plan(units) {
          if (run.plan) return;
          const plan = Object.freeze({ build, units });
          run.plan = plan;
          for (const subscriber of [...subscribers]) notify(subscriber, () => subscriber.observer.onWorkPlan(plan));
        },
        verified(unitId) {
          const plan = run.plan;
          if (!plan || run.completed.has(unitId) || !plan.units.some((unit) => unit.id === unitId)) return;
          run.completed.add(unitId);
          const proof = Object.freeze({ build: plan.build, unitId });
          for (const subscriber of [...subscribers]) notify(subscriber, () => subscriber.observer.onVerifiedUnit(proof));
        },
      };
      void buildCatalog(snapshot, observer).then(resolve, (error: unknown) => {
        if (cached === run) cached = undefined;
        reject(error);
      });
      return promise;
    },
    subscribeVerification(observer) {
      const subscriber = { observer };
      subscribers.add(subscriber);
      const run = cached;
      if (run?.plan) {
        const plan = run.plan;
        const completed = [...run.completed];
        notify(subscriber, () => observer.onWorkPlan(plan));
        for (const unitId of completed) notify(subscriber, () => observer.onVerifiedUnit(Object.freeze({ build: plan.build, unitId })));
      }
      return () => { subscribers.delete(subscriber); };
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

/** `full` forces per-start verification (manifest generation, tests); `auto` trusts a matching build-time manifest. */
type VerificationMode = "auto" | "full";

/** Only the exact bundled inputs can be covered by the bundled manifest; injected dependencies always verify fully. */
function coversBundledContent(dependencies: CanonicalRuntimeBuildDependencies): boolean {
  return dependencies.artifacts === undefined && dependencies.locks === undefined && dependencies.successorLedger === undefined
    && (dependencies.interactionRegistry === undefined || dependencies.interactionRegistry === canonicalInteractionRegistry);
}

const unavailableArtifact = () => new Error("Canonical artifact is unavailable; restart to load canonical content.");

async function readBundledArtifacts(assets: ContentAssetSource): Promise<readonly unknown[]> {
  const artifacts: unknown[] = [];
  for (const trackId of CURRENT_TRACK_IDS) {
    let asset: ContentAsset;
    try { asset = await assets.read("canonical-content", trackAssetFile(trackId)); }
    catch { throw unavailableArtifact(); }
    artifacts.push(JSON.parse(asset.text) as unknown);
  }
  return Object.freeze(artifacts);
}

async function buildCatalog(dependencies: CanonicalRuntimeBuildDependencies = {}, observer?: BuildObserver, mode: VerificationMode = "auto"): Promise<CanonicalRuntimeCatalog> {
  markStartup("catalog_build", "begin");
  try {
    // Injected artifacts announce their plan synchronously, inside load().
    const injectedUnits = dependencies.artifacts === undefined ? undefined : createVerificationUnits(dependencies.artifacts, false);
    if (injectedUnits) observer?.plan(injectedUnits);
    const sourceLocks = new Map((dependencies.locks ?? [...locks.values()]).map((entry) => [entry.trackId, entry]));
    const sha256 = dependencies.sha256Utf8 ?? contentHasher.sha256;
    const interactionRegistry = dependencies.interactionRegistry ?? canonicalInteractionRegistry;
    const assets = dependencies.assets ?? bundledContentAssetSource;
    const successorLedger = dependencies.successorLedger ?? (dependencies.artifacts === undefined ? successorLedgerFile : undefined);
    if (successorLedger !== undefined) assertValidContentSuccessorLedger(successorLedger);
    if (mode === "auto" && coversBundledContent(dependencies)) {
      const trust = await matchContentTrustManifest(contentTrustManifestFile, { lockFile, ledgerFile: successorLedgerFile, trackIds: CURRENT_TRACK_IDS, locks: sourceLocks, sha256Utf8: sha256 });
      if (trust) return createTrustedLazyCatalog({ trust, assets, interactionRegistry, successorLedger: successorLedger as ContentSuccessorLedger });
    }
    const sourceArtifacts = dependencies.artifacts ?? await readBundledArtifacts(assets);
    if (dependencies.artifacts === undefined) {
      const units = createVerificationUnits(sourceArtifacts, true);
      if (units) observer?.plan(units);
    }
    const verified = (unitId: string) => observer?.verified(unitId);
    const catalogs: CanonicalQuestionCatalog[] = [];
    for (const [index, artifact] of sourceArtifacts.entries()) {
      if (!artifact || typeof artifact !== "object" || Array.isArray(artifact) || typeof (artifact as Record<string, unknown>).trackId !== "string") throw unavailableArtifact();
      const trackId = (artifact as Record<string, unknown>).trackId as string;
      const lock = sourceLocks.get(trackId);
      if (!lock) throw new Error(`Canonical content lock is missing for ${trackId}.`);
      catalogs.push(await createCanonicalQuestionCatalog(artifact, lock, trackId, sha256, interactionRegistry));
      if (successorLedger !== undefined) {
        const entry = contentSuccessorLedgerEntry(successorLedger as ContentSuccessorLedger, trackId);
        assertLedgerMatchesArtifact(entry, artifact as Record<string, unknown>, lock, trackId);
        markStartup("predecessor_clone_stringify", "begin");
        // Only root fields change; nested generated JSON is read-only during serialization.
        const historical = { ...(artifact as Record<string, unknown>) };
        delete historical.planningPolicy;
        delete historical.approachChallengeProblems;
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
      verified(`current:${index}:${trackId}`);
    }
    markStartup("catalog_projection", "begin");
    const projections = catalogs.map((catalog) => ({ schemaVersion: "patternly-content-artifact-v1", trackId: catalog.trackId, contentVersion: catalog.contentVersion, questions: catalog.questions.map((question) => ({ trackId: question.trackId, nodeId: question.nodeId, mentalUnitId: question.mentalUnitId, questionId: question.questionId, interaction: { type: question.interaction.type } })) }));
    const modeConfigs = validateProductModeConfigsAgainstArtifacts(PRODUCT_MODE_CONFIGS, projections, (edge) => markStartup("mode_artifact_questions", edge));
    markStartup("catalog_projection", "end");
    markStartup("catalog_tracks", "begin");
    // Optional retained rules preserve already earned legacy completions.
    // Attributed unit progress does not depend on these historical catalogs.
    const onRetainedPair = (index: number) => {
      const unitId = retainedVerificationIds[index];
      if (unitId) verified(unitId);
    };
    const retainedProofs = dependencies.artifacts === undefined
      ? await verifyRetainedCompletionCatalogs(await loadRetainedClaudePackages(assets).catch(() => []), interactionRegistry, onRetainedPair)
      : [];
    const byTrack = new Map(catalogs.map((catalog) => [catalog.trackId, createTrackRuntime(catalog, modeConfigs,
      successorLedger === undefined ? undefined : contentSuccessorLedgerEntry(successorLedger as ContentSuccessorLedger, catalog.trackId), interactionRegistry,
      completionSourcesFor(catalog, retainedProofs))] as const));
    markStartup("catalog_tracks", "end");
    return catalogFacade(Object.freeze(catalogs.map((catalog) => catalog.trackId)), (trackId) => byTrack.get(trackId), (trackId) => {
      const result = byTrack.get(trackId);
      if (!result) throw new Error(`Canonical track ${trackId} is unavailable; restart to load canonical content.`);
      return result;
    });
  } finally { markStartup("catalog_build", "end"); }
}

function assertLedgerMatchesArtifact(entry: ContentSuccessorLedger["tracks"][number], source: Record<string, unknown>, lock: CanonicalContentLockRecord, trackId: string): void {
  if (source.schemaVersion !== "patternly-content-artifact-v2" || source.contentVersion !== entry.planningPolicy.contentVersion || lock.sha256 !== entry.planningPolicy.artifactSha256 ||
    (source.planningPolicy as Record<string, unknown> | undefined)?.policyVersion !== entry.planningPolicy.policyVersion || !Array.isArray(source.questions) || source.questions.length !== entry.training.questionCount) {
    throw new Error(`Content successor ledger does not match the current v2 policy artifact for ${trackId}.`);
  }
}

function completionSourcesFor(catalog: CanonicalQuestionCatalog, retainedProofs: readonly CanonicalQuestionCatalog[]): readonly VerifiedCompletionSource[] {
  return [catalog, ...retainedProofs.filter((source) => source.trackId === catalog.trackId)].map((source) => Object.freeze({
    trackId: source.trackId, contentVersion: source.contentVersion, artifactSha256: source.artifactSha256, completionRule: source.completionRule,
    getQuestion: (questionId: string) => {
      const question = source.getQuestionById(questionId);
      return question ? Object.freeze({ nodeId: question.nodeId, mentalUnitId: question.mentalUnitId }) : undefined;
    },
  }));
}

function catalogFacade(tracks: readonly string[], loaded: (trackId: string) => CanonicalTrackRuntime | undefined, getTrack: (trackId: string) => CanonicalTrackRuntime, loadTrack?: (trackId: string) => Promise<CanonicalTrackRuntime>): CanonicalRuntimeCatalog {
  return Object.freeze({
    tracks,
    getTrack,
    loadTrack: loadTrack ?? (async (trackId: string) => getTrack(trackId)),
    isTrackLoaded: (trackId: string) => loaded(trackId) !== undefined,
    getQuestion: (trackId: string, questionId: string) => getTrack(trackId).getQuestion(questionId),
    getNode: (trackId: string, nodeId: string) => getTrack(trackId).getQuestionsForNode(nodeId),
    getMentalUnit: (trackId: string, mentalUnitId: string) => getTrack(trackId).getQuestionsForMentalUnit(mentalUnitId),
    getMode: (trackId: string, modeId: string) => getTrack(trackId).getMode(modeId),
    getPool: (trackId: string, modeId: string) => getTrack(trackId).getPool(modeId),
  });
}

type TrustedLazyContext = Readonly<{ trust: TrustedContent; assets: ContentAssetSource; interactionRegistry: CanonicalInteractionRegistry; successorLedger: ContentSuccessorLedger }>;

/**
 * Trusted path (D5, T1.4, T2.4): the build-time full verification proved these exact asset bytes. At runtime a
 * track is accepted only when the SHA-256 of its asset bytes equals the manifest entry (which equals the lock),
 * so the expensive validation, stringify and predecessor hashing stay at build time. Its modes are still checked
 * against its questions, because mode configs are code and the manifest does not bind them.
 */
function createTrustedLazyCatalog(context: TrustedLazyContext): CanonicalRuntimeCatalog {
  const loaded = new Map<string, CanonicalTrackRuntime>();
  const pending = new Map<string, Promise<CanonicalTrackRuntime>>();
  const unavailable = (trackId: string) => new Error(`Canonical track ${trackId} is unavailable; restart to load canonical content.`);
  const install = (trackId: string, build: () => CanonicalTrackRuntime) => {
    const existing = loaded.get(trackId);
    if (existing) return existing;
    const runtime = build();
    loaded.set(trackId, runtime);
    return runtime;
  };
  const traced = <T>(trackId: string, work: () => T): T => {
    const end = beginStartupSpan("catalog_track_load");
    markStartup(`catalog_track:${trackId}`);
    try { return work(); } finally { end(); }
  };
  const getTrack = (trackId: string): CanonicalTrackRuntime => {
    const ready = loaded.get(trackId);
    if (ready) return ready;
    if (!CURRENT_TRACK_IDS.includes(trackId)) throw unavailable(trackId);
    return traced(trackId, () => {
      let asset: ContentAsset;
      try { asset = context.assets.readSync("canonical-content", trackAssetFile(trackId)); }
      catch { throw unavailableArtifact(); }
      const retained = trackId === RETAINED_TRACK_ID ? RETAINED_FILES.map((file) => { try { return context.assets.readSync("retained-content", file); } catch { return undefined; } }) : [];
      return install(trackId, () => buildTrustedTrack(context, trackId, asset, retained));
    });
  };
  const loadTrack = (trackId: string): Promise<CanonicalTrackRuntime> => {
    const ready = loaded.get(trackId);
    if (ready) return Promise.resolve(ready);
    if (!CURRENT_TRACK_IDS.includes(trackId)) return Promise.reject(unavailable(trackId));
    const inFlight = pending.get(trackId);
    if (inFlight) return inFlight;
    const promise = (async () => {
      const [asset, retained] = await Promise.all([
        context.assets.read("canonical-content", trackAssetFile(trackId)).catch(() => { throw unavailableArtifact(); }),
        trackId === RETAINED_TRACK_ID ? Promise.all(RETAINED_FILES.map((file) => context.assets.read("retained-content", file).catch(() => undefined))) : Promise.resolve([]),
      ]);
      return traced(trackId, () => install(trackId, () => buildTrustedTrack(context, trackId, asset, retained)));
    })();
    pending.set(trackId, promise);
    const settle = () => { if (pending.get(trackId) === promise) pending.delete(trackId); };
    promise.then(settle, settle);
    return promise;
  };
  return catalogFacade(CURRENT_TRACK_IDS, (trackId) => loaded.get(trackId), getTrack, loadTrack);
}

function parseTrustedAsset(label: string, asset: ContentAsset, expectedSha: string | undefined): unknown {
  if (expectedSha === undefined || asset.sha256 !== expectedSha) throw new Error(`Canonical content asset ${label} does not match its trust manifest; restart to load canonical content.`);
  markStartup("catalog_asset_parse", "begin");
  try { return JSON.parse(asset.text) as unknown; }
  finally { markStartup("catalog_asset_parse", "end"); }
}

function buildTrustedTrack(context: TrustedLazyContext, trackId: string, asset: ContentAsset, retainedAssets: readonly (ContentAsset | undefined)[]): CanonicalTrackRuntime {
  const lock = locks.get(trackId);
  if (!lock) throw new Error(`Canonical content lock is missing for ${trackId}.`);
  const artifact = parseTrustedAsset(trackId, asset, context.trust.artifactSha(trackId));
  const catalog = createTrustedCanonicalQuestionCatalog(artifact, lock, trackId);
  const entry = contentSuccessorLedgerEntry(context.successorLedger, trackId);
  assertLedgerMatchesArtifact(entry, artifact as Record<string, unknown>, lock, trackId);
  markStartup("catalog_projection", "begin");
  let modes: readonly ProductModeConfig[];
  try {
    modes = validateTrackModeConfigsAgainstArtifact(PRODUCT_MODE_CONFIGS, { schemaVersion: "patternly-content-artifact-v1", trackId, contentVersion: catalog.contentVersion, questions: catalog.questions },
      (edge) => markStartup("mode_artifact_questions", edge));
  } finally { markStartup("catalog_projection", "end"); }
  const retainedProofs = trustedRetainedCompletionCatalogs(context.trust, retainedAssets);
  return createTrackRuntime(catalog, modes, entry, context.interactionRegistry, completionSourcesFor(catalog, retainedProofs));
}

function createTrackRuntime(catalog: CanonicalQuestionCatalog, configs: readonly ProductModeConfig[], predecessor?: ContentSuccessorLedger["tracks"][number], interactions: CanonicalInteractionRegistry = canonicalInteractionRegistry, completionSources?: readonly VerifiedCompletionSource[]): CanonicalTrackRuntime {
  const modes = Object.freeze(configs.filter((config) => config.trackId === catalog.trackId));
  markStartup("planning_policy", "begin");
  let planningPolicy: LearningPlanningPolicy | undefined;
  try { planningPolicy = catalog.planningPolicy === undefined ? undefined : validateLearningPlanningPolicy(catalog.planningPolicy, catalog.questions, modes, catalog.completionRule); }
  finally { markStartup("planning_policy", "end"); }
  markStartup("pool_construction", "begin");
  let pools: Map<string, readonly Question[]>;
  try { pools = new Map(modes.map((mode) => [mode.modeId, resolvePool(catalog, mode)])); }
  finally { markStartup("pool_construction", "end"); }
  return Object.freeze({
    trackId: catalog.trackId,
    contentVersion: catalog.contentVersion,
    artifactSha256: catalog.artifactSha256,
    contentReleaseId: catalog.artifactMetadata.contentReleaseId,
    questions: catalog.questions,
    ...(catalog.approachChallengeProblems
      ? { approachChallengeProblems: Object.freeze([...catalog.approachChallengeProblems]) }
      : {}),
    interactions,
    ...(catalog.completionRule ? { completionRule: catalog.completionRule } : {}),
    ...(completionSources ? { completionSources: Object.freeze(completionSources) } : {}),
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

/** Retained Claude package (exact historical artifact + its lock and successor ledger row), read from an asset. */
export type RetainedClaudePackage = Readonly<{
  artifact: Readonly<{ trackId: string; contentVersion: string; planningPolicy: Readonly<{ policyVersion: string }>; questions: readonly unknown[] }>;
  lock: CanonicalContentLockRecord;
  ledger: Readonly<{
    trackId: string;
    training: Readonly<{ contentVersion: string; artifactSha256: string; questionCount: number }>;
    planningPolicy: Readonly<{ contentVersion: string; artifactSha256: string; policyVersion: string }>;
  }>;
}>;

/** Exact-only historical Claude data, outside the replaced active content directory. */
async function loadRetainedClaudePackages(assets: ContentAssetSource = bundledContentAssetSource): Promise<RetainedClaudePackage[]> {
  const packages: RetainedClaudePackage[] = [];
  for (const file of RETAINED_FILES) packages.push(JSON.parse((await assets.read("retained-content", file)).text) as RetainedClaudePackage);
  return packages;
}

/** Failed historical proofs stay absent from the classifier's verified pin set. */
export async function verifyRetainedCompletionCatalogs(sources: readonly RetainedClaudePackage[], interactions: CanonicalInteractionRegistry = canonicalInteractionRegistry, onVerifiedPair?: (index: number) => void): Promise<readonly CanonicalQuestionCatalog[]> {
  const verified: CanonicalQuestionCatalog[] = [];
  for (const [index, source] of sources.entries()) {
    try { verified.push(...await verifyRetainedClaudePackage(source, interactions)); onVerifiedPair?.(index); }
    catch { /* An unverified pin yields explicit unavailable completion, not current-account failure. */ }
  }
  return Object.freeze(verified);
}

async function verifyRetainedClaudePackage(retained: RetainedClaudePackage, interactions: CanonicalInteractionRegistry): Promise<readonly CanonicalQuestionCatalog[]> {
  const { artifact, lock, ledger } = retained;
  if (ledger.trackId !== artifact.trackId || ledger.planningPolicy.contentVersion !== artifact.contentVersion || ledger.planningPolicy.policyVersion !== artifact.planningPolicy.policyVersion) throw new Error("Retained Claude policy identity does not match its artifact.");
  const catalog = await createCanonicalQuestionCatalog(artifact, lock, artifact.trackId, contentHasher.sha256, interactions);
  const training = { ...artifact } as Record<string, unknown>;
  delete training.planningPolicy;
  training.schemaVersion = "patternly-content-artifact-v1";
  training.contentVersion = ledger.training.contentVersion;
  if (ledger.planningPolicy.artifactSha256 !== lock.sha256 || ledger.training.questionCount !== catalog.questions.length || await contentHasher.sha256(JSON.stringify(training)) !== ledger.training.artifactSha256) throw new Error("Retained Claude predecessor does not match its exact ledger.");
  const trainingCatalog = await createCanonicalQuestionCatalog(training, { trackId: artifact.trackId, contentVersion: ledger.training.contentVersion, sha256: ledger.training.artifactSha256, questionCount: ledger.training.questionCount }, artifact.trackId, contentHasher.sha256, interactions);
  return [catalog, trainingCatalog];
}

/**
 * Trusted retained proofs: the manifest lists only packages whose full proof passed at build time, with the
 * SHA-256 of their exact file bytes. A package that is absent, unreadable or changed stays unverified, exactly
 * as a failed proof would. Full re-verification of a retained pin happens on demand in `resolveRetainedClaudeTrack`.
 */
function trustedRetainedCompletionCatalogs(trust: TrustedContent, assets: readonly (ContentAsset | undefined)[]): readonly CanonicalQuestionCatalog[] {
  const verified: CanonicalQuestionCatalog[] = [];
  for (const [index, asset] of assets.entries()) {
    const id = retainedVerificationIds[index];
    const expected = id === undefined ? undefined : trust.retainedFileSha(id);
    if (!asset || expected === undefined || asset.sha256 !== expected) continue;
    try { verified.push(...trustedRetainedClaudePackage(JSON.parse(asset.text) as RetainedClaudePackage)); }
    catch { /* Same contract as the full path: an unverified pin yields explicit unavailable completion. */ }
  }
  return Object.freeze(verified);
}

function trustedRetainedClaudePackage(retained: RetainedClaudePackage): readonly CanonicalQuestionCatalog[] {
  const { artifact, lock, ledger } = retained;
  if (ledger.trackId !== artifact.trackId || ledger.planningPolicy.contentVersion !== artifact.contentVersion || ledger.planningPolicy.policyVersion !== artifact.planningPolicy.policyVersion
    || ledger.planningPolicy.artifactSha256 !== lock.sha256 || ledger.training.questionCount !== artifact.questions.length) throw new Error("Retained Claude policy identity does not match its artifact.");
  const catalog = createTrustedCanonicalQuestionCatalog(artifact, lock, artifact.trackId);
  const training = { ...artifact } as Record<string, unknown>;
  delete training.planningPolicy;
  training.schemaVersion = "patternly-content-artifact-v1";
  training.contentVersion = ledger.training.contentVersion;
  const trainingCatalog = createTrustedCanonicalQuestionCatalog(training, { trackId: artifact.trackId, contentVersion: ledger.training.contentVersion, sha256: ledger.training.artifactSha256, questionCount: ledger.training.questionCount }, artifact.trackId);
  return [catalog, trainingCatalog];
}

/**
 * Build-time only (scripts/verifyBundledCurrentContent.mjs): runs the complete per-start verification of the
 * bundled content once and returns the manifest that lets each start of this binary skip it. Throws when the
 * current bundle does not verify, so a broken bank can never obtain a manifest.
 */
export async function deriveBundledContentTrustManifest(sha256Utf8: (value: string) => Promise<string> = contentHasher.sha256, assets: ContentAssetSource = bundledContentAssetSource): Promise<ContentTrustManifest> {
  const proven = new Set<string>();
  await buildCatalog({ sha256Utf8, assets }, { plan() {}, verified: (unitId) => { proven.add(unitId); } }, "full");
  const retained: { id: string; sha: string; fileSha: string }[] = [];
  for (const [index, id] of retainedVerificationIds.entries()) {
    const file = RETAINED_FILES[index];
    if (!file || !proven.has(id)) continue;
    const asset = await assets.read("retained-content", file);
    retained.push({ id, sha: await retainedTrustBindingSha(JSON.parse(asset.text) as RetainedClaudePackage, sha256Utf8), fileSha: asset.sha256 });
  }
  return {
    schemaVersion: CONTENT_TRUST_MANIFEST_SCHEMA,
    lockSha: await contentTrustBindingSha(lockFile, sha256Utf8),
    ledgerSha: await contentTrustBindingSha(successorLedgerFile, sha256Utf8),
    artifacts: await Promise.all(CURRENT_TRACK_IDS.map(async (trackId) => {
      const sha = locks.get(trackId)?.sha256;
      if (!sha) throw new Error(`Canonical content lock is missing for ${trackId}.`);
      // The asset bytes are what the runtime hashes; the full proof above hashed their canonical serialization.
      if ((await assets.read("canonical-content", trackAssetFile(trackId))).sha256 !== sha) throw new Error(`Canonical content asset ${trackId} bytes do not match its lock.`);
      return { trackId, sha };
    })),
    retained,
  };
}

/** Full per-start verification regardless of the manifest (tests and diagnostics). */
export async function buildFullyVerifiedCanonicalRuntimeCatalog(dependencies: CanonicalRuntimeBuildDependencies = {}): Promise<CanonicalRuntimeCatalog> {
  return buildCatalog(dependencies, undefined, "full");
}

export async function resolveRetainedClaudeTrack(identity: Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }>, interactions: CanonicalInteractionRegistry = canonicalInteractionRegistry): Promise<CanonicalTrackRuntime | null> {
  if (identity.trackId !== RETAINED_TRACK_ID) return null;
  const retained = (await loadRetainedClaudePackages()).find(({ lock, ledger }) =>
    (identity.contentVersion === lock.contentVersion && identity.artifactSha256 === lock.sha256) ||
    (identity.contentVersion === ledger.training.contentVersion && identity.artifactSha256 === ledger.training.artifactSha256));
  if (!retained) return null;
  const catalogs = await verifyRetainedClaudePackage(retained, interactions);
  const exact = catalogs.find(catalog => catalog.contentVersion === identity.contentVersion && catalog.artifactSha256 === identity.artifactSha256);
  if (!exact) return null;
  return createTrackRuntime(exact, PRODUCT_MODE_CONFIGS, exact.contentVersion === retained.lock.contentVersion && exact.artifactSha256 === retained.lock.sha256 ? retained.ledger as ContentSuccessorLedger["tracks"][number] : undefined, interactions);
}
