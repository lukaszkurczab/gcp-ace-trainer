// Independent CLI persistence check using a disposable copy of the real review console.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { copyFile, lstat, mkdir, mkdtemp, open, readFile, realpath, rename, rm, stat, symlink, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import test from "node:test";
import { createContentReviewConsole, LAUNCH_TRACK_IDS, startContentReviewConsole } from "../../../../patternly-content/scripts/review/content-review-console.mjs";
import { validateSchema } from "../../../../patternly-content/scripts/review/schema-validation.mjs";

const execFileAsync = promisify(execFile);
const repoContent = new URL("../../../../patternly-content/", import.meta.url);

test("CH-01 QA actual CLI review writes canonical JSON and a fresh CLI process reopens it", async (t) => {
  const temporaryRoot = await realpath(await mkdtemp(join(tmpdir(), "patternly-ch01-cli-")));
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }));

  const source = await createContentReviewConsole({ reviewPath: join(temporaryRoot, "read-only-probe.json") });
  const records = source.listItems();
  for (const trackId of LAUNCH_TRACK_IDS) {
    const item = records.find((record) => record.trackId === trackId);
    assert.ok(item, `fixture question exists for ${trackId}`);
    const fixturePath = join(temporaryRoot, item.sourceFile);
    await mkdir(dirname(fixturePath), { recursive: true });
    await writeFile(fixturePath, `${JSON.stringify([item.item])}\n`);
  }

  const copy = async (sourcePath, relativePath) => {
    const destination = join(temporaryRoot, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(new URL(sourcePath, repoContent), destination);
  };
  await copy("scripts/review/content-review-console.mjs", "scripts/review/content-review-console.mjs");
  await copy("scripts/review/schema-validation.mjs", "scripts/review/schema-validation.mjs");
  await copy("schemas/review/content-review-outcome.schema.json", "schemas/review/content-review-outcome.schema.json");

  const trackId = LAUNCH_TRACK_IDS[0];
  const target = records.find((record) => record.trackId === trackId);
  const note = "Independent CLI acceptance fixture; no source or learner outcome changed.";
  const fixtureBytes = await readFile(join(temporaryRoot, target.sourceFile));
  const fixtureSha256 = createHash("sha256").update(fixtureBytes).digest("hex");
  const reviewerId = "independent-qa";
  const cli = await realpath(join(temporaryRoot, "scripts/review/content-review-console.mjs"));
  const run = async (...args) => execFileAsync(process.execPath, [cli, ...args], { cwd: temporaryRoot, encoding: "utf8" });

  const written = await run("review", "--track", trackId, "--item", target.questionId,
    "--outcome", "approved", "--note", note, "--reviewer", reviewerId);
  const immediate = JSON.parse(written.stdout);
  assert.equal(immediate.review.status, "approved");
  assert.equal(immediate.itemFingerprint, target.itemFingerprint);
  assert.equal(immediate.sourceFileSha256, fixtureSha256);
  assert.equal(immediate.review.note, note);
  assert.equal(immediate.review.reviewerId, reviewerId);

  const reviewPath = join(temporaryRoot, "evidence/content-reviews/outcomes.json");
  assert.ok(!relative(temporaryRoot, await realpath(reviewPath)).startsWith(".."), "outcome stays under the disposable root");
  const store = JSON.parse(await readFile(reviewPath, "utf8"));
  const schema = JSON.parse(await readFile(join(temporaryRoot, "schemas/review/content-review-outcome.schema.json"), "utf8"));
  await validateSchema(store, schema, "independent CH-01 CLI outcome");
  assert.equal(store.schemaVersion, "patternly-content-review-outcome-v1");
  assert.equal(store.reviews.length, 1);
  assert.equal(store.reviews[0].sourceFileSha256, fixtureSha256);
  assert.match(store.reviews[0].sourceFileSha256, /^[a-f0-9]{64}$/u);
  assert.match(store.reviews[0].itemFingerprint, /^[a-f0-9]{64}$/u);
  assert.ok(Number.isFinite(Date.parse(store.reviews[0].reviewedAt)));
  assert.deepEqual(
    [store.reviews[0].trackId, store.reviews[0].questionId, store.reviews[0].outcome, store.reviews[0].note, store.reviews[0].reviewerId],
    [trackId, target.questionId, "approved", note, reviewerId],
  );

  const reopened = await run("item", "--track", trackId, "--item", target.questionId);
  const item = JSON.parse(reopened.stdout);
  assert.equal(item.review.status, "approved");
  assert.equal(item.itemFingerprint, target.itemFingerprint);
  assert.equal(item.sourceFileSha256, fixtureSha256);
});

