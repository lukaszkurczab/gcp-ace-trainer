import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import test from "node:test";

import { contentPackageRuntime, createContentPackageResolver, type ContentPackageSource } from "../src/content";
import { GENERATED_FREE_NODE_PACKAGES } from "../src/content/bundled/generatedFreeNodePackages";

const sources = GENERATED_FREE_NODE_PACKAGES as readonly ContentPackageSource[];

test("PKG-04A node adapter verifies both generated packages through the production runtime contract", async () => {
  const resolver = createContentPackageResolver(sources, contentPackageRuntime);

  const coding = await resolver.resolveForPreparation({
    trackId: "coding-interview-dsa-problem-solving",
    familyId: "coding_interview",
    freeNodeId: "complexity_and_constraints",
    modeId: "coding-interview-learn-approach",
    appVersion: "0.1.0",
  });
  const certification = await resolver.resolveForPreparation({
    trackId: "google-cloud-associate-cloud-engineer",
    familyId: "certification",
    freeNodeId: "organization_projects_policies_services_quotas_and_assets",
    modeId: "certification-focus-practice",
    appVersion: "0.1.0",
  });

  assert.equal(coding.catalog.itemIds.length, 158);
  assert.equal(certification.catalog.itemIds.length, 136);
});

test("PKG-04A package runtime rejects non-canonical base64 and malformed UTF-8", () => {
  assert.throws(() => contentPackageRuntime.decodeBase64("a"));
  assert.throws(() => contentPackageRuntime.decodeBase64("a==="));
  assert.throws(() => contentPackageRuntime.decodeBase64("AB=="));
  assert.throws(() => contentPackageRuntime.decodeBase64("AAB="));
  assert.throws(() => contentPackageRuntime.decodeBase64("Zm9="));
  assert.throws(() => contentPackageRuntime.decodeUtf8(new Uint8Array([0xc3, 0x28])));
});

test("PKG-04A resolver closes non-canonical payload base64 as a payload error", async () => {
  const outer = JSON.parse(sources[0]!.packageBytes) as { payloadGzipBase64: string };
  outer.payloadGzipBase64 = "AB==";
  const packageBytes = JSON.stringify(outer);
  const source: ContentPackageSource = {
    ...sources[0]!,
    packageBytes,
    packageSize: packageBytes.length,
    packageSha256: createHash("sha256").update(packageBytes).digest("hex"),
  };
  const resolver = createContentPackageResolver([source], contentPackageRuntime, [{ packageIdentity: source.packageSha256, packageBytes }]);

  await assert.rejects(
    () => resolver.resolveForPreparation({
      trackId: source.trackId,
      familyId: "coding_interview",
      freeNodeId: "complexity_and_constraints",
      modeId: "coding-interview-learn-approach",
      appVersion: "0.1.0",
    }),
    (error: unknown) => (error as { code?: string }).code === "package_payload_invalid",
  );
});

test("PKG-04A resolver closes malformed UTF-8 as a payload error", async () => {
  const outer = JSON.parse(sources[0]!.packageBytes) as { payloadGzipBase64: string; manifest: Record<string, unknown> };
  const malformedUtf8 = gzipSync(new Uint8Array([0xc3, 0x28]));
  outer.payloadGzipBase64 = malformedUtf8.toString("base64");
  outer.manifest.payloadCompressedSize = malformedUtf8.length;
  outer.manifest.payloadCompressedSha256 = createHash("sha256").update(malformedUtf8).digest("hex");
  outer.manifest.payloadUncompressedSize = 2;
  const packageBytes = JSON.stringify(outer);
  const source: ContentPackageSource = {
    ...sources[0]!,
    packageBytes,
    packageSize: packageBytes.length,
    packageSha256: createHash("sha256").update(packageBytes).digest("hex"),
  };
  const resolver = createContentPackageResolver([source], contentPackageRuntime, [{ packageIdentity: source.packageSha256, packageBytes }]);

  await assert.rejects(
    () => resolver.resolveForPreparation({
      trackId: source.trackId,
      familyId: "coding_interview",
      freeNodeId: "complexity_and_constraints",
      modeId: "coding-interview-learn-approach",
      appVersion: "0.1.0",
    }),
    (error: unknown) => (error as { code?: string }).code === "package_payload_invalid",
  );
});

test("PKG-04A native runtime uses Expo Crypto and pure-JS gzip without Node built-ins", () => {
  const nativeRuntime = readFileSync("src/infrastructure/content/contentPackageRuntime.native.ts", "utf8");
  assert.match(nativeRuntime, /from "expo-crypto"/);
  assert.match(nativeRuntime, /from "fflate"/);
  assert.doesNotMatch(nativeRuntime, /node:(?:crypto|zlib)/);
});
