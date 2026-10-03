import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson, validateTrack } from "../../../../../patternly-content/scripts/build.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const producer = path.resolve(here, "../../../../../patternly-content");
const proposal = JSON.parse(await readFile(path.join(here, "PROPOSAL.json"), "utf8"));
const temp = await mkdtemp(path.join(os.tmpdir(), "patternly-gcp07-attribution-"));
try {
  await cp(path.join(producer, "content"), path.join(temp, "content"), { recursive: true });
  await cp(path.join(producer, "config"), path.join(temp, "config"), { recursive: true });
  const config = JSON.parse(await readFile(path.join(temp, "config/tracks", `${proposal.trackId}.json`), "utf8"));
  const evidencePath = config.profile.nodeDomainMapEvidence.artifactPath;
  await mkdir(path.dirname(path.join(temp, evidencePath)), { recursive: true });
  await cp(path.join(producer, evidencePath), path.join(temp, evidencePath));
  const baseline = await validateTrack({ rootDirectory: temp, trackId: proposal.trackId });
  assert.equal(baseline.questions.length, 2981);
  const sourcePath = path.join(temp, proposal.sourceFile);
  const questions = JSON.parse(await readFile(sourcePath, "utf8"));
  const index = questions.findIndex((question) => question.questionId === proposal.questionId);
  assert.ok(index >= 0);
  questions[index] = proposal.proposedQuestion;
  await writeFile(sourcePath, canonicalJson(questions));
  const catalogPath = path.join(temp, "content/catalog.json");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  catalog.tracks.find((track) => track.trackId === proposal.trackId).contentVersion = proposal.proposedContentVersion;
  await writeFile(catalogPath, canonicalJson(catalog));
  await assert.rejects(validateTrack({ rootDirectory: temp, trackId: proposal.trackId }), /GCP nodeDomainMap evidence does not match the current published artifact identity/);
  console.log("PASS: baseline GCP2981 validates; proposed one-item/new-version fixture reproduces ARCH-03/F-18 exact attribution failure. No source/config/artifact mutation in real repos.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
