import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import { usePatternlyAccount, type AccountSessionContextValue, type AccountState } from "./AccountSessionProvider";
import { createAccountForegroundRefreshScheduler, type AccountForegroundRefreshIntent } from "./accountForegroundRefresh";
import { observeReachability } from "./accountReconnect";

type ForegroundRefreshIntent = AccountForegroundRefreshIntent & Readonly<{ sessionGeneration: number }>;

function authenticatedUid(state: AccountState): string | null {
  return state.kind === "authenticated" ? state.user.uid : null;
}

/** Owns the process-wide app-return signal while the provider owns refresh semantics. */
export function AccountForegroundRefreshSidecar() {
  const account = usePatternlyAccount();
  const accountRef = useRef<AccountSessionContextValue>(account);
  accountRef.current = account;
  const sessionUidRef = useRef<string | null>(null);
  const sessionGenerationRef = useRef(0);
  const foregroundGenerationRef = useRef(0);
  const bootstrappedAccountRef = useRef<string | null>(null);
  const currentUid = authenticatedUid(account.state);
  const currentAccountId = account.state.kind === "authenticated" ? account.state.backendUser.id : null;
  const currentRecoveryIncidentId = account.state.kind === "authenticated" ? account.state.accountData.learningPlanRecovery?.incidentId ?? null : null;
  if (currentUid !== sessionUidRef.current) {
    sessionUidRef.current = currentUid;
    sessionGenerationRef.current += 1;
  }

  useEffect(() => {
    if (!currentUid || !currentAccountId) { bootstrappedAccountRef.current = null; return; }
    const key = `${currentUid}\u0000${currentAccountId}\u0000${currentRecoveryIncidentId ?? ""}`;
    if (bootstrappedAccountRef.current === key) return;
    bootstrappedAccountRef.current = key;
    void accountRef.current.refreshPremiumEntitlement(currentAccountId);
    void accountRef.current.retryLearningPlanRecovery(currentAccountId);
  }, [currentUid, currentAccountId, currentRecoveryIncidentId]);

  useEffect(() => {
    let previousReachability: boolean | null = null;
    const unsubscribe = NetInfo.addEventListener(({ isInternetReachable }) => {
      const transition = observeReachability(previousReachability, isInternetReachable);
      previousReachability = transition.next;
      if (!transition.reconnected) return;
      const current = accountRef.current.state;
      if (current.kind !== "authenticated") return;
      void accountRef.current.refreshPremiumEntitlement(current.backendUser.id);
      void accountRef.current.retryLearningPlanRecovery(current.backendUser.id);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const scheduler = createAccountForegroundRefreshScheduler<ForegroundRefreshIntent>({
      isCurrent: (intent) => {
        const current = accountRef.current.state;
        return current.kind === "authenticated"
          && current.user.uid === intent.uid
          && foregroundGenerationRef.current === intent.generation
          && sessionGenerationRef.current === intent.sessionGeneration;
      },
      refresh: async (intent) => {
        const result = await accountRef.current.refreshAccountIdentity();
        const current = accountRef.current.state;
        if (result.kind === "success" && current.kind === "authenticated" && current.user.uid === intent.uid) {
          await accountRef.current.refreshPremiumEntitlement(current.backendUser.id);
          await accountRef.current.retryLearningPlanRecovery(current.backendUser.id);
        }
      },
    });
    let previousState: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener("change", (nextState) => {
      const returnedToForeground = previousState !== "active" && nextState === "active";
      previousState = nextState;
      if (!returnedToForeground) return;
      const current = accountRef.current.state;
      if (current.kind !== "authenticated") return;
      foregroundGenerationRef.current += 1;
      scheduler.request({
        generation: foregroundGenerationRef.current,
        sessionGeneration: sessionGenerationRef.current,
        uid: current.user.uid,
      });
    });
    return () => {
      subscription.remove();
      scheduler.dispose();
    };
  }, []);

  useEffect(() => {
    if (!currentUid || !currentAccountId || !currentRecoveryIncidentId) return;
    const timer = setInterval(() => {
      if (AppState.currentState !== "active") return;
      const current = accountRef.current.state;
      if (current.kind !== "authenticated" || current.user.uid !== currentUid || current.backendUser.id !== currentAccountId
        || current.accountData.learningPlanRecovery?.incidentId !== currentRecoveryIncidentId) return;
      void accountRef.current.retryLearningPlanRecovery(currentAccountId);
    }, 30_000);
    return () => clearInterval(timer);
  }, [currentUid, currentAccountId, currentRecoveryIncidentId]);

  return null;
}
