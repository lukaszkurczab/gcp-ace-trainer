import { useEffect, useRef, useState } from "react";
import * as Crypto from "expo-crypto";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { Button, ChoiceRow, InfoBlock, Screen, ScreenHeader, SettingsGroup } from "../../components";
import type { PrivacyRequestResponseDto, PrivacyRequestRightDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { radius, spacing, typography } from "../../theme";
import { clearGuestPrivacyDraft, loadGuestPrivacyDraft, saveGuestPrivacyDraft, type GuestPrivacyDraft } from "./guestPrivacyDraft";

const RIGHTS: readonly PrivacyRequestRightDto[] = ["access", "rectification", "erasure", "restriction", "objection", "portability", "consent_withdrawal"];

export function GuestPrivacyRequestsScreen({ onBack }: Readonly<{ onBack: () => void }>) {
  const { t } = useTranslation("data");
  const account = usePatternlyAccount();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState("");
  const [right, setRight] = useState<PrivacyRequestRightDto>("access");
  const [narrative, setNarrative] = useState("");
  const [requestId, setRequestId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<PrivacyRequestResponseDto | null>(null);
  const [session, setSession] = useState<Readonly<{ requestId: string; token: string; expiresAt: number }> | null>(null);
  const pendingDraft = useRef<GuestPrivacyDraft | null>(null);
  const mounted = useRef(true);
  const operationActive = useRef(false);

  useEffect(() => {
    mounted.current = true;
    void loadGuestPrivacyDraft().then((draft) => {
      if (!mounted.current) return;
      setStorageReady(true);
      if (!draft) return;
      pendingDraft.current = draft;
      setEmail(draft.email);
      setRight(draft.right);
      setNarrative(draft.narrative ?? "");
      if (draft.requestId) setRequestId(draft.requestId);
    }).catch(() => { if (mounted.current) setMessage(t("guestPrivacy.storageUnavailable")); });
    return () => { mounted.current = false; };
  }, [t]);

  async function run(action: () => Promise<void>) {
    if (operationActive.current) return;
    operationActive.current = true;
    setBusy(true);
    setMessage(null);
    try { await action(); }
    catch { if (mounted.current) setMessage(t("guestPrivacy.storageUnavailable")); }
    finally { operationActive.current = false; if (mounted.current) setBusy(false); }
  }

  function failure(key: string) { if (mounted.current) setMessage(t(`privacyRequests.failures.${key}`)); }

  async function submit() {
    await run(async () => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalizedEmail)) { setMessage(t("guestPrivacy.invalidEmail")); return; }
      const normalizedNarrative = narrative.trim();
      const previous = pendingDraft.current;
      const matches = previous?.email === normalizedEmail && previous.right === right && (previous.narrative ?? "") === normalizedNarrative;
      const draft: GuestPrivacyDraft = {
        clientRequestId: matches ? previous.clientRequestId : Crypto.randomUUID(), email: normalizedEmail, right,
        ...(normalizedNarrative ? { narrative: normalizedNarrative } : {}),
        ...(matches && previous.requestId ? { requestId: previous.requestId } : {}),
      };
      await saveGuestPrivacyDraft(draft);
      pendingDraft.current = draft;
      const result = await account.createGuestPrivacyRequest({ clientRequestId: draft.clientRequestId, email: draft.email, right: draft.right, ...(draft.narrative ? { narrative: draft.narrative } : {}), reportSubmissionIds: [] });
      if (!mounted.current) return;
      if (result.kind === "failure") { failure(result.failure); return; }
      const accepted = { ...draft, requestId: result.value };
      await saveGuestPrivacyDraft(accepted);
      pendingDraft.current = accepted;
      setRequestId(result.value);
      setMessage(t("guestPrivacy.pending"));
    });
  }

  async function resend() {
    await run(async () => {
      const result = await account.resendGuestPrivacyCode(requestId.trim(), email.trim());
      if (!mounted.current) return;
      setMessage(result.kind === "success" ? t("guestPrivacy.pending") : t(`privacyRequests.failures.${result.failure}`));
    });
  }

  async function readVerified(id: string, token: string) {
    const result = await account.readGuestPrivacyResponse(id, token);
    if (!mounted.current) return;
    if (result.kind === "failure") { failure(result.failure); return; }
    setResponse(result.value);
    setMessage(null);
  }

  async function verify() {
    await run(async () => {
      const result = await account.verifyGuestPrivacyCode(code.trim());
      if (!mounted.current) return;
      if (result.kind === "failure") { failure(result.failure); return; }
      const next = { requestId: result.value.requestId, token: result.value.sessionToken, expiresAt: Date.now() + 15 * 60 * 1000 };
      setSession(next);
      setRequestId(next.requestId);
      setCode("");
      let storageFailed = false;
      try { await clearGuestPrivacyDraft(); pendingDraft.current = null; }
      catch { storageFailed = true; }
      await readVerified(next.requestId, next.token);
      if (storageFailed && mounted.current) setMessage(t("guestPrivacy.storageUnavailable"));
    });
  }

  async function refresh() {
    if (!session || Date.now() >= session.expiresAt) { setSession(null); setMessage(t("guestPrivacy.sessionExpired")); return; }
    await run(async () => readVerified(session.requestId, session.token));
  }

  return <Screen edges={["top", "bottom"]}>
    <ScreenHeader backAction={{ onPress: onBack }} context={t("data")} contextTone="primary" title={t("privacyRequests.title")} />
    <InfoBlock body={t("guestPrivacy.intro")} title={t("guestPrivacy.title")} />
    <SettingsGroup title={t("guestPrivacy.newRequest")}>
      <Text style={styles.label}>{t("guestPrivacy.email")}</Text>
      <TextInput autoCapitalize="none" autoComplete="email" editable={!busy} keyboardType="email-address" onChangeText={setEmail} style={styles.input} testID="guest-privacy-email" value={email} />
      <View accessibilityRole="radiogroup" style={styles.choices}>{RIGHTS.map((value) => <ChoiceRow detail={t(`privacyRequests.rightDetails.${value}`)} key={value} onPress={() => setRight(value)} selected={right === value} title={t(`privacyRequests.rights.${value}`)} />)}</View>
      <Text style={styles.label}>{t("privacyRequests.narrativeLabel")}</Text>
      <TextInput editable={!busy} maxLength={2000} multiline onChangeText={setNarrative} style={[styles.input, styles.narrative]} testID="guest-privacy-narrative" value={narrative} />
      <Button disabled={!storageReady} loading={busy} onPress={() => { void submit(); }} testID="guest-privacy-submit">{t("privacyRequests.submit")}</Button>
    </SettingsGroup>
    <SettingsGroup title={t("guestPrivacy.existingRequest")}>
      <Text style={styles.label}>{t("guestPrivacy.requestId")}</Text>
      <TextInput autoCapitalize="none" editable={!busy} onChangeText={setRequestId} style={styles.input} testID="guest-privacy-request-id" value={requestId} />
      <Button disabled={!requestId.trim() || !email.trim()} loading={busy} onPress={() => { void resend(); }} testID="guest-privacy-resend" variant="secondary">{t("guestPrivacy.resend")}</Button>
      <Text style={styles.label}>{t("guestPrivacy.code")}</Text>
      <TextInput autoCapitalize="none" editable={!busy} onChangeText={setCode} style={styles.input} testID="guest-privacy-code" value={code} />
      <Button disabled={!code.trim()} loading={busy} onPress={() => { void verify(); }} testID="guest-privacy-verify">{t("guestPrivacy.verify")}</Button>
    </SettingsGroup>
    {session ? <Button onPress={() => { void refresh(); }} testID="guest-privacy-refresh" variant="secondary">{t("guestPrivacy.refresh")}</Button> : null}
    {response ? <InfoBlock body={response.response ?? t("privacyRequests.noResponse")} title={t(`privacyRequests.status.${response.request.status}`)} /> : null}
    {message ? <InfoBlock accessibilityAlert body={message} title={t("guestPrivacy.statusTitle")} tone="warning" /> : null}
  </Screen>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  choices: { gap: spacing.sm },
  input: { ...typography.body, backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, color: palette.textPrimary, padding: spacing.md },
  label: { ...typography.small, color: palette.textSecondary },
  narrative: { minHeight: 96, textAlignVertical: "top" },
});
