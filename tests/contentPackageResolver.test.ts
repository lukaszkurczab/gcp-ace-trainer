import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import test from "node:test";

import { createContentPackageResolver, createPackageCatalogProfileAdapter, type ContentPackageRuntime, type ContentPackageSource } from "../src/content";
import { createCodingPackageRuntimeCatalog, createCertificationPackageRuntimeCatalog } from "../src/content";
import { CodingInterviewFamilyRuntime } from "../src/application/coding-interview/CodingInterviewFamilyRuntime";
import { CertificationFamilyRuntime } from "../src/application/certification/CertificationFamilyRuntime";
import { GENERATED_FREE_NODE_PACKAGES } from "../src/content/bundled/generatedFreeNodePackages";

const runtime: ContentPackageRuntime = Object.freeze({
  async sha256Utf8(value) { return createHash("sha256").update(value, "utf8").digest("hex"); },
  async sha256Bytes(value) { return createHash("sha256").update(value).digest("hex"); },
  decodeBase64(value) { return new Uint8Array(Buffer.from(value, "base64")); },
  async gunzip(value) { return new Uint8Array(gunzipSync(value)); },
  decodeUtf8(value) { return new TextDecoder().decode(value); },
});

test("PKG-04A adapts each verified package into a closed family-local catalog/profile", async () => {
  const resolver = createContentPackageResolver(sources, runtime);
  const coding = createPackageCatalogProfileAdapter(await resolver.resolveForPreparation({ trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", freeNodeId: "complexity_and_constraints", modeId: "coding-interview-learn-approach", appVersion: "0.1.0" }));
  assert.equal(coding.familyId, "coding_interview");
  assert.deepEqual(coding.modes.map((mode) => [mode.modeId, mode.blueprintModeId, mode.requestedLengths]), [
    ["coding-interview-learn-approach", "coding-interview-learn-approach", [10]],
    ["coding-interview-guided-practice", "coding-interview-guided-practice", [10, 20, 40]],
    ["coding-interview-custom-practice", "coding-interview-guided-practice", [10]],
    ["coding-interview-weak-area-review", "coding-interview-weak-area-review", [10, 20]],
  ]);
  assert.deepEqual(coding.getConfiguration("coding-interview-custom-practice").feedbackOptions, ["afterEachAnswer", "atSessionEnd"]);
  assert.equal(coding.getConfiguration("coding-interview-weak-area-review").selection.emptyEligibility, "unavailable");
  assert.throws(() => coding.getMode("coding-interview-simulation"), /unavailable/);
  assert.throws(() => coding.getConfiguration("coding-interview-recognize-patterns"), /unavailable/);
  assert.throws(() => coding.getItemById("outside-whole-track-item"), /unavailable/);
  assert.ok(Object.isFrozen(coding.configurations));
  assert.ok(Object.isFrozen(coding.getConfiguration("coding-interview-guided-practice").selection));

  const certification = createPackageCatalogProfileAdapter(await resolver.resolveForPreparation({ trackId: "google-cloud-associate-cloud-engineer", familyId: "certification", freeNodeId: "setup_environment", modeId: "certification-focus-practice", appVersion: "0.1.0" }));
  assert.equal(certification.familyId, "certification");
  assert.deepEqual(certification.modes.map((mode) => [mode.modeId, mode.requestedLengths]), [
    ["certification-focus-practice", [10, 20, 40]],
    ["certification-weak-area-review", [10, 20]],
    ["certification-quick-review", [10]],
  ]);
  assert.equal(certification.getConfiguration("certification-weak-area-review").selection.emptyEligibility, "unavailable");
  assert.equal(certification.getConfiguration("certification-quick-review").selection.kind, "due_free_node_review_evidence");
  assert.throws(() => certification.getMode("certification-exam-simulation"), /unavailable/);
  assert.throws(() => certification.getConfiguration("certification-scenario-practice"), /unavailable/);
  assert.throws(() => certification.getItemById("ace-q-9999"), /unavailable/);
});

test("PKG-04A package catalogs are accepted by family runtimes only for their closed profile paths", async () => {
  const resolver = createContentPackageResolver(sources, runtime);
  const codingPackage = await resolver.resolveForPreparation({ trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", freeNodeId: "complexity_and_constraints", modeId: "coding-interview-learn-approach", appVersion: "0.1.0" });
  if (codingPackage.familyId !== "coding_interview") throw new Error("Expected coding package.");
  const coding = new CodingInterviewFamilyRuntime(createCodingPackageRuntimeCatalog(codingPackage), undefined, codingPackage.taxonomyVersion);
  const codingItem = codingPackage.catalog.items[0] as { taxonomy: { primaryMentalUnitId: string } };
  const preparedCoding = await coding.prepare({ trackId: codingPackage.trackId, modeId: "coding-interview-learn-approach", request: { sessionId: "pkg-coding", requestedLength: 10, scope: { mentalUnitId: codingItem.taxonomy.primaryMentalUnitId } }, attempts: [], reviews: [], now: "2026-08-09T00:00:00.000Z" });
  assert.equal(preparedCoding.session.actualLength, 10);
  const preparedCustom = await coding.prepare({ trackId: codingPackage.trackId, modeId: "coding-interview-custom-practice", request: { sessionId: "pkg-coding-custom", requestedLength: 10, feedbackMode: "atSessionEnd", scope: { mentalUnitId: codingItem.taxonomy.primaryMentalUnitId } }, attempts: [], reviews: [], now: "2026-08-09T00:00:00.000Z" });
  assert.equal(preparedCustom.session.actualLength, 10);
  await assert.rejects(() => coding.prepare({ trackId: codingPackage.trackId, modeId: "coding-interview-custom-practice", request: { sessionId: "pkg-coding-custom-excluded", requestedLength: 20, scope: { mentalUnitId: codingItem.taxonomy.primaryMentalUnitId } }, attempts: [], reviews: [], now: "2026-08-09T00:00:00.000Z" }), /does not support requested length|unavailable/);
  await assert.rejects(() => coding.prepare({ trackId: codingPackage.trackId, modeId: "coding-interview-simulation", request: { sessionId: "pkg-coding-excluded", requestedLength: 40, scope: { simulationProfileId: "outside" } }, attempts: [], reviews: [], now: "2026-08-09T00:00:00.000Z" }), /unavailable/);

  const certificationPackage = await resolver.resolveForPreparation({ trackId: "google-cloud-associate-cloud-engineer", familyId: "certification", freeNodeId: "setup_environment", modeId: "certification-focus-practice", appVersion: "0.1.0" });
  if (certificationPackage.familyId !== "certification") throw new Error("Expected certification package.");
  const certification = new CertificationFamilyRuntime(createCertificationPackageRuntimeCatalog(certificationPackage), certificationPackage.taxonomyVersion);
  const preparedCertification = await certification.prepare({ trackId: certificationPackage.trackId, modeId: "certification-focus-practice", request: { sessionId: "pkg-certification", requestedLength: 10, domain: "setup_environment" }, attempts: [], reviews: [], now: "2026-08-09T00:00:00.000Z" });
  assert.equal(preparedCertification.session.actualLength, 10);
  await assert.rejects(() => certification.prepare({ trackId: certificationPackage.trackId, modeId: "certification-exam-simulation", request: { sessionId: "pkg-certification-excluded" }, attempts: [], reviews: [], now: "2026-08-09T00:00:00.000Z" }), /unavailable/);
});

test("PKG-04A adapter owns nested item and policy values", async () => {
  const resolver = createContentPackageResolver(sources, runtime);
  const verified = await resolver.resolveForPreparation({ trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", freeNodeId: "complexity_and_constraints", modeId: "coding-interview-guided-practice", appVersion: "0.1.0" });
  const mutable = structuredClone(verified);
  const adapter = createPackageCatalogProfileAdapter(mutable);
  (mutable.catalog.items[0] as { taxonomy: { primaryMentalUnitId: string } }).taxonomy.primaryMentalUnitId = "mutated";
  (mutable.profile.configurations[0]!.selection as { freeNodeId: string }).freeNodeId = "mutated";
  assert.notEqual((adapter.items[0] as { taxonomy: { primaryMentalUnitId: string } }).taxonomy.primaryMentalUnitId, "mutated");
  assert.notEqual(adapter.configurations[0]!.selection.freeNodeId, "mutated");
  assert.ok(Object.isFrozen((adapter.items[0] as { taxonomy: unknown }).taxonomy));
  assert.ok(Object.isFrozen(adapter.configurations[0]!.selection));
});

test("PKG-04A adapter has no whole-track catalog dependency", () => {
  const adapterSource = readFileSync(new URL("../src/content/application/packageRuntimeCatalog.ts", import.meta.url), "utf8");
  assert.doesNotMatch(adapterSource, /AlgorithmContentCatalog|CertificationContentCatalog|PublishedAlgorithmsBank|PublishedCertificationBank|catalogRepository/);
});

const sources = GENERATED_FREE_NODE_PACKAGES as readonly ContentPackageSource[];

test("CONTENT-PACKAGE-RESOLVER-001 verifies exact bundled node packages and resolves only closed profile modes", async () => {
  const resolver = createContentPackageResolver(sources, runtime);
  const coding = await resolver.resolveForPreparation({ trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", freeNodeId: "complexity_and_constraints", modeId: "coding-interview-learn-approach", appVersion: "0.1.0" });
  const gcp = await resolver.resolveForPreparation({ trackId: "google-cloud-associate-cloud-engineer", familyId: "certification", freeNodeId: "setup_environment", modeId: "certification-focus-practice", appVersion: "0.1.0" });
  assert.equal(coding.packagePin.packageIdentity, sources[0]!.packageSha256);
  assert.equal(gcp.packagePin.packageIdentity, sources[1]!.packageSha256);
  assert.ok(Object.isFrozen(coding));
  assert.ok(Object.isFrozen(coding.catalog.items[0]!));
  assert.ok(Object.isFrozen((coding.catalog.items[0] as { taxonomy: unknown }).taxonomy));
  assert.ok(Object.isFrozen(coding.profile.modes[0]!));
  assert.ok(Object.isFrozen(coding.catalog.assets));
  assert.throws(() => { (coding.catalog.items[0] as { id: string }).id = "mutated"; }, TypeError);
  assert.equal(coding.catalog.itemIds.length, 158);
  assert.equal(gcp.catalog.itemIds.length, 82);
  await assert.rejects(() => resolver.resolveForPreparation({ trackId: coding.trackId, familyId: coding.familyId, freeNodeId: coding.freeNodeId, modeId: "coding-interview-simulation", appVersion: "0.1.0" }), code("package_mode_unavailable"));
  assert.deepEqual(await resolver.resolveExact(coding.packagePin, "0.1.0"), coding);
  const alternateBytes = `${sources[0]!.packageBytes} `;
  const sameVersionDifferentHash: ContentPackageSource = { ...sources[0]!, packageBytes: alternateBytes, packageSize: alternateBytes.length, packageSha256: createHash("sha256").update(alternateBytes).digest("hex") };
  const duplicateVersionResolver = createContentPackageResolver([sameVersionDifferentHash, sources[0]!], runtime, [
    { packageIdentity: sameVersionDifferentHash.packageSha256, packageBytes: sameVersionDifferentHash.packageBytes },
    { packageIdentity: sources[0]!.packageSha256, packageBytes: sources[0]!.packageBytes },
  ]);
  assert.deepEqual(await duplicateVersionResolver.resolveExact(coding.packagePin, "0.1.0"), coding);
  await assert.rejects(() => resolver.resolveExact({ ...coding.packagePin, packageIdentity: "0".repeat(64) }, "0.1.0"), code("package_pin_mismatch"));
  await assert.rejects(() => resolver.resolveExact({ ...coding.packagePin, contentReleaseId: "missing" }, "0.1.0"), code("package_pin_mismatch"));
  await assert.rejects(() => resolver.resolveExact({ ...coding.packagePin, packageVersion: "missing" }, "0.1.0"), code("package_pin_not_found"));

  const tamperedOuterBytes = `${sources[0]!.packageBytes} `;
  await assertPackageFailure({ ...sources[0]!, packageBytes: tamperedOuterBytes, packageSize: tamperedOuterBytes.length }, "package_outer_integrity_failed");
  await assertPackageFailure(repack(sources[0]!, (outer) => { outer.manifest.payloadCompressedSize++; }), "package_compressed_integrity_failed");
  await assertPackageFailure(repack(sources[0]!, (outer) => { outer.manifest.payloadCanonicalSha256 = "0".repeat(64); }), "package_payload_integrity_failed");
  await assertPackageFailure(repack(sources[0]!, (outer) => { outer.manifest.trackId = "wrong"; }), "package_identity_mismatch");
  await assertPackageFailure(repack(sources[0]!, (outer) => { outer.manifest.familyId = "certification"; }), "package_identity_mismatch");
  await assertPackageFailure(repack(sources[0]!, (outer) => { outer.manifest.freeNodeId = "wrong"; }), "package_identity_mismatch");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.trackId = "wrong"; }, true), "package_identity_mismatch");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.freeNodeExperienceProfile.modes.pop(); }, true), "package_profile_invalid");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.items.push({ ...payload.items[0] }); }, true), "package_identity_mismatch");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.assets[0].sha256 = "0".repeat(64); }, true), "package_payload_integrity_failed");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.modeStructures.configurations[0].selection.freeNodeId = "external_node"; }, true), "package_profile_invalid");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.freeNodeExperienceProfile.modes[0].modeId = "free-only-mode"; payload.modeStructures.configurations[0].modeId = "free-only-mode"; payload.modeStructures.configurations[0].blueprintModeId = "free-only-mode"; }, true), "package_profile_invalid");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.freeNodeExperienceProfile.primaryEntry = { modeId: "coding-interview-weak-area-review", requestedLength: 10 }; }, true), "package_profile_invalid");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.modeStructures.configurations.find((entry: any) => entry.modeId === "coding-interview-custom-practice").feedbackOptions = ["afterEachAnswer"]; }, true), "package_profile_invalid");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.modeStructures.configurations.find((entry: any) => entry.modeId === "coding-interview-weak-area-review").selection.emptyEligibility = "silent_substitute"; }, true), "package_profile_invalid");
  await assertPackageFailure(repackPayload(sources[1]!, (payload) => { delete payload.modeStructures.configurations.find((entry: any) => entry.modeId === "certification-quick-review").selection.shortening; }, true), "package_profile_invalid");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.modeStructures.configurations.find((entry: any) => entry.modeId === "coding-interview-weak-area-review").selection.reviewSources = ["due_queue", "outside"]; }, true), "package_profile_invalid");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.modeStructures.configurations.find((entry: any) => entry.modeId === "coding-interview-weak-area-review").selection.sessionMissesMustBeCommitted = false; }, true), "package_profile_invalid");
  await assertPackageFailure(repackPayload(sources[1]!, (payload) => { payload.modeStructures.configurations.find((entry: any) => entry.modeId === "certification-quick-review").selection.kind = "free_node_review_evidence"; }, true), "package_profile_invalid");
  await assertPackageFailure(repackPayload(sources[0]!, (payload) => { payload.items[0] = { id: payload.items[0].id, taxonomy: payload.items[0].taxonomy }; }, true), "package_payload_invalid");
  await assertPackageFailure(repack(sources[0]!, (outer) => { outer.manifest.minimumAppVersion = "0.2.0"; }), "package_minimum_app_version");
  const provenanceForged = repack(sources[0]!, (outer) => { outer.manifest.provenance.sourceRepositoryCommit = "0".repeat(40); });
  await assert.rejects(() => createContentPackageResolver([provenanceForged], runtime).resolveForPreparation({ trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", freeNodeId: "complexity_and_constraints", modeId: "coding-interview-learn-approach", appVersion: "0.1.0" }), code("package_outer_integrity_failed"));
  const malformedBytes = "{";
  const malformed: ContentPackageSource = { ...sources[0]!, packageBytes: malformedBytes, packageSize: malformedBytes.length, packageSha256: createHash("sha256").update(malformedBytes).digest("hex") };
  await assert.rejects(() => createContentPackageResolver([malformed], runtime).resolveExact({ packageIdentity: malformed.packageSha256, packageVersion: malformed.packageVersion, contentReleaseId: "claimed" }, "0.1.0"), code("package_outer_integrity_failed"));
  await assert.rejects(() => resolver.resolveForPreparation({ trackId: coding.trackId, familyId: coding.familyId, freeNodeId: "other-node", modeId: "coding-interview-learn-approach", appVersion: "0.1.0" }), code("package_pin_not_found"));
});

async function assertPackageFailure(source: ContentPackageSource, expectedCode: string): Promise<void> {
  const resolver = createContentPackageResolver([source], runtime, [{ packageIdentity: source.packageSha256, packageBytes: source.packageBytes }]);
  const certification = source.trackId === "google-cloud-associate-cloud-engineer";
  await assert.rejects(() => resolver.resolveForPreparation(certification ? { trackId: source.trackId, familyId: "certification", freeNodeId: "setup_environment", modeId: "certification-focus-practice", appVersion: "0.1.0" } : { trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", freeNodeId: "complexity_and_constraints", modeId: "coding-interview-learn-approach", appVersion: "0.1.0" }), code(expectedCode));
}
function code(expected: string) { return (error: unknown) => error instanceof Error && "code" in error && (error as { code: string }).code === expected; }
function repack(source: ContentPackageSource, mutate: (outer: any) => void): ContentPackageSource {
  const outer = JSON.parse(source.packageBytes); mutate(outer); return sourceFor(outer, source);
}
function repackPayload(source: ContentPackageSource, mutate: (payload: any) => void, refreshPayloadChecksum = false): ContentPackageSource {
  const outer = JSON.parse(source.packageBytes);
  const payload = JSON.parse(gunzipSync(Buffer.from(outer.payloadGzipBase64, "base64")).toString("utf8"));
  mutate(payload);
  const payloadText = JSON.stringify(payload);
  outer.payloadGzipBase64 = gzipSync(payloadText).toString("base64");
  outer.manifest.payloadCompressedSize = Buffer.from(outer.payloadGzipBase64, "base64").length;
  outer.manifest.payloadUncompressedSize = Buffer.byteLength(payloadText);
  outer.manifest.payloadCompressedSha256 = createHash("sha256").update(Buffer.from(outer.payloadGzipBase64, "base64")).digest("hex");
  if (refreshPayloadChecksum) outer.manifest.payloadCanonicalSha256 = createHash("sha256").update(payloadText).digest("hex");
  return sourceFor(outer, source);
}
function sourceFor(outer: any, source: ContentPackageSource): ContentPackageSource {
  const packageBytes = JSON.stringify(outer);
  return { ...source, packageBytes, packageSize: packageBytes.length, packageSha256: createHash("sha256").update(packageBytes).digest("hex") };
}
