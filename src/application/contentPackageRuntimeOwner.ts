import { CanonicalTrainingRuntime } from "./canonical/CanonicalTrainingRuntime";
import { createCanonicalRuntimeCatalogOwner, type CanonicalTrackRuntime, type Question } from "../content/canonical";
import { createResolvedContentRef, isArtifactSha256, type ResolvedContentRef, type TrackFamilyId, type TrackId } from "../domain";

export type ResolvedPackageRuntime = Readonly<{ track: CanonicalTrackRuntime; runtime: CanonicalTrainingRuntime }>;
export class ContentPackageRuntimeOwner {
  private readonly catalogOwner = createCanonicalRuntimeCatalogOwner();
  private readonly exact = new Map<string, ResolvedPackageRuntime>();
  private readonly discovered = new Map<string, ResolvedPackageRuntime>();
  async resolveForPreparation(input: Readonly<{ trackId: TrackId; familyId: TrackFamilyId; modeId: string }>): Promise<ResolvedPackageRuntime> { const track = (await this.catalogOwner.load()).getTrack(input.trackId); assertFamily(track, input.familyId); track.getMode(input.modeId); const r = this.materialize(track); this.discovered.set(input.trackId, r); return r; }
  async resolveExactArtifact(input: Pick<ResolvedContentRef, "trackId" | "contentVersion" | "artifactSha256">): Promise<ResolvedPackageRuntime> {
    if (!input.trackId.trim() || !input.contentVersion.trim() || !isArtifactSha256(input.artifactSha256)) {
      throw new Error("Exact canonical artifact identity is invalid.");
    }
    const track = (await this.catalogOwner.load()).getTrack(input.trackId);
    if (track.trackId !== input.trackId || track.contentVersion !== input.contentVersion || track.artifactSha256 !== input.artifactSha256) {
      throw new Error("Exact canonical artifact identity does not match the verified catalog.");
    }
    return this.materialize(track);
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
  private materialize(track: CanonicalTrackRuntime): ResolvedPackageRuntime { const key = `${track.trackId}:${track.contentVersion}:${track.artifactSha256}`; const cached = this.exact.get(key); if (cached) return cached; const r = Object.freeze({ track, runtime: new CanonicalTrainingRuntime(track) }); this.exact.set(key, r); return r; }
}
function assertFamily(track: CanonicalTrackRuntime, familyId: TrackFamilyId): void { if (new CanonicalTrainingRuntime(track).familyId !== familyId) throw new Error(`Canonical family routing does not own ${track.trackId}.`); }
export const contentPackageRuntimeOwner = new ContentPackageRuntimeOwner();
