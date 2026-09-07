import { useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { readContentReportTransport, retryContentReport, submitContentReportFromConfiguredRuntime } from "../../application/contentReports";
import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { CONTENT_REPORT_DESCRIPTION_MAX_LENGTH, contentReportDescriptionIssue, type ContentItemRef, type ContentReportInput, type ContentReportModeRoute, type ContentReportOutboxEntry, type ContentReportReason } from "../../domain";
import { Button } from "../../components";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";

export type ContentReportSurfaceContext = Readonly<{ modeRoute: ContentReportModeRoute; trackNode: string | null }>;

const REASON_LABELS: Readonly<Record<ContentReportReason, string>> = {
  incorrect_answer: "Incorrect answer",
  unclear_explanation: "Unclear explanation",
  outdated_content: "Outdated content",
  technical_issue: "Technical issue",
  other: "Other",
};

export function ContentReportSheet({ item, surface }: Readonly<{ item: ContentItemRef; surface: ContentReportSurfaceContext }>) {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const account = usePatternlyAccount();
  const { locale } = useAppPreferences();
  const { t } = useTranslation("common");
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState<ContentReportReason>("unclear_explanation");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [entry, setEntry] = useState<ContentReportOutboxEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : null;
  const reasonOptions = useMemo(() => Object.keys(REASON_LABELS) as ContentReportReason[], []);

  function open() {
    setError(null);
    setDetailsVisible(false);
    setVisible(true);
  }

  function close() {
    if (!pending) setVisible(false);
  }

  async function submit() {
    const descriptionIssue = contentReportDescriptionIssue(description);
    if (descriptionIssue === "private_data") {
      setError(t("Remove private information: an email address, phone number, link, password, or code."));
      return;
    }
    if (descriptionIssue === "too_long") {
      setError(t("Keep the extra details within 280 characters."));
      return;
    }
    if (!platform) {
      setError(t("Reporting is unavailable on this platform."));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await submitContentReportFromConfiguredRuntime(buildInput(item, surface, reason, description, locale, platform));
      setEntry(result.entry);
      if (result.status === "accepted") setDescription("");
    } catch (cause) {
      setError(describeOperationalFailure(cause, t("The report could not be saved locally.")));
    } finally {
      setPending(false);
    }
  }

  async function retry() {
    if (!entry) return;
    setPending(true);
    setError(null);
    try {
      const runtime = readContentReportTransport();
      const result = await retryContentReport(entry.input.clientSubmissionId, runtime.kind === "available" ? runtime.transport : undefined);
      setEntry(result.entry);
    } catch (cause) {
      setError(describeOperationalFailure(cause, t("The report could not be retried.")));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button onPress={open} style={styles.trigger} testID={`content-report-open-${item.itemId}`} variant="ghost">{t("Report an issue")}</Button>
      <Modal accessibilityViewIsModal animationType="slide" onRequestClose={close} transparent visible={visible}>
        <View style={styles.backdrop}>
          <Pressable accessibilityLabel={t("Close report form")} accessibilityRole="button" onPress={close} style={styles.dismissArea} />
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text maxFontSizeMultiplier={2} style={styles.title}>{t("Report a content issue")}</Text>
              {account.state.kind === "guest" ? (
                <View style={styles.guestNotice} testID="content-report-guest-notice">
                  <Text maxFontSizeMultiplier={2} style={styles.description}>{t("We send the issue category, an optional note, and technical details about the question so Patternly can improve it.")}</Text>
                  <Text maxFontSizeMultiplier={2} style={styles.warning}>{t("Do not enter your answer or private information, such as an email, phone number, or password.")}</Text>
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsVisible }} onPress={() => setDetailsVisible((current) => !current)} testID="content-report-details-toggle">
                    <Text maxFontSizeMultiplier={2} style={styles.detailsAction}>{t(detailsVisible ? "Hide details" : "Show details")}</Text>
                  </Pressable>
                  {detailsVisible ? (
                    <View style={styles.detailsBlock} testID="content-report-details">
                      <Text maxFontSizeMultiplier={2} style={styles.details}>{t("We send the issue category, a note only if you write one, a random report ID, the question ID and version, screen, language, app version, platform, report time, and an app security token. We do not automatically add your account, contact details, or answer. Your connection gives the server an IP address; the server turns it into a code used only to limit repeated reports. Do not enter your name, address, email, phone number, password, code, or link.")}</Text>
                      <Pressable accessibilityRole="link" onPress={() => { setVisible(false); navigation.navigate(ROUTES.PRIVACY_POLICY); }} testID="content-report-privacy-policy-link">
                        <Text maxFontSizeMultiplier={2} style={styles.detailsAction}>{t("Privacy Policy")}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ) : <Text maxFontSizeMultiplier={2} style={styles.description}>{t("Tell us what is wrong. Your answer and the full explanation are not sent automatically.")}</Text>}
              <Text maxFontSizeMultiplier={2} style={styles.label}>{t("Category")}</Text>
              <View style={styles.reasons}>
                {reasonOptions.map((option) => (
                  <Pressable accessibilityRole="radio" accessibilityState={{ selected: reason === option }} key={option} onPress={() => setReason(option)} style={[styles.reasonOption, reason === option ? styles.reasonOptionSelected : null]}>
                    <Text maxFontSizeMultiplier={2} style={styles.reasonOptionText}>{t(REASON_LABELS[option])}</Text>
                  </Pressable>
                ))}
              </View>
              <Text maxFontSizeMultiplier={2} style={styles.label}>{t("Extra details (optional)")}</Text>
              <TextInput accessibilityLabel={t("Report description")} editable={!pending} maxLength={CONTENT_REPORT_DESCRIPTION_MAX_LENGTH} multiline onChangeText={setDescription} placeholder={t("Write only what is wrong with this question.")} placeholderTextColor={styles.placeholder.color as string} style={styles.input} testID={`content-report-input-${item.itemId}`} value={description} />
              <Text maxFontSizeMultiplier={2} style={styles.privacy}>{t("Do not include private information or your answer.")}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.privacy}>{t("By default, we do not link reports to your account or contact details.")}</Text>
              {entry ? <ReportStatus entry={entry} /> : null}
              {error ? <Text accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.error}>{error}</Text> : null}
              <Button disabled={pending} loading={pending} onPress={() => void submit()} testID={`content-report-submit-${item.itemId}`}>{t("Send report")}</Button>
              {entry?.status === "failed" ? <Button disabled={pending} onPress={() => void retry()} variant="secondary">{t("Retry report")}</Button> : null}
              <Button disabled={pending} onPress={close} variant="ghost">{t("Cancel")}</Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ReportStatus({ entry }: Readonly<{ entry: ContentReportOutboxEntry }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const message = entry.status === "accepted"
    ? t("Report accepted. Thank you.")
    : entry.status === "queued"
      ? t("Your report is saved on this device. Sending is currently unavailable.")
      : entry.status === "retrying"
        ? t("Retrying report…")
        : t("Report was not accepted. You can retry it.");
  return <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={2} style={entry.status === "accepted" ? styles.statusAccepted : styles.statusPending}>{message}</Text>;
}

function buildInput(item: ContentItemRef, surface: ContentReportSurfaceContext, reason: ContentReportReason, description: string, locale: "en" | "pl", platform: "ios" | "android"): Omit<ContentReportInput, "clientSubmissionId"> {
  return {
    trackId: item.trackId,
    contentVersion: item.contentVersion,
    itemId: item.itemId,
    reason,
    description: description.trim(),
    context: {
      releasePackageId: item.packagePin.contentReleaseId,
      trackNode: surface.trackNode,
      modeRoute: surface.modeRoute,
      locale,
      appBuild: "0.1.0",
      platform,
      occurredAt: new Date().toISOString(),
    },
  };
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  backdrop: { backgroundColor: palette.effects.scrim, flex: 1, justifyContent: "flex-end" },
  content: { gap: spacing.lg, paddingBottom: spacing.xxxl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  description: { ...typography.body, color: palette.textSecondary },
  details: { ...typography.caption, color: palette.textSecondary },
  detailsBlock: { gap: spacing.sm },
  detailsAction: { ...typography.bodyStrong, color: palette.primary },
  dismissArea: { flex: 1 },
  error: { color: palette.danger, ...typography.body },
  guestNotice: { gap: spacing.sm },
  input: { backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, color: palette.textPrimary, minHeight: 120, padding: spacing.md, textAlignVertical: "top", ...typography.body },
  label: { ...typography.bodyStrong, color: palette.textPrimary },
  placeholder: { color: palette.textMuted },
  privacy: { ...typography.caption, color: palette.textMuted },
  reasonOption: { borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md },
  reasonOptionSelected: { backgroundColor: palette.effects.ghostPressed, borderColor: palette.primary },
  reasonOptionText: { ...typography.body, color: palette.textPrimary },
  reasons: { gap: spacing.sm },
  sheet: { backgroundColor: palette.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: "92%" },
  statusAccepted: { ...typography.body, color: palette.success },
  statusPending: { ...typography.body, color: palette.textSecondary },
  title: { ...typography.title, color: palette.textPrimary },
  trigger: { alignSelf: "flex-start", marginTop: spacing.sm, paddingHorizontal: 0 },
  warning: { ...typography.bodyStrong, color: palette.textPrimary },
});
