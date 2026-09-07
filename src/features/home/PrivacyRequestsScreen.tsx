import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { Button, ChoiceRow, Icon, IconTile, InfoBlock, ListRow, Screen, ScreenHeader, SettingsBottomSheet, SettingsGroup } from "../../components";
import { ROUTES } from "../../constants/routes";
import type { PrivacyRequestListItemDto, PrivacyRequestResponseDto, PrivacyRequestRightDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { radius, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRIVACY_REQUESTS>;
const RIGHTS: readonly PrivacyRequestRightDto[] = ["access", "rectification", "erasure", "restriction", "objection", "portability", "consent_withdrawal"];

export function PrivacyRequestsScreen({ navigation }: Props) {
  const { t } = useTranslation("data");
  const account = usePatternlyAccount();
  const styles = useThemedStyles(createStyles);
  const [items, setItems] = useState<readonly PrivacyRequestListItemDto[]>([]);
  const [selectedRight, setSelectedRight] = useState<PrivacyRequestRightDto>("access");
  const [narrative, setNarrative] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<PrivacyRequestResponseDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const mounted = useRef(true);
  const operationActive = useRef(false);

  const load = useCallback(async () => {
    const result = await account.listPrivacyRequests();
    if (!mounted.current) return;
    if (result.kind === "success") { setItems(result.value); setFailure(null); }
    else setFailure(t(`privacyRequests.failures.${result.failure}`));
  }, [account, t]);

  useEffect(() => { if (account.state.kind === "authenticated") void load(); }, [account.state.kind, load]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; operationActive.current = false; }; }, []);
  useEffect(() => { if (failure) AccessibilityInfo.announceForAccessibility(failure); }, [failure]);

  async function submit() {
    if (operationActive.current) return;
    operationActive.current = true;
    setBusy(true);
    setFailure(null);
    const result = await account.createPrivacyRequest(selectedRight, narrative.trim() || undefined);
    if (!mounted.current) return;
    operationActive.current = false;
    setBusy(false);
    if (result.kind === "failure") {
      if (result.failure === "recentAuthenticationRequired") navigation.navigate(ROUTES.ACCOUNT_SECURITY, { screen: "privacy" });
      setFailure(t(`privacyRequests.failures.${result.failure}`));
      return;
    }
    setItems((current) => [result.value, ...current.filter((item) => item.requestId !== result.value.requestId)]);
    setNarrative("");
    setFormVisible(false);
    AccessibilityInfo.announceForAccessibility(t("privacyRequests.created"));
  }

  async function openRequest(item: PrivacyRequestListItemDto) {
    if (operationActive.current) return;
    operationActive.current = true;
    setBusy(true);
    setFailure(null);
    const result = await account.readPrivacyRequest(item.requestId);
    if (!mounted.current) return;
    operationActive.current = false;
    setBusy(false);
    if (result.kind === "failure") {
      if (result.failure === "recentAuthenticationRequired") navigation.navigate(ROUTES.ACCOUNT_SECURITY, { screen: "privacy" });
      setFailure(t(`privacyRequests.failures.${result.failure}`));
      return;
    }
    setSelectedResponse(result.value);
  }

  if (account.state.kind !== "authenticated") {
    return <Screen edges={["top", "bottom"]}><ScreenHeader backAction={{ onPress: () => navigation.goBack() }} context={t("data")} contextTone="primary" title={t("privacyRequests.title")} /><InfoBlock body={t("privacyRequests.accountRequired")} icon={<Icon name="shield-check" size={18} />} title={t("privacyRequests.title")} /></Screen>;
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader backAction={{ onPress: () => navigation.goBack() }} context={t("data")} contextTone="primary" title={t("privacyRequests.title")} />
      <InfoBlock body={t("privacyRequests.summary")} icon={<Icon name="shield-check" size={18} />} title={t("privacyRequests.infoTitle")} />
      <Button onPress={() => setFormVisible(true)} testID="privacy-request-create">{t("privacyRequests.create")}</Button>
      <SettingsGroup title={t("privacyRequests.yourRequests")}>
        {items.length === 0 ? <ListRow detail={t("privacyRequests.emptyDetail")} leading={<IconTile name="mail" size={32} tone="settings" />} title={t("privacyRequests.empty")} variant="grouped" /> : items.map((item) => (
          <ListRow key={item.requestId} detail={`${t(`privacyRequests.status.${item.status}`)} · ${t("privacyRequests.deadline", { date: new Date(item.deadlineAt).toLocaleDateString() })}${item.extendedAt ? ` · ${t("privacyRequests.extended")}` : ""}`} leading={<IconTile name="database" size={32} tone="settings" />} onPress={() => { void openRequest(item); }} testID={`privacy-request-${item.requestId}`} title={t(`privacyRequests.rights.${item.right}`)} variant="grouped" />
        ))}
      </SettingsGroup>
      {failure ? <InfoBlock accessibilityAlert body={failure} title={t("privacyRequests.failureTitle")} tone="warning" /> : null}

      <SettingsBottomSheet closeLabel={t("close")} intro={t("privacyRequests.formIntro")} onClose={() => setFormVisible(false)} title={t("privacyRequests.create")} visible={formVisible}>
        <View accessibilityRole="radiogroup" style={styles.choices}>{RIGHTS.map((right) => <ChoiceRow detail={t(`privacyRequests.rightDetails.${right}`)} key={right} onPress={() => setSelectedRight(right)} selected={selectedRight === right} title={t(`privacyRequests.rights.${right}`)} />)}</View>
        <Text maxFontSizeMultiplier={2} style={styles.label}>{t("privacyRequests.narrativeLabel")}</Text>
        <TextInput accessibilityLabel={t("privacyRequests.narrativeLabel")} editable={!busy} maxLength={2000} multiline onChangeText={setNarrative} placeholder={t("privacyRequests.narrativePlaceholder")} placeholderTextColor={styles.placeholder.color as string} style={styles.input} testID="privacy-request-narrative" value={narrative} />
        <Button loading={busy} onPress={() => { void submit(); }} testID="privacy-request-submit">{t("privacyRequests.submit")}</Button>
      </SettingsBottomSheet>

      <SettingsBottomSheet closeLabel={t("close")} intro={selectedResponse ? t("privacyRequests.deadline", { date: new Date(selectedResponse.request.deadlineAt).toLocaleDateString() }) : ""} onClose={() => setSelectedResponse(null)} title={selectedResponse ? t(`privacyRequests.rights.${selectedResponse.request.right}`) : t("privacyRequests.title")} visible={selectedResponse !== null}>
        {selectedResponse?.request.extendedAt ? <InfoBlock body={selectedResponse.extensionReason ? t("privacyRequests.extensionReason", { reason: selectedResponse.extensionReason }) : t("privacyRequests.extensionNotice")} title={t("privacyRequests.extendedTitle")} tone="warning" /> : null}
        {selectedResponse ? <InfoBlock body={selectedResponse.response ?? t("privacyRequests.noResponse")} title={t(`privacyRequests.status.${selectedResponse.request.status}`)} {...(selectedResponse.request.status === "refused" ? { tone: "warning" as const } : {})} /> : null}
      </SettingsBottomSheet>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  choices: { gap: spacing.sm },
  label: { ...typography.small, color: palette.textSecondary },
  input: { ...typography.body, backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, color: palette.textPrimary, minHeight: 96, padding: spacing.md, textAlignVertical: "top" },
  placeholder: { color: palette.textMuted },
});
