import assert from "node:assert/strict";
import test from "node:test";
import { clearGuestPrivacyDraft, inspectQ13GuestPrivacyDraft, loadGuestPrivacyDraft, saveGuestPrivacyDraft } from "./guestPrivacyDraft";

test("guest privacy retry identity survives restart without persisting a session token", async () => {
  const storage = new Map<string, string>();
  const store = {
    getItemAsync: async (key: string) => storage.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => { storage.set(key, value); },
    deleteItemAsync: async (key: string) => { storage.delete(key); },
  };
  const draft = { clientRequestId: "d39fbfd9-33dc-47f5-9d1c-48e630da2b43", email: "guest@example.com", right: "access" as const, requestId: "pr_75347222-8b93-4d78-9232-36b053107c46" };
  await saveGuestPrivacyDraft(draft, store);
  assert.deepEqual(await loadGuestPrivacyDraft(store), draft);
  assert.doesNotMatch([...storage.values()][0] ?? "", /sessionToken|app-check/u);
  await clearGuestPrivacyDraft(store);
  assert.equal(await loadGuestPrivacyDraft(store), null);
});

test("Q13 guest privacy receipt hashes the exact slot without parsing or mutating its PII", async () => {
  const storage = new Map([[
    "patternly.guest-privacy-pending.v1",
    JSON.stringify({ clientRequestId: "private-id", email: "private@example.com", right: "access", narrative: "private narrative" }),
  ]]);
  let writes = 0;
  const store = {
    getItemAsync: async (key: string) => storage.get(key) ?? null,
    setItemAsync: async () => { writes += 1; },
    deleteItemAsync: async () => { writes += 1; },
  };
  const before = storage.get("patternly.guest-privacy-pending.v1");

  const receipt = await inspectQ13GuestPrivacyDraft(store);

  assert.equal(receipt.kind, "observed");
  assert.equal(receipt.draft, "present");
  assert.equal(receipt.draftSha256?.length, 64);
  assert.equal(JSON.stringify(receipt).includes("private@example.com"), false);
  assert.equal(storage.get("patternly.guest-privacy-pending.v1"), before);
  assert.equal(writes, 0);
});
