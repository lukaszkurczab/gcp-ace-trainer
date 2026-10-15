/** Strict API descriptor boundary; the existing package verifier remains the byte/content authority. */
export function parseContentPackageDescriptor(value: unknown, trackId: string, nodeId: string, now = Date.now()): Readonly<{ url: URL; headers: Headers }> {
  const invalid = () => { throw new Error("content_package_descriptor_invalid"); };
  const row = record(value), manifest = record(row?.manifest), object = record(row?.object);
  const id = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9][a-z0-9._-]{0,127}$/u.test(v);
  const sha = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/u.test(v);
  const size = (v: unknown, max: number): v is number => Number.isSafeInteger(v) && Number(v) > 0 && Number(v) <= max;
  if (!row || !manifest || !object || !keys(row, ["schemaVersion", "manifest", "object", "downloadUrl", "expiresAt"])
    || !keys(manifest, ["schemaVersion", "trackId", "nodeId", "contentVersion", "artifactSha256", "packageSha256", "contentReleaseId", "minimumAppVersion", "packageFormat", "compressedSizeBytes", "artifactSizeBytes", "packagePath"])
    || !keys(object, ["bucket", "path", "generation"]) || row.schemaVersion !== "patternly-content-download-v1"
    || manifest.schemaVersion !== "patternly-content-node-package-v1" || manifest.trackId !== trackId || manifest.nodeId !== nodeId
    || !id(trackId) || !id(nodeId) || !id(manifest.contentVersion) || !id(manifest.contentReleaseId)
    || !sha(manifest.artifactSha256) || !sha(manifest.packageSha256) || manifest.packageFormat !== "gzip"
    || !size(manifest.compressedSizeBytes, 2 * 1024 * 1024) || !size(manifest.artifactSizeBytes, 8 * 1024 * 1024)
    || typeof manifest.minimumAppVersion !== "string" || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(manifest.minimumAppVersion)
    || manifest.packagePath !== `packages/${trackId}/${nodeId}/${manifest.packageSha256}.gzip` || object.path !== manifest.packagePath
    || typeof object.bucket !== "string" || !/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u.test(object.bucket)
    || typeof object.generation !== "string" || !/^[1-9][0-9]{0,30}$/u.test(object.generation)
    || typeof row.downloadUrl !== "string" || row.downloadUrl.length > 8192 || typeof row.expiresAt !== "string") return invalid();
  let url: URL;
  try { url = new URL(row.downloadUrl); } catch { return invalid(); }
  const expiry = Date.parse(row.expiresAt);
  const signedAt = url.searchParams.get("X-Goog-Date");
  const signedSeconds = url.searchParams.get("X-Goog-Expires");
  const date = signedAt?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/u);
  const issued = date ? Date.parse(`${date[1]}-${date[2]}-${date[3]}T${date[4]}:${date[5]}:${date[6]}Z`) : NaN;
  if (url.protocol !== "https:" || url.hostname !== "storage.googleapis.com" || url.port || url.username || url.password || url.hash
    || decodeURIComponent(url.pathname) !== `/${object.bucket}/${object.path}` || url.searchParams.getAll("generation").length !== 1
    || url.searchParams.get("generation") !== object.generation || url.searchParams.get("X-Goog-Algorithm") !== "GOOG4-RSA-SHA256"
    || !url.searchParams.get("X-Goog-Signature") || !signedSeconds || !/^[1-9][0-9]?$/u.test(signedSeconds) || Number(signedSeconds) > 60
    || !Number.isFinite(expiry) || expiry <= now || expiry > now + 60_000 || expiry !== issued + Number(signedSeconds) * 1000) return invalid();
  return Object.freeze({ url, headers: new Headers({ "content-type": "application/gzip", "content-length": String(manifest.compressedSizeBytes),
    "x-content-package-sha256": manifest.packageSha256, "x-content-artifact-sha256": manifest.artifactSha256,
    "x-content-version": manifest.contentVersion, "x-content-release-id": manifest.contentReleaseId,
    "x-content-minimum-app-version": manifest.minimumAppVersion, "x-content-artifact-size-bytes": String(manifest.artifactSizeBytes) }) });
}
function record(value: unknown): Record<string, unknown> | null { return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function keys(row: Record<string, unknown>, expected: readonly string[]): boolean { return Object.keys(row).sort().join("\0") === [...expected].sort().join("\0"); }
