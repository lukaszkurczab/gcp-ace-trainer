import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { APPROACH_CHALLENGE_BANK_CONTRACT, RELEASE_LOCK_RELATIVE_PATH, GENERATED_DIRECTORY } from "./syncBundledContentRelease.mjs";
import { CONTENT_TRUST_MANIFEST_RELATIVE_PATH, RETAINED_CONTENT_RELATIVE_DIRECTORY, checkContentTrustManifest, validateBundledApproachChallengeBank, verifyBundledCurrentContent, verifyContentTrustManifestBinding, writeContentTrustManifest } from "./verifyBundledCurrentContent.mjs";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

test("standalone verifier accepts the real paired bank and rejects malformed or foreign pairs without CONTENT runtime imports", async () => {
  const contentRoot = path.resolve(root, "../patternly-content");
  const familyCounts = APPROACH_CHALLENGE_BANK_CONTRACT.familyCounts;
  const problems = [];
  for (const [familyIndex, [familyId, count]] of Object.entries(familyCounts).entries()) {
    for (let index = 1; index <= count; index += 1) {
      const name = `acm-b${String(familyIndex + 1).padStart(2, "0")}-${String(index).padStart(2, "0")}.json`;
      problems.push(JSON.parse(await readFile(path.join(contentRoot, "content/approach-challenges/coding-interview-dsa-problem-solving", familyId, name), "utf8")));
    }
  }
  const artifact = { trackId: "coding-interview-dsa-problem-solving", approachChallengeProblems: problems };
  assert.deepEqual(validateBundledApproachChallengeBank(artifact), { problemCount: 472, stageCount: 944, freeCount: 16, premiumCount: 456 });

  const malformed = structuredClone(artifact);
  delete malformed.approachChallengeProblems[0].complexityQuestion.answer;
  assert.throws(() => validateBundledApproachChallengeBank(malformed), /malformed or foreign complexityQuestion/u);

  const foreign = structuredClone(artifact);
  foreign.approachChallengeProblems[0].trackId = "backend-system-design-interview";
  assert.throws(() => validateBundledApproachChallengeBank(foreign), /invalid or foreign identity/u);
});

test("shipped bundle verifier needs no content checkout and rejects changed artifact bytes", async (t) => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-eas-content-verify-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const target = path.join(fixture, GENERATED_DIRECTORY);
  const lockPath = path.join(fixture, RELEASE_LOCK_RELATIVE_PATH);
  await mkdir(path.dirname(target), { recursive: true });
  await mkdir(path.dirname(lockPath), { recursive: true });
  await cp(path.join(root, GENERATED_DIRECTORY), target, { recursive: true });
  await cp(path.join(root, RELEASE_LOCK_RELATIVE_PATH), lockPath);

  const verified = await verifyBundledCurrentContent({ root: fixture });
  assert.equal(verified.trackCount, 9);
  const standalone = path.join(fixture, "application-only");
  await mkdir(path.join(standalone, "scripts"), { recursive: true });
  await mkdir(path.join(standalone, "src/content/generated"), { recursive: true });
  await mkdir(path.join(standalone, "integration/contracts/content-release"), { recursive: true });
  await cp(path.join(root, "scripts/verifyBundledCurrentContent.mjs"), path.join(standalone, "scripts/verifyBundledCurrentContent.mjs"));
  await cp(path.join(root, "scripts/syncBundledContentRelease.mjs"), path.join(standalone, "scripts/syncBundledContentRelease.mjs"));
  await cp(target, path.join(standalone, GENERATED_DIRECTORY), { recursive: true });
  await cp(lockPath, path.join(standalone, RELEASE_LOCK_RELATIVE_PATH));
  await cp(path.join(root, CONTENT_TRUST_MANIFEST_RELATIVE_PATH), path.join(standalone, CONTENT_TRUST_MANIFEST_RELATIVE_PATH));
  await cp(path.join(root, RETAINED_CONTENT_RELATIVE_DIRECTORY), path.join(standalone, RETAINED_CONTENT_RELATIVE_DIRECTORY), { recursive: true });
  const standaloneResult = execFileSync(process.execPath, ["scripts/verifyBundledCurrentContent.mjs"], { cwd: standalone, encoding: "utf8", env: { ...process.env, PATTERNLY_CONTENT_CURRENT_ROOT: "", PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA: "" } });
  assert.match(standaloneResult, /BUNDLED_CURRENT_CONTENT=passed/u);
  assert.match(standaloneResult, /CONTENT_TRUST_MANIFEST_BINDING=passed artifacts=9 retained=4/u);
  assert.equal(await import("node:fs/promises").then(({ readdir }) => readdir(fixture)).then((names) => names.includes("patternly-content")), false);

  const artifact = path.join(standalone, GENERATED_DIRECTORY, "aws-certified-solutions-architect-associate.json");
  await writeFile(artifact, Buffer.concat([await readFile(artifact), Buffer.from(" ")]));
  assert.throws(() => execFileSync(process.execPath, ["scripts/verifyBundledCurrentContent.mjs"], { cwd: standalone, stdio: "pipe" }), /Bundled current content digest mismatch/u);
});

