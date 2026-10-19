import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import { prepareEasBuild } from "./prepareEasBuild.mjs";

test("EAS build wrapper syncs and verifies current content before invoking EAS", async () => {
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
});

test("prepare-only verifies the bundle without starting an EAS build", async () => {
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
});
