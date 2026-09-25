import { useEffect, useRef, useState, type ReactNode } from "react";
import { Linking, View } from "react-native";
import { useTranslation } from "react-i18next";

import { EmptyState, LoadingState, Screen } from "../../components";
import { describeOperationalFailure, operationalDiagnosticCode } from "../../application/operationalDiagnostics";
import { useAppPreferences } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { encryptedStorageFailureCode } from "../../infrastructure/storage/encryptedStorageBootstrap";
import { inspectPreparedProfileState, prepareProfileStorage, removeUnavailableEncryptedStorage, type PreparedProfileState } from "../../storage/repositories/profileStorageRepository";
import { createNativeLocalLogoutControl, LocalLogoutControlError, type LocalLogoutControl, type LocalLogoutControlSnapshot } from "../../infrastructure/storage/localLogoutControl";
import { EncryptedStorageRecoverySurface, type EncryptedStorageRecoveryStatus } from "../../content/application/EncryptedStorageRecoverySurface";
import { canStartManualRetry, createManualRetryLimit, reserveManualRetry, settleManualRetry } from "../../content/application/manualRetryLimit";
import { PreparedProfileStorageContext } from "./profileStoragePreparationContext";
import { parseStorageRecoveryAuditCommand, type StorageRecoveryAuditPresentation } from "./storageRecoveryAuditCommand";
import { isPatternlySmokeRuntime } from "../../infrastructure/runtime/runtimeMode";

type PreparationState =
  | { kind: "loading" }
  | { kind: "ready"; profile: PreparedProfileState; logoutControl: LocalLogoutControl; logoutControlSnapshot: LocalLogoutControlSnapshot }
  | { kind: "unavailable"; reason: string; storageFailureCode?: string };

export function ProfileStoragePreparationGate({ children }: { children: ReactNode }) {
  const { colors } = useAppPreferences();
  const { t } = useTranslation("common");
  const [state, setState] = useState<PreparationState>({ kind: "loading" });
  const [revision, setRevision] = useState(0);
  const [recoveryStatus, setRecoveryStatus] = useState<EncryptedStorageRecoveryStatus>("base");
  const [removalError, setRemovalError] = useState<string | undefined>();
  const [auditPresentation, setAuditPresentation] = useState<StorageRecoveryAuditPresentation>();
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
    if (!__DEV__ || !isPatternlySmokeRuntime()) return;
    const apply = (url: string | null) => {
      const presentation = parseStorageRecoveryAuditCommand(url, { development: __DEV__, smoke: isPatternlySmokeRuntime() });
      if (!presentation) return;
      setRecoveryStatus("base");
      setRemovalError(undefined);
      setAuditPresentation(presentation);
      setState({
        kind: "unavailable",
        reason: "Development-only encrypted storage recovery presentation.",
        storageFailureCode: "encrypted_storage_key_missing",
      });
    };
    const subscription = Linking.addEventListener("url", ({ url }) => { apply(url); });
    return () => { subscription.remove(); };
  }, []);

  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    void Promise.resolve().then(() => {
      const logoutControl = createNativeLocalLogoutControl();
      return logoutControl.read().then((logoutControlSnapshot) => ({ logoutControl, logoutControlSnapshot }));
    }).then(({ logoutControl, logoutControlSnapshot }) => prepareProfileStorage().then(() => inspectPreparedProfileState()).then((profileState) => ({ profileState, logoutControl, logoutControlSnapshot }))).then(({ profileState, logoutControl, logoutControlSnapshot }) => {
      if (active) {
        settleManualRetry(manualRetry.current, true);
        setState({ kind: "ready", profile: profileState, logoutControl, logoutControlSnapshot });
      }
    }).catch((error: unknown) => {
      if (active) {
        settleManualRetry(manualRetry.current, false);
        const storageFailureCode = encryptedStorageFailureCode(error) ?? undefined;
        const reason = error instanceof LocalLogoutControlError
          ? t("We couldn't check the local sign-out state. Your account data remains closed. Try again.")
          : describeOperationalFailure(error, "Local profile storage could not be prepared.");
        setState({ kind: "unavailable", reason, ...(storageFailureCode ? { storageFailureCode } : {}) });
      }
    });
    return () => { active = false; };
  }, [revision]);

  const retry = () => {
    setAuditPresentation(undefined);
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
    ? <PreparedProfileStorageContext.Provider value={{ profile: state.profile, logoutControl: state.logoutControl, logoutControlSnapshot: state.logoutControlSnapshot }}>{children}</PreparedProfileStorageContext.Provider>
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
            canRetry={auditPresentation !== "retry-limit" && canStartManualRetry(manualRetry.current)}
            onRetryBootstrap={retryLostKeyPreparation}
            onReturn={() => { setRemovalError(undefined); setRecoveryStatus("base"); }}
            retryLimitReached={auditPresentation === "retry-limit" || manualRetry.current.failedAttempts >= 5}
            status={recoveryStatus}
          />
        : <Screen><EmptyState actionLabel={t("Try again")} description={state.reason} onActionPress={retry} title={t("Profile storage unavailable")} /></Screen>;

  return <View style={{ backgroundColor: colors.background, flex: 1 }} testID={runtimeSelectors.content.unavailable()}>{body}</View>;
}
