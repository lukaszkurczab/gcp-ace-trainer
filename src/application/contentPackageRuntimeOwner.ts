import { CanonicalTrainingRuntime } from "./canonical/CanonicalTrainingRuntime";
import { createCanonicalRuntimeCatalogOwner, type CanonicalTrackRuntime, type Question } from "../content/canonical";
import type { ContentItemRef, ContentPackagePin, TrackFamilyId, TrackId } from "../domain";
import { contentPackagePinsEqual } from "../domain";

export type ResolvedPackageRuntime = Readonly<{ track: CanonicalTrackRuntime; runtime: CanonicalTrainingRuntime }>;
export class ContentPackageRuntimeOwner {
  private readonly catalogOwner = createCanonicalRuntimeCatalogOwner();
  private readonly exact = new Map<string, ResolvedPackageRuntime>();
  private readonly discovered = new Map<string, ResolvedPackageRuntime>();
  async resolveForPreparation(input: Readonly<{ trackId: TrackId; familyId: TrackFamilyId; modeId: string }>): Promise<ResolvedPackageRuntime> { const track = (await this.catalogOwner.load()).getTrack(input.trackId); assertFamily(track, input.familyId); track.getMode(input.modeId); const r = this.materialize(track); this.discovered.set(input.trackId, r); return r; }
  async resolveExact(pin: ContentPackagePin): Promise<ResolvedPackageRuntime> { return this.materialize((await this.catalogOwner.load()).getTrackByPin(pin)); }
  async resolveForDiscovery(trackId: TrackId, familyId: TrackFamilyId): Promise<ResolvedPackageRuntime> { const track = (await this.catalogOwner.load()).getTrack(trackId); assertFamily(track, familyId); const r = this.materialize(track); this.discovered.set(trackId, r); return r; }
  getPreparedDiscovery(trackId: TrackId): ResolvedPackageRuntime { const prepared = this.discovered.get(trackId); if (prepared) return prepared; for (const candidate of this.exact.values()) { if (candidate.track.trackId === trackId) { this.discovered.set(trackId, candidate); return candidate; } } throw new Error(`Canonical discovery is not prepared for ${trackId}.`); }
  async verifyBundledPackages(): Promise<void> { const catalog = await this.catalogOwner.load(); for (const id of catalog.tracks) { const track = catalog.getTrack(id); const runtime = this.materialize(track); this.discovered.set(id, runtime); } }
  async resolveItem(ref: ContentItemRef): Promise<Question> { const r = await this.resolveExact(ref.packagePin); const q = r.track.getQuestion(ref.itemId); if (!q || q.trackId !== ref.trackId || r.track.trackId !== ref.trackId || r.track.contentVersion !== ref.contentVersion || !contentPackagePinsEqual(ref.packagePin, r.track.packagePin)) throw new Error("Content item reference does not match its exact canonical question."); return q; }
  resolveTextAsset(_ref: ContentItemRef, _assetId: string): never { throw new Error("Canonical content does not provide text assets."); }
  private materialize(track: CanonicalTrackRuntime): ResolvedPackageRuntime { const key = `${track.packagePin.packageIdentity}:${track.packagePin.packageVersion}:${track.packagePin.contentReleaseId}`; const cached = this.exact.get(key); if (cached) return cached; const r = Object.freeze({ track, runtime: new CanonicalTrainingRuntime(track) }); this.exact.set(key, r); return r; }
}
function assertFamily(track: CanonicalTrackRuntime, familyId: TrackFamilyId): void { if (new CanonicalTrainingRuntime(track).familyId !== familyId) throw new Error(`Canonical family routing does not own ${track.trackId}.`); }
export const contentPackageRuntimeOwner = new ContentPackageRuntimeOwner();
