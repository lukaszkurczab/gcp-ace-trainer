import { useCallback, useEffect, useRef } from "react";

import { ROUTES } from "../../constants/routes";

type RecoveryReturnAccount = Readonly<{
  uid: string;
  healthy: boolean;
  scope: object;
}> | null;

/** Returns after an explicit Settings recovery retry reaches healthy state for the same actor and storage lease. */
export function useSettingsRecoveryReturn(input: Readonly<{
  enabled: boolean;
  focused: boolean;
  previousRouteName: string | undefined;
  account: RecoveryReturnAccount;
  goBack: () => void;
}>): () => void {
  const requestedRecovery = useRef<Readonly<{ uid: string; scope: object }> | null>(null);
  const returned = useRef(false);

  const markRetryRequested = useCallback(() => {
    if (!input.enabled || !input.focused || input.previousRouteName !== ROUTES.HOME || !input.account || input.account.healthy) return;
    requestedRecovery.current = { uid: input.account.uid, scope: input.account.scope };
    returned.current = false;
  }, [input.account, input.enabled, input.focused, input.previousRouteName]);

  useEffect(() => {
    if (!input.focused || !input.enabled || input.previousRouteName !== ROUTES.HOME || !input.account) {
      requestedRecovery.current = null;
      return;
    }
    const recovery = requestedRecovery.current;
    if (recovery && (recovery.uid !== input.account.uid || recovery.scope !== input.account.scope)) {
      requestedRecovery.current = null;
      return;
    }
    if (!input.account.healthy || returned.current || !recovery) return;
    returned.current = true;
    requestedRecovery.current = null;
    input.goBack();
  }, [input.account, input.enabled, input.focused, input.goBack, input.previousRouteName]);

  return markRetryRequested;
}
