import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PublishedTrackManifest } from "../contracts";
import { CorruptContentCacheError } from "../errors";

export type CachedTrackContent = { trackId: string; familyId: string; contentVersion: string; manifest: PublishedTrackManifest; bankJson: string; sha256: string; activatedAt: string };
const key = (name: string) => `patternly:v1:content:${name}`;
const stagedKey = (trackId: string, version: string) => key(`staged:${trackId}:${version}`);
const activeKey = (trackId: string) => key(`active:${trackId}`);
export interface ContentCache { readActive(trackId: string): Promise<CachedTrackContent | null>; readStaged(trackId: string, version: string): Promise<CachedTrackContent | null>; stage(candidate: CachedTrackContent): Promise<void>; activate(trackId: string, contentVersion: string): Promise<void>; discardStaged(trackId: string, contentVersion: string): Promise<void>; }
function parse(value: string | null): CachedTrackContent | null { if (!value) return null; try { const candidate = JSON.parse(value) as CachedTrackContent; if (!candidate.trackId || !candidate.contentVersion || !candidate.bankJson || !candidate.manifest) throw new Error(); return candidate; } catch { throw new CorruptContentCacheError(); } }
export class AsyncStorageContentCache implements ContentCache {
  async readActive(trackId: string): Promise<CachedTrackContent | null> { const pointer = await AsyncStorage.getItem(activeKey(trackId)); if (!pointer) return null; return parse(await AsyncStorage.getItem(stagedKey(trackId, pointer))); }
  async readStaged(trackId: string, version: string): Promise<CachedTrackContent | null> { return parse(await AsyncStorage.getItem(stagedKey(trackId, version))); }
  async stage(candidate: CachedTrackContent): Promise<void> { await AsyncStorage.setItem(stagedKey(candidate.trackId, candidate.contentVersion), JSON.stringify(candidate)); }
  async activate(trackId: string, contentVersion: string): Promise<void> { if (!(await this.readStaged(trackId, contentVersion))) throw new CorruptContentCacheError(); await AsyncStorage.setItem(activeKey(trackId), contentVersion); }
  async discardStaged(trackId: string, contentVersion: string): Promise<void> { await AsyncStorage.removeItem(stagedKey(trackId, contentVersion)); }
}
