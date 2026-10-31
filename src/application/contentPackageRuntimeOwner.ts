import { indexCaseRecipes } from "../content/canonical/caseRecipe";
import { resolveRetainedClaudeTrack, type VerificationObserver } from "../content/canonical/runtimeCatalog";
import { createCanonicalTrainingFamilyComposition } from "./canonicalTrainingFamilyComposition";
import { createCanonicalRuntimeCatalogOwner, type CanonicalTrackRuntime } from "../content/canonical";
import { isCanonicalSafeIdentity } from "../domain/identity/canonicalIdentity";
import { createResolvedContentRef, isArtifactSha256, type ResolvedContentRef, type TrackFamilyId, type TrackId } from "../domain";
import type { VerifiedNodePackage } from "../content/runtime/nodeContentPackage";
import { getProductSimulationModeConfig } from "../content/canonical/productModeConfig";
import { getActiveNodePackageScopeKey, loadActiveProfileNodePackages } from "../content/application/nodePackageStoreComposition";
import { findPremiumNodeOfferForIdentity } from "../content/application/premiumNodeOffers";
import { getAvailablePremiumNodeOfferForMode } from "../content/application/premiumNodeOfferAccess";
import { ExactContentArtifactUnavailableError, type ContentPackageRuntimePort, type ContentPackageRuntimeResolution, type TrainingCatalog, type TrainingFamilyRuntime, type TrainingPresentationPort, type TrainingQuestionSummary } from "./trainingLifecycle/contracts";
import { getTrackRegistration, isRegisteredTrackId } from "../domain/tracks/trackRegistry";
import type { LearningPlanningPolicy } from "../content/canonical/planningPolicy";
import type { ContentPlanningPolicyIdentity } from "../content/canonical/contentSuccessorLedger";
import { NodePackageStorageUnavailableError } from "../content/runtime/nodeContentPackage";
import { canonicalInteractionRegistry, type CanonicalInteractionRegistry } from "../content/canonical/interactions/registry";
import { APPROACH_CHALLENGE_MODE_ID } from "../tracks/coding-interview/domain/algorithmModes";
import { APPROACH_CHALLENGE_TRACK_ID } from "../content/canonical/approachChallengeProblem";

