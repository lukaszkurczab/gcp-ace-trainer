import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { nativeScreensPatchContract as contract, verifyNativeScreensPatch } from "./verifyNativeScreensPatch.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const before = {
  "android/src/main/cpp/NativeProxy.cpp": "b1295187e684e48ea2620f09a35a646129ada4d705caa258694bb1a06bde36a2",
  "android/src/main/cpp/NativeProxy.h": "819ac75f33a7b621c79a5dec27154dc119b4b0c0dc2a561779691d5fad9837b6",
  "cpp/RNSScreenRemovalListener.cpp": "522ce1151eb7a484730ba60360e0c377d2ecd0607c237aef2ebe5ad3dd660b03",
  "cpp/RNSScreenRemovalListener.h": "3eb22b7fd1365f6b111b9e065a37b46a3f41d7e5b51c8db3413ddf8a6595cdc8",
};
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
async function fixture(t) {
  const directory = await mkdtemp(resolve(tmpdir(), "patternly-native-screens-patch-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(resolve(directory, "package.json"), JSON.stringify({ name: "native-screens-patch-fixture", version: "1.0.0", private: true, dependencies: { "react-native-screens": contract.version } }));
  for (const file of ["package.json", ...Object.keys(contract.files)]) {
    const source = resolve(root, "node_modules/react-native-screens", file);
    const target = resolve(directory, "node_modules/react-native-screens", file);
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target);
  }
  await mkdir(resolve(directory, "patches"));
  await cp(resolve(root, contract.patch), resolve(directory, contract.patch));
  return directory;
}
async function fileHashes(directory) {
  return Object.fromEntries(await Promise.all(Object.keys(contract.files).map(async file => [file, sha256(await readFile(resolve(directory, "node_modules/react-native-screens", file)))])));
}
function applyStandardPatch(directory, reverse = false) {
  const result = spawnSync(process.execPath, [resolve(root, "node_modules/patch-package/index.js"), "--error-on-fail", ...(reverse ? ["--reverse"] : [])], { cwd: directory, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

test("actual patch-package reverses to approved original bytes, applies the four-file backport and is idempotent", async t => {
  const directory = await fixture(t);
  applyStandardPatch(directory, true);
  assert.deepEqual(await fileHashes(directory), before);
  await assert.rejects(verifyNativeScreensPatch(directory), /native_screens_patch_source_mismatch/u);
  applyStandardPatch(directory);
  assert.deepEqual(await fileHashes(directory), contract.files);
  const expected = await verifyNativeScreensPatch(directory);
  applyStandardPatch(directory);
  assert.deepEqual(await verifyNativeScreensPatch(directory), expected);
  assert.deepEqual(await fileHashes(directory), contract.files);
});

test("verification reads exactly the approved patch and four postimages without changing them", async t => {
  const directory = await fixture(t);
  const original = await fileHashes(directory);
  assert.equal((await verifyNativeScreensPatch(directory)).files, 4);
  assert.deepEqual(await fileHashes(directory), original);
  const diff = await readFile(resolve(directory, contract.patch), "utf8");
  const paths = [...diff.matchAll(/^diff --git a\/node_modules\/react-native-screens\/(\S+) b\/node_modules\/react-native-screens\/\S+$/gmu)].map(match => match[1]);
  assert.deepEqual(paths.sort(), Object.keys(contract.files).sort());
});

test("wrong dependency version fails before any patch mutation", async t => {
  const directory = await fixture(t);
  await writeFile(resolve(directory, "node_modules/react-native-screens/package.json"), JSON.stringify({ version: "4.28.0" }));
  await assert.rejects(verifyNativeScreensPatch(directory), { message: "native_screens_patch_version_mismatch" });
  assert.deepEqual(await fileHashes(directory), contract.files);
});

test("missing patch fails closed", async t => {
  const directory = await fixture(t);
  await unlink(resolve(directory, contract.patch));
  await assert.rejects(verifyNativeScreensPatch(directory), { message: "native_screens_patch_missing" });
});

test("tampered patch fails closed even when the source postimages still match", async t => {
  const directory = await fixture(t);
  await writeFile(resolve(directory, contract.patch), `${await readFile(resolve(directory, contract.patch), "utf8")}\n`);
  await assert.rejects(verifyNativeScreensPatch(directory), { message: "native_screens_patch_hash_mismatch" });
  assert.deepEqual(await fileHashes(directory), contract.files);
});

for (const file of Object.keys(contract.files)) {
  test(`changed postimage fails closed: ${file}`, async t => {
    const directory = await fixture(t);
    const target = resolve(directory, "node_modules/react-native-screens", file);
    await writeFile(target, `${await readFile(target, "utf8")}\n`);
    await assert.rejects(verifyNativeScreensPatch(directory), { message: `native_screens_patch_source_mismatch:${file}` });
  });
}

test("missing postimage fails closed", async t => {
  const directory = await fixture(t);
  const file = Object.keys(contract.files)[0];
  await unlink(resolve(directory, "node_modules/react-native-screens", file));
  await assert.rejects(verifyNativeScreensPatch(directory), { message: `native_screens_patch_source_missing:${file}` });
});

test("npm install keeps the exact patch tool in regular dependencies and verifies patched sources", async () => {
  const manifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  assert.equal(manifest.dependencies["react-native-screens"], "4.26.2");
  assert.equal(manifest.dependencies["patch-package"], "8.0.1");
  assert.equal(manifest.devDependencies?.["patch-package"], undefined);
  assert.equal(manifest.scripts.postinstall, "patch-package --error-on-fail && node scripts/verifyNativeScreensPatch.mjs");
});
