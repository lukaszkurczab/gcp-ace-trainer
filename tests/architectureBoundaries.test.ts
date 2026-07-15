import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function files(root: string): string[] { return readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)]); }
test("learning kernel and registry boundaries exclude family content", () => {
  const kernel = files("src/domain/learning").map((path) => readFileSync(path, "utf8")).join("\n");
  const registry = files("src/domain/tracks").map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(kernel, /tracks\/algorithms|cloud-certification|AlgorithmQuestion|CertificationQuestion/);
  assert.doesNotMatch(registry, /algorithmContent|questionBank|CertificationQuestion|AlgorithmQuestion/);
});

test("families do not import one another and source contains no replacement bridge", () => {
  const algorithms = files("src/tracks/algorithms").map((path) => readFileSync(path, "utf8")).join("\n");
  const certification = files("src/tracks/cloud-certification").map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(algorithms, /cloud-certification/); assert.doesNotMatch(certification, /tracks\/algorithms/);
  const sourcePaths = files("src");
  assert.equal(sourcePaths.some((path) => /Adapter|Compatibility/.test(path)), false);
  const source = sourcePaths.map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(source, /as unknown as|@ts-ignore|@ts-expect-error|toCanonical|fromLegacy/);
});

test("application mutations depend on repositories rather than raw storage internals", () => {
  const mutations = files("src/application/learningMutations").map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(mutations, /infrastructure\/storage\/mmkvClient|storage\/(?:keys|storageCodec)/);
});

test("the public storage barrel does not expose raw keys or codec", () => {
  const barrel = readFileSync("src/storage/index.ts", "utf8");
  assert.doesNotMatch(barrel, /export \* from "\.\/(?:keys|storageCodec)"/);
});
