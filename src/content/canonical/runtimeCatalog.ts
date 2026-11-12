import { markStartup } from "../../infrastructure/diagnostics/startupTrace";
import type { PackageCompletionRule, VerifiedCompletionSource } from "../../domain/learning/packageCompletionRule";
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
import contentTrustManifestFile from "../generated/content-trust-manifest.json";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { getProductModeConfig, PRODUCT_MODE_CONFIGS, validateProductModeConfigsAgainstArtifacts, type ProductModeConfig } from "./productModeConfig";
import { createCanonicalQuestionCatalog, createTrustedCanonicalQuestionCatalog, type CanonicalQuestionCatalog } from "./questionCatalog";
import { CONTENT_TRUST_MANIFEST_SCHEMA, contentTrustBindingSha, isContentTrustManifestEnabled, matchContentTrustManifest, retainedTrustBindingSha, type ContentTrustManifest, type TrustedContent } from "./contentTrustManifest";
import type { CanonicalContentLockRecord, CanonicalProductSimulationProfile, Question } from "./questionTypes";
import { validateLearningPlanningPolicy, type LearningPlanningPolicy } from "./planningPolicy";
import { assertValidContentSuccessorLedger, contentSuccessorLedgerEntry, type ContentPlanningPolicyIdentity, type ContentTrackIdentity, type ContentSuccessorLedger } from "./contentSuccessorLedger";
import { canonicalInteractionRegistry, type CanonicalInteractionRegistry } from "./interactions/registry";

const artifacts: readonly unknown[] = Object.freeze([aws, backend, claude, coding, frontend, gcp, az104, ai901, objectDesign]);
const locks = new Map((lockFile.tracks as CanonicalContentLockRecord[]).map((entry) => [entry.trackId, entry]));
const retainedVerificationIds = Object.freeze([
  "retained:claude-pre-qle-v2.json", "retained:claude-qle-v2-first-cases.json", "retained:claude-qle-v2-before-identity.json", "retained:claude-qle-v2-active-before-exam.json",
]);

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

