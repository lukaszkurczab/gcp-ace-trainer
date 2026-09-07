import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { Button, Icon, IconTile, InfoBlock, ListRow, Screen, ScreenHeader, SettingsBottomSheet, SettingsGroup } from "../../components";
import { ROUTES } from "../../constants/routes";
import type { LegalRequestDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { radius, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.LEGAL_REQUESTS>;

export function LegalRequestsScreen({ navigation, route }: Props) {
  const { t } = useTranslation("legal");
  const account = usePatternlyAccount();
  const styles = useThemedStyles(createStyles);
  const kind = route.params.kind;
  const [items, setItems] = useState<readonly LegalRequestDto[]>([]);
  const [narrative, setNarrative] = useState("");
  const [email, setEmail] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LegalRequestDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const mounted = useRef(true);
  const operationActive = useRef(false);

  const load = useCallback(async () => {
    const result = await account.listLegalRequests();
    if (!mounted.current) return;
    if (result.kind === "success") { setItems(result.value.filter((item) => item.kind === kind)); setFailure(null); }
    else setFailure(t(`legalRequests.failures.${result.failure}`));
  }, [account, kind, t]);

  useEffect(() => { if (account.state.kind === "authenticated") void load(); }, [account.state.kind, load]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; operationActive.current = false; }; }, []);
  useEffect(() => { if (failure) AccessibilityInfo.announceForAccessibility(failure); }, [failure]);

  async function submit() {
    if (operationActive.current) return;
    const trimmedNarrative = narrative.trim();
    if (kind !== "withdrawal" && !trimmedNarrative) {
      setFailure(t("legalRequests.narrativeRequired"));
      return;
    }
    if (account.state.kind !== "authenticated" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email.trim())) {
      setFailure(t("legalRequests.emailRequired"));
      return;
    }
    operationActive.current = true;
    setBusy(true);
    setFailure(null);
    const request = { kind, ...(trimmedNarrative ? { narrative: trimmedNarrative } : {}), ...(transactionId.trim() ? { transactionId: transactionId.trim() } : {}) };
    const result = account.state.kind === "authenticated"
      ? await account.createLegalRequest(request)
      : await account.createPublicLegalRequest({ ...request, email: email.trim() });
    if (!mounted.current) return;
    operationActive.current = false;
    setBusy(false);
    if (result.kind === "failure") { setFailure(t(`legalRequests.failures.${result.failure}`)); return; }
    setItems((current) => [result.value, ...current.filter((item) => item.requestId !== result.value.requestId)]);
    setNarrative("");
    setEmail("");
    setTransactionId("");
    setFormVisible(false);
    AccessibilityInfo.announceForAccessibility(t("legalRequests.created"));
  }

  async function openRequest(item: LegalRequestDto) {
    if (operationActive.current) return;
    operationActive.current = true;
    setBusy(true);
    setFailure(null);
    const result = await account.readLegalRequest(item.requestId);
    if (!mounted.current) return;
    operationActive.current = false;
    setBusy(false);
    if (result.kind === "failure") { setFailure(t(`legalRequests.failures.${result.failure}`)); return; }
    setSelectedRequest(result.value);
  }

  const title = t(`legalRequests.kinds.${kind}.title`);
  const isAuthenticated = account.state.kind === "authenticated";

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader backAction={{ onPress: () => navigation.goBack() }} context={t("settings")} contextTone="primary" title={title} />
      <InfoBlock body={isAuthenticated ? t(`legalRequests.kinds.${kind}.intro`) : t("legalRequests.guestIntro")} icon={<Icon name="shield-check" size={18} />} title={title} />
      <Button onPress={() => setFormVisible(true)} testID={`legal-request-create-${kind}`}>{t("legalRequests.create")}</Button>
      {isAuthenticated ? <SettingsGroup title={t("legalRequests.yourRequests")}>
        {items.length === 0 ? <ListRow detail={t("legalRequests.emptyDetail")} leading={<IconTile name="mail" size={32} tone="settings" />} title={t("legalRequests.empty")} variant="grouped" /> : items.map((item) => <ListRow detail={`${t(`legalRequests.status.${item.status}`)} · ${t("legalRequests.received", { date: new Date(item.receivedAt).toLocaleDateString() })}`} key={item.requestId} leading={<IconTile name="shield-check" size={32} tone="settings" />} onPress={() => { void openRequest(item); }} testID={`legal-request-${item.requestId}`} title={title} variant="grouped" />)}
      </SettingsGroup> : null}
      {failure ? <InfoBlock accessibilityAlert body={failure} title={t("legalRequests.failureTitle")} tone="warning" /> : null}

      <SettingsBottomSheet closeLabel={t("close")} intro={t(`legalRequests.kinds.${kind}.formIntro`)} onClose={() => setFormVisible(false)} title={title} visible={formVisible}>
        {isAuthenticated ? null : <View style={styles.field}><Text maxFontSizeMultiplier={2} style={styles.label}>{t("legalRequests.emailLabel")}</Text><TextInput accessibilityLabel={t("legalRequests.emailLabel")} autoCapitalize="none" autoComplete="email" editable={!busy} keyboardType="email-address" onChangeText={setEmail} placeholder={t("legalRequests.emailPlaceholder")} placeholderTextColor={styles.placeholder.color as string} style={styles.singleLineInput} testID="legal-request-email" value={email} /></View>}
        <Text maxFontSizeMultiplier={2} style={styles.label}>{t(kind === "withdrawal" ? "legalRequests.narrativeOptionalLabel" : "legalRequests.narrativeLabel")}</Text>
        <TextInput accessibilityLabel={t("legalRequests.narrativeLabel")} editable={!busy} maxLength={2000} multiline onChangeText={setNarrative} placeholder={t("legalRequests.narrativePlaceholder")} placeholderTextColor={styles.placeholder.color as string} style={styles.input} testID="legal-request-narrative" value={narrative} />
        {kind === "withdrawal" ? <View style={styles.field}><Text maxFontSizeMultiplier={2} style={styles.label}>{t("legalRequests.transactionIdLabel")}</Text><TextInput accessibilityLabel={t("legalRequests.transactionIdLabel")} editable={!busy} maxLength={160} onChangeText={setTransactionId} placeholder={t("legalRequests.transactionIdPlaceholder")} placeholderTextColor={styles.placeholder.color as string} style={styles.singleLineInput} testID="legal-request-transaction-id" value={transactionId} /></View> : null}
        <Button loading={busy} onPress={() => { void submit(); }} testID="legal-request-submit">{t("legalRequests.submit")}</Button>
      </SettingsBottomSheet>

      <SettingsBottomSheet closeLabel={t("close")} intro={selectedRequest?.responseDueAt ? t("legalRequests.responseDue", { date: new Date(selectedRequest.responseDueAt).toLocaleDateString() }) : t("legalRequests.noResponseDue")} onClose={() => setSelectedRequest(null)} title={title} visible={selectedRequest !== null}>
        {selectedRequest ? <InfoBlock body={selectedRequest.response ?? t("legalRequests.noResponse")} title={t(`legalRequests.status.${selectedRequest.status}`)} /> : null}
      </SettingsBottomSheet>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  field: { gap: spacing.xs },
  input: { ...typography.body, backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, color: palette.textPrimary, minHeight: 96, padding: spacing.md, textAlignVertical: "top" },
  label: { ...typography.small, color: palette.textSecondary },
  placeholder: { color: palette.textMuted },
  singleLineInput: { ...typography.body, backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, color: palette.textPrimary, minHeight: 48, paddingHorizontal: spacing.md },
});