export type ResolvedPackageRuntime = Readonly<{ track: TrainingCatalog; runtime: TrainingFamilyRuntime; presentation: TrainingPresentationPort; planningPolicy?: LearningPlanningPolicy; planningPolicyIdentity?: ContentPlanningPolicyIdentity }>;
export type ResolvedInteractionItem = Readonly<{ question: TrainingQuestionSummary; interactions: TrainingPresentationPort }>;
type PackageOffer = ReturnType<typeof findPremiumNodeOfferForIdentity>;
export class ContentPackageRuntimeOwner {
  private hydration: Readonly<{ scopeKey: string; epoch: number; promise: Promise<void> }> | null = null;
  private hydrationEpoch = 0;
  private installedScopeKey: string | null = null;
  private scopeInitialized = false;
  private readonly catalogOwner: ReturnType<typeof createCanonicalRuntimeCatalogOwner>;
  private readonly loadActiveInstalledPackages: (scopeKey: string) => Promise<readonly VerifiedNodePackage[]>;
  constructor(
    private readonly getInstalledScopeKey: () => string | null = getActiveNodePackageScopeKey,
    loadActiveInstalledPackages?: (scopeKey: string) => Promise<readonly VerifiedNodePackage[]>,
    private readonly offerForIdentity: (identity: VerifiedNodePackage["identity"]) => PackageOffer = findPremiumNodeOfferForIdentity,
    private readonly availableOfferForMode: typeof getAvailablePremiumNodeOfferForMode = getAvailablePremiumNodeOfferForMode,
    private readonly interactions: CanonicalInteractionRegistry = canonicalInteractionRegistry,
    catalogOwner?: ReturnType<typeof createCanonicalRuntimeCatalogOwner>,
  ) {
    this.loadActiveInstalledPackages = loadActiveInstalledPackages ?? ((scopeKey) => loadActiveProfileNodePackages(scopeKey, this.interactions));
    this.catalogOwner = catalogOwner ?? createCanonicalRuntimeCatalogOwner({ interactionRegistry: this.interactions });
  }
  private readonly historicalExact = new Map<string, ResolvedPackageRuntime>();
  private readonly exact = new Map<string, ResolvedPackageRuntime>();
  private readonly installedExact = new Map<string, ResolvedPackageRuntime>();
  private readonly discovered = new Map<string, ResolvedPackageRuntime>();
  private readonly modeDiscovered = new Map<string, ResolvedPackageRuntime>();
  private readonly sourceTracks = new Map<string, CanonicalTrackRuntime>();
  subscribeBundledVerification(observer: VerificationObserver): () => void { return this.catalogOwner.subscribeVerification(observer); }
  async resolveForPreparation(input: Readonly<{ trackId: TrackId; familyId: TrackFamilyId; modeId: string; nodeId?: string; caseId?: string }>): Promise<ResolvedPackageRuntime> {
    const track = (await this.catalogOwner.load()).getTrack(input.trackId);
    assertFamily(track, input.familyId);
    if (input.modeId === APPROACH_CHALLENGE_MODE_ID) {
      if (input.trackId !== APPROACH_CHALLENGE_TRACK_ID || input.nodeId !== undefined || input.caseId !== undefined || !track.approachChallengeProblems?.length) throw new Error("Approach Challenge requires the current whole-track artifact.");
      const resolved = this.materialize(track, APPROACH_CHALLENGE_MODE_ID);
      this.modeDiscovered.set(modeDiscoveryKey(input.trackId, input.modeId), resolved);
      return resolved;
    }
    if (input.modeId === "certification-exam-simulation" || input.modeId === "coding-interview-simulation" || input.modeId === "design-interview-simulation") {
      if (input.nodeId !== undefined) throw new Error("Product simulations do not accept a nodeId.");
      const simulation = getProductSimulationModeConfig(track.trackId, track.simulationProfiles);
      if (simulation.config.modeId !== input.modeId || simulation.config.familyId !== input.familyId) throw new Error("Requested simulation mode does not match its canonical product profile.");
      return this.materialize(track);
    }
    if (input.caseId !== undefined) {
      const recipe = indexCaseRecipes(track.questions).find(c => c.caseId === input.caseId);
      const owner = recipe && track.getQuestion(recipe.steps[0]!.questionId);
      if (!recipe || !owner || input.modeId !== "certification-focus-practice" || !input.nodeId || owner.nodeId !== input.nodeId || recipe.steps.some(step => track.getQuestion(step.questionId)?.nodeId !== owner.nodeId)) throw new Error("The requested whole case is unavailable in this bundle/node.");
      // Lifecycle admission checks every item against the canonical Free node before start/resume.
      return this.materialize(track);
    }
    if (input.nodeId) {
      const offeredNode = this.availableOfferForMode(input.trackId, input.modeId);
      if (offeredNode?.familyId === input.familyId && offeredNode.nodeId === input.nodeId) {
        const resolved = await this.resolveExactArtifact({ trackId: offeredNode.trackId, contentVersion: offeredNode.contentVersion, artifactSha256: offeredNode.artifactSha256 });
        resolved.track.getMode(input.modeId);
        return resolved;
      }
      const bundledMode = track.getMode(input.modeId);
      if (bundledMode.selection.kind !== "node" || bundledMode.selection.nodeId !== input.nodeId) {
        throw new Error(`Product node ${input.trackId}/${input.nodeId} is unavailable for mode ${input.modeId}.`);
      }
    }
    try {
      track.getMode(input.modeId);
      const resolved = this.materialize(track);
      this.discovered.set(input.trackId, resolved);
      return resolved;
    } catch {
      const offer = this.availableOfferForMode(input.trackId, input.modeId);
      if (!offer || offer.familyId !== input.familyId) throw new Error(`Product mode ${input.trackId}/${input.modeId} is unavailable.`);
      const resolved = await this.resolveExactArtifact({ trackId: offer.trackId, contentVersion: offer.contentVersion, artifactSha256: offer.artifactSha256 });
      resolved.track.getMode(input.modeId);
      return resolved;
    }
  }
  async resolveExactArtifact(input: Pick<ResolvedContentRef, "trackId" | "contentVersion" | "artifactSha256"> & Readonly<{ modeId?: string }>): Promise<ResolvedPackageRuntime> {
    const scopeKey = this.syncInstalledScope();
    if (!isRegisteredTrackId(input.trackId) || !isCanonicalSafeIdentity(input.contentVersion) || !isArtifactSha256(input.artifactSha256)) {
      throw new Error("Exact canonical artifact identity is invalid.");
    }
    const key = runtimeKey(input.trackId, input.contentVersion, input.artifactSha256);
    if (input.modeId === APPROACH_CHALLENGE_MODE_ID) {
      const catalog = await this.catalogOwner.load();
      if (!catalog.tracks.includes(input.trackId)) throw unavailable(input);
      const source = catalog.getTrack(input.trackId);
      if (input.trackId !== APPROACH_CHALLENGE_TRACK_ID || source.contentVersion !== input.contentVersion || source.artifactSha256 !== input.artifactSha256 || !source.approachChallengeProblems?.length) throw unavailable(input);
      return this.materialize(source, APPROACH_CHALLENGE_MODE_ID);
    }
    const installed = this.installedExact.get(key);
    if (installed) return installed;
    // A missing exact ref is meaningful only after the canonical catalog has
    // loaded and passed its lock/content checks. Catalog failure is an unknown
    // state, not evidence that the requested version was removed.
    const catalog = await this.catalogOwner.load();
    if (catalog.tracks.includes(input.trackId)) {
      const track = catalog.getTrack(input.trackId);
      if (track.trainingIdentity?.contentVersion === input.contentVersion && track.trainingIdentity.artifactSha256 === input.artifactSha256) return this.materialize(track);
    }
    const historical = this.historicalExact.get(key);
    if (historical) return historical;
    const historicalTrack = await resolveRetainedClaudeTrack(input, this.interactions);
    if (historicalTrack) {
      const family = createCanonicalTrainingFamilyComposition(historicalTrack);
      const resolved = Object.freeze({ track: family.catalog, runtime: family.runtime, presentation: family.presentation });
      this.sourceTracks.set(key, historicalTrack);
      this.historicalExact.set(key, resolved);
      return resolved;
    }
    if (scopeKey) {
      // A corrupt, unreadable, or changing retained-package inventory must
      // remain an operational failure rather than becoming unavailable.
      await this.hydrateInstalledPackages(scopeKey);
    }
    const currentScopeKey = this.syncInstalledScope();
    if (currentScopeKey !== scopeKey) throw new Error("Exact content resolution crossed a profile storage transition.");
    const retained = scopeKey ? this.installedExact.get(key) : undefined;
    if (retained) return retained;
    throw new ExactContentArtifactUnavailableError(Object.freeze({
      trackId: input.trackId,
      contentVersion: input.contentVersion,
      artifactSha256: input.artifactSha256,
    }));
  }
  /** Registers verified exact-only node data. It is intentionally absent from discovery and product-mode selection. */
  registerInstalledNodePackage(record: VerifiedNodePackage, scopeKey: string): void {
    if (!scopeKey || this.syncInstalledScope() !== scopeKey) throw new Error("Installed node package profile scope is unavailable or changed.");
    this.registerInstalledNodePackageInto(record, scopeKey, this.installedExact);
  }
  private registerInstalledNodePackageInto(record: VerifiedNodePackage, scopeKey: string, target: Map<string, ResolvedPackageRuntime>): void {
    const { payload, identity } = record;
    const premiumOffer = this.offerForIdentity(identity);
    if (identity.trackId !== payload.trackId || identity.nodeId !== payload.nodeId || identity.contentVersion !== payload.contentVersion || identity.artifactSha256 !== record.manifest.artifactSha256) throw new Error("Installed node package identity is inconsistent.");
    const questions = Object.freeze([...payload.items]);
    const byId = new Map(questions.map((question) => [question.questionId, question]));
    const getMode = (modeId: string) => { const mode = premiumOffer?.mode; if (!mode || mode.modeId !== modeId) throw new Error(`Product mode ${identity.trackId}/${modeId} is not available for an installed node package.`); return mode; };
    const track: CanonicalTrackRuntime = Object.freeze({
      trackId: identity.trackId,
      contentVersion: identity.contentVersion,
      artifactSha256: identity.artifactSha256,
      contentReleaseId: payload.contentReleaseId,
      questions,
      interactions: this.interactions,
      modes: Object.freeze(premiumOffer ? [premiumOffer.mode] : []),
      getQuestion: (questionId) => byId.get(questionId),
      getQuestionsForNode: (nodeId) => nodeId === identity.nodeId ? questions : Object.freeze([]),
      getQuestionsForMentalUnit: (mentalUnitId) => Object.freeze(questions.filter((question) => question.mentalUnitId === mentalUnitId)),
      getMode,
      getPool: (modeId) => { const mode = getMode(modeId); const selection = mode.selection; if (selection.kind !== "node" || selection.nodeId !== identity.nodeId) throw new Error(`Product mode ${identity.trackId}/${modeId} does not own this installed node.`); return questions; },
    });
    const key = runtimeKey(identity.trackId, identity.contentVersion, identity.artifactSha256);
    if (!target.has(key)) {
      const family = createCanonicalTrainingFamilyComposition(track);
      this.sourceTracks.set(key, track);
      target.set(key, Object.freeze({ track: family.catalog, runtime: family.runtime, presentation: family.presentation }));
    }
  }
  async resolveForDiscovery(trackId: TrackId, familyId: TrackFamilyId): Promise<ResolvedPackageRuntime> { const track = (await this.catalogOwner.load()).getTrack(trackId); assertFamily(track, familyId); const r = this.materialize(track); this.discovered.set(trackId, r); return r; }
  getPreparedDiscovery(trackId: TrackId, modeId?: string): ResolvedPackageRuntime { if (modeId === APPROACH_CHALLENGE_MODE_ID) { const prepared = this.modeDiscovered.get(modeDiscoveryKey(trackId, modeId)); if (prepared) return prepared; throw new Error(`Canonical discovery is not prepared for ${trackId}/${modeId}.`); } const prepared = this.discovered.get(trackId); if (prepared) return prepared; for (const [key, candidate] of this.exact) { if (candidate.track.trackId === trackId && isOrdinaryRuntimeKey(key)) { this.discovered.set(trackId, candidate); return candidate; } } throw new Error(`Canonical discovery is not prepared for ${trackId}.`); }
  async verifyBundledPackages(): Promise<void> { const catalog = await this.catalogOwner.load(); for (const id of catalog.tracks) { const track = catalog.getTrack(id); const runtime = this.materialize(track); this.discovered.set(id, runtime); if (id === APPROACH_CHALLENGE_TRACK_ID && track.approachChallengeProblems?.length) this.modeDiscovered.set(modeDiscoveryKey(id, APPROACH_CHALLENGE_MODE_ID), this.materialize(track, APPROACH_CHALLENGE_MODE_ID)); } }
  /** Fresh bootstrap check: cache hits and bundled content must not hide a corrupt installed index. */
  async verifyInstalledPackages(): Promise<void> {
    const scopeKey = this.syncInstalledScope();
    if (!scopeKey) throw new NodePackageStorageUnavailableError("inventory_read");
    const epoch = ++this.hydrationEpoch;
    this.hydration = null;
    const records = await this.loadActiveInstalledPackages(scopeKey);
    if (this.hydrationEpoch !== epoch || this.getInstalledScopeKey() !== scopeKey) {
      this.syncInstalledScope();
      throw new NodePackageStorageUnavailableError("inventory_read");
    }
    this.syncInstalledScope();
    const replacement = new Map<string, ResolvedPackageRuntime>();
    for (const record of records) this.registerInstalledNodePackageInto(record, scopeKey, replacement);
    this.installedExact.clear();
    for (const [key, runtime] of replacement) this.installedExact.set(key, runtime);
    this.hydration = Object.freeze({ scopeKey, epoch, promise: Promise.resolve() });
  }
  async resolveItem(ref: ResolvedContentRef): Promise<ResolvedInteractionItem> {
    const exactRef = createResolvedContentRef(ref);
    const r = await this.resolveExactArtifact(exactRef);
    const source = this.sourceTracks.get(runtimeKey(exactRef.trackId, exactRef.contentVersion, exactRef.artifactSha256));
    const sourceQuestion = source?.getQuestion(exactRef.questionId);
    const question = r.track.getQuestion(exactRef.questionId);
    if (!sourceQuestion || !question || sourceQuestion.trackId !== exactRef.trackId || r.track.trackId !== exactRef.trackId || r.track.contentVersion !== exactRef.contentVersion || r.track.artifactSha256 !== exactRef.artifactSha256) {
      throw new Error("Resolved content reference does not match its exact canonical question.");
    }
    return Object.freeze({ question, interactions: r.presentation });
  }
  resolveTextAsset(_ref: ResolvedContentRef, _assetId: string): never { throw new Error("Canonical content does not provide text assets."); }
  private async hydrateInstalledPackages(scopeKey: string): Promise<void> {
    if (this.getInstalledScopeKey() !== scopeKey) { this.syncInstalledScope(); return; }
    if (!this.hydration || this.hydration.scopeKey !== scopeKey) {
      const epoch = this.hydrationEpoch;
      const promise = this.loadActiveInstalledPackages(scopeKey).then((records) => {
        if (this.hydrationEpoch !== epoch || this.getInstalledScopeKey() !== scopeKey) return;
        this.syncInstalledScope();
        for (const record of records) this.registerInstalledNodePackage(record, scopeKey);
      }).catch((error) => { if (this.hydration?.epoch === epoch) this.hydration = null; throw error; });
      this.hydration = Object.freeze({ scopeKey, epoch, promise });
    }
    await this.hydration.promise;
    this.syncInstalledScope();
  }
  private syncInstalledScope(): string | null {
    const scopeKey = this.getInstalledScopeKey();
    if (!this.scopeInitialized || scopeKey !== this.installedScopeKey) {
      this.hydrationEpoch += 1;
      this.installedExact.clear();
      this.hydration = null;
      this.installedScopeKey = scopeKey;
      this.scopeInitialized = true;
    }
    return scopeKey;
  }
  private materialize(sourceTrack: CanonicalTrackRuntime, modeId?: string): ResolvedPackageRuntime {
    const identity = modeId === APPROACH_CHALLENGE_MODE_ID
      ? Object.freeze({ contentVersion: sourceTrack.contentVersion, artifactSha256: sourceTrack.artifactSha256 })
      : sourceTrack.trainingIdentity ?? Object.freeze({ contentVersion: sourceTrack.contentVersion, artifactSha256: sourceTrack.artifactSha256 });
    const key = runtimeKey(sourceTrack.trackId, identity.contentVersion, identity.artifactSha256, modeId);
    const cached = this.exact.get(key);
    if (cached) return cached;
    const { planningPolicy: _planningPolicy, planningPolicyIdentity: _planningIdentity, ...sourceWithoutPolicy } = sourceTrack;
    const track: CanonicalTrackRuntime = Object.freeze({
      ...sourceWithoutPolicy,
      contentVersion: identity.contentVersion,
      artifactSha256: identity.artifactSha256,
      trainingIdentity: identity,
    });
    const family = createCanonicalTrainingFamilyComposition(track);
    const resolved = Object.freeze({
      track: family.catalog,
      runtime: family.runtime,
      presentation: family.presentation,
      ...(sourceTrack.planningPolicy ? { planningPolicy: sourceTrack.planningPolicy } : {}),
      ...(sourceTrack.planningPolicyIdentity ? { planningPolicyIdentity: sourceTrack.planningPolicyIdentity } : {}),
    });
    this.sourceTracks.set(key, track);
    this.exact.set(key, resolved);
    return resolved;
  }
}
function unavailable(input: Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }>): ExactContentArtifactUnavailableError { return new ExactContentArtifactUnavailableError(Object.freeze({ trackId: input.trackId, contentVersion: input.contentVersion, artifactSha256: input.artifactSha256 })); }
function runtimeKey(trackId: string, contentVersion: string, artifactSha256: string, modeId?: string): string { return JSON.stringify([trackId, contentVersion, artifactSha256, modeId ?? null]); }
function modeDiscoveryKey(trackId: string, modeId: string): string { return JSON.stringify([trackId, modeId]); }
function isOrdinaryRuntimeKey(key: string): boolean { try { return JSON.parse(key)[3] === null; } catch { return false; } }
function assertFamily(track: CanonicalTrackRuntime, familyId: TrackFamilyId): void { if (getTrackRegistration(track.trackId).familyId !== familyId) throw new Error(`Canonical family routing does not own ${track.trackId}.`); }
export const contentPackageRuntimeOwner = new ContentPackageRuntimeOwner();
function lifecycleResolution(resolved: ResolvedPackageRuntime): ContentPackageRuntimeResolution {
  return Object.freeze({ track: resolved.track, runtime: resolved.runtime });
}
/** Lifecycle receives only the verified metadata catalog and its bound family runtime. */
export const contentPackageRuntimePort: ContentPackageRuntimePort = Object.freeze({
  async resolveForPreparation(input: Parameters<ContentPackageRuntimePort["resolveForPreparation"]>[0]) { return lifecycleResolution(await contentPackageRuntimeOwner.resolveForPreparation(input)); },
  async resolveExactArtifact(input: Parameters<ContentPackageRuntimePort["resolveExactArtifact"]>[0]) { return lifecycleResolution(await contentPackageRuntimeOwner.resolveExactArtifact(input)); },
  async resolveForDiscovery(trackId: Parameters<ContentPackageRuntimePort["resolveForDiscovery"]>[0], familyId: Parameters<ContentPackageRuntimePort["resolveForDiscovery"]>[1]) { return lifecycleResolution(await contentPackageRuntimeOwner.resolveForDiscovery(trackId, familyId)); },
});
