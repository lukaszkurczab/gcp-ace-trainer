import { useEffect, useRef, useState, type ReactNode } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { EmptyState, LoadingState, Screen } from "../../components";
import { describeOperationalFailure, operationalDiagnosticCode } from "../../application/operationalDiagnostics";
import { useAppPreferences } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { encryptedStorageFailureCode } from "../../infrastructure/storage/encryptedStorageBootstrap";
import { inspectPreparedProfileState, prepareProfileStorage, removeUnavailableEncryptedStorage, type PreparedProfileState } from "../../infrastructure/storage/mmkvClient";
import { EncryptedStorageRecoverySurface, type EncryptedStorageRecoveryStatus } from "../../content/application/EncryptedStorageRecoverySurface";
import { canStartManualRetry, createManualRetryLimit, reserveManualRetry, settleManualRetry } from "../../content/application/manualRetryLimit";
import { PreparedProfileStorageContext } from "./profileStoragePreparationContext";

type PreparationState =
  | { kind: "loading" }
  | { kind: "ready"; profile: PreparedProfileState }
  | { kind: "unavailable"; reason: string; storageFailureCode?: string };

export function ProfileStoragePreparationGate({ children }: { children: ReactNode }) {
  const { colors } = useAppPreferences();
  const { t } = useTranslation("common");
  const [state, setState] = useState<PreparationState>({ kind: "loading" });
  const [revision, setRevision] = useState(0);
  const [recoveryStatus, setRecoveryStatus] = useState<EncryptedStorageRecoveryStatus>("base");
  const [removalError, setRemovalError] = useState<string | undefined>();
  const removalInFlight = useRef(false);
  const removalAttempt = useRef(0);
  const manualRetry = useRef(createManualRetryLimit());
  const presentationWaiter = useRef<{ attempt: number; resolve: (presented: boolean) => void } | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      presentationWaiter.current?.resolve(false);
      presentationWaiter.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    void prepareProfileStorage().then(() => inspectPreparedProfileState()).then((profileState) => {
      if (active) {
        settleManualRetry(manualRetry.current, true);
        setState({ kind: "ready", profile: profileState });
      }
    }).catch((error: unknown) => {
      if (active) {
        settleManualRetry(manualRetry.current, false);
        const storageFailureCode = encryptedStorageFailureCode(error) ?? undefined;
        setState({ kind: "unavailable", reason: describeOperationalFailure(error, "Local profile storage could not be prepared."), ...(storageFailureCode ? { storageFailureCode } : {}) });
      }
    });
    return () => { active = false; };
  }, [revision]);

  const retry = () => {
    setRecoveryStatus("base");
    setRemovalError(undefined);
    setState({ kind: "loading" });
    setRevision((value) => value + 1);
  };
  const retryLostKeyPreparation = () => {
    if (!reserveManualRetry(manualRetry.current)) return;
    retry();
  };
  const removeUnavailableData = async () => {
    if (removalInFlight.current) return;
    removalInFlight.current = true;
    const attempt = ++removalAttempt.current;
    const presented = new Promise<boolean>((resolve) => { presentationWaiter.current = { attempt, resolve }; });
    setRecoveryStatus("removing");
    setRemovalError(undefined);
    try {
      if (!await presented) {
        if (mounted.current && removalAttempt.current === attempt) setRecoveryStatus("base");
        return;
      }
      if (!mounted.current || removalAttempt.current !== attempt) return;
      await removeUnavailableEncryptedStorage();
      if (!mounted.current || removalAttempt.current !== attempt) return;
      setRecoveryStatus("success");
    } catch (error) {
      if (!mounted.current || removalAttempt.current !== attempt) return;
      setRemovalError(`[${operationalDiagnosticCode(error)}]`);
      setRecoveryStatus("error");
    } finally {
      if (removalAttempt.current === attempt) {
        if (presentationWaiter.current?.attempt === attempt) presentationWaiter.current = null;
        removalInFlight.current = false;
      }
    }
  };

  const lostKey = state.kind === "unavailable" && state.storageFailureCode === "encrypted_storage_key_missing";
  const activeRemovalAttempt = removalAttempt.current;
  const body = state.kind === "ready"
    ? <PreparedProfileStorageContext.Provider value={state.profile}>{children}</PreparedProfileStorageContext.Provider>
    : state.kind === "loading"
      ? <Screen edges={["top", "bottom"]}><LoadingState description={t("Opening local profile storage…")} showLogo testID="profile-storage-preparing" title={t("Preparing your profile…")} /></Screen>
      : lostKey
        ? <EncryptedStorageRecoverySurface
            error={removalError}
            onContinue={retry}
            onRemovingPresented={(presented) => {
              const waiter = presentationWaiter.current;
              if (waiter?.attempt !== activeRemovalAttempt || !mounted.current) return;
              presentationWaiter.current = null;
              waiter.resolve(presented);
            }}
            onRemove={() => { void removeUnavailableData(); }}
            canRetry={canStartManualRetry(manualRetry.current)}
            onRetryBootstrap={retryLostKeyPreparation}
            onReturn={() => { setRemovalError(undefined); setRecoveryStatus("base"); }}
            retryLimitReached={manualRetry.current.failedAttempts >= 5}
            status={recoveryStatus}
          />
        : <Screen><EmptyState actionLabel={t("Try again")} description={state.reason} onActionPress={retry} title={t("Profile storage unavailable")} /></Screen>;

  return <View style={{ backgroundColor: colors.background, flex: 1 }} testID={runtimeSelectors.content.unavailable()}>{body}</View>;
}
