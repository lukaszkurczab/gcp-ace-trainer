import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { validateBundledContent } from "../src/content/application";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
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
    trainingSessionIdentity.create({ trackId: "algorithms", modeId: "algorithms-custom-practice" }),
    trainingSessionIdentity.create({ trackId: "algorithms", modeId: "algorithms-custom-practice" }),
  ]);
  const shape = /^algorithms:algorithms-custom-practice:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  assert.match(first, shape);
  assert.match(second, shape);
  assert.notEqual(first, second);
});

test("identity format rejects malformed scope and non-v4 UUIDs without a fallback", () => {
  const uuid = "00000000-0000-4000-8000-000000000001";
  assert.equal(
    formatTrainingSessionIdentity({ trackId: "cloud-certification", modeId: "certification-focus-practice", uuid }),
    `cloud-certification:certification-focus-practice:${uuid}`,
  );
  assert.throws(() => formatTrainingSessionIdentity({ trackId: "algorithms", modeId: "bad:mode", uuid }), /valid mode ID/);
  assert.throws(() => formatTrainingSessionIdentity({ trackId: "algorithms", modeId: "algorithms-custom-practice", uuid: "not-a-uuid" }), /UUIDv4/);
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
    await validateBundledContent();
    installMemoryStorage();
    const roadmapNodeId = getAlgorithmContentCatalog().getItems()[0]!.taxonomy.roadmapNodeId;

    let lifecycle = composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
    const first = await lifecycle.startSession({
      trackId: "algorithms",
      modeId: "algorithms-custom-practice",
      request: algorithmsRequest(roadmapNodeId),
    });
    assert.equal(first.session.id, "algorithms:algorithms-custom-practice:1");
    await lifecycle.abandonActiveSession();

    lifecycle = composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
    const second = await lifecycle.startSession({
      trackId: "algorithms",
      modeId: "algorithms-guided-practice",
      request: algorithmsRequest(roadmapNodeId),
    });
    assert.equal(second.session.id, "algorithms:algorithms-guided-practice:2");

    await lifecycle.resetLearningState();
    lifecycle = composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
    const afterReset = await lifecycle.startSession({
      trackId: "algorithms",
      modeId: "algorithms-custom-practice",
      request: algorithmsRequest(roadmapNodeId),
    });
    assert.equal(afterReset.session.id, "algorithms:algorithms-custom-practice:1");
  } finally {
    setDevelopment(previous);
  }
});

test("one injected identity port forwards exact lifecycle-owned IDs across both families", async () => {
  await validateBundledContent();
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
  const roadmapNodeId = getAlgorithmContentCatalog().getItems()[0]!.taxonomy.roadmapNodeId;
  const algorithms = await lifecycle.startSession({
    trackId: "algorithms",
    modeId: "algorithms-custom-practice",
    request: { ...algorithmsRequest(roadmapNodeId), sessionId: "caller-id-must-be-overwritten" },
  });
  assert.equal(algorithms.session.id, "algorithms:algorithms-custom-practice:00000000-0000-4000-8000-000000000001");
  await lifecycle.abandonActiveSession();

  const certification = await lifecycle.startSession({
    trackId: "cloud-certification",
    modeId: "certification-diagnostic-baseline",
    request: { sessionId: "second-caller-id-must-be-overwritten" },
  });
  assert.equal(certification.session.id, "cloud-certification:certification-diagnostic-baseline:00000000-0000-4000-8000-000000000002");
  assert.deepEqual(calls, [
    "algorithms:algorithms-custom-practice",
    "cloud-certification:certification-diagnostic-baseline",
  ]);
});
