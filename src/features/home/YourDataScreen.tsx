import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { Button, Icon, IconTile, InfoBlock, ListRow, Screen, ScreenHeader, SettingsBottomSheet, SettingsGroup } from "../../components";
import { ROUTES } from "../../constants/routes";
import { readPublicLegalLinksFromRuntime } from "../../infrastructure/firebase/publicConfig";
import type { RootStackParamList } from "../../navigation";

type YourDataScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.YOUR_DATA>;
type ExportStatus = "authenticationRequired" | "sessionRevoked" | "offline" | "rateLimited" | "responseTooLarge" | "serverFailure" | "invalidResponse" | "sharingUnavailable" | "fileFailure" | "sharingFailed" | "cleanupFailed" | "supportUnavailable" | null;

export function YourDataScreen({ navigation }: YourDataScreenProps) {
  const { t } = useTranslation("data");
  const account = usePatternlyAccount();
  const publicLinks = useMemo(readPublicLegalLinksFromRuntime, []);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const activeRef = useRef(true);
  const [status, setStatus] = useState<ExportStatus>(null);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const authenticated = account.state.kind === "authenticated";
  const guest = account.state.kind === "guest";
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

  async function requestExport() {
    if (busyRef.current || remainingSeconds > 0 || !authenticated) return;
    busyRef.current = true;
    setBusy(true);
    setStatus(null);
    try {
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
        return;
      }
    } finally {
      busyRef.current = false;
      if (activeRef.current) setBusy(false);
    }
  }

  async function openPrivacySupport() {
    if (busyRef.current || !guest) return;
    if (publicLinks.kind !== "configured") { setStatus("supportUnavailable"); return; }
    busyRef.current = true;
    setBusy(true);
    setStatus(null);
    try {
      if (!(await Linking.canOpenURL(publicLinks.value.supportUrl))) { if (activeRef.current) setStatus("supportUnavailable"); return; }
      if (!activeRef.current) return;
      await Linking.openURL(publicLinks.value.supportUrl);
    } catch {
      if (activeRef.current) setStatus("supportUnavailable");
    } finally {
      busyRef.current = false;
      if (activeRef.current) setBusy(false);
    }
  }

  const actionTitle = authenticated ? t("export.title") : t("guest.title");
  const actionDetail = busy
    ? t("status.preparing")
    : remainingSeconds > 0
      ? t("status.rateLimited", { seconds: remainingSeconds })
      : authenticated ? t("export.summary") : t("guest.summary");
  const statusBody = status && !(status === "rateLimited" && remainingSeconds > 0) ? t(`status.${status}`) : null;

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
      <InfoBlock body={t(authenticated ? "infoBodyAuthenticated" : "infoBodyGuest")} icon={<Icon name="shield-check" size={18} />} title={t("infoTitle")} />
      <SettingsGroup title={t("rights.title")}>
        <ListRow
          accessibilityLabel={`${actionTitle}. ${actionDetail}`}
          accessibilityLiveRegion="polite"
          detail={actionDetail}
          disabled={busy || remainingSeconds > 0 || (!authenticated && !guest)}
          leading={<IconTile name={authenticated ? "database" : "mail"} size={32} tone="settings" />}
          onPress={() => { void (authenticated ? requestExport() : openPrivacySupport()); }}
          testID={authenticated ? "account-data-export" : "data-privacy-support"}
          title={actionTitle}
          variant="grouped"
        />
        {authenticated ? <ListRow detail={t("privacyRequests.entrySummary")} leading={<IconTile name="shield" size={32} tone="settings" />} onPress={() => navigation.navigate(ROUTES.PRIVACY_REQUESTS)} testID="privacy-requests-entry" title={t("privacyRequests.entryTitle")} variant="grouped" /> : null}
      </SettingsGroup>
      <Button onPress={() => setDetailsVisible(true)} testID="account-data-export-details" variant="ghost">{t("details.action")}</Button>
      {statusBody ? <InfoBlock accessibilityAlert body={statusBody} title={t("status.title")} tone="warning" testID={`account-data-export-${status}`} /> : null}
      <SettingsBottomSheet closeLabel={t("close")} intro={t(authenticated ? "details.accountIntro" : "details.guestIntro")} onClose={() => setDetailsVisible(false)} title={t("details.title")} visible={detailsVisible}>
        <InfoBlock body={t(authenticated ? "details.accountBody" : "details.guestBody")} title={t("details.scopeTitle")} />
      </SettingsBottomSheet>
    </Screen>
  );
}
