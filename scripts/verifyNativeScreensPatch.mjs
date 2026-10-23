import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Upstream PR4413, adapted only from cpp/legacy/ to 4.26.2's cpp/ paths.
// https://github.com/software-mansion/react-native-screens/pull/4413
export const nativeScreensPatchContract = Object.freeze({
  version: "4.26.2",
  upstreamCommit: "204d36b45f2a718c6f86e00cfc70765cbde06565",
  patch: "patches/react-native-screens+4.26.2.patch",
  patchSha256: "d2e0170866f318c5a3e96feece3f3718d8b79585d5e0898bb5c9e2888c0bf1d4",
  files: Object.freeze({
    "android/src/main/cpp/NativeProxy.cpp": "d1d006db671bf07d62dd8d486eac7d3027efa320cfe5cc25b8981e913ce019a9",
    "android/src/main/cpp/NativeProxy.h": "31fa7da8d2d614a3000f461a51bfa3f120c11cb1909c2e029da72cf1c162edcc",
    "cpp/RNSScreenRemovalListener.cpp": "8fce5565911f4241803f851a94e76ad94547e5f9ad4ed547d82971522c2b4613",
    "cpp/RNSScreenRemovalListener.h": "a61f5280c833689328c23d7c99c42b840bd8c8492f0a89996e54f9c7c5f75485",
  }),
});

const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
async function required(path, stage) {
  try { return await readFile(path); }
  catch { throw new Error(stage); }
}

/** Read-only: a missing or drifted patch is an error, never a repair/fallback. */
export async function verifyNativeScreensPatch(root = resolve(dirname(fileURLToPath(import.meta.url)), "..")) {
  const contract = nativeScreensPatchContract;
  const dependencyRoot = resolve(root, "node_modules/react-native-screens");
  let version;
  try { version = JSON.parse(await required(resolve(dependencyRoot, "package.json"), "native_screens_patch_package_missing")).version; }
  catch (error) {
    if (error instanceof Error && error.message === "native_screens_patch_package_missing") throw error;
    throw new Error("native_screens_patch_package_invalid");
  }
  if (version !== contract.version) throw new Error("native_screens_patch_version_mismatch");
  const patch = await required(resolve(root, contract.patch), "native_screens_patch_missing");
  if (sha256(patch) !== contract.patchSha256) throw new Error("native_screens_patch_hash_mismatch");
  for (const [file, expected] of Object.entries(contract.files)) {
    const bytes = await required(resolve(dependencyRoot, file), `native_screens_patch_source_missing:${file}`);
    if (sha256(bytes) !== expected) throw new Error(`native_screens_patch_source_mismatch:${file}`);
  }
  return Object.freeze({ package: "react-native-screens", version, files: Object.keys(contract.files).length, upstreamCommit: contract.upstreamCommit, patchSha256: contract.patchSha256 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(await verifyNativeScreensPatch())); }
  catch (error) {
    console.error(error instanceof Error ? error.message : "native_screens_patch_verification_failed");
    process.exitCode = 1;
  }
}
