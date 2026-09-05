import assert from "node:assert/strict";
import test from "node:test";

import { createNotificationSettingsRequestGuard } from "./notificationSettingsState";

test("notification settings mutations are single-flight before asynchronous work starts", () => {
  const guard = createNotificationSettingsRequestGuard();

  const first = guard.beginMutation();
  const second = guard.beginMutation();

  assert.equal(first, 1);
  assert.equal(second, null);
  guard.finishMutation(first!);
  assert.equal(guard.beginMutation(), 2);
});

test("a read that started before a mutation cannot overwrite the completed mutation", () => {
  const guard = createNotificationSettingsRequestGuard();
  const readBeforeMutation = guard.beginRead();
  const mutation = guard.beginMutation();

  guard.finishMutation(mutation!);

  assert.equal(guard.canCommitRead(readBeforeMutation), false);
});

test("a read started during a mutation stays stale while a later idle read can commit", () => {
  const guard = createNotificationSettingsRequestGuard();
  const mutation = guard.beginMutation();
  const readDuringMutation = guard.beginRead();
  guard.finishMutation(mutation!);
  const readAfterMutation = guard.beginRead();

  assert.equal(guard.canCommitRead(readDuringMutation), false);
  assert.equal(guard.canCommitRead(readAfterMutation), true);
});

test("a foreground read during a mutation is skipped before it can leave loading asserted", () => {
  const guard = createNotificationSettingsRequestGuard();
  const mutation = guard.beginMutation();
  const readDuringMutation = guard.beginRead();
  let loading = false;

  if (!readDuringMutation.startedWhileBusy) loading = true;
  guard.finishMutation(mutation!);
  if (guard.canCommitRead(readDuringMutation)) loading = false;

  assert.equal(readDuringMutation.startedWhileBusy, true);
  assert.equal(loading, false);
});
