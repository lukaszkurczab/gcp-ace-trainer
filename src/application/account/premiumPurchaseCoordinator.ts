import type { LocalPurchaseAttempt, PurchaseAttemptJournal, PurchaseConfirmationInput } from "../../storage/repositories/premiumPurchaseAttemptRepository";
import type { PurchaseAttemptDto, PurchaseAttemptCommandDto, PurchaseCaseDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import type { PurchasesAdapter, RevenueCatPackage } from "../../infrastructure/purchases";

export type PremiumVerification = "verified" | "denied" | "pending";
export type PremiumPurchaseActor = Readonly<{
  accountId: string;
  isCurrent: () => boolean;
  record: (input: PurchaseConfirmationInput) => Promise<unknown>;
  attempt: (id: string) => Promise<Readonly<{ attempt: PurchaseAttemptDto }>>;
  command: (id: string, command: PurchaseAttemptCommandDto) => Promise<Readonly<{ attempt: PurchaseAttemptDto }>>;
  cases: () => Promise<Readonly<{ items: readonly PurchaseCaseDto[]; truncated: boolean }>>;
  refresh: () => Promise<PremiumVerification>;
}>;
export type PremiumPurchaseState = Readonly<{
  access: PremiumVerification;
  blocked: boolean;
  storeActive: boolean;
  notice: "checking" | "active" | "pending" | "unknown" | "cancelled" | "failure" | "denied" | "notStarted" | "restoreCancelled" | null;
  receiptIssue: boolean;
}>;

/** One original SDK dispatch; recovery only reads/replays evidence for that exact attempt. */
export function createPremiumPurchaseCoordinator(input: Readonly<{
  actor: PremiumPurchaseActor; adapter: PurchasesAdapter; journal: PurchaseAttemptJournal;
  monotonicNow: () => number; dispatchEpoch: () => number | null;
}>) {
  const { actor, adapter, journal } = input;
  let state: PremiumPurchaseState = { access: "pending", blocked: true, storeActive: false, notice: "checking", receiptIssue: false };
  let busy = false;
  let dispatchValid = true;
  let reloadQueued = false;
  const finish = () => {
    busy = false;
    if (reloadQueued && actor.isCurrent()) { reloadQueued = false; void reload(); }
  };
  const listeners = new Set<(state: PremiumPurchaseState) => void>();
  const assertCurrent = () => { if (!actor.isCurrent()) throw Error("purchase_actor_changed"); };
  const publish = (patch: Partial<PremiumPurchaseState>) => {
    if (!actor.isCurrent()) return;
    state = { ...state, ...patch };
    for (const listener of listeners) listener(state);
  };
  const save = (value: LocalPurchaseAttempt) => { assertCurrent(); journal.save(value); };
  async function reconcile(freshStore = false): Promise<void> {
    assertCurrent();
    const marker = journal.read();
    let unresolved = false;
    let pending = false;
    let notStarted = false;
    let boundMarker = false;
    if (marker) {
      if (marker.accountId !== actor.accountId) throw Error("purchase_owner_changed");
      if (marker.phase === "intent" && marker.confirmation) {
        await actor.record(marker.confirmation); // Identical payload/ID, no consent renewal.
        assertCurrent();
        notStarted = true;
      }
      // A candidate or cancel is replayable evidence, never a repeated store effect.
      const response = marker.phase === "candidate" && marker.transactionId
        ? await actor.command(marker.attemptId, { action: "candidate", transactionId: marker.transactionId })
        : marker.phase === "cancelled"
          ? await actor.command(marker.attemptId, { action: "cancelled", source: "original_sdk_operation" })
          : marker.phase === "pending"
            ? await actor.command(marker.attemptId, { action: "pending" })
            : await actor.attempt(marker.attemptId);
      assertCurrent();
      if (response.attempt.outcome === "cancelled") {
        journal.clear();
      } else if (response.attempt.outcome === "bound") {
        boundMarker = true;
      } else {
        unresolved = true;
        pending = response.attempt.outcome === "pending" || marker.phase === "pending";
      }
    }
    const cases = await actor.cases();
    assertCurrent();
    const receiptIssue = cases.truncated || cases.items.some((item) => item.status !== "bound");
    // Outstanding provider transactions must not lead to another checkout on a new device.
    unresolved ||= cases.truncated || cases.items.some((item) => item.status === "reconciliation_required" || item.status === "expired_unresolved");
    const access = await actor.refresh();
    assertCurrent();
    if (boundMarker) {
      if (access === "verified") journal.clear();
      else unresolved = true; // A bound receipt is not proof that another purchase is safe.
    }
    const store = await adapter.getCustomerInfo(freshStore);
    assertCurrent();
    const storeActive = store.status === "success" && store.hasActiveSubscription === true;
    const knownStore = store.status === "success" && store.hasActiveSubscription !== undefined;
    publish({ access, storeActive, receiptIssue,
      blocked: unresolved || access !== "denied" || !knownStore || storeActive,
      notice: access === "verified" ? "active" : notStarted ? "notStarted" : pending ? "pending" : unresolved || storeActive ? "unknown" : access === "pending" || !knownStore ? "checking" : state.notice === "checking" ? null : state.notice,
    });
  }
  async function reload(): Promise<PremiumPurchaseState> {
    if (busy) { reloadQueued = true; return state; }
    busy = true;
    try { await reconcile(); }
    catch {
      let notStarted = false;
      try { notStarted = actor.isCurrent() && journal.read()?.phase === "intent"; } catch { /* Unreadable evidence remains unknown. */ }
      publish({ blocked: true, notice: notStarted ? "notStarted" : state.notice === "pending" ? "pending" : "unknown" });
    }
    finally { finish(); }
    return state;
  }
  async function purchase(pkg: RevenueCatPackage, confirmation: PurchaseConfirmationInput): Promise<void> {
    if (busy || state.blocked) return;
    busy = true;
    let marker: LocalPurchaseAttempt | null = null;
    try {
      // Recheck both authorities immediately before creating a new attempt.
      await reconcile(true);
      assertCurrent();
      if (state.blocked || journal.read()) return;
      marker = { accountId: actor.accountId, attemptId: confirmation.confirmationId, phase: "intent", transactionId: null, confirmation };
      save(marker); // Before the first external effect, including a lost confirmation ACK.
      publish({ blocked: true, notice: "checking" });
      await actor.record(confirmation);
      assertCurrent();
      const epoch = input.dispatchEpoch();
      const started = input.monotonicNow();
      marker = { ...marker, phase: "dispatch", confirmation: null };
      save(marker); // A restarted process never reclaims or replays dispatch.
      const { attempt } = await actor.command(marker.attemptId, { action: "claim" });
      assertCurrent();
      const budget = Date.parse(attempt.startExpiresAt) - Date.parse(attempt.initiatedAt ?? "");
      const canDispatch = () => dispatchValid && actor.isCurrent() && epoch !== null && epoch === input.dispatchEpoch()
        && attempt.dispatchAllowed === true && Number.isFinite(budget) && budget > 0
        && input.monotonicNow() >= started && input.monotonicNow() - started < budget;
      if (!canDispatch()) { publish({ notice: "unknown" }); return; }
      const outcome = await adapter.purchasePackage(pkg, canDispatch);
      assertCurrent();
      marker = { ...marker, phase: outcome.status === "success" && outcome.transactionId ? "candidate" : outcome.status === "cancelled" ? "cancelled" : outcome.status === "pending" ? "pending" : "unknown", transactionId: outcome.transactionId ?? null };
      save(marker); // Exact original result is durable before the candidate request.
      publish({ notice: marker.phase === "pending" ? "pending" : marker.phase === "cancelled" ? "cancelled" : "unknown" });
      await reconcile();
    } catch {
      publish({ blocked: marker !== null || state.blocked, notice: marker?.phase === "intent" ? "notStarted" : marker ? "unknown" : "failure" });
    } finally { finish(); }
  }
  async function restore(): Promise<void> {
    if (busy) return;
    busy = true;
    try {
      assertCurrent();
      const outcome = await adapter.restorePurchases();
      assertCurrent();
      if (outcome.status !== "success") { publish({ notice: outcome.status === "pending" ? "pending" : outcome.status === "cancelled" ? "restoreCancelled" : "failure" }); return; }
      await reconcile();
      if (state.access === "denied" && !state.blocked) publish({ notice: "denied" });
    } catch { publish({ notice: "failure", blocked: true }); }
    finally { finish(); }
  }
  return Object.freeze({
    reload, purchase, restore, invalidateDispatch: () => { dispatchValid = false; }, getState: () => state,
    subscribe(listener: (state: PremiumPurchaseState) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  });
}