function createVerificationPlan(sourceArtifacts: readonly unknown[], includeRetained: boolean): VerificationWorkPlan | undefined {
  if (sourceArtifacts.length > 9) return undefined;
  const trackIds = sourceArtifacts.map((artifact) => artifact && typeof artifact === "object" && !Array.isArray(artifact)
    ? (artifact as Record<string, unknown>).trackId : undefined);
  if (trackIds.some((id) => typeof id !== "string" || id.length === 0) || new Set(trackIds).size !== trackIds.length) return undefined;
  const units: VerificationWorkPlan["units"][number][] = trackIds.map((id, index) => Object.freeze({ id: `current:${index}:${id}`, kind: "current_artifact" }));
  if (includeRetained) for (const id of retainedVerificationIds) units.push(Object.freeze({ id, kind: "retained_pair" }));
  return Object.freeze({ build: Object.freeze({}), units: Object.freeze(units) });
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
      const sourceArtifacts = Object.freeze([...(dependencies.artifacts ?? artifacts)]);
      const snapshot = { ...dependencies, ...(dependencies.artifacts === undefined ? {} : { artifacts: sourceArtifacts }),
        ...(dependencies.locks === undefined ? {} : { locks: Object.freeze([...dependencies.locks]) }) };
      let resolve!: (catalog: CanonicalRuntimeCatalog) => void;
      let reject!: (error: unknown) => void;
      const promise = new Promise<CanonicalRuntimeCatalog>((yes, no) => { resolve = yes; reject = no; });
      const run: Run = { promise, plan: createVerificationPlan(sourceArtifacts, dependencies.artifacts === undefined), completed: new Set() };
      // Install both identities before reentrant observers or the builder can call load().
      cached = run;
      const plan = run.plan;
      if (plan) for (const subscriber of [...subscribers]) notify(subscriber, () => subscriber.observer.onWorkPlan(plan));
      const verified = (unitId: string) => {
        if (!plan || run.completed.has(unitId) || !plan.units.some((unit) => unit.id === unitId)) return;
        run.completed.add(unitId);
        const proof = Object.freeze({ build: plan.build, unitId });
        for (const subscriber of [...subscribers]) notify(subscriber, () => subscriber.observer.onVerifiedUnit(proof));
      };
      void buildCatalog(snapshot, verified).then(resolve, (error: unknown) => {
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

async function buildCatalog(dependencies: CanonicalRuntimeBuildDependencies = {}, verified?: (unitId: string) => void, mode: VerificationMode = "auto"): Promise<CanonicalRuntimeCatalog> {
  markStartup("catalog_build", "begin");
  try {
    const sourceArtifacts = dependencies.artifacts ?? artifacts;
    const sourceLocks = new Map((dependencies.locks ?? [...locks.values()]).map((entry) => [entry.trackId, entry]));
    const sha256 = dependencies.sha256Utf8 ?? contentHasher.sha256;
    const interactionRegistry = dependencies.interactionRegistry ?? canonicalInteractionRegistry;
    const successorLedger = dependencies.successorLedger ?? (dependencies.artifacts === undefined ? successorLedgerFile : undefined);
    if (successorLedger !== undefined) assertValidContentSuccessorLedger(successorLedger);
    const trust: TrustedContent | undefined = mode === "auto" && coversBundledContent(dependencies) && isContentTrustManifestEnabled()
      ? await matchContentTrustManifest(contentTrustManifestFile, { lockFile, ledgerFile: successorLedgerFile, artifacts: sourceArtifacts, locks: sourceLocks, sha256Utf8: sha256 })
      : undefined;
    const catalogs: CanonicalQuestionCatalog[] = [];
    for (const [index, artifact] of sourceArtifacts.entries()) {
      if (!artifact || typeof artifact !== "object" || Array.isArray(artifact) || typeof (artifact as Record<string, unknown>).trackId !== "string") throw new Error("Canonical artifact is unavailable; restart to load canonical content.");
      const trackId = (artifact as Record<string, unknown>).trackId as string;
      const lock = sourceLocks.get(trackId);
      if (!lock) throw new Error(`Canonical content lock is missing for ${trackId}.`);
      catalogs.push(trust ? createTrustedCanonicalQuestionCatalog(artifact, lock, trackId) : await createCanonicalQuestionCatalog(artifact, lock, trackId, sha256, interactionRegistry));
      if (successorLedger !== undefined) {
        const entry = contentSuccessorLedgerEntry(successorLedger as ContentSuccessorLedger, trackId);
        const source = artifact as Record<string, unknown>;
        if (source.schemaVersion !== "patternly-content-artifact-v2" || source.contentVersion !== entry.planningPolicy.contentVersion || lock.sha256 !== entry.planningPolicy.artifactSha256 ||
          (source.planningPolicy as Record<string, unknown> | undefined)?.policyVersion !== entry.planningPolicy.policyVersion || !Array.isArray(source.questions) || source.questions.length !== entry.training.questionCount) {
          throw new Error(`Content successor ledger does not match the current v2 policy artifact for ${trackId}.`);
        }
        // The build-time manifest already reconstructed and hashed this exact predecessor.
        if (trust) { verified?.(`current:${index}:${trackId}`); continue; }
        markStartup("predecessor_clone_stringify", "begin");
        // Only root fields change; nested generated JSON is read-only during serialization.
        const historical = { ...source };
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
      verified?.(`current:${index}:${trackId}`);
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
      if (unitId) verified?.(unitId);
    };
    const retainedProofs = dependencies.artifacts === undefined
      ? trust
        ? await trustedRetainedCompletionCatalogs(await loadRetainedClaudePackages().catch(() => []), trust, onRetainedPair)
        : await verifyRetainedCompletionCatalogs(await loadRetainedClaudePackages().catch(() => []), interactionRegistry, onRetainedPair)
      : [];
    const byTrack = new Map(catalogs.map((catalog) => {
      const completionSources = [catalog, ...retainedProofs.filter(source => source.trackId === catalog.trackId)].map(source => Object.freeze({
        trackId: source.trackId, contentVersion: source.contentVersion, artifactSha256: source.artifactSha256, completionRule: source.completionRule,
        getQuestion: (questionId: string) => {
          const question = source.getQuestionById(questionId);
          return question ? Object.freeze({ nodeId: question.nodeId, mentalUnitId: question.mentalUnitId }) : undefined;
        },
      }));
      return [catalog.trackId, createTrackRuntime(catalog, modeConfigs,
        successorLedger === undefined ? undefined : contentSuccessorLedgerEntry(successorLedger as ContentSuccessorLedger, catalog.trackId), interactionRegistry,
        completionSources)] as const;
    }));
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

/** Exact-only historical Claude data, outside the replaced active bundle directory. */
async function loadRetainedClaudePackages() {
  return [
    (await import("../generated/retained-content/claude-pre-qle-v2.json")).default,
    (await import("../generated/retained-content/claude-qle-v2-first-cases.json")).default,
    (await import("../generated/retained-content/claude-qle-v2-before-identity.json")).default,
    (await import("../generated/retained-content/claude-qle-v2-active-before-exam.json")).default,
  ];
}

type RetainedClaudePackage = Awaited<ReturnType<typeof loadRetainedClaudePackages>>[number];

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
 * Trusted retained proofs: the manifest lists only packages whose full proof passed at build time, so a
 * package that is absent (or whose lock/ledger changed) stays unverified, exactly as a failed proof would.
 * Full re-verification of a retained pin happens lazily, on demand, in `resolveRetainedClaudeTrack`.
 */
async function trustedRetainedCompletionCatalogs(sources: readonly RetainedClaudePackage[], trust: TrustedContent, onVerifiedPair?: (index: number) => void): Promise<readonly CanonicalQuestionCatalog[]> {
  const verified: CanonicalQuestionCatalog[] = [];
  for (const [index, source] of sources.entries()) {
    const id = retainedVerificationIds[index];
    try {
      if (!id || !await trust.retainedProven(id, source)) continue;
      verified.push(...trustedRetainedClaudePackage(source));
      onVerifiedPair?.(index);
    } catch { /* Same contract as the full path: an unverified pin yields explicit unavailable completion. */ }
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
export async function deriveBundledContentTrustManifest(sha256Utf8: (value: string) => Promise<string> = contentHasher.sha256): Promise<ContentTrustManifest> {
  const proven = new Set<string>();
  await buildCatalog({ sha256Utf8 }, (unitId) => { proven.add(unitId); }, "full");
  const retainedPackages = await loadRetainedClaudePackages();
  const retained: { id: string; sha: string }[] = [];
  for (const [index, id] of retainedVerificationIds.entries()) {
    const source = retainedPackages[index];
    if (source && proven.has(id)) retained.push({ id, sha: await retainedTrustBindingSha(source, sha256Utf8) });
  }
  return {
    schemaVersion: CONTENT_TRUST_MANIFEST_SCHEMA,
    lockSha: await contentTrustBindingSha(lockFile, sha256Utf8),
    ledgerSha: await contentTrustBindingSha(successorLedgerFile, sha256Utf8),
    artifacts: artifacts.map((artifact) => {
      const trackId = (artifact as { trackId: string }).trackId;
      const sha = locks.get(trackId)?.sha256;
      if (!sha) throw new Error(`Canonical content lock is missing for ${trackId}.`);
      return { trackId, sha };
    }),
    retained,
  };
}

/** Full per-start verification regardless of the manifest (tests and diagnostics). */
export async function buildFullyVerifiedCanonicalRuntimeCatalog(dependencies: CanonicalRuntimeBuildDependencies = {}): Promise<CanonicalRuntimeCatalog> {
  return buildCatalog(dependencies, undefined, "full");
}

export async function resolveRetainedClaudeTrack(identity: Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }>, interactions: CanonicalInteractionRegistry = canonicalInteractionRegistry): Promise<CanonicalTrackRuntime | null> {
  if (identity.trackId !== "claude-certified-architect-professional-certification") return null;
  const retained = (await loadRetainedClaudePackages()).find(({ lock, ledger }) =>
    (identity.contentVersion === lock.contentVersion && identity.artifactSha256 === lock.sha256) ||
    (identity.contentVersion === ledger.training.contentVersion && identity.artifactSha256 === ledger.training.artifactSha256));
  if (!retained) return null;
  const catalogs = await verifyRetainedClaudePackage(retained, interactions);
  const exact = catalogs.find(catalog => catalog.contentVersion === identity.contentVersion && catalog.artifactSha256 === identity.artifactSha256);
  if (!exact) return null;
  return createTrackRuntime(exact, PRODUCT_MODE_CONFIGS, exact.contentVersion === retained.lock.contentVersion && exact.artifactSha256 === retained.lock.sha256 ? retained.ledger : undefined, interactions);
}
