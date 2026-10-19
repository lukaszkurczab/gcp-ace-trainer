import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncCanonicalContent } from "./syncBundledContentRelease.mjs";

const APP_ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const DEFAULT_CONTENT_ROOT = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(APP_ROOT, "../patternly-content"));

export async function verifyCandidateContentAdmission({ appRoot = APP_ROOT, contentRoot = DEFAULT_CONTENT_ROOT } = {}) {
  const result = await syncCanonicalContent({ mode: "check", appRoot, producerRoot: contentRoot });
  const releaseLock = JSON.parse(await (await import("node:fs/promises")).readFile(path.join(appRoot, "integration/contracts/content-release/release.lock.json"), "utf8"));
  return { sourceInputFingerprint: result.currentIdentity.sourceInputFingerprint, releaseId: releaseLock.releaseId, trackIds: result.currentIdentity.tracks.map((track) => track.trackId) };
}

export function parseCandidateContentReleaseLockArgs(argv = process.argv.slice(2)) {
  const options = { appRoot: APP_ROOT, contentRoot: DEFAULT_CONTENT_ROOT };
  let index = argv[0] === "check" ? 1 : 0;
  while (index < argv.length) {
    const flag = argv[index];
    if ((flag === "--content-root" || flag === "--app-root") && index + 1 < argv.length) {
      const key = flag === "--content-root" ? "contentRoot" : "appRoot";
      if (options[key] !== (key === "appRoot" ? APP_ROOT : DEFAULT_CONTENT_ROOT)) throw new Error(`Duplicate ${flag}`);
      options[key] = path.resolve(argv[index + 1]);
      index += 2;
    } else throw new Error("Usage: node scripts/candidateContentReleaseLock.mjs check [--content-root <Patternly content root>] [--app-root <Patternly app root>]");
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await verifyCandidateContentAdmission(parseCandidateContentReleaseLockArgs());
    process.stdout.write(`current source matches installed APP bank; fingerprint=${result.sourceInputFingerprint}; tracks=${result.trackIds.length}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
