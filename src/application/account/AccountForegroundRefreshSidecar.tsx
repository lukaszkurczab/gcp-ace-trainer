import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { usePatternlyAccount, type AccountSessionContextValue, type AccountState } from "./AccountSessionProvider";
import { createAccountForegroundRefreshScheduler, type AccountForegroundRefreshIntent } from "./accountForegroundRefresh";

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
  const currentUid = authenticatedUid(account.state);
  if (currentUid !== sessionUidRef.current) {
    sessionUidRef.current = currentUid;
    sessionGenerationRef.current += 1;
  }

  useEffect(() => {
    const scheduler = createAccountForegroundRefreshScheduler<ForegroundRefreshIntent>({
      isCurrent: (intent) => {
        const current = accountRef.current.state;
        return current.kind === "authenticated"
          && current.user.uid === intent.uid
          && foregroundGenerationRef.current === intent.generation
          && sessionGenerationRef.current === intent.sessionGeneration;
      },
      refresh: async () => {
        await accountRef.current.refreshAccountIdentity();
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

  return null;
}