test("CH-01 QA cross-process writer through a directory symlink cannot bypass the live store lock", async (t) => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "patternly-ch01-alias-lock-")));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const reviewPath = join(directory, "outcomes.json");
  const aliasPath = join(directory, "alias", "outcomes.json");
  await symlink(directory, dirname(aliasPath), "dir");

  let signalLockCreated;
  let releaseOwner;
  let gated = false;
  const lockCreated = new Promise((resolve) => { signalLockCreated = resolve; });
  const ownerGate = new Promise((resolve) => { releaseOwner = resolve; });
  const fileSystem = {
    mkdir, readFile, realpath, rename, stat, lstat, unlink,
    open: async (path, ...args) => {
      const handle = await open(path, ...args);
      if (!gated && path === `${reviewPath}.lock` && args[0] === "wx") {
        gated = true;
        signalLockCreated();
        await ownerGate;
      }
      return handle;
    },
  };
  const owner = await createContentReviewConsole({ reviewPath, reviewStoreFs: fileSystem });
  const ownerItem = owner.listItems()[0];
  const pendingWrite = owner.recordOutcome({ trackId: ownerItem.trackId, questionId: ownerItem.questionId, outcome: "approved", note: "Temporary aliased-lock owner.", reviewerId: "temporary-owner" });
  await lockCreated;

  const moduleUrl = new URL("../../../../patternly-content/scripts/review/content-review-console.mjs", import.meta.url).href;
  const childSource = `import {createContentReviewConsole} from ${JSON.stringify(moduleUrl)};const s=await createContentReviewConsole({reviewPath:process.env.CH01_ALIAS_PATH});const item=s.listItems()[0];try{await s.recordOutcome({trackId:item.trackId,questionId:item.questionId,outcome:"rejected",note:"Temporary alias contender.",reviewerId:"temporary-contender"});process.stdout.write("unexpected-commit");process.exitCode=2;}catch(error){process.stdout.write(JSON.stringify({code:error.code}));if(error.code!=="review_store_busy")process.exitCode=1;}`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", childSource], {
    env: { ...process.env, CH01_ALIAS_PATH: aliasPath },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  try {
    assert.equal(gated, true, "owner must acquire the canonical lock before starting the alias contender");
    const exitCode = await new Promise((resolveExit, rejectExit) => {
      const timeout = setTimeout(() => { child.kill("SIGKILL"); rejectExit(new Error("cross-process alias probe timed out")); }, 15_000);
      child.once("error", (error) => { clearTimeout(timeout); rejectExit(error); });
      child.once("exit", (code) => { clearTimeout(timeout); resolveExit(code); });
    });
    assert.equal(exitCode, 0, stderr);
    assert.deepEqual(JSON.parse(stdout), { code: "review_store_busy" });
    await lstat(`${reviewPath}.lock`);
    await assert.rejects(readFile(reviewPath), { code: "ENOENT" });
  } finally {
    releaseOwner();
    await pendingWrite;
  }
  const persisted = JSON.parse(await readFile(reviewPath, "utf8"));
  assert.equal(persisted.reviews.length, 1);
  assert.equal(persisted.reviews[0].questionId, ownerItem.questionId);
});

test("CH-01 QA concurrent public HTTP reviews preserve every distinct committed identity", async (t) => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "patternly-ch01-http-")));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const reviewPath = join(directory, "outcomes.json");
  const running = await startContentReviewConsole({ reviewPath, port: 0 });
  t.after(() => new Promise((resolveClose) => running.server.close(resolveClose)));
  const records = running.service.listItems().slice(0, 4);
  assert.equal(new Set(records.map((item) => item.questionKey)).size, 4);
  const responses = await Promise.all(records.map((item, index) => fetch(`http://127.0.0.1:${running.address.port}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      trackId: item.trackId,
      questionId: item.questionId,
      outcome: index % 2 ? "needs_change" : "approved",
      note: `Temporary concurrent HTTP review ${index}.`,
      reviewerId: "independent-qa",
    }),
  })));
  assert.deepEqual(responses.map((response) => response.status), [200, 200, 200, 200]);
  const payloads = await Promise.all(responses.map((response) => response.json()));
  assert.deepEqual(payloads.map((payload) => payload.review.status), ["approved", "needs_change", "approved", "needs_change"]);

  const store = JSON.parse(await readFile(reviewPath, "utf8"));
  const schema = JSON.parse(await readFile(new URL("../../../../patternly-content/schemas/review/content-review-outcome.schema.json", import.meta.url), "utf8"));
  await validateSchema(store, schema, "concurrent HTTP review outcomes");
  assert.equal(store.reviews.length, 4);
  const reopened = await createContentReviewConsole({ reviewPath });
  for (const [index, item] of records.entries()) {
    assert.equal(reopened.getItem(item.trackId, item.questionId).review.status, index % 2 ? "needs_change" : "approved");
  }
});
