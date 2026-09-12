import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { Button, Icon, IconTile, InfoBlock, ListRow, Screen, ScreenHeader, SettingsBottomSheet, SettingsGroup } from "../../components";
import { ROUTES } from "../../constants/routes";
import { readPublicLegalLinksFromRuntime } from "../../infrastructure/firebase/publicConfig";
import type { RootStackParamList } from "../../navigation";
import { getYourDataPresentation, type YourDataActionKind } from "./yourDataPresentation";

type YourDataScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.YOUR_DATA>;
type ExportStatus = "authenticationRequired" | "sessionRevoked" | "offline" | "rateLimited" | "responseTooLarge" | "serverFailure" | "invalidResponse" | "sharingUnavailable" | "fileFailure" | "sharingFailed" | "cleanupFailed" | "supportUnavailable" | "actionFailed" | null;

export function YourDataScreen({ navigation }: YourDataScreenProps) {
  const { t } = useTranslation("data");
  const account = usePatternlyAccount();
  const publicLinks = useMemo(readPublicLegalLinksFromRuntime, []);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [localResetVisible, setLocalResetVisible] = useState(false);
  const [localResetBusy, setLocalResetBusy] = useState(false);
  const localResetBusyRef = useRef(false);
  const [localResetStatus, setLocalResetStatus] = useState<"success" | "error" | null>(null);
  const activeRef = useRef(true);
  const [status, setStatus] = useState<ExportStatus>(null);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const presentation = getYourDataPresentation(account.state);
  const remainingSeconds = retryUntil === null ? 0 : Math.max(0, Math.ceil((retryUntil - now) / 1000));

  useEffect(() => {
    activeRef.current = true;
    return () => { activeRef.current = false; };
  }, []);

  useEffect(() => {
    if (retryUntil === null) return;
    if (remainingSeconds <= 0) { setRetryUntil(null); setStatus(null); return; }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds, retryUntil]);

  async function runAction(action: Exclude<YourDataActionKind, "none" | "openAccount">) {
    if (busyRef.current || !activeRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setStatus(null);
    try {
      if (action === "export") {
        if (remainingSeconds > 0 || account.state.kind !== "authenticated") return;
        const result = await account.exportAccountData(() => activeRef.current);
        if (!activeRef.current) return;
        if (result.kind === "failure") {
          if (result.failure === "rateLimited" && result.retryAfterSeconds) {
            const timestamp = Date.now();
            setNow(timestamp);
            setRetryUntil(timestamp + result.retryAfterSeconds * 1000);
          }
          setStatus(result.failure);
          if (result.failure === "authenticationRequired") navigation.navigate(ROUTES.ACCOUNT_SECURITY, { screen: "export" });
        }
        return;
      }
      if (action === "guestSupport") {
        if (account.state.kind !== "guest") return;
        if (publicLinks.kind !== "configured") { setStatus("supportUnavailable"); return; }
        if (!(await Linking.canOpenURL(publicLinks.value.supportUrl))) { if (activeRef.current) setStatus("supportUnavailable"); return; }
        if (!activeRef.current) return;
        await Linking.openURL(publicLinks.value.supportUrl);
        return;
      }
      if (action === "retryRestore") {
        account.retrySessionRestore();
        return;
      }
      const result = action === "retryDeletion"
        ? await account.retryPendingDeletion()
        : action === "retryIdentity"
          ? await account.refreshAccountIdentity()
          : await account.signOut();
      if (activeRef.current && result.kind === "failure") setStatus("actionFailed");
    } catch {
      if (activeRef.current) setStatus(action === "guestSupport" ? "supportUnavailable" : "actionFailed");
    } finally {
      busyRef.current = false;
      if (activeRef.current) setBusy(false);
    }
  }

  function handleAction(action: YourDataActionKind): void {
    if (action === "none") return;
    if (action === "openAccount") { navigation.navigate(ROUTES.ACCOUNT_ENTRY); return; }
    void runAction(action);
  }

  function openLocalReset(): void {
    if (localResetBusyRef.current) return;
    setLocalResetStatus(null);
    setLocalResetVisible(true);
  }

  function closeLocalReset(): void {
    if (localResetBusyRef.current) return;
    setLocalResetVisible(false);
    setLocalResetStatus(null);
  }

  async function confirmLocalReset(): Promise<void> {
    if (localResetBusyRef.current || !activeRef.current || presentation.reset === null) return;
    localResetBusyRef.current = true;
    setLocalResetBusy(true);
    setLocalResetStatus(null);
    try {
      const result = await account.resetLocalLearningHistory();
      if (!activeRef.current) return;
      setLocalResetStatus(result.kind === "success" ? "success" : "error");
    } catch {
      if (activeRef.current) setLocalResetStatus("error");
    } finally {
      localResetBusyRef.current = false;
      if (activeRef.current) setLocalResetBusy(false);
    }
  }

  const actionTitle = t(`actions.${presentation.action.kind}.title`);
  const actionDetail = busy
    ? t("status.preparing")
    : presentation.action.kind === "export" && remainingSeconds > 0
      ? t("status.rateLimited", { seconds: remainingSeconds })
      : t(`actions.${presentation.action.kind}.summary`);
  const statusBody = status && !(status === "rateLimited" && remainingSeconds > 0) ? t(`status.${status}`) : null;
  const statusTestID = status === "actionFailed" ? "your-data-action-error" : status ? `account-data-export-${status}` : undefined;

  useEffect(() => {
    const announcement = busy ? t("status.preparing") : status === "rateLimited" && remainingSeconds > 0
      ? t("status.rateLimited", { seconds: remainingSeconds })
      : statusBody;
    if (announcement) AccessibilityInfo.announceForAccessibility(announcement);
    // Announce a rate limit once when the state changes, not on every countdown tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, status]);

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader backAction={{ onPress: () => navigation.goBack() }} context={t("settings")} contextTone="primary" title={t("yourData")} />
      <InfoBlock body={t(`state.${presentation.stateCopy}.body`)} icon={<Icon name="shield-check" size={18} />} title={t(`state.${presentation.stateCopy}.title`)} />
      <SettingsGroup title={t("rights.title")}>
        {presentation.action.kind === "none" ? <ListRow
          detail={actionDetail}
          disabled
          leading={<IconTile name={presentation.action.icon} size={32} tone="settings" />}
          title={actionTitle}
          variant="grouped"
        /> : <ListRow
          accessibilityLabel={`${actionTitle}. ${actionDetail}`}
          accessibilityLiveRegion="polite"
          detail={actionDetail}
          disabled={busy || (presentation.action.kind === "export" && remainingSeconds > 0)}
          leading={<IconTile name={presentation.action.icon} size={32} tone="settings" />}
          onPress={() => handleAction(presentation.action.kind)}
          testID={presentation.action.testID}
          title={actionTitle}
          variant="grouped"
        />}
        {presentation.privacyRequests ? <ListRow detail={t("privacyRequests.entrySummary")} leading={<IconTile name="shield" size={32} tone="settings" />} onPress={() => navigation.navigate(ROUTES.PRIVACY_REQUESTS)} testID="privacy-requests-entry" title={t("privacyRequests.entryTitle")} variant="grouped" /> : null}
        {presentation.reset ? <ListRow
          accessibilityLabel={`${t("localReset.entryTitle")}. ${t("localReset.entrySummary")}`}
          accessibilityLiveRegion="polite"
          detail={t("localReset.entrySummary")}
          disabled={busy || localResetBusy}
          leading={<IconTile name={presentation.reset.icon} size={32} tone="settings" />}
          onPress={openLocalReset}
          testID="data-local-reset"
          title={t("localReset.entryTitle")}
          variant="grouped"
        /> : null}
      </SettingsGroup>
      {presentation.details !== "none" ? <Button disabled={busy} onPress={() => setDetailsVisible(true)} testID={presentation.details === "account" ? "account-data-export-details" : "data-guest-details"} variant="ghost">{t("details.action")}</Button> : null}
      {statusBody ? <InfoBlock accessibilityAlert body={statusBody} title={t("status.title")} tone="warning" testID={statusTestID} /> : null}
      {presentation.details !== "none" ? <SettingsBottomSheet closeLabel={t("close")} intro={t(`details.${presentation.details}Intro`)} onClose={() => setDetailsVisible(false)} title={t("details.title")} visible={detailsVisible}>
        <InfoBlock body={t(`details.${presentation.details}Body`)} title={t("details.scopeTitle")} />
      </SettingsBottomSheet> : null}
      {presentation.reset ? <SettingsBottomSheet closeLabel={t("localReset.cancel")} intro={t("localReset.intro")} onClose={closeLocalReset} title={t("localReset.title")} visible={localResetVisible}>
        <InfoBlock body={t("localReset.scopeBody")} testID="data-local-reset-scope" title={t("localReset.scopeTitle")} />
        <InfoBlock body={t("localReset.confirmationBody")} testID="data-local-reset-confirmation" title={t("localReset.confirmationTitle")} />
        {localResetBusy ? <InfoBlock body={t("localReset.runningBody")} testID="data-local-reset-running" title={t("localReset.runningTitle")} tone="neutral" /> : null}
        {localResetStatus === "success" ? <InfoBlock body={t("localReset.successBody")} testID="data-local-reset-success" title={t("localReset.successTitle")} tone="success" /> : null}
        {localResetStatus === "error" ? <InfoBlock accessibilityAlert body={t("localReset.errorBody")} testID="data-local-reset-error" title={t("localReset.errorTitle")} tone="warning" /> : null}
        <Button disabled={localResetBusy} onPress={closeLocalReset} testID="data-local-reset-cancel" variant="secondary">{t("localReset.cancel")}</Button>
        <Button disabled={localResetBusy} loading={localResetBusy} onPress={() => { void confirmLocalReset(); }} testID="data-local-reset-confirm" variant="destructive">{t("localReset.confirm")}</Button>
      </SettingsBottomSheet> : null}
    </Screen>
  );
}
