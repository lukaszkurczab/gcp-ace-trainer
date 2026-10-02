import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button, InfoBlock } from "../../components";
import type { RecoveryOperationSnapshot } from "../../application/account/recoveryOperationCoordinator";
import { recoveryCodeClipboard } from "../../infrastructure/security/recoveryCodeClipboard";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { getRecoveryOperationPresentation } from "./recoveryOperationPresentation";

export function RecoveryOperationPanel({
  busy,
  onConfirmSaved,
  onDefer,
  onResume,
  onReplace,
  onRetry,
  snapshot,
}: Readonly<{
  busy: boolean;
  onConfirmSaved: () => void;
  onDefer?: () => void;
  onResume: () => void;
  onReplace: () => void;
  onRetry: () => void;
  snapshot: RecoveryOperationSnapshot;
}>) {
  const { t } = useTranslation("account");
  const styles = useThemedStyles(createStyles);
  const appStateRef = useRef(AppState.currentState);
  const lastIssueOperationIdRef = useRef<string | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [codesVisible, setCodesVisible] = useState(() => AppState.currentState === "active");
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "failed">("idle");
  const presentation = getRecoveryOperationPresentation(snapshot);
  const operationId = snapshot.kind === "issue" ? snapshot.operationId : null;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      setAppState(nextState);
      if (nextState !== "active") setCodesVisible(false);
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    setCopyState("idle");
    if (operationId !== null && lastIssueOperationIdRef.current !== operationId) {
      lastIssueOperationIdRef.current = operationId;
      setCodesVisible(appStateRef.current === "active");
    }
  }, [operationId]);
  if (snapshot.kind === "idle") return null;

  const statusCopy = snapshot.kind === "consume"
    ? t(`recoveryOperationConsumeStatus.${snapshot.status}`, { keySeparator: "." })
    : snapshot.kind === "issue" || snapshot.kind === "terminal"
    ? t(`recoveryOperationStatus.${snapshot.status}`, { keySeparator: "." })
    : snapshot.kind === "loading"
      ? t("recoveryOperationLoading")
      : t(`recoveryOperationUnavailable.${snapshot.reason}`, { keySeparator: "." });
  const failure = snapshot.kind === "issue" || snapshot.kind === "consume" ? snapshot.failure : null;
  const failureCopy = failure ? t(`recoveryOperationFailure.${failure}`, { keySeparator: "." }) : null;
  const mismatchCopy = snapshot.kind === "issue" && snapshot.accountResolution !== "different_uid" && snapshot.accountResolution !== "different_generation"
    ? t("recoveryOperationGenerationMissingDescription")
    : t(presentation.resumeKind === "issue" ? "recoveryOperationIssueMismatchDescription" : "recoveryOperationMismatchDescription");

  return (
    <View style={styles.panel} testID="recovery-operation-panel">
      {snapshot.kind === "issue" && snapshot.status === "delivery_unconfirmed" ? <InfoBlock accessibilityAlert body={t("recoveryOperationDeliveryUnconfirmed")} title={t("recoveryCodes")} tone="warning" testID="recovery-operation-delivery-unconfirmed" /> : null}
      {presentation.resumeKind && presentation.resumeKind !== "terminal" ? <InfoBlock accessibilityAlert body={mismatchCopy} title={t("recoveryOperationMismatchTitle")} tone="warning" testID="recovery-operation-mismatch" /> : null}
      {presentation.deferred ? <InfoBlock accessibilityAlert body={t("recoveryOperationDeferredDescription")} title={t("recoveryOperationDeferredTitle")} tone="warning" testID="recovery-operation-deferred" /> : null}
      {snapshot.kind === "loading" || snapshot.kind === "unavailable" ? <InfoBlock accessibilityAlert body={statusCopy} title={t("recoveryOperationUnavailableTitle")} tone="warning" testID="recovery-operation-unavailable" /> : null}
      {snapshot.kind === "issue" && !presentation.showCodes && !presentation.savedAcknowledgementPending && snapshot.status !== "delivery_unconfirmed" && snapshot.status !== "acknowledged" && snapshot.status !== "superseded" && snapshot.status !== "expired_or_invalid" && !snapshot.needsAccountResolution ? <InfoBlock body={statusCopy} title={t("recoveryCodes")} testID="recovery-operation-status" /> : null}
      {snapshot.kind === "terminal" ? <InfoBlock accessibilityAlert body={statusCopy} title={t("recoveryCodes")} tone={snapshot.status === "acknowledged" ? "success" : "warning"} testID="recovery-operation-terminal" /> : null}
      {snapshot.kind === "issue" && (snapshot.status === "acknowledged" || snapshot.status === "superseded" || snapshot.status === "expired_or_invalid") ? <InfoBlock accessibilityAlert body={statusCopy} title={t("recoveryCodes")} tone={snapshot.status === "acknowledged" ? "success" : "warning"} testID="recovery-operation-terminal" /> : null}
      {snapshot.kind === "consume" && !snapshot.needsAccountResolution ? <InfoBlock accessibilityAlert body={statusCopy} title={t("recoveryOperationPendingTitle")} testID="recovery-operation-pending" /> : null}
      {failureCopy ? <InfoBlock accessibilityAlert body={failureCopy} title={t("recoveryOperationActionNeeded")} tone="warning" testID={`recovery-operation-error-${failure}`} /> : null}
      {presentation.savedAcknowledgementPending ? <InfoBlock body={t("recoveryOperationSavedAckPending")} title={t("recoveryCodes")} testID="recovery-operation-saved-ack-pending" /> : null}
      {presentation.showCodes && snapshot.kind === "issue" && snapshot.codes && appState === "active" && !codesVisible ? <View style={styles.hiddenCodes} testID="recovery-operation-codes-hidden">
        <Text style={styles.body}>{t("recoveryOperationCodesHidden")}</Text>
        <Button onPress={() => setCodesVisible(true)} testID="recovery-operation-show-codes" variant="secondary">{t("recoveryOperationCodesShow")}</Button>
      </View> : null}
      {presentation.showCodes && snapshot.kind === "issue" && snapshot.codes && appState === "active" && codesVisible ? <View testID="recovery-operation-codes">
        <Text selectable style={styles.codes}>{snapshot.codes.join("\n")}</Text>
        <Text style={styles.body}>{t("recoveryCodesClipboardWarning")}</Text>
        <Button disabled={busy || copyState === "copying"} loading={copyState === "copying"} onPress={() => {
          const codes = snapshot.codes;
          if (codes) {
            setCopyState("copying");
            void recoveryCodeClipboard.copy(codes).then(() => setCopyState("copied")).catch(() => setCopyState("failed"));
          }
        }} testID="recovery-operation-copy-codes" variant="secondary">{copyState === "copied" ? t("recoveryCodesCopied") : t("copyRecoveryCodes")}</Button>
        {copyState === "failed" ? <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.error} testID="recovery-operation-copy-error">{t("recoveryCodesCopyFailed")}</Text> : null}
        {!snapshot.savedIntent ? <Text style={styles.body} testID="recovery-operation-save-required">{t("recoveryCodesSaveRequired")}</Text> : null}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: snapshot.savedIntent, disabled: busy || snapshot.savedIntent }}
          disabled={busy || snapshot.savedIntent}
          onPress={onConfirmSaved}
          style={styles.savedRow}
          testID="recovery-operation-saved-ack"
        >
          <View style={[styles.checkbox, snapshot.savedIntent ? styles.checkboxChecked : null]}>{snapshot.savedIntent ? <Text style={styles.checkmark}>✓</Text> : null}</View>
          <Text style={styles.body}>{t(snapshot.savedIntent ? "recoveryOperationSavedAckPending" : "recoveryCodesSaved")}</Text>
        </Pressable>
      </View> : null}
      {presentation.showRetry ? <Button disabled={busy} loading={busy} onPress={onRetry} testID="recovery-operation-retry" variant="secondary">{t(presentation.savedAcknowledgementPending ? "recoveryOperationRetryAck" : "recoveryOperationRetry")}</Button> : null}
      {presentation.showResume ? <Button disabled={busy} loading={busy} onPress={onResume} testID="recovery-operation-resume" variant="primary">{t(presentation.resumeKind === "issue" ? "recoveryOperationResumeIssue" : presentation.resumeKind === "terminal" ? "recoveryOperationContinue" : "recoveryOperationResume")}</Button> : null}
      {presentation.showDefer && onDefer ? <Button disabled={busy} loading={busy} onPress={onDefer} testID="recovery-operation-continue-current" variant="secondary">{t("recoveryOperationContinueCurrent")}</Button> : null}
      {snapshot.kind === "issue" && !presentation.deferred && !snapshot.needsAccountResolution && (snapshot.status === "delivery_unconfirmed" || snapshot.replacementPending) ? <Button disabled={busy} loading={busy} onPress={() => Alert.alert(t("recoveryOperationReplaceTitle"), t("recoveryOperationReplaceDescription"), [
        { text: t("recoveryOperationReplaceCancel"), style: "cancel" },
        { text: t("recoveryOperationReplaceConfirm"), onPress: onReplace },
      ])} testID="recovery-operation-replace" variant="secondary">{t(snapshot.replacementPending ? "recoveryOperationFinishReplacement" : "recoveryOperationReplaceTitle")}</Button> : null}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  panel: { gap: spacing.md },
  hiddenCodes: { gap: spacing.sm },
  codes: { backgroundColor: colors.elevatedSurface, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, color: colors.textPrimary, fontFamily: "monospace", padding: spacing.md },
  body: { ...typography.small, color: colors.textSecondary, flexShrink: 1 },
  error: { ...typography.small, color: colors.danger },
  savedRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 48 },
  checkbox: { alignItems: "center", borderColor: colors.borderStrong, borderRadius: radius.xs, borderWidth: 2, height: 22, justifyContent: "center", width: 22 },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.onPrimary, fontSize: 15, fontWeight: "700" },
});
