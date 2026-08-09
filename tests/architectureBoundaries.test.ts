import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function files(root: string): string[] { return readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)]); }
test("learning kernel and registry boundaries exclude family content and platform owners", () => {
  const kernelPaths = files("src/domain/learning");
  const kernel = kernelPaths.map((path) => readFileSync(path, "utf8")).join("\n");
  const registry = files("src/domain/tracks").map((path) => readFileSync(path, "utf8")).join("\n");
  for (const path of kernelPaths) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /from\s+["'][^"']*(?:tracks\/|react(?:-native)?|mmkv|storage\/repositories)[^"']*["']/,
      `kernel import boundary violated by ${path}`);
  }
  assert.doesNotMatch(kernel, /tracks\/algorithms|google-cloud-associate-cloud-engineer|AlgorithmQuestion|CertificationQuestion|ValidatedBank|TrainingItem\s*=/);
  assert.doesNotMatch(registry, /algorithmContent|questionBank|CertificationQuestion|AlgorithmQuestion/);
});

test("families do not import one another and source contains no replacement bridge", () => {
  const algorithms = files("src/tracks/coding-interview").map((path) => readFileSync(path, "utf8")).join("\n");
  const certification = files("src/tracks/certification").map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(algorithms, /certification/); assert.doesNotMatch(certification, /tracks\/coding-interview/);
  const sourcePaths = files("src");
  assert.equal(sourcePaths.some((path) => /Adapter|Compatibility/.test(path)), false);
  const source = sourcePaths.map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(source, /as unknown as|@ts-ignore|@ts-expect-error|toCanonical|fromLegacy/);
});

test("application mutations depend on repositories rather than raw storage internals", () => {
  const mutations = files("src/application/learningMutations").map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(mutations, /infrastructure\/storage\/mmkvClient|storage\/(?:keys|storageCodec)/);
});

test("canonical lifecycle use cases have no React, storage implementation, or family-scoring dependency", () => {
  const lifecycle = files("src/application/trainingLifecycle").map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(lifecycle, /react|react-native|storage\/repositories|learningMutations|scoreAlgorithmQuestion|scoreCertificationQuestion|AlgorithmQuestion|CertificationQuestion/);
});

test("the public storage barrel does not expose raw keys or codec", () => {
  const barrel = readFileSync("src/storage/index.ts", "utf8");
  assert.doesNotMatch(barrel, /export \* from "\.\/(?:keys|storageCodec)"/);
});
