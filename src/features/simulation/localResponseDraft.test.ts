import assert from "node:assert/strict";
import test from "node:test";

import { resolveLocalResponseDraft, runLocalResponseTransition, type LocalResponseDraft } from "./localResponseDraft";

test("a local response draft is visible only for its own occurrence", () => {
  const firstDraft: LocalResponseDraft<string> = { occurrenceId: "q1", response: "unsaved q1" };

  assert.equal(resolveLocalResponseDraft(firstDraft, "q1", "saved q1"), "unsaved q1");
  assert.equal(resolveLocalResponseDraft(firstDraft, "q2", "saved q2"), "saved q2");
  assert.equal(resolveLocalResponseDraft(firstDraft, null, null), null);
});

test("save transition clears before projection refresh and restores the keyed draft on failure", async () => {
  const draft: LocalResponseDraft<string> = { occurrenceId: "q1", response: "unsaved q1" };
  let current: LocalResponseDraft<string> | null = draft;
  let rejectTransition!: (error: Error) => void;
  const pending = runLocalResponseTransition(draft, (next) => { current = next; }, () => new Promise<never>((_resolve, reject) => { rejectTransition = reject; }));

  assert.equal(current, null);
  assert.equal(resolveLocalResponseDraft(current, "q2", "saved q2"), "saved q2");
  rejectTransition(new Error("save failed"));
  await assert.rejects(pending, /save failed/);
  assert.deepEqual(current, draft);
  assert.equal(resolveLocalResponseDraft(current, "q1", "saved q1"), "unsaved q1");
  assert.equal(resolveLocalResponseDraft(current, "q2", "saved q2"), "saved q2");
});
