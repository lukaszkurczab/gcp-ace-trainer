export function validateAud02dExpoManifest(manifest, manifestUrl, port = 8081) {
  if (!manifest || typeof manifest.runtimeVersion !== "string" || !manifest.runtimeVersion.trim()) {
    throw new Error("AUD-02D Expo manifest must declare a runtimeVersion.");
  }
  const asset = manifest.launchAsset;
  if (!asset || typeof asset.url !== "string" || typeof asset.contentType !== "string" || !asset.contentType.toLowerCase().includes("javascript")) {
    throw new Error("AUD-02D Expo manifest must declare a JavaScript launchAsset.");
  }
  let url;
  let root;
  try {
    url = new URL(asset.url);
    root = new URL(manifestUrl);
  } catch {
    throw new Error("AUD-02D Expo manifest or launchAsset URL is invalid.");
  }
  if (!new Set(["[::1]", "127.0.0.1", "localhost"]).has(url.hostname) || url.protocol !== "http:" || Number(url.port) !== port || url.origin !== root.origin) {
    throw new Error("AUD-02D launchAsset must use the same local loopback origin and port as Expo.");
  }
  if (url.pathname !== "/node_modules/expo/AppEntry.bundle") {
    throw new Error(`AUD-02D launchAsset must use the Expo AppEntry bundle, received ${url.pathname}.`);
  }
  const query = url.searchParams;
  if (query.get("platform") !== "ios" || query.get("dev") !== "false" || query.get("hot") !== "false" || (query.get("minify") !== "true" && query.get("transform.minify") !== "true")) {
    throw new Error("AUD-02D launchAsset must request platform=ios, dev=false, hot=false and minify=true.");
  }
  return Object.freeze({ runtimeVersion: manifest.runtimeVersion, launchAsset: Object.freeze({ url: asset.url, contentType: asset.contentType }) });
}
