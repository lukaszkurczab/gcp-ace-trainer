import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const APP_ROOT = fileURLToPath(new URL("../..", import.meta.url));
let stage = "arguments";

function candidateDirectory(argv) {
  if (argv.length !== 2 || argv[0] !== "--candidate-dir" || !argv[1] || argv[1].startsWith("--")) {
    throw new Error("invalid arguments");
  }
  return path.resolve(argv[1]);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function main() {
  const directory = candidateDirectory(process.argv.slice(2));
  stage = "app_consumer_load";
  const runtime = await import(pathToFileURL(path.join(APP_ROOT, "src/content/canonical/runtimeCatalog.ts")).href);

  stage = "successor_ledger_read";
  const successorLedger = await readJson(path.join(APP_ROOT, "src/content/generated/canonical-content/content-successor-ledger.json"));
  const expectedTrackIds = successorLedger.tracks.map(({ trackId }) => trackId);

  stage = "candidate_inventory_read";
  const filenames = (await readdir(directory)).sort();
  const expectedFilenames = [...expectedTrackIds.map((trackId) => `${trackId}.json`), "content-lock.json"].sort();
  if (JSON.stringify(filenames) !== JSON.stringify(expectedFilenames)) throw new Error("candidate inventory mismatch");
  const artifacts = await Promise.all(expectedTrackIds.map((trackId) => readJson(path.join(directory, `${trackId}.json`))));
  if (artifacts.some((artifact, index) => artifact.trackId !== expectedTrackIds[index])) throw new Error("artifact identity mismatch");
  const lock = await readJson(path.join(directory, "content-lock.json"));
  if (lock.schemaVersion !== "patternly-content-lock-v1" || !Array.isArray(lock.tracks) || JSON.stringify(lock.tracks.map(({ trackId }) => trackId)) !== JSON.stringify(expectedTrackIds)) {
    throw new Error("lock identity mismatch");
  }

  stage = "canonical_app_consume";
  const catalog = await runtime.buildCanonicalRuntimeCatalog({ artifacts, locks: lock.tracks, successorLedger });
  if (JSON.stringify(catalog.tracks) !== JSON.stringify(expectedTrackIds)) throw new Error("runtime catalog track mismatch");
  const questionCount = catalog.tracks.reduce((total, trackId) => total + catalog.getTrack(trackId).questions.length, 0);
  process.stdout.write(`${JSON.stringify({ status: "consumed", trackCount: catalog.tracks.length, questionCount })}\n`);
}

main().catch(() => {
  process.stderr.write(`${JSON.stringify({ status: "blocked", stage })}\n`);
  process.exitCode = 1;
});
