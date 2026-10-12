// Run from the app root: node --import tsx scripts/qa/measureCanonicalPlanningPolicy.mjs
// Node CPU measurement of the real validator, not Hermes/startup/heap evidence.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { validateLearningPlanningPolicy } = require("../../src/content/canonical/planningPolicy.ts");
const { PRODUCT_MODE_CONFIGS, validateProductModeConfigsAgainstArtifacts } = require("../../src/content/canonical/productModeConfig.ts");

const root = "src/content/generated/canonical-content/";
const lock = JSON.parse(readFileSync(`${root}content-lock.json`, "utf8"));
const artifacts = lock.tracks.map(({ trackId }) => JSON.parse(readFileSync(`${root}${trackId}.json`, "utf8")));
const modes = validateProductModeConfigsAgainstArtifacts(PRODUCT_MODE_CONFIGS, artifacts);
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const inputsBefore = hash(artifacts);
const run = () => artifacts.map((artifact) => {
  const trackModes = modes.filter((mode) => mode.trackId === artifact.trackId);
  const start = performance.now();
  const policy = validateLearningPlanningPolicy(artifact.planningPolicy, artifact.questions, trackModes, artifact.completionRule);
  return { trackId: artifact.trackId, elapsedMs: performance.now() - start, outputSha256: hash(policy) };
});
for (let i = 0; i < 3; i++) run();
const samples = Array.from({ length: 15 }, run);
if (hash(artifacts) !== inputsBefore) throw Error("measurement_input_changed");
const totals = samples.map((sample) => sample.reduce((sum, track) => sum + track.elapsedMs, 0)).sort((a, b) => a - b);
const outputs = samples[0].map(({ trackId, outputSha256 }) => ({ trackId, outputSha256 }));
if (samples.some((sample) => sample.some((track, i) => track.outputSha256 !== outputs[i].outputSha256))) throw Error("measurement_output_changed");
console.log(JSON.stringify({ schema: "patternly.planning-policy-measurement.v1", runtime: process.version,
  warmups: 3, samples: 15, inputSha256: inputsBefore, outputs, medianMs: totals[7], p95Ms: totals[14],
  samplesByTrack: samples }, null, 2));
