import assert from "node:assert/strict";
import test from "node:test";
import { clearGuestPrivacyDraft, loadGuestPrivacyDraft, saveGuestPrivacyDraft } from "./guestPrivacyDraft";

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
