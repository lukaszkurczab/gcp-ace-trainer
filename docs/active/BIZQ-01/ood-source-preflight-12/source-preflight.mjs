import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "tsx/cjs";

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const contentRoot = resolve(appRoot, "../patternly-content");
const { loadCanonicalRuntimeCatalog } = require(resolve(appRoot, "src/content/canonical/runtimeCatalog.ts"));
const trackId = "object-oriented-design-interview";
const sourcePath = "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json";
const raw = readFileSync(resolve(contentRoot, sourcePath));
const rows = JSON.parse(raw.toString("utf8"));
const source = rows.find((question) => question.questionId === "ood-n01-b01-i002");
const track = (await loadCanonicalRuntimeCatalog()).getTrack(trackId);
const question = track.getQuestion("ood-n01-b01-i002");
assert.deepEqual(question, source);
assert.ok(track.getPool("design-interview-learn-framework").some((item) => item.questionId === question.questionId));
const malformed = question.feedback.messages.find((message) => message.targetId === "coordinator_exports_state");
assert.match(malformed.text, /It moves actors, goals, use cases, and system boundary is the primary decision;/u);
assert.ok(question.constraints.some((line) => line.includes("a live a live captioning studio")));
assert.equal(rows.some((item) => item.questionId === "ood-n01-b01-i019"), false);
assert.equal(rows.some((item) => item.questionId === "ood-n01-b01-i018"), true);
const lock = JSON.parse(readFileSync(resolve(appRoot, "src/content/generated/canonical-content/content-lock.json"), "utf8")).tracks.find((item) => item.trackId === trackId);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
console.log(JSON.stringify({
  status: "reproduced",
  appHead: execFileSync("git", ["rev-parse", "HEAD"], { cwd: appRoot, encoding: "utf8" }).trim(),
  contentHead: execFileSync("git", ["rev-parse", "HEAD"], { cwd: contentRoot, encoding: "utf8" }).trim(),
  sourcePath,
  sourceSha256: hash(raw),
  compactRoundTripExact: raw.equals(Buffer.from(JSON.stringify(rows) + "\n")),
  questionId: question.questionId,
  mentalUnitId: question.mentalUnitId,
  contentVersion: lock.contentVersion,
  artifactSha256: lock.sha256,
  sourceEqualsCurrentRuntime: true,
  modeId: "design-interview-learn-framework",
  actualPoolCount: track.getPool("design-interview-learn-framework").length,
  malformedMessage: malformed.text,
  malformedConstraints: question.constraints.filter((line) => line.includes("a live a live")),
  prompt: question.prompt,
  acceptedOption: question.interaction.options.find((option) => option.optionId === question.answer.optionId),
  sessionPrepared: false,
  premiumAuthorizationProven: false,
}, null, 2));
