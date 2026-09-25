import { CanonicalTrainingRuntime } from "./canonical/CanonicalTrainingRuntime";
import { createCanonicalRuntimeCatalogOwner, type CanonicalTrackRuntime, type Question } from "../content/canonical";
import { createResolvedContentRef, isArtifactSha256, type ResolvedContentRef, type TrackFamilyId, type TrackId } from "../domain";
import type { VerifiedNodePackage } from "../content/runtime/nodeContentPackage";
import { getActiveNodePackageScopeKey, loadActiveProfileNodePackages } from "../content/application/nodePackageStoreComposition";

export type ResolvedPackageRuntime = Readonly<{ track: CanonicalTrackRuntime; runtime: CanonicalTrainingRuntime }>;
export class ContentPackageRuntimeOwner {
  private hydration: Readonly<{ scopeKey: string; promise: Promise<void> }> | null = null;
  private installedScopeKey: string | null = null;
  private scopeInitialized = false;
  constructor(
    private readonly getInstalledScopeKey: () => string | null = getActiveNodePackageScopeKey,
    private readonly loadActiveInstalledPackages: (scopeKey: string) => Promise<readonly VerifiedNodePackage[]> = loadActiveProfileNodePackages,
  ) {}
  private readonly catalogOwner = createCanonicalRuntimeCatalogOwner();
  private readonly exact = new Map<string, ResolvedPackageRuntime>();
  private readonly installedExact = new Map<string, ResolvedPackageRuntime>();
  private readonly discovered = new Map<string, ResolvedPackageRuntime>();
  async resolveForPreparation(input: Readonly<{ trackId: TrackId; familyId: TrackFamilyId; modeId: string }>): Promise<ResolvedPackageRuntime> { const track = (await this.catalogOwner.load()).getTrack(input.trackId); assertFamily(track, input.familyId); track.getMode(input.modeId); const r = this.materialize(track); this.discovered.set(input.trackId, r); return r; }
  async resolveExactArtifact(input: Pick<ResolvedContentRef, "trackId" | "contentVersion" | "artifactSha256">): Promise<ResolvedPackageRuntime> {
    const scopeKey = this.syncInstalledScope();
    if (!input.trackId.trim() || !input.contentVersion.trim() || !isArtifactSha256(input.artifactSha256)) {
      throw new Error("Exact canonical artifact identity is invalid.");
    }
    const key = runtimeKey(input.trackId, input.contentVersion, input.artifactSha256);
    const installed = this.installedExact.get(key);
    if (installed) return installed;
    try {
      const track = (await this.catalogOwner.load()).getTrack(input.trackId);
      if (track.trackId === input.trackId && track.contentVersion === input.contentVersion && track.artifactSha256 === input.artifactSha256) return this.materialize(track);
    } catch { /* The exact ref may be a retained, installed node version. */ }
    if (scopeKey) {
      try { await this.hydrateInstalledPackages(scopeKey); }
      catch { /* No active profile or a profile transition means no retained package can be claimed as available. */ }
    }
    const retained = scopeKey && this.syncInstalledScope() === scopeKey ? this.installedExact.get(key) : undefined;
    if (retained) return retained;
    throw new Error("Exact canonical artifact identity does not match the verified catalog or retained node packages.");
  }
  /** Registers verified exact-only node data. It is intentionally absent from discovery and product-mode selection. */
  registerInstalledNodePackage(record: VerifiedNodePackage, scopeKey: string): void {
    if (!scopeKey || this.syncInstalledScope() !== scopeKey) throw new Error("Installed node package profile scope is unavailable or changed.");
    const { payload, identity } = record;
    if (identity.trackId !== payload.trackId || identity.nodeId !== payload.nodeId || identity.contentVersion !== payload.contentVersion || identity.artifactSha256 !== record.manifest.artifactSha256) throw new Error("Installed node package identity is inconsistent.");
    const questions = Object.freeze([...payload.items]);
    const byId = new Map(questions.map((question) => [question.questionId, question]));
    const track: CanonicalTrackRuntime = Object.freeze({
      trackId: identity.trackId,
      contentVersion: identity.contentVersion,
      artifactSha256: identity.artifactSha256,
      contentReleaseId: payload.contentReleaseId,
      questions,
      modes: Object.freeze([]),
      getQuestion: (questionId) => byId.get(questionId),
      getQuestionsForNode: (nodeId) => nodeId === identity.nodeId ? questions : Object.freeze([]),
      getQuestionsForMentalUnit: (mentalUnitId) => Object.freeze(questions.filter((question) => question.mentalUnitId === mentalUnitId)),
      getMode: (modeId) => { throw new Error(`Product mode ${identity.trackId}/${modeId} is not available for an installed node package.`); },
      getPool: (modeId) => { throw new Error(`Product mode ${identity.trackId}/${modeId} is not available for an installed node package.`); },
    });
    const key = runtimeKey(identity.trackId, identity.contentVersion, identity.artifactSha256);
    if (!this.installedExact.has(key)) this.installedExact.set(key, Object.freeze({ track, runtime: new CanonicalTrainingRuntime(track) }));
  }
  async resolveForDiscovery(trackId: TrackId, familyId: TrackFamilyId): Promise<ResolvedPackageRuntime> { const track = (await this.catalogOwner.load()).getTrack(trackId); assertFamily(track, familyId); const r = this.materialize(track); this.discovered.set(trackId, r); return r; }
  getPreparedDiscovery(trackId: TrackId): ResolvedPackageRuntime { const prepared = this.discovered.get(trackId); if (prepared) return prepared; for (const candidate of this.exact.values()) { if (candidate.track.trackId === trackId) { this.discovered.set(trackId, candidate); return candidate; } } throw new Error(`Canonical discovery is not prepared for ${trackId}.`); }
  async verifyBundledPackages(): Promise<void> { const catalog = await this.catalogOwner.load(); for (const id of catalog.tracks) { const track = catalog.getTrack(id); const runtime = this.materialize(track); this.discovered.set(id, runtime); } }
  async resolveItem(ref: ResolvedContentRef): Promise<Question> {
    const exactRef = createResolvedContentRef(ref);
    const r = await this.resolveExactArtifact(exactRef);
    const q = r.track.getQuestion(exactRef.questionId);
    if (!q || q.trackId !== exactRef.trackId || r.track.trackId !== exactRef.trackId || r.track.contentVersion !== exactRef.contentVersion || r.track.artifactSha256 !== exactRef.artifactSha256) {
      throw new Error("Resolved content reference does not match its exact canonical question.");
    }
    return q;
  }
  resolveTextAsset(_ref: ResolvedContentRef, _assetId: string): never { throw new Error("Canonical content does not provide text assets."); }
  private async hydrateInstalledPackages(scopeKey: string): Promise<void> {
    if (this.getInstalledScopeKey() !== scopeKey) { this.syncInstalledScope(); return; }
    if (!this.hydration || this.hydration.scopeKey !== scopeKey) {
      const promise = this.loadActiveInstalledPackages(scopeKey).then((records) => {
        if (this.getInstalledScopeKey() !== scopeKey) return;
        this.syncInstalledScope();
        for (const record of records) this.registerInstalledNodePackage(record, scopeKey);
      }).catch((error) => { if (this.hydration?.scopeKey === scopeKey) this.hydration = null; throw error; });
      this.hydration = Object.freeze({ scopeKey, promise });
    }
    await this.hydration.promise;
    this.syncInstalledScope();
  }
  private syncInstalledScope(): string | null {
    const scopeKey = this.getInstalledScopeKey();
    if (!this.scopeInitialized || scopeKey !== this.installedScopeKey) {
      this.installedExact.clear();
      this.hydration = null;
      this.installedScopeKey = scopeKey;
      this.scopeInitialized = true;
    }
    return scopeKey;
  }
  private materialize(track: CanonicalTrackRuntime): ResolvedPackageRuntime { const key = runtimeKey(track.trackId, track.contentVersion, track.artifactSha256); const cached = this.exact.get(key); if (cached) return cached; const r = Object.freeze({ track, runtime: new CanonicalTrainingRuntime(track) }); this.exact.set(key, r); return r; }
}
function runtimeKey(trackId: string, contentVersion: string, artifactSha256: string): string { return JSON.stringify([trackId, contentVersion, artifactSha256]); }
function assertFamily(track: CanonicalTrackRuntime, familyId: TrackFamilyId): void { if (new CanonicalTrainingRuntime(track).familyId !== familyId) throw new Error(`Canonical family routing does not own ${track.trackId}.`); }
export const contentPackageRuntimeOwner = new ContentPackageRuntimeOwner();
