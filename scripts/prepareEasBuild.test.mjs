import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import { prepareEasBuild } from "./prepareEasBuild.mjs";

async function withoutInheritedContentSha(run) {
  const inherited = process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA;
  delete process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA;
  try { return await run(); }
  finally {
    if (inherited === undefined) delete process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA;
    else process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA = inherited;
  }
}

test("EAS build wrapper syncs and verifies current content before invoking EAS", async () => withoutInheritedContentSha(async () => {
  const order = [];
  const result = await prepareEasBuild(["--profile", "release"], {
    applicationRoot: "/tmp/patternly-app",
    contentRoot: "/tmp/patternly-content",
    getContentHead: async () => "1".repeat(40),
    sync: async (options) => { order.push(["sync", options]); },
    verify: async (options) => { order.push(["verify", options]); return { sourceRepositoryCommit: "1".repeat(40), sourceInputFingerprint: "a".repeat(64), trackCount: 9 }; },
    command: "eas-test-double",
    spawn: (command, args, options) => {
      order.push(["spawn", command, args, options]);
      const child = new EventEmitter();
      queueMicrotask(() => child.emit("exit", 0, null));
      return child;
    },
  });
  assert.equal(result.code, 0);
  assert.deepEqual(order.map(([kind]) => kind), ["sync", "verify", "spawn"]);
  assert.deepEqual(order[0][1], { mode: "sync", appRoot: "/tmp/patternly-app", producerRoot: "/tmp/patternly-content" });
  assert.deepEqual(order[2][2], ["eas", "build", "--profile", "release"]);
}));

test("prepare-only verifies the bundle without starting an EAS build", async () => withoutInheritedContentSha(async () => {
  let spawned = false;
  const result = await prepareEasBuild(["--prepare-only"], {
    applicationRoot: "/tmp/patternly-app",
    contentRoot: "/tmp/patternly-content",
    getContentHead: async () => "1".repeat(40),
    sync: async () => {},
    verify: async () => ({ sourceRepositoryCommit: "1".repeat(40), sourceInputFingerprint: "a".repeat(64), trackCount: 9 }),
    spawn: () => { spawned = true; throw new Error("must not spawn"); },
  });
  assert.equal(result.prepared, true);
  assert.equal(spawned, false);
}));

test("an explicit expected content SHA still rejects a mismatched checkout before sync", async () => {
  const inherited = process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA;
  process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA = "2".repeat(40);
  let synced = false;
  try {
    await assert.rejects(prepareEasBuild(["--prepare-only"], {
      applicationRoot: "/tmp/patternly-app",
      contentRoot: "/tmp/patternly-content",
      getContentHead: async () => "1".repeat(40),
      sync: async () => { synced = true; },
      verify: async () => { throw new Error("must not verify"); },
    }), /Selected content checkout HEAD differs from the expected exact SHA\./);
    assert.equal(synced, false);
  } finally {
    if (inherited === undefined) delete process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA;
    else process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA = inherited;
  }
});
