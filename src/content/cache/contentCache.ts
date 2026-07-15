import type { PublishedTrackManifest } from "../contracts";
import { CorruptContentCacheError } from "../errors";
import { STORAGE_KEYS } from "../../storage/keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../../storage/storageCodec";

export type CachedTrackContent = { trackId: string; familyId: string; contentVersion: string; manifest: PublishedTrackManifest; bankJson: string; sha256: string; activatedAt: string };
export interface ContentCache { readActive(trackId: string): Promise<CachedTrackContent | null>; readStaged(trackId: string, version: string): Promise<CachedTrackContent | null>; stage(candidate: CachedTrackContent): Promise<void>; activate(trackId: string, contentVersion: string): Promise<void>; discardStaged(trackId: string, contentVersion: string): Promise<void>; }
function isCached(value: unknown): value is CachedTrackContent { return typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as CachedTrackContent).trackId === "string" && typeof (value as CachedTrackContent).contentVersion === "string" && typeof (value as CachedTrackContent).bankJson === "string" && typeof (value as CachedTrackContent).sha256 === "string" && typeof (value as CachedTrackContent).activatedAt === "string" && typeof (value as CachedTrackContent).manifest === "object"; }
const isVersion = (value: unknown): value is string => typeof value === "string";
export class ContentCacheRepository implements ContentCache {
  async readActive(trackId: string): Promise<CachedTrackContent | null> { const version = readStoredJson(STORAGE_KEYS.contentActive(trackId), isVersion); return version ? this.readStaged(trackId, version) : null; }
  async readStaged(trackId: string, version: string): Promise<CachedTrackContent | null> { return readStoredJson(STORAGE_KEYS.contentVersion(trackId, version), isCached); }
  async stage(candidate: CachedTrackContent): Promise<void> { writeStoredJson(STORAGE_KEYS.contentVersion(candidate.trackId, candidate.contentVersion), candidate); }
  async activate(trackId: string, contentVersion: string): Promise<void> { if (!await this.readStaged(trackId, contentVersion)) throw new CorruptContentCacheError(); writeStoredJson(STORAGE_KEYS.contentActive(trackId), contentVersion); }
  async discardStaged(trackId: string, contentVersion: string): Promise<void> { removeStoredValue(STORAGE_KEYS.contentVersion(trackId, contentVersion)); }
}
