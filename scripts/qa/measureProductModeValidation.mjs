// From APP: node --import tsx scripts/qa/measureProductModeValidation.mjs
// Same runtime projection/validator boundary; Node CPU, not native startup proof.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";

const require = createRequire(import.meta.url);
const { PRODUCT_MODE_CONFIGS, validateProductModeConfigsAgainstArtifacts } = require("../../src/content/canonical/productModeConfig.ts");
const root = "src/content/generated/canonical-content/";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const lockBytes = readFileSync(`${root}content-lock.json`);
const dataset = JSON.parse(lockBytes).tracks.map(({ trackId }) => {
  const bytes = readFileSync(`${root}${trackId}.json`);
  const artifact = JSON.parse(bytes);
  return { trackId, bytes: bytes.length, sha256: hash(bytes), artifact };
});
const projections = dataset.map(({ artifact }) => ({
  schemaVersion: "patternly-content-artifact-v1", trackId: artifact.trackId,
  contentVersion: artifact.contentVersion,
  questions: artifact.questions.map(({ trackId, nodeId, mentalUnitId, questionId, interaction }) => ({
    trackId, nodeId, mentalUnitId, questionId, interaction: { type: interaction.type },
  })),
}));
const inputSha256 = hash(JSON.stringify(projections));
const run = () => {
  let scanCount = 0, scanStart = 0, scanMs = 0;
  const start = performance.now();
  const output = validateProductModeConfigsAgainstArtifacts(PRODUCT_MODE_CONFIGS, projections, (edge) => {
    if (edge === "begin") { scanCount++; scanStart = performance.now(); }
    else scanMs += performance.now() - scanStart;
  });
  return { totalMs: performance.now() - start, scanMs, scanCount, outputSha256: hash(JSON.stringify(output)) };
};
for (let i = 0; i < 3; i++) run();
const samples = Array.from({ length: 15 }, run);
if (hash(JSON.stringify(projections)) !== inputSha256) throw Error("measurement_input_changed");
if (samples.some((sample) => sample.outputSha256 !== samples[0].outputSha256 || sample.scanCount !== samples[0].scanCount)) throw Error("measurement_output_changed");
const median = (field) => samples.map((sample) => sample[field]).sort((a, b) => a - b)[7];
console.log(JSON.stringify({ schema: "patternly.product-mode-validation-measurement.v1", runtime: process.version,
  validatorSha256: hash(readFileSync("src/content/canonical/productModeConfig.ts")), lockSha256: hash(lockBytes),
  dataset: dataset.map(({ artifact, ...row }) => ({ ...row, questions: artifact.questions.length })),
  inputSha256, warmups: 3, samples: 15, medianTotalMs: median("totalMs"), medianScanMs: median("scanMs"), measurements: samples,
}, null, 2));
