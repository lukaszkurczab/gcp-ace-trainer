import assert from "node:assert/strict";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../src/application/contentPackageRuntimeOwner";
import { prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";

const GCP_FREE_NODE_ID = "organization_projects_policies_services_quotas_and_assets";

async function profile() {
  await prepareBundledTestPackages();
  return contentPackageRuntimeOwner.getPreparedDiscovery("google-cloud-associate-cloud-engineer").profile;
}

test("Certification Diagnostic Baseline is excluded from the bundled Free package and direct entry fails", async () => {
  const value = await profile();
  assert.throws(() => value.getMode("certification-diagnostic-baseline"), /unavailable in package/u);
});

test("Certification Focus Practice is the bundled Free package primary entry and remains node-local", async () => {
  const value = await profile();
  assert.equal(value.primaryEntry.modeId, "certification-focus-practice");
  assert.equal(value.freeNodeId, GCP_FREE_NODE_ID);
  assert.deepEqual(value.getMode("certification-focus-practice").requestedLengths, [10, 20, 40]);
  assert.ok((value.items as readonly { nodeId: string }[]).every((item) => item.nodeId === GCP_FREE_NODE_ID));
});

test("Certification Scenario Practice is excluded from the bundled Free package and direct entry fails", async () => {
  const value = await profile();
  assert.throws(() => value.getMode("certification-scenario-practice"), /unavailable in package/u);
});

test("Certification Weak Area Review is evidence-conditioned by the bundled Free package profile", async () => {
  const mode = (await profile()).getMode("certification-weak-area-review");
  assert.equal(mode.availability, "evidence_conditioned");
  assert.deepEqual(mode.requestedLengths, [10, 20]);
});

test("Certification Mixed Practice is excluded from the bundled Free package and direct entry fails", async () => {
  const value = await profile();
  assert.throws(() => value.getMode("certification-mixed-practice"), /unavailable in package/u);
});

test("Certification Quick Review is evidence-conditioned and capped by the bundled Free package profile", async () => {
  const mode = (await profile()).getMode("certification-quick-review");
  assert.equal(mode.availability, "evidence_conditioned");
  assert.deepEqual(mode.requestedLengths, [10]);
  assert.equal(mode.defaultRequestedLength, 10);
});
