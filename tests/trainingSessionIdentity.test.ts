import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";
import { getCodingPackageTestCatalog } from "./contentPackageRuntimeTestSupport";
import { formatTrainingSessionIdentity } from "../src/infrastructure/identity/trainingSessionIdentityFormat";
import { trainingSessionIdentity } from "../src/infrastructure/identity/trainingSessionIdentity";
import { installMemoryStorage } from "./journalTestSupport";

const NOW = "2026-08-02T08:00:00.000Z";
const developmentFlag = globalThis as typeof globalThis & { __DEV__?: boolean };

function setDevelopment(value: boolean | undefined): void {
  if (value === undefined) delete developmentFlag.__DEV__;
  else developmentFlag.__DEV__ = value;
}

function algorithmsRequest(roadmapNodeId: string) {
  return {
    feedbackMode: "afterEachAnswer" as const,
    requestedLength: 10,
    scope: { roadmapNodeId },
  } as const;
}

test("Node production identity emits validated, distinct track/mode UUIDv4 values", async () => {
  const [first, second] = await Promise.all([
    trainingSessionIdentity.create({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-custom-practice" }),
    trainingSessionIdentity.create({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-custom-practice" }),
  ]);
  const shape = /^coding-interview-dsa-problem-solving:coding-interview-custom-practice:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  assert.match(first, shape);
  assert.match(second, shape);
  assert.notEqual(first, second);
});

test("identity format rejects malformed scope and non-v4 UUIDs without a fallback", () => {
  const uuid = "00000000-0000-4000-8000-000000000001";
  assert.equal(
    formatTrainingSessionIdentity({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-focus-practice", uuid }),
    `google-cloud-associate-cloud-engineer:certification-focus-practice:${uuid}`,
  );
  assert.throws(() => formatTrainingSessionIdentity({ trackId: "coding-interview-dsa-problem-solving", modeId: "bad:mode", uuid }), /valid mode ID/);
  assert.throws(() => formatTrainingSessionIdentity({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-custom-practice", uuid: "not-a-uuid" }), /UUIDv4/);
});

test("Node and phone adapters use their platform crypto peer through extensionless resolution", () => {
  const node = readFileSync("src/infrastructure/identity/trainingSessionIdentity.ts", "utf8");
  const native = readFileSync("src/infrastructure/identity/trainingSessionIdentity.native.ts", "utf8");
  const composition = readFileSync("src/application/bootstrap/trainingLifecycleComposition.ts", "utf8");

  assert.match(node, /from "node:crypto"/);
  assert.doesNotMatch(node, /expo-crypto|Math\.random|Date\.now/);
  assert.match(native, /from "expo-crypto"/);
  assert.doesNotMatch(native, /node:crypto|Math\.random|Date\.now/);
  assert.match(composition, /identity\/trainingSessionIdentity"/);
  assert.doesNotMatch(composition, /trainingSessionIdentity\.(?:native|ts)/);
});

test("development audit identity advances from durable history across modes and composition reload, then reset restores suffix one", async () => {
  const previous = developmentFlag.__DEV__;
  setDevelopment(true);
  try {
    await prepareBundledTestPackages();
    installMemoryStorage();
    const roadmapNodeId = getCodingPackageTestCatalog().getItems()[0]!.taxonomy.roadmapNodeId;

    let lifecycle = composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
    const first = await lifecycle.startSession({
      trackId: "coding-interview-dsa-problem-solving",
      modeId: "coding-interview-custom-practice",
      request: algorithmsRequest(roadmapNodeId),
    });
    assert.equal(first.session.id, "coding-interview-dsa-problem-solving:coding-interview-custom-practice:1");
    await lifecycle.abandonActiveSession();

    lifecycle = composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
    const second = await lifecycle.startSession({
      trackId: "coding-interview-dsa-problem-solving",
      modeId: "coding-interview-guided-practice",
      request: algorithmsRequest(roadmapNodeId),
    });
    assert.equal(second.session.id, "coding-interview-dsa-problem-solving:coding-interview-guided-practice:2");

    await lifecycle.resetLearningState();
    lifecycle = composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
    const afterReset = await lifecycle.startSession({
      trackId: "coding-interview-dsa-problem-solving",
      modeId: "coding-interview-custom-practice",
      request: algorithmsRequest(roadmapNodeId),
    });
    assert.equal(afterReset.session.id, "coding-interview-dsa-problem-solving:coding-interview-custom-practice:1");
  } finally {
    setDevelopment(previous);
  }
});

test("one injected identity port forwards exact lifecycle-owned IDs across both families", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  const calls: string[] = [];
  let sequence = 0;
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: { now: () => NOW },
    sessionIds: {
      async create({ trackId, modeId }) {
        calls.push(`${trackId}:${modeId}`);
        sequence += 1;
        return `${trackId}:${modeId}:00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
      },
    },
  });
  const roadmapNodeId = getCodingPackageTestCatalog().getItems()[0]!.taxonomy.roadmapNodeId;
  const algorithms = await lifecycle.startSession({
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "coding-interview-custom-practice",
    request: { ...algorithmsRequest(roadmapNodeId), sessionId: "caller-id-must-be-overwritten" },
  });
  assert.equal(algorithms.session.id, "coding-interview-dsa-problem-solving:coding-interview-custom-practice:00000000-0000-4000-8000-000000000001");
  await lifecycle.abandonActiveSession();

  const certification = await lifecycle.startSession({
    trackId: "google-cloud-associate-cloud-engineer",
    modeId: "certification-focus-practice",
    request: { domain: "setup_environment", requestedLength: 10, sessionId: "second-caller-id-must-be-overwritten" },
  });
  assert.equal(certification.session.id, "google-cloud-associate-cloud-engineer:certification-focus-practice:00000000-0000-4000-8000-000000000002");
  assert.deepEqual(calls, [
    "coding-interview-dsa-problem-solving:coding-interview-custom-practice",
    "google-cloud-associate-cloud-engineer:certification-focus-practice",
  ]);
});
