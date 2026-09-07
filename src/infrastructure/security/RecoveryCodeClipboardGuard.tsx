import { useEffect } from "react";
import { AppState } from "react-native";

import { recoveryCodeClipboard } from "./recoveryCodeClipboard";

export function RecoveryCodeClipboardGuard() {
  useEffect(() => {
    void recoveryCodeClipboard.reconcile().catch(() => undefined);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void recoveryCodeClipboard.reconcile().catch(() => undefined);
    });
    return () => subscription.remove();
  }, []);
  return null;
}
