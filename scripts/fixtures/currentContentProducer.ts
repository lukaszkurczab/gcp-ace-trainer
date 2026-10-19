import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

type CurrentTrackIdentity = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  artifactBytes: number;
  questionCount: number;
}>;

type Options = Readonly<{
  appRoot: string;
  contentRoot?: string;
  trackId: string;
}>;

type CurrentIdentityApi = Readonly<{
  computeCurrentSourceIdentity(options: { contentRoot: string }): Promise<Readonly<{
    sourceInputFingerprint: string;
    tracks: readonly CurrentTrackIdentity[];
  }>>;
}>;

type AppVerifierApi = Readonly<{
  verifyBundledCurrentContent(options: { root: string }): Promise<Readonly<{
    sourceInputFingerprint: string;
    trackCount: number;
    artifactDigests: readonly Readonly<{ trackId: string; sha256: string; bytes: number }>[];
  }>>;
}>;

/**
 * Returns the selected current CONTENT checkout only after its full canonical
 * identity matches the APP's independently verified installed payloads.
 * This intentionally performs no Git clone or historical checkout.
 */
export async function currentContentProducer({ appRoot, contentRoot, trackId }: Options): Promise<string> {
  const resolvedAppRoot = path.resolve(appRoot);
  const resolvedContentRoot = path.resolve(contentRoot ?? process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(resolvedAppRoot, "../patternly-content"));
  assert.ok(existsSync(path.join(resolvedContentRoot, "scripts/content/current-source-identity.mjs")), `selected current CONTENT source exists: ${resolvedContentRoot}`);
  assert.ok(existsSync(path.join(resolvedAppRoot, "scripts/verifyBundledCurrentContent.mjs")), `APP current-content verifier exists: ${resolvedAppRoot}`);

  const [identityApi, appVerifier] = await Promise.all([
    import(pathToFileURL(path.join(resolvedContentRoot, "scripts/content/current-source-identity.mjs")).href) as Promise<CurrentIdentityApi>,
    import(pathToFileURL(path.join(resolvedAppRoot, "scripts/verifyBundledCurrentContent.mjs")).href) as Promise<AppVerifierApi>,
  ]);
  const [sourceIdentity, installedIdentity] = await Promise.all([
    identityApi.computeCurrentSourceIdentity({ contentRoot: resolvedContentRoot }),
    appVerifier.verifyBundledCurrentContent({ root: resolvedAppRoot }),
  ]);

  assert.equal(sourceIdentity.tracks.length, 9, "selected current CONTENT source has the complete nine-track identity");
  assert.equal(installedIdentity.trackCount, 9, "APP installed bundle has the complete nine-track identity");
  assert.equal(sourceIdentity.sourceInputFingerprint, installedIdentity.sourceInputFingerprint, "selected current CONTENT source matches the APP current identity");

  const sourceTracks = [...sourceIdentity.tracks].sort((left, right) => left.trackId.localeCompare(right.trackId));
  const installedTracks = [...installedIdentity.artifactDigests].sort((left, right) => left.trackId.localeCompare(right.trackId));
  assert.equal(new Set(sourceTracks.map((track) => track.trackId)).size, 9, "selected current CONTENT source track identities are unique");
  assert.equal(new Set(installedTracks.map((track) => track.trackId)).size, 9, "APP installed track identities are unique");
  assert.deepEqual(sourceTracks.map((track) => track.trackId), installedTracks.map((track) => track.trackId), "selected source and APP contain the exact same nine track IDs");
  assert.deepEqual(
    sourceTracks.map(({ trackId: sourceTrackId, artifactSha256, artifactBytes }) => ({ trackId: sourceTrackId, sha256: artifactSha256, bytes: artifactBytes })),
    installedTracks,
    "all nine selected source artifact digests and byte lengths match APP bytes",
  );

  const selectedSourceTracks = sourceTracks.filter((track) => track.trackId === trackId);
  const selectedInstalledTracks = installedTracks.filter((track) => track.trackId === trackId);
  assert.equal(selectedSourceTracks.length, 1, `${trackId} has exactly one current source identity`);
  assert.equal(selectedInstalledTracks.length, 1, `${trackId} has exactly one verified APP artifact`);
  return resolvedContentRoot;
}
