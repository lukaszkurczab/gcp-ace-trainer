import assert from "node:assert/strict";
import test from "node:test";

import { captureHomeShellEpochFence, HomeShellSourcesChangedError } from "./homeShellReadFence";
import { captureFirstScreenInputEpoch, noteProfileKeyWrite } from "./bootstrap/firstScreenRecord";
import { isTodayInputKey } from "./home/todaySnapshot";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../storage/keys";

test("T27: the reused-snapshot fence passes while no Today input is written and the profile store is unchanged", () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  assert.equal(isTodayInputKey(STORAGE_KEYS.SETTINGS), false, "the Today input filter is registered");
  const fence = captureHomeShellEpochFence(captureFirstScreenInputEpoch());
  assert.doesNotThrow(fence);
  noteProfileKeyWrite(STORAGE_KEYS.SETTINGS);
  noteProfileKeyWrite(STORAGE_KEYS.ACCOUNT_SYNC);
  assert.doesNotThrow(fence, "writes outside the Today inputs");
});

test("T27: a Today input write during the read fails the fence with the retryable error", () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const fence = captureHomeShellEpochFence(captureFirstScreenInputEpoch());
  noteProfileKeyWrite(STORAGE_KEYS.trainingAttempt("a1"));
  assert.throws(fence, HomeShellSourcesChangedError);
});

test("T27: an epoch taken before an earlier write fails the fence (the token read came after it)", () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const epoch = captureFirstScreenInputEpoch();
  noteProfileKeyWrite(STORAGE_KEYS.ACTIVE_TRACK);
  assert.throws(captureHomeShellEpochFence(epoch), HomeShellSourcesChangedError);
});

test("T27: a profile store change during the read fails the fence", () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const fence = captureHomeShellEpochFence(captureFirstScreenInputEpoch());
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  assert.throws(fence, HomeShellSourcesChangedError);
});
