import { useEffect, useRef, useState } from "react";

import type { AccountCommandResult } from "../../application/account/AccountSessionProvider";

export type BusyAction = "recovery" | "continue" | "retry" | "delete" | "signOut";

export function useAccountCommand() {
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runCommand = (
    action: BusyAction,
    operation: () => Promise<AccountCommandResult>,
    onResult: (result: AccountCommandResult) => void,
  ) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyAction(action);
    void operation()
      .then((result) => {
        if (mountedRef.current) onResult(result);
      })
      .catch(() => {
        if (mountedRef.current) onResult({ kind: "failure", failure: "remoteFailure" });
      })
      .finally(() => {
        busyRef.current = false;
        if (mountedRef.current) setBusyAction(null);
      });
  };

  return { busyAction, runCommand };
}
