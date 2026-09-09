import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import * as Google from "expo-auth-session/providers/google";

import { Button, HoldToConfirmButton, InfoBlock, Screen, ScreenHeader } from "../../components";
import { usePatternlyAccount, type AccountCommandResult } from "../../application/account/AccountSessionProvider";
import { createRefreshHoldLifecycle, DELETION_AUTHORIZATION_TTL_MS, type RefreshHoldLifecycle } from "../../application/account/accountCommandGuards";
import type { FirebaseAuthCredentials } from "../../infrastructure/firebase/firebaseAuthClient";
import { readFirebaseClientConfiguration, type FirebaseClientConfiguration } from "../../infrastructure/firebase/publicConfig";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation/types";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { recoveryCodeClipboard } from "../../infrastructure/security/recoveryCodeClipboard";
import { getAccountSecurityErrorAfterEdit, getAccountSecurityErrorField } from "./accountSecurityFieldErrors";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ACCOUNT_SECURITY>;

export function AccountSecurityScreen(props: Props) {
  return <SecurityForm key={props.route.params.screen} {...props} />;
}

function SecurityForm({ route, navigation }: Props) {
  const mode = route.params.screen;
  const account = usePatternlyAccount();
  const accountRef = useRef(account);
  accountRef.current = account;
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("settings");
  const { t: ta } = useTranslation("account");
  const [password, setPassword] = useState("");
  const [nextValue, setNextValue] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [prepared, setPrepared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [codes, setCodes] = useState<readonly string[] | null>(null);
  const busyRef = useRef(false);
  const epoch = useRef(0);
  const focused = useRef(true);
  const providerPrompt = useRef(false);
  const configuration = useRef(readFirebaseClientConfiguration()).current;
  const user = "user" in account.state ? account.state.user : null;
  const authenticated = account.state.kind === "authenticated";
  const usesPassword = user?.providers.includes("password") ?? false;
  const usesApple = !usesPassword && Platform.OS === "ios" && (user?.providers.includes("apple") ?? false);
  const usesGoogle = !usesPassword && !usesApple && (user?.providers.includes("google") ?? false);
  const title = mode === "delete" ? ta("deleteAccount") : t(mode === "recovery" ? "recoveryCodes" : mode === "email" ? "changeEmail" : mode === "export" ? "exportAuthentication" : mode === "privacy" ? "privacyAuthentication" : "changePassword");

  const revoke = useCallback(() => {
    epoch.current += 1;
    accountRef.current.revokeDeletionAuthorization();
    setPrepared(false);
  }, []);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => {
      focused.current = false;
      revoke();
      setPassword("");
      setNextValue("");
      setConfirmation("");
      setCodes(null);
    };
  }, [revoke]));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      // The provider owns its external authentication sheet. Existing consent is
      // always revoked; an in-flight provider prompt has not issued consent yet.
      if (state !== "active") {
        setCodes(null);
        if (!providerPrompt.current) revoke();
        else { accountRef.current.revokeDeletionAuthorization(); setPrepared(false); }
      }
    });
    return () => subscription.remove();
  }, [revoke]);
  useEffect(() => { revoke(); }, [user?.uid, revoke]);
  useEffect(() => {
    if (!prepared) return;
    const timeout = setTimeout(revoke, DELETION_AUTHORIZATION_TTL_MS);
    return () => clearTimeout(timeout);
  }, [prepared, revoke]);

  function edit(setter: (value: string) => void, value: string, editedField: string) {
    revoke();
    setter(value);
    setFailure((previous) => getAccountSecurityErrorAfterEdit({ failure: previous, mode, usesPassword, editedField }));
    setSuccess(null);
  }

  async function run(operation: () => Promise<AccountCommandResult>, onSuccess: (result: Extract<AccountCommandResult, { kind: "success" }>) => void, externalProvider = false) {
    if (busyRef.current || !focused.current) return;
    Keyboard.dismiss();
    busyRef.current = true;
    providerPrompt.current = externalProvider;
    const current = epoch.current;
    setBusy(true);
    setFailure(null);
    setSuccess(null);
    try {
      const result = await operation();
      if (!focused.current || current !== epoch.current) return;
      if (result.kind === "failure") setFailure(result.failure);
      else onSuccess(result);
    } catch {
      if (focused.current && current === epoch.current) setFailure("remoteFailure");
    } finally {
      providerPrompt.current = false;
      busyRef.current = false;
      if (focused.current) setBusy(false);
    }
  }

  function submit(credentials: FirebaseAuthCredentials) {
    if (!authenticated || !focused.current) return;
    const requestedEmail = mode === "email" ? nextValue.trim().toLowerCase() : "";
    const requestedUid = mode === "email" ? user?.uid ?? null : null;
    if (mode === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(requestedEmail)) { setFailure("invalidEmail"); return; }
    if (mode === "email" && requestedUid === null) { setFailure("providerUnavailable"); return; }
    if (mode === "password" && nextValue !== confirmation) { setFailure("passwordMismatch"); return; }
    revoke();
    void run(() => mode === "delete" ? account.prepareDeletion(credentials)
      : mode === "recovery" ? account.issueRecoveryCodes(credentials)
      : mode === "export" || mode === "privacy" ? account.reauthenticateForExport(credentials)
      : mode === "email" ? account.requestEmailChange(credentials, requestedEmail)
      : account.changePassword(credentials, nextValue), (result) => {
      setPassword("");
      if (mode === "delete" && result.next === "deletionAuthorized") setPrepared(true);
      else if (mode === "recovery" && result.next === "recoveryCodesIssued" && result.recoveryCodes?.length === 10) { setCodes(result.recoveryCodes); setSuccess("codesGenerated"); }
      else if ((mode === "export" || mode === "privacy") && result.next === "authenticated") navigation.goBack();
      else if (mode === "email" && result.next === "verificationSent" && requestedUid !== null) navigation.replace(ROUTES.ACCOUNT_EMAIL_CHANGE_PENDING, { requestedEmail, uid: requestedUid });
      else if (mode === "password" && result.next === "authenticated") { setNextValue(""); setConfirmation(""); setSuccess("passwordChanged"); }
      else setFailure("remoteFailure");
    }, credentials.kind !== "password");
  }

  const pendingDeletion = authenticated && account.state.accountData.lastFailureCode !== "reauthenticationRequired" && (account.state.accountData.status === "remoteDeletionPending" || account.state.accountData.status === "localCleanupPending");
  const blocked = busy || !authenticated;
  const errorField = getAccountSecurityErrorField({ failure, mode, usesPassword });
  const fieldErrorMessage = errorField === "security-new-email"
    ? t("emailChangeAddressError")
    : failure === "passwordMismatch"
      ? ta("passwordMismatch")
    : failure === "weakPassword"
      ? ta("weakPassword")
      : mode === "recovery" && failure === "invalidCredential"
        ? ta("invalidCredential")
      : t("emailChangePasswordError");
  const field = (label: string, value: string, setter: (value: string) => void, id: string, secret: boolean) => (
    <View style={styles.field}>
      <Text maxFontSizeMultiplier={2} style={styles.label}>{label}</Text>
      <TextInput accessibilityHint={errorField === id ? fieldErrorMessage : undefined} accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} editable={!blocked} keyboardType={secret ? "default" : "email-address"} maxFontSizeMultiplier={2} onChangeText={(value) => edit(setter, value, id)} onFocus={revoke} onSubmitEditing={Keyboard.dismiss} returnKeyType="done" secureTextEntry={secret} style={[styles.input, errorField === id && styles.inputError]} testID={id} textContentType={secret ? id === "security-password" ? "password" : "newPassword" : "emailAddress"} value={value} />
      {errorField === id ? <Text selectable accessibilityLabel={`${label}. ${fieldErrorMessage}`} accessibilityLiveRegion="polite" accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.fieldError} testID={`${id}-error`}>{fieldErrorMessage}</Text> : null}
    </View>
  );

  return (
    <Screen edges={["top", "bottom"]} scroll={false} style={styles.screen}>
      <View style={styles.header}><ScreenHeader backAction={{ onPress: () => { Keyboard.dismiss(); revoke(); navigation.goBack(); } }} context={t("appSettings")} title={title} /></View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView automaticallyAdjustKeyboardInsets keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {failure && errorField === null ? <InfoBlock accessibilityAlert body={mode === "export" || mode === "privacy" ? t("exportAuthenticationFailed") : ta(failure === "invalidEmail" ? "emailFormatError" : failure)} title={title} tone="warning" testID={`security-error-${failure}`} /> : null}
          {mode === "email" && account.refreshAccountIdentityFailure ? <InfoBlock accessibilityAlert body={ta(account.refreshAccountIdentityFailure)} title={t("changeEmail")} tone="warning" testID="security-refresh-error" /> : null}
          {success ? <InfoBlock accessibilityAlert body={t(success)} title={title} testID="security-success" /> : null}
          {mode === "delete" ? !prepared ? <>
            <InfoBlock body={t("deleteConsequences")} title={t("deletePermanent")} tone="warning" />
          </> : null : <Text maxFontSizeMultiplier={2} style={styles.body}>{t(mode === "recovery" ? "recoveryWarning" : mode === "email" ? "emailChangeIntro" : mode === "export" ? "exportAuthenticationIntro" : mode === "privacy" ? "privacyAuthenticationIntro" : "passwordChangeIntro")}</Text>}
          {!authenticated ? <InfoBlock body={account.state.kind === "deleting" ? ta("deletionPendingDescription") : ta("providerUnavailable")} title={title} testID="security-unavailable" /> : pendingDeletion ? <>
            <InfoBlock body={ta("deletionPendingDescription")} title={ta("deleting")} />
            <Button disabled={busy} loading={busy} onPress={() => { void run(() => account.retryPendingDeletion(), () => {}); }} testID="security-delete-retry">{t("retryDeletion")}</Button>
          </> : mode === "password" && !usesPassword ? <InfoBlock body={t("providerPassword")} title={title} testID="security-provider-password" /> : <>
            {mode === "email" ? field(t("newEmail"), nextValue, setNextValue, "security-new-email", false) : null}
            {mode === "password" ? <>{field(t("newPassword"), nextValue, setNextValue, "security-new-password", true)}{field(t("confirmNewPassword"), confirmation, setConfirmation, "security-confirm-password", true)}</> : null}
            {codes ? <View style={styles.field} testID="security-recovery-codes">
              <Text selectable maxFontSizeMultiplier={2} style={styles.codes}>{codes.join("\n")}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.body}>{ta("recoveryCodesClipboardWarning")}</Text>
              <Button disabled={busy} onPress={() => { void recoveryCodeClipboard.copy(codes).then(() => { if (focused.current) setSuccess("codesCopied"); }).catch(() => { if (focused.current) setFailure("remoteFailure"); }); }} variant="secondary">{ta("copyRecoveryCodes")}</Button>
            </View> : <>
              {usesPassword && !prepared ? field(t(mode === "delete" ? "password" : "currentPassword"), password, setPassword, "security-password", true) : null}
              {!prepared ? usesGoogle && configuration.kind === "configured" ? <GoogleVerification configuration={configuration.value} disabled={blocked} holdAccountIdentityRefresh={account.holdAccountIdentityRefresh} onCredential={submit} onFailure={() => { if (focused.current) setFailure("providerUnavailable"); }} /> : usesPassword || usesApple ? <Button disabled={blocked || (usesPassword && password.length === 0)} loading={busy} onPress={() => submit(usesPassword ? { kind: "password", password } : { kind: "apple" })} testID="security-submit" variant="secondary">{usesApple ? t("verifyApple") : t(mode === "delete" || mode === "export" || mode === "privacy" ? "verifyIdentity" : mode === "recovery" ? "generateCodes" : "saveChange")}</Button> : <InfoBlock body={ta("providerUnavailable")} title={title} /> : null}
              {mode === "delete" && prepared ? <HoldToConfirmButton accessibilityLabel={t("holdDelete")} disabled={blocked} hint={t("holdDeleteHint")} loading={busy} onConfirm={() => { setPrepared(false); void run(() => account.deleteAccount(), () => {}); }} testID="security-delete-hold">{t("holdDelete")}</HoldToConfirmButton> : null}
            </>}
          </>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function GoogleVerification({ configuration, disabled, holdAccountIdentityRefresh, onCredential, onFailure }: Readonly<{ configuration: FirebaseClientConfiguration; disabled: boolean; holdAccountIdentityRefresh: () => () => void; onCredential: (credentials: FirebaseAuthCredentials) => void; onFailure: () => void }>) {
  const { t } = useTranslation("settings");
  const [request, , prompt] = Google.useIdTokenAuthRequest({ androidClientId: configuration.googleAndroidClientId, iosClientId: configuration.googleIosClientId, webClientId: configuration.googleWebClientId, selectAccount: true }, { scheme: "com.lkurczab.patternly" });
  const [prompting, setPrompting] = useState(false);
  const promptRef = useRef(false);
  const refreshHoldLifecycleRef = useRef<RefreshHoldLifecycle | null>(null);
  if (refreshHoldLifecycleRef.current === null) refreshHoldLifecycleRef.current = createRefreshHoldLifecycle(holdAccountIdentityRefresh);
  const refreshHoldLifecycle = refreshHoldLifecycleRef.current;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      refreshHoldLifecycle.release();
    };
  }, [refreshHoldLifecycle]);
  return <Button disabled={disabled || !request || prompting} loading={prompting} onPress={() => {
    if (promptRef.current) return;
    refreshHoldLifecycle.acquire();
    promptRef.current = true;
    setPrompting(true);
    void Promise.resolve().then(() => prompt()).then((result) => {
      if (!mounted.current) return;
      if (result.type === "success" && result.params.id_token) {
        try {
          onCredential({ kind: "google", idToken: result.params.id_token });
        } finally {
          refreshHoldLifecycle.release();
        }
      } else {
        refreshHoldLifecycle.release();
        if (result.type === "error" || result.type === "success") onFailure();
      }
    }).catch(() => {
      refreshHoldLifecycle.release();
      if (mounted.current) onFailure();
    }).finally(() => {
      refreshHoldLifecycle.release();
      promptRef.current = false;
      if (mounted.current) setPrompting(false);
    });
  }} testID="security-google-verify" variant="secondary">{t("verifyGoogle")}</Button>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: spacing.lg, paddingBottom: 0, gap: spacing.lg },
  header: { paddingHorizontal: spacing.xl },
  flex: { flex: 1 },
  content: { gap: spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  field: { gap: spacing.sm },
  label: { ...typography.caption, color: palette.textPrimary },
  body: { ...typography.body, color: palette.textMuted },
  input: { ...typography.body, color: palette.textPrimary, backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: radius.md, minHeight: 52, padding: spacing.md },
  inputError: { borderColor: palette.danger },
  fieldError: { ...typography.caption, color: palette.danger },
  codes: { ...typography.body, color: palette.textPrimary, fontVariant: ["tabular-nums"], lineHeight: 32 },
});
