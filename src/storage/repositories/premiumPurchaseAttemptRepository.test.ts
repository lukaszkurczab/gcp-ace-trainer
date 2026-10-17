import assert from "node:assert/strict";
import test from "node:test";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";
import { capturePremiumPurchaseJournal } from "./premiumPurchaseAttemptRepository";
import { STORAGE_KEYS } from "../keys";
import { clearGuestOwnedLocalData } from "./accountDataRepository";

const profile = { id: "account:A", kind: "account", accountId: "A" } as const;
const marker = { accountId: "A", attemptId: "00000000-0000-4000-8000-000000000018", phase: "candidate", transactionId: "exact-T", confirmation: null } as const;

test("journal roundtrip is canonical, restart-readable and survives learning-only reset", async () => {
  const storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage); setActiveProfileLeaseForTests(profile);
  const journal = capturePremiumPurchaseJournal("A", () => true); journal.save(marker);
  assert.deepEqual(capturePremiumPurchaseJournal("A", () => true).read(), marker);
  await clearGuestOwnedLocalData();
  assert.deepEqual(journal.read(), marker);
  journal.clear(); assert.equal(journal.read(), null);
});

test("same-account new lease and actor invalidation refuse old journal writes", () => {
  const storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage); setActiveProfileLeaseForTests(profile);
  let current = true; const journal = capturePremiumPurchaseJournal("A", () => current); journal.save(marker);
  const before = storage.snapshot(); setActiveProfileLeaseForTests(profile);
  assert.throws(() => journal.save(marker), /purchase_storage_changed/u);
  assert.deepEqual(storage.snapshot(), before);
  const fresh = capturePremiumPurchaseJournal("A", () => current); current = false;
  assert.throws(() => fresh.clear(), /purchase_storage_changed/u);
  assert.deepEqual(storage.snapshot(), before);
});

test("invalid/corrupt markers and uncertain storage write cannot permit dispatch", () => {
  const storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage); setActiveProfileLeaseForTests(profile);
  const journal = capturePremiumPurchaseJournal("A", () => true);
  storage.setString(STORAGE_KEYS.PREMIUM_PURCHASE_ATTEMPT, "corrupt");
  assert.throws(() => journal.read());
  storage.remove(STORAGE_KEYS.PREMIUM_PURCHASE_ATTEMPT);
  storage.setFailurePlan({ kind: "fail_on_key_read", key: STORAGE_KEYS.PREMIUM_PURCHASE_ATTEMPT });
  assert.throws(() => journal.save(marker));
});

test("intent preserves exact consent payload for idempotent recovery", () => {
  const storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage); setActiveProfileLeaseForTests(profile);
  const confirmation = { confirmationId: marker.attemptId, termsVersion: "2026-09-05", productIdentifier: "monthly", storefrontPrice: "49,99 zł", locale: "pl", immediateStartRequested: true } as const;
  const journal = capturePremiumPurchaseJournal("A", () => true);
  journal.save({ ...marker, phase: "intent", transactionId: null, confirmation });
  assert.deepEqual(capturePremiumPurchaseJournal("A", () => true).read()?.confirmation, confirmation);
});

test("Play journal preserves the composite store product and store discriminator exactly", () => {
  const storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage); setActiveProfileLeaseForTests(profile);
  const confirmation = { confirmationId: marker.attemptId, termsVersion: "2026-10-17", productIdentifier: "fixture_play_monthly:monthly", storefrontPrice: "€9.99", store: "PLAY_STORE" as const, locale: "en" as const, immediateStartRequested: true as const };
  const journal = capturePremiumPurchaseJournal("A", () => true);
  journal.save({ ...marker, phase: "intent", transactionId: null, confirmation });
  assert.deepEqual(capturePremiumPurchaseJournal("A", () => true).read()?.confirmation, confirmation);
});
