import { useEffect } from "react";
import { AppState } from "react-native";

import { getRetiredAccountSecretsCleanup } from "../../infrastructure/security/retiredAccountSecrets";

/** Runs legacy device-secret cleanup independently of profile storage readiness. */
export function RetiredAccountSecretsCleanupHost() {
  useEffect(() => {
    const cleanup = getRetiredAccountSecretsCleanup();
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active") void cleanup.reconcile();
    });
    void cleanup.reconcile();
    return () => {
      appState.remove();
      cleanup.dispose();
    };
  }, []);

  return null;
}
