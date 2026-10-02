import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const appRoot = resolve(import.meta.dirname, "../../../..");
const contentRoot = resolve(appRoot, "../patternly-content");
const { buildAll } = await import(pathToFileURL(join(contentRoot, "scripts/build.mjs")).href);
const outputRoot = await mkdtemp(join(tmpdir(), "patternly-bizq01-score-parity-"));
try {
  const built = await buildAll({ rootDirectory: contentRoot, outputRoot });
  const bundled = join(appRoot, "src/content/generated/canonical-content");
  const lock = JSON.parse(await readFile(join(bundled, "content-lock.json"), "utf8"));
  assert.equal(built.artifacts.length, 9);
  assert.deepEqual(built.lock, lock);
  for (const file of [...lock.tracks.map((track) => `${track.trackId}.json`), "content-lock.json"]) {
    assert.deepEqual(await readFile(join(outputRoot, file)), await readFile(join(bundled, file)), file);
    console.log(`EXACT BYTES ${file}`);
  }
  console.log("PASS actual buildAll9 and lock; no active generated output changed");
} finally {
  await rm(outputRoot, { recursive: true, force: true });
}
