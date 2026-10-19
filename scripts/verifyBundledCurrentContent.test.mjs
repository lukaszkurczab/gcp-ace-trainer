import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { RELEASE_LOCK_RELATIVE_PATH, GENERATED_DIRECTORY } from "./syncBundledContentRelease.mjs";
import { verifyBundledCurrentContent } from "./verifyBundledCurrentContent.mjs";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

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
  const standaloneResult = execFileSync(process.execPath, ["scripts/verifyBundledCurrentContent.mjs"], { cwd: standalone, encoding: "utf8", env: { ...process.env, PATTERNLY_CONTENT_CURRENT_ROOT: "", PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA: "" } });
  assert.match(standaloneResult, /BUNDLED_CURRENT_CONTENT=passed/u);
  assert.equal(await import("node:fs/promises").then(({ readdir }) => readdir(fixture)).then((names) => names.includes("patternly-content")), false);

  const artifact = path.join(standalone, GENERATED_DIRECTORY, "aws-certified-solutions-architect-associate.json");
  await writeFile(artifact, Buffer.concat([await readFile(artifact), Buffer.from(" ")]));
  assert.throws(() => execFileSync(process.execPath, ["scripts/verifyBundledCurrentContent.mjs"], { cwd: standalone, stdio: "pipe" }), /Bundled current content digest mismatch/u);
});
