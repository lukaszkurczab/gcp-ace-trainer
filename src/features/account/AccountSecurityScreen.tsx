import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Keyboard, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";
import * as Google from "expo-auth-session/providers/google";

import { Button, HoldToConfirmButton, InfoBlock, Screen, ScreenHeader } from "../../components";
import { usePatternlyAccount, type AccountCommandResult } from "../../application/account/AccountSessionProvider";
import { DELETION_AUTHORIZATION_TTL_MS } from "../../application/account/accountCommandGuards";
import type { FirebaseAuthCredentials } from "../../infrastructure/firebase/firebaseAuthClient";
import { readFirebaseClientConfiguration, type FirebaseClientConfiguration } from "../../infrastructure/firebase/publicConfig";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation/types";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";

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
  const title = mode === "delete" ? ta("deleteAccount") : t(mode === "recovery" ? "recoveryCodes" : mode === "email" ? "changeEmail" : "changePassword");

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

  function edit(setter: (value: string) => void, value: string) {
    revoke();
    setter(value);
    setFailure(null);
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
    if (mode === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(nextValue.trim())) { setFailure("invalidEmail"); return; }
    if (mode === "password" && nextValue !== confirmation) { setFailure("passwordMismatch"); return; }
    revoke();
    void run(() => mode === "delete" ? account.prepareDeletion(credentials)
      : mode === "recovery" ? account.issueRecoveryCodes(credentials)
      : mode === "email" ? account.requestEmailChange(credentials, nextValue)
      : account.changePassword(credentials, nextValue), (result) => {
      setPassword("");
      if (mode === "delete" && result.next === "deletionAuthorized") setPrepared(true);
      else if (mode === "recovery" && result.next === "recoveryCodesIssued" && result.recoveryCodes?.length === 10) { setCodes(result.recoveryCodes); setSuccess("codesGenerated"); }
      else if (mode === "email" && result.next === "verificationSent") setSuccess("emailVerificationSent");
      else if (mode === "password" && result.next === "authenticated") { setNextValue(""); setConfirmation(""); setSuccess("passwordChanged"); }
      else setFailure("remoteFailure");
    }, credentials.kind !== "password");
  }

  const pendingDeletion = authenticated && account.state.accountData.lastFailureCode !== "reauthenticationRequired" && (account.state.accountData.status === "remoteDeletionPending" || account.state.accountData.status === "localCleanupPending");
  const blocked = busy || !authenticated;
  const field = (label: string, value: string, setter: (value: string) => void, id: string, secret: boolean) => (
    <View style={styles.field}>
      <Text maxFontSizeMultiplier={2} style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} editable={!blocked} keyboardType={secret ? "default" : "email-address"} maxFontSizeMultiplier={2} onChangeText={(value) => edit(setter, value)} onFocus={revoke} onSubmitEditing={Keyboard.dismiss} returnKeyType="done" secureTextEntry={secret} style={styles.input} testID={id} textContentType={secret ? id === "security-password" ? "password" : "newPassword" : "emailAddress"} value={value} />
    </View>
  );

  return (
    <Screen edges={["top", "bottom"]} scroll={false} style={styles.screen}>
      <View style={styles.header}><ScreenHeader backAction={{ onPress: () => { Keyboard.dismiss(); revoke(); navigation.goBack(); } }} context={t("appSettings")} title={title} /></View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView automaticallyAdjustKeyboardInsets keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {user?.email ? <Text selectable maxFontSizeMultiplier={2} style={styles.body}>{`${ta("accountSignedInAs")}: ${user.email}`}</Text> : null}
          {failure ? <InfoBlock accessibilityAlert body={ta(failure === "invalidEmail" ? "emailFormatError" : failure)} title={title} tone="warning" testID={`security-error-${failure}`} /> : null}
          {success ? <InfoBlock accessibilityAlert body={t(success)} title={title} testID="security-success" /> : null}
          {mode === "delete" ? <>
            <InfoBlock body={t("deleteConsequences")} title={t("deletePermanent")} tone="warning" />
            <Text selectable maxFontSizeMultiplier={2} style={styles.body}>{t("deletionRetention")}</Text>
            <Text selectable maxFontSizeMultiplier={2} style={styles.body}>{t("deletionContact")}</Text>
            <Button onPress={() => { void Linking.openURL("mailto:Lukasz.kurczab@gmail.com").catch(() => { if (focused.current) setFailure("remoteFailure"); }); }} variant="ghost">Lukasz.kurczab@gmail.com</Button>
          </> : <Text maxFontSizeMultiplier={2} style={styles.body}>{t(mode === "recovery" ? "recoveryWarning" : mode === "email" ? "emailChangeIntro" : "passwordChangeIntro")}</Text>}
          {!authenticated ? <InfoBlock body={account.state.kind === "deleting" ? ta("deletionPendingDescription") : ta("providerUnavailable")} title={title} testID="security-unavailable" /> : pendingDeletion ? <>
            <InfoBlock body={ta("deletionPendingDescription")} title={ta("deleting")} />
            <Button disabled={busy} loading={busy} onPress={() => { void run(() => account.retryPendingDeletion(), () => {}); }} testID="security-delete-retry">{t("retryDeletion")}</Button>
          </> : mode === "password" && !usesPassword ? <InfoBlock body={t("providerPassword")} title={title} testID="security-provider-password" /> : <>
            {mode === "email" ? field(t("newEmail"), nextValue, setNextValue, "security-new-email", false) : null}
            {mode === "password" ? <>{field(t("newPassword"), nextValue, setNextValue, "security-new-password", true)}{field(t("confirmNewPassword"), confirmation, setConfirmation, "security-confirm-password", true)}</> : null}
            {codes ? <View style={styles.field} testID="security-recovery-codes">
              <Text selectable maxFontSizeMultiplier={2} style={styles.codes}>{codes.join("\n")}</Text>
              <Button disabled={busy} onPress={() => { void Clipboard.setStringAsync(codes.join("\n")).then((copied) => { if (focused.current) copied ? setSuccess("codesCopied") : setFailure("remoteFailure"); }).catch(() => { if (focused.current) setFailure("remoteFailure"); }); }} variant="secondary">{ta("copyRecoveryCodes")}</Button>
            </View> : <>
              {usesPassword ? field(t("currentPassword"), password, setPassword, "security-password", true) : null}
              {prepared ? <InfoBlock body={t("deletionVerified")} title={t("identityVerified")} testID="security-deletion-authorized" /> : usesGoogle && configuration.kind === "configured" ? <GoogleVerification configuration={configuration.value} disabled={blocked} onCredential={submit} onFailure={() => { if (focused.current) setFailure("providerUnavailable"); }} /> : usesPassword || usesApple ? <Button disabled={blocked || (usesPassword && password.length === 0)} loading={busy} onPress={() => submit(usesPassword ? { kind: "password", password } : { kind: "apple" })} testID="security-submit" variant="secondary">{usesApple ? t("verifyApple") : t(mode === "delete" ? "verifyIdentity" : mode === "recovery" ? "generateCodes" : "saveChange")}</Button> : <InfoBlock body={ta("providerUnavailable")} title={title} />}
              {mode === "delete" ? <HoldToConfirmButton accessibilityLabel={t("holdDelete")} disabled={!prepared || blocked} hint={t("holdDeleteHint")} loading={busy} onConfirm={() => { setPrepared(false); void run(() => account.deleteAccount(), () => {}); }} readyLabel={t("releaseDelete")} testID="security-delete-hold">{t("holdDelete")}</HoldToConfirmButton> : null}
            </>}
          </>}
          {mode === "email" && authenticated ? <Button disabled={busy} onPress={() => { void run(() => account.refreshAccountIdentity(), () => setSuccess("identityRefreshed")); }} variant="ghost">{t("refreshIdentity")}</Button> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function GoogleVerification({ configuration, disabled, onCredential, onFailure }: Readonly<{ configuration: FirebaseClientConfiguration; disabled: boolean; onCredential: (credentials: FirebaseAuthCredentials) => void; onFailure: () => void }>) {
  const { t } = useTranslation("settings");
  const [request, , prompt] = Google.useIdTokenAuthRequest({ androidClientId: configuration.googleAndroidClientId, iosClientId: configuration.googleIosClientId, webClientId: configuration.googleWebClientId, selectAccount: true }, { scheme: "com.lkurczab.patternly" });
  const [prompting, setPrompting] = useState(false);
  const promptRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return <Button disabled={disabled || !request || prompting} loading={prompting} onPress={() => {
    if (promptRef.current) return;
    promptRef.current = true;
    setPrompting(true);
    void prompt().then((result) => {
      if (!mounted.current) return;
      if (result.type === "success" && result.params.id_token) onCredential({ kind: "google", idToken: result.params.id_token });
      else if (result.type === "error" || result.type === "success") onFailure();
    }).catch(() => { if (mounted.current) onFailure(); }).finally(() => { promptRef.current = false; if (mounted.current) setPrompting(false); });
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
  codes: { ...typography.body, color: palette.textPrimary, fontVariant: ["tabular-nums"], lineHeight: 32 },
});