async function trustFixture(t) {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-content-trust-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  for (const relative of [GENERATED_DIRECTORY, RETAINED_CONTENT_RELATIVE_DIRECTORY]) await cp(path.join(root, relative), path.join(fixture, relative), { recursive: true });
  await cp(path.join(root, CONTENT_TRUST_MANIFEST_RELATIVE_PATH), path.join(fixture, CONTENT_TRUST_MANIFEST_RELATIVE_PATH));
  return fixture;
}

test("T1.4 trust manifest binds the exact bundled lock, ledger, artifacts and retained identities", async (t) => {
  const fixture = await trustFixture(t);
  assert.deepEqual(await verifyContentTrustManifestBinding({ root: fixture }), { artifactCount: 9, retainedCount: 4 });
  const manifestPath = path.join(fixture, CONTENT_TRUST_MANIFEST_RELATIVE_PATH);
  const original = await readFile(manifestPath, "utf8");
  const tamper = async (change, pattern) => {
    const manifest = JSON.parse(original);
    change(manifest);
    await writeFile(manifestPath, JSON.stringify(manifest));
    await assert.rejects(verifyContentTrustManifestBinding({ root: fixture }), pattern);
  };
  await tamper((manifest) => { manifest.lockSha = "0".repeat(64); }, /stale or invalid: content lock/u);
  await tamper((manifest) => { manifest.ledgerSha = "0".repeat(64); }, /stale or invalid: successor ledger/u);
  await tamper((manifest) => { manifest.artifacts[0].sha = "0".repeat(64); }, /stale or invalid: artifact/u);
  await tamper((manifest) => { manifest.artifacts.pop(); }, /stale or invalid: artifact inventory/u);
  await tamper((manifest) => { manifest.retained[0].sha = "0".repeat(64); }, /stale or invalid: retained/u);
  await tamper((manifest) => { manifest.retained[0].id = "retained:../../../etc.json"; }, /stale or invalid: retained identity/u);
  await tamper((manifest) => { manifest.schemaVersion = "v0"; }, /stale or invalid: shape/u);
});

test("T1.4 negative: a bank that fails full verification never gets a manifest and a stale manifest fails check", async (t) => {
  const fixture = await trustFixture(t);
  const manifestPath = path.join(fixture, CONTENT_TRUST_MANIFEST_RELATIVE_PATH);
  const before = await readFile(manifestPath);
  const failingVerifier = async () => { throw new Error("Artifact does not satisfy the canonical contract."); };
  await assert.rejects(writeContentTrustManifest({ root: fixture, deriveManifest: failingVerifier }), /canonical contract/u);
  assert.ok((await readFile(manifestPath)).equals(before), "a failed verification must not rewrite the manifest");
  const stale = { ...JSON.parse(before.toString("utf8")), retained: [] };
  await assert.rejects(checkContentTrustManifest({ root: fixture, deriveManifest: async () => stale }), /differs from a fresh full verification/u);
  const artifact = path.join(fixture, GENERATED_DIRECTORY, "aws-certified-solutions-architect-associate.json");
  await writeFile(artifact, Buffer.concat([await readFile(artifact), Buffer.from(" ")]));
  await assert.rejects(verifyContentTrustManifestBinding({ root: fixture }), /digest mismatch/u);
});

test("T1.4 negative: the real TS verifier rejects a structurally invalid bundled artifact", async () => {
  const program = `const ns = await import(${JSON.stringify(new URL("../src/content/canonical/runtimeCatalog.ts", import.meta.url).href)}); const m = ns.buildFullyVerifiedCanonicalRuntimeCatalog ? ns : ns.default;
const aws = (await import(${JSON.stringify(new URL("../src/content/generated/canonical-content/aws-certified-solutions-architect-associate.json", import.meta.url).href)}, { with: { type: "json" } })).default;
const lock = (await import(${JSON.stringify(new URL("../src/content/generated/canonical-content/content-lock.json", import.meta.url).href)}, { with: { type: "json" } })).default;
const broken = structuredClone(aws); broken.questions[0].prompt = 42;
try { await m.buildFullyVerifiedCanonicalRuntimeCatalog({ artifacts: [broken], locks: lock.tracks }); process.stdout.write("ACCEPTED"); } catch (error) { process.stdout.write("REJECTED " + error.message); }`;
  const output = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "--eval", program], { cwd: root, encoding: "utf8" });
  assert.match(output, /^REJECTED .*canonical contract/u);
});
