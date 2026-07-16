import * as Crypto from "expo-crypto";
import type { ContentCache, CachedTrackContent } from "../cache";
import type { PublishedRootTrack } from "../contracts";
import { ContentChecksumError, ContentUnavailableError } from "../errors";
import type { ContentSource } from "../source";
import { validateRootManifest, validateTrackManifest } from "../validation";
import { getContentFamilyHandler } from "../../tracks/contentFamilyHandlers";

async function checksum(text: string): Promise<string> { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text, { encoding: Crypto.CryptoEncoding.HEX }); }
function familyHandler(entry: PublishedRootTrack) { return getContentFamilyHandler(entry.familyId); }
async function activateCandidate(cache: ContentCache, candidate: CachedTrackContent, entry: PublishedRootTrack): Promise<void> { const staged = await cache.readStaged(candidate.trackId, candidate.contentVersion); if (!staged) throw new ContentUnavailableError(); const actual = await checksum(staged.bankJson); if (actual !== staged.sha256) throw new ContentChecksumError(); familyHandler(entry).install(JSON.parse(staged.bankJson), staged.manifest); await cache.activate(candidate.trackId, candidate.contentVersion); }

export async function loadTrackContent(source: ContentSource, cache: ContentCache, trackId: string): Promise<void> {
  const root = validateRootManifest(await source.getRootManifest()); const entry = root.tracks.find((track) => track.trackId === trackId); if (!entry) throw new ContentUnavailableError();
  const active = await cache.readActive(trackId);
  if (active) { const actual = await checksum(active.bankJson); if (actual !== active.sha256) throw new ContentChecksumError(); familyHandler(entry).install(JSON.parse(active.bankJson), active.manifest); }
  try {
    const manifest = validateTrackManifest(await source.getTrackManifest(entry), entry);
    if (active?.contentVersion === manifest.contentVersion) return;
    const raw = await source.getTrackBank(manifest); const actual = await checksum(raw.text); if (actual !== manifest.sha256) throw new ContentChecksumError();
    familyHandler(entry).validate(raw.json, manifest);
    const candidate: CachedTrackContent = { trackId, familyId: entry.familyId, contentVersion: manifest.contentVersion, manifest, bankJson: raw.text, sha256: actual, activatedAt: new Date().toISOString() };
    await cache.stage(candidate); await activateCandidate(cache, candidate, entry);
  } catch (error) { if (!active) throw error; }
}
