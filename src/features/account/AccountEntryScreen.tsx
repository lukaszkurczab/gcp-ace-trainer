import { useEffect, useMemo, useRef, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Linking, Platform, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle } from "react-native";
import * as Google from "expo-auth-session/providers/google";

import { Button, Card, InfoBlock, PublicLinkRow, Screen, ScreenHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import { usePatternlyAccount, type AccountCommandResult, type AccountFailure } from "../../application/account/AccountSessionProvider";
import { readFirebaseClientConfiguration, readPublicLegalLinksFromRuntime } from "../../infrastructure/firebase/publicConfig";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";

type AccountEntryProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ACCOUNT_ENTRY>;
type AccountMode = NonNullable<NonNullable<RootStackParamList[typeof ROUTES.ACCOUNT_ENTRY]>["initialMode"]>;
type Feedback = AccountCommandResult;

const copy = {
  en: {
    account: "Account",
    accountDescription: "Sign in to continue to Patternly, or create an account if you do not have one yet.",
    unavailable: "Account entry unavailable",
    unavailableDescription: "This build has no complete Firebase, public-origin, or provider configuration. Sign-in cannot continue until the configuration is available.",
    register: "Create account",
    signIn: "Sign in",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    create: "Create account",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    forgotPassword: "Forgot password?",
    alreadyHaveAccount: "Already have an account? Sign in",
    needAccount: "Need an account? Create one",
    sendRecovery: "Send recovery email",
    consumeRecoveryCode: "Use a recovery code",
    recoveryCode: "Recovery code",
    recoveryDescription: "If the address can receive mail, you will receive a recovery link. We do not disclose whether an account exists.",
    recoveryAccepted: "Recovery request accepted",
    recoveryAcceptedDescription: "If the address can receive mail, a recovery link will arrive. Check your inbox and spam folder.",
    verification: "Verify your email",
    verificationDescription: "Open the verification link sent to your email, then return here and check again.",
    resend: "Resend verification",
    check: "Check verification",
    signOut: "Sign out",
    signOutPending: "Sign-out pending",
    signOutPendingDescription: "The server has not confirmed session revocation or local cleanup. Your account remains bound; retry when connected.",
    deleteAccount: "Delete account",
    deleteAccountDescription: "This permanently removes Patternly account data from Firestore and account-owned local records. Store subscriptions and provider records are separate.",
    confirmDeletion: "Delete permanently",
    publicDeletionLink: "Public account-deletion request",
    publicDeletionLinkDetail: "Open the configured public request path.",
    publicDeletionLinkUnavailable: "No validated public deletion URL is configured; this link is disabled in this local build.",
    publicDeletionLinkInvalid: "The public environment configuration is invalid; this link is disabled.",
    publicDeletionLinkOpenFailedTitle: "Public deletion link unavailable",
    publicDeletionLinkOpenFailed: "The configured public deletion link could not be opened on this device.",
    deleting: "Deleting account",
    deletionPending: "Account deletion pending",
    deletionPendingDescription: "Deletion is not confirmed complete. Keep this account bound and retry; no success is shown until the server proof and local cleanup verify.",
    localCleanupPending: "Local cleanup pending",
    localCleanupPendingDescription: "Remote deletion is verified, but local account-owned cleanup needs a retry before the session can finish.",
    remoteDeletionPending: "Remote deletion is pending or failed. The account remains bound until the server confirms completion.",
    localCleanupFailure: "Local account-owned cleanup failed. The account remains signed in until retry succeeds.",
    sessionRevocationPending: "Session revocation is pending. The account remains bound until the server confirms it.",
    reauthenticationRequired: "Recent reauthentication is required before account deletion.",
    recoveryCodes: "Recovery codes",
    recoveryCodesDescription: "These eight codes are shown once. Store them in a password manager; Patternly never stores the raw codes.",
    issueRecoveryCodes: "Generate new recovery codes",
    accountReady: "Account identity verified",
    accountReadyDescription: "Your identity is verified. Local learning is shown below before any account binding or upload.",
    adoptionPreview: "Review account adoption",
    adoptionPreviewDescription: "Nothing is bound or uploaded until you confirm this exact preview.",
    preserve: "Keep",
    upload: "Upload",
    restore: "Restore",
    deduplicated: "Already identical",
    decisions: "Needs your decision",
    keepGuest: "Keep this device",
    keepAccount: "Keep account",
    confirmAdoption: "Confirm adoption",
    retrySync: "Retry sync",
    syncing: "Syncing account data",
    syncComplete: "Account data is synchronized",
    syncCompleteDescription: "The allowlisted account facts are synchronized. Active sessions and recovery journals remain device-only.",
    pending: "Pending account changes",
    pendingDescription: "Your verified local changes are retained and will not be discarded. Retry when connected.",
    conflict: "Account data conflict",
    conflictDescription: "The remote revision changed or records disagree. Choose a side in the preview before retrying.",
    dataFailure: "Account data is unavailable",
    dataFailureDescription: "No success was recorded. Local verified data remains on this device.",
    activeSessionBlocked: "Finish or abandon the active session before adoption.",
    journalBlocked: "Recover the interrupted learning operation before adoption.",
    pendingSyncRequiresNetwork: "Sync pending changes before signing out.",
    journalRecoveryFailure: "Recover the interrupted learning operation before signing out.",
    localDeletionFailure: "Local account data could not be cleared. You remain signed in.",
    remoteFailure: "The account service did not confirm this operation.",
    account_revision_conflict: "The account changed on another device. Review the new preview.",
    version_conflict: "A record changed on another device. Review the new preview.",
    adoption_conflict: "Some records need an explicit choice.",
    active_session_sync_deferred: "Sync waits until the active session is finished.",
    journal_recovery_required: "Recover the interrupted learning operation before syncing.",
    account_data_unavailable: "Account data is unavailable right now.",
    backendUnavailable: "Backend unavailable",
    backendUnavailableDescription: "Firebase accepted the identity, but Patternly could not verify the account right now. Try again when the backend is available.",
    revokedSession: "Session revoked",
    revokedSessionDescription: "The backend rejected this session. Sign out, then sign in again to continue.",
    resetPassword: "Choose a new password",
    reset: "Reset password",
    passwordMismatch: "Passwords do not match.",
    invalid: "Check the entered details.",
    duplicate: "This provider is already linked or the credential is already in use.",
    rateLimited: "Too many attempts. Try again later.",
    offline: "You appear to be offline. Try again when connected.",
    expiredAction: "This link has expired. Request a new one.",
    providerUnavailable: "This sign-in provider is unavailable in this build.",
    invalidCredential: "The credentials could not be verified.",
    unverifiedIdentity: "Verify your email before signing in.",
  },
  pl: {
    account: "Konto",
    accountDescription: "Zaloguj się, aby przejść do Patternly, lub utwórz konto, jeśli jeszcze go nie masz.",
    unavailable: "Logowanie jest niedostępne",
    unavailableDescription: "Ta wersja nie ma pełnej konfiguracji Firebase, publicznych originów lub dostawcy. Logowanie nie może być kontynuowane do czasu udostępnienia konfiguracji.",
    register: "Utwórz konto",
    signIn: "Zaloguj się",
    email: "E-mail",
    password: "Hasło",
    confirmPassword: "Powtórz hasło",
    create: "Utwórz konto",
    continueWithGoogle: "Kontynuuj z Google",
    continueWithApple: "Kontynuuj z Apple",
    forgotPassword: "Nie pamiętasz hasła?",
    alreadyHaveAccount: "Masz już konto? Zaloguj się",
    needAccount: "Nie masz konta? Utwórz je",
    sendRecovery: "Wyślij e-mail odzyskiwania",
    consumeRecoveryCode: "Użyj kodu odzyskiwania",
    recoveryCode: "Kod odzyskiwania",
    recoveryDescription: "Jeśli adres może odebrać wiadomość, otrzymasz link odzyskiwania. Nie ujawniamy, czy konto istnieje.",
    recoveryAccepted: "Żądanie odzyskiwania przyjęte",
    recoveryAcceptedDescription: "Jeśli adres może odebrać wiadomość, link odzyskiwania przyjdzie na skrzynkę. Sprawdź też spam.",
    verification: "Zweryfikuj e-mail",
    verificationDescription: "Otwórz link w wiadomości, a następnie wróć tutaj i sprawdź ponownie.",
    resend: "Wyślij weryfikację ponownie",
    check: "Sprawdź weryfikację",
    signOut: "Wyloguj",
    signOutPending: "Wylogowanie oczekuje",
    signOutPendingDescription: "Serwer nie potwierdził jeszcze unieważnienia sesji lub czyszczenia lokalnego. Konto pozostaje powiązane; spróbuj ponownie po połączeniu.",
    deleteAccount: "Usuń konto",
    deleteAccountDescription: "Ta operacja trwale usuwa dane konta Patternly z Firestore i account-owned dane lokalne. Subskrypcje sklepu i dane providerów są osobne.",
    confirmDeletion: "Usuń trwale",
    publicDeletionLink: "Publiczne żądanie usunięcia konta",
    publicDeletionLinkDetail: "Otwórz skonfigurowaną publiczną ścieżkę żądania.",
    publicDeletionLinkUnavailable: "Nie skonfigurowano zweryfikowanego publicznego URL usunięcia konta; ten link jest wyłączony w tej lokalnej wersji.",
    publicDeletionLinkInvalid: "Konfiguracja publicznego środowiska jest nieprawidłowa; ten link jest wyłączony.",
    publicDeletionLinkOpenFailedTitle: "Publiczny link usunięcia jest niedostępny",
    publicDeletionLinkOpenFailed: "Nie udało się otworzyć skonfigurowanego publicznego linku usunięcia na tym urządzeniu.",
    deleting: "Usuwanie konta",
    deletionPending: "Usuwanie konta oczekuje",
    deletionPendingDescription: "Usunięcie nie jest potwierdzone jako zakończone. Pozostaw konto powiązane i spróbuj ponownie; sukces pokażemy dopiero po weryfikacji proof i lokalnego czyszczenia.",
    localCleanupPending: "Czyszczenie lokalne oczekuje",
    localCleanupPendingDescription: "Zdalne usunięcie jest potwierdzone, ale lokalne dane account-owned wymagają ponowienia przed zakończeniem sesji.",
    remoteDeletionPending: "Zdalne usunięcie oczekuje albo się nie powiodło. Konto pozostaje powiązane do czasu potwierdzenia przez serwer.",
    localCleanupFailure: "Czyszczenie lokalnych danych account-owned nie powiodło się. Konto pozostaje zalogowane do ponowienia.",
    sessionRevocationPending: "Unieważnienie sesji oczekuje. Konto pozostaje powiązane do potwierdzenia przez serwer.",
    reauthenticationRequired: "Przed usunięciem konta wymagane jest świeże ponowne uwierzytelnienie.",
    recoveryCodes: "Kody odzyskiwania",
    recoveryCodesDescription: "Te osiem kodów pokazujemy tylko raz. Zapisz je w menedżerze haseł; Patternly nie przechowuje kodów jawnych.",
    issueRecoveryCodes: "Wygeneruj nowe kody odzyskiwania",
    accountReady: "Tożsamość konta zweryfikowana",
    accountReadyDescription: "Tożsamość jest potwierdzona. Poniżej zobaczysz dane lokalne przed każdym powiązaniem lub wysłaniem.",
    adoptionPreview: "Sprawdź powiązanie danych",
    adoptionPreviewDescription: "Nic nie zostanie powiązane ani wysłane bez potwierdzenia tego podglądu.",
    preserve: "Zachowaj",
    upload: "Wyślij",
    restore: "Odtwórz",
    deduplicated: "Już identyczne",
    decisions: "Wymaga decyzji",
    keepGuest: "Zachowaj to urządzenie",
    keepAccount: "Zachowaj konto",
    confirmAdoption: "Potwierdź powiązanie",
    retrySync: "Spróbuj synchronizacji ponownie",
    syncing: "Synchronizowanie danych konta",
    syncComplete: "Dane konta są zsynchronizowane",
    syncCompleteDescription: "Allowlista faktów konta jest zsynchronizowana. Aktywne sesje i dzienniki odzyskiwania pozostają tylko na urządzeniu.",
    pending: "Oczekujące zmiany konta",
    pendingDescription: "Potwierdzone lokalne zmiany pozostają na urządzeniu i nie zostaną usunięte. Spróbuj po połączeniu.",
    conflict: "Konflikt danych konta",
    conflictDescription: "Zdalna rewizja się zmieniła albo rekordy się różnią. Przed ponowieniem wybierz stronę w podglądzie.",
    dataFailure: "Dane konta są niedostępne",
    dataFailureDescription: "Nie potwierdzono sukcesu. Zweryfikowane dane lokalne pozostają na urządzeniu.",
    activeSessionBlocked: "Przed powiązaniem zakończ albo jawnie porzuć aktywną sesję.",
    journalBlocked: "Przed powiązaniem odzyskaj przerwaną operację nauki.",
    pendingSyncRequiresNetwork: "Przed wylogowaniem zsynchronizuj oczekujące zmiany.",
    journalRecoveryFailure: "Przed wylogowaniem odzyskaj przerwaną operację nauki.",
    localDeletionFailure: "Nie udało się wyczyścić lokalnych danych konta. Konto pozostaje zalogowane.",
    remoteFailure: "Usługa konta nie potwierdziła tej operacji.",
    account_revision_conflict: "Konto zmieniło się na innym urządzeniu. Sprawdź nowy podgląd.",
    version_conflict: "Rekord zmienił się na innym urządzeniu. Sprawdź nowy podgląd.",
    adoption_conflict: "Niektóre rekordy wymagają jawnego wyboru.",
    active_session_sync_deferred: "Synchronizacja poczeka na zakończenie aktywnej sesji.",
    journal_recovery_required: "Przed synchronizacją odzyskaj przerwaną operację nauki.",
    account_data_unavailable: "Dane konta są teraz niedostępne.",
    backendUnavailable: "Backend jest niedostępny",
    backendUnavailableDescription: "Firebase przyjął tożsamość, ale Patternly nie może teraz potwierdzić konta. Spróbuj ponownie, gdy backend będzie dostępny.",
    revokedSession: "Sesja unieważniona",
    revokedSessionDescription: "Backend odrzucił tę sesję. Wyloguj się, a następnie zaloguj ponownie.",
    resetPassword: "Ustaw nowe hasło",
    reset: "Zresetuj hasło",
    passwordMismatch: "Hasła nie są takie same.",
    invalid: "Sprawdź wpisane dane.",
    duplicate: "Ten dostawca jest już połączony albo dane logowania są już używane.",
    rateLimited: "Zbyt wiele prób. Spróbuj później.",
    offline: "Wygląda na to, że jesteś offline. Spróbuj po połączeniu.",
    expiredAction: "Link wygasł. Poproś o nowy.",
    providerUnavailable: "Ten dostawca logowania jest niedostępny w tej wersji.",
    invalidCredential: "Nie udało się potwierdzić danych logowania.",
    unverifiedIdentity: "Zweryfikuj e-mail przed logowaniem.",
  },
} as const;
type AccountCopy = { [Key in keyof typeof copy.en]: string };

export function AccountEntryScreen({ navigation, route }: AccountEntryProps) {
  const styles = useThemedStyles(createStyles);
  const { locale } = useAppPreferences();
  const text = copy[locale];
  const account = usePatternlyAccount();
  const accountRef = useRef(account);
  accountRef.current = account;
  const [mode, setMode] = useState<AccountMode>(route.params?.initialMode ?? "entry");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [deletionPassword, setDeletionPassword] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<readonly string[] | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const backAction = navigation.canGoBack() ? { onPress: () => navigation.goBack() } : undefined;
  const firebaseConfig = useMemo(() => readFirebaseClientConfiguration(), []);
  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    androidClientId: firebaseConfig.kind === "configured" ? firebaseConfig.value.googleAndroidClientId : undefined,
    iosClientId: firebaseConfig.kind === "configured" ? firebaseConfig.value.googleIosClientId : undefined,
    selectAccount: true,
    webClientId: firebaseConfig.kind === "configured" ? firebaseConfig.value.googleWebClientId : undefined,
  }, { scheme: "com.lkurczab.patternly" });

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type !== "success") {
      if (googleResponse.type === "error") setFeedback({ kind: "failure", failure: "providerUnavailable" });
      return;
    }
    const idToken = googleResponse.params.id_token;
    void accountRef.current.signInWithGoogle(idToken ?? "").then(setResult(setFeedback));
  }, [googleResponse]);

  useEffect(() => {
    const consumeUrl = (url: string | null) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get("oobCode");
        const action = parsed.searchParams.get("mode");
        if (!code) return;
        if (action === "verifyEmail") void accountRef.current.applyVerificationCode(code).then(setResult(setFeedback));
        if (action === "resetPassword") { setResetCode(code); setMode("resetPassword"); }
        if (action !== "verifyEmail" && action !== "resetPassword") setFeedback({ kind: "failure", failure: "invalid" });
      } catch { setFeedback({ kind: "failure", failure: "invalid" }); }
    };
    void Linking.getInitialURL().then(consumeUrl);
    const subscription = Linking.addEventListener("url", (event) => consumeUrl(event.url));
    return () => subscription.remove();
  }, []);

  if (account.state.kind === "unavailable") return <Screen><ScreenHeader backAction={backAction} title={text.account} /><InfoBlock body={text.unavailableDescription} title={text.unavailable} testID="account-unavailable" tone="warning" /></Screen>;
  if (account.state.kind === "verificationPending") return <Screen><ScreenHeader backAction={backAction} title={text.verification} /><InfoBlock body={text.verificationDescription} title={text.verification} testID="account-verification-pending" /><Text style={styles.email}>{account.state.user.email ?? email}</Text>{renderFeedback(feedback, text)}<Button loading={false} onPress={() => void account.resendVerification().then(setResult(setFeedback))} testID="account-resend-verification" variant="primary">{text.resend}</Button><Button onPress={() => void account.refreshVerification().then(setResult(setFeedback))} testID="account-check-verification" variant="secondary">{text.check}</Button><Button onPress={() => void account.signOut()} testID="account-sign-out" variant="ghost">{text.signOut}</Button></Screen>;
  if (account.state.kind === "authenticated") return <Screen><ScreenHeader backAction={backAction} title={text.account} /><InfoBlock body={text.accountReadyDescription} title={text.accountReady} testID="account-authenticated" tone="success" /><AccountDataPanel accountData={account.state.accountData} onConfirm={(resolutions) => void account.confirmAdoption(resolutions).then(setResult(setFeedback))} onRetry={() => void account.retryAccountSync().then(setResult(setFeedback))} text={text} />{feedback ? renderFeedback(feedback, text) : null}{recoveryCodes ? <Card testID="account-recovery-codes" style={{ gap: spacing.md }}><Text maxFontSizeMultiplier={2} style={{ ...typography.bodyStrong }}>{text.recoveryCodes}</Text><Text maxFontSizeMultiplier={2} style={{ ...typography.small }}>{text.recoveryCodesDescription}</Text><Text selectable maxFontSizeMultiplier={2}>{recoveryCodes.join("\n")}</Text></Card> : <Card style={{ gap: spacing.md }} testID="account-recovery-codes-panel"><Text maxFontSizeMultiplier={2} style={{ ...typography.bodyStrong }}>{text.recoveryCodes}</Text><TextInput autoCapitalize="none" autoComplete="password" onChangeText={setRecoveryPassword} placeholder={text.password} placeholderTextColor={styles.placeholder.color as string} secureTextEntry style={styles.input} testID="account-recovery-reauth-password" value={recoveryPassword} /><Button onPress={() => void account.issueRecoveryCodes(recoveryPassword).then((result) => { if (result.kind === "success") setRecoveryCodes(result.recoveryCodes ?? []); setFeedback(result); })} testID="account-recovery-codes-submit" variant="secondary">{text.issueRecoveryCodes}</Button></Card>}<Card style={{ gap: spacing.md }} testID="account-delete-panel"><Text maxFontSizeMultiplier={2} style={{ ...typography.bodyStrong }}>{text.deleteAccount}</Text><Text maxFontSizeMultiplier={2} style={{ ...typography.small }}>{text.deleteAccountDescription}</Text><PublicDeletionLink text={text} /><TextInput autoCapitalize="none" autoComplete="password" onChangeText={setDeletionPassword} placeholder={text.password} placeholderTextColor={styles.placeholder.color as string} secureTextEntry style={styles.input} testID="account-delete-reauth-password" value={deletionPassword} /><Button onPress={() => void account.deleteAccount(deletionPassword).then(setResult(setFeedback))} testID="account-delete-submit" variant="secondary">{text.confirmDeletion}</Button></Card><Button onPress={() => void account.signOut().then(setResult(setFeedback))} testID="account-sign-out" variant="secondary">{text.signOut}</Button></Screen>;
  if (account.state.kind === "signingOut") return <Screen><ScreenHeader backAction={backAction} title={text.signOut} /><InfoBlock body={text.signOutPendingDescription} title={text.signOutPending} testID="account-sign-out-pending" tone="warning" /></Screen>;
  if (account.state.kind === "deleting") return <Screen><ScreenHeader backAction={backAction} title={text.deleteAccount} /><InfoBlock body={text.deletionPendingDescription} title={text.deleting} testID="account-deletion-pending" tone="warning" /></Screen>;
  if (account.state.kind === "backendUnavailable") return <Screen><ScreenHeader backAction={backAction} title={text.account} /><InfoBlock body={text.backendUnavailableDescription} title={text.backendUnavailable} testID="account-backend-unavailable" tone="warning" /><Button onPress={() => void account.refreshVerification().then(setResult(setFeedback))} testID="account-retry-backend" variant="primary">{text.check}</Button><Button onPress={() => void account.signOut()} testID="account-sign-out" variant="ghost">{text.signOut}</Button></Screen>;
  if (account.state.kind === "revokedSession") return <Screen><ScreenHeader backAction={backAction} title={text.account} /><InfoBlock body={text.revokedSessionDescription} title={text.revokedSession} testID="account-revoked-session" tone="warning" /><Button onPress={() => void account.signOut()} testID="account-sign-out" variant="primary">{text.signOut}</Button></Screen>;

  return <Screen><ScreenHeader backAction={backAction} title={mode === "register" ? text.register : mode === "signIn" ? text.signIn : mode === "recovery" ? text.forgotPassword : mode === "resetPassword" ? text.resetPassword : text.account} description={mode === "entry" ? text.accountDescription : undefined} />{renderFeedback(feedback, text)}{mode === "entry" ? <EntryActions onApple={Platform.OS === "ios" ? () => void account.signInWithApple().then(setResult(setFeedback)) : undefined} onGoogle={() => { if (!googleRequest) { setFeedback({ kind: "failure", failure: "providerUnavailable" }); return; } void promptGoogle(); }} onRegister={() => { setFeedback(null); setMode("register"); }} onSignIn={() => { setFeedback(null); setMode("signIn"); }} text={text} /> : null}{mode === "register" ? <CredentialsForm buttonLabel={text.create} confirmation={confirmation} email={email} inputStyle={styles.input} onConfirmationChange={setConfirmation} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={() => { if (password !== confirmation) { setFeedback({ kind: "failure", failure: "passwordMismatch" }); return; } void account.register(email, password).then(setResult(setFeedback)); }} password={password} placeholderTextColor={styles.placeholder.color as string} text={text} testID="account-register-submit" /> : null}{mode === "signIn" ? <CredentialsForm buttonLabel={text.signIn} email={email} forgotPasswordLabel={text.forgotPassword} inputStyle={styles.input} onEmailChange={setEmail} onForgotPassword={() => { setFeedback(null); setMode("recovery"); }} onPasswordChange={setPassword} onSubmit={() => void account.signIn(email, password).then(setResult(setFeedback))} password={password} placeholderTextColor={styles.placeholder.color as string} text={text} testID="account-sign-in-submit" /> : null}{mode === "recovery" ? <RecoveryForm code={recoveryCode} descriptionStyle={styles.formDescription} email={email} inputStyle={styles.input} onCodeChange={setRecoveryCode} onConsume={() => void account.consumeRecoveryCode(recoveryCode).then(setResult(setFeedback))} onEmailChange={setEmail} onSubmit={() => void account.requestPasswordRecovery(email).then(setResult(setFeedback))} placeholderTextColor={styles.placeholder.color as string} text={text} /> : null}{mode === "resetPassword" ? <ResetPasswordForm confirmation={confirmation} descriptionStyle={styles.formDescription} inputStyle={styles.input} onConfirmationChange={setConfirmation} onPasswordChange={setPassword} onSubmit={() => { if (password !== confirmation) { setFeedback({ kind: "failure", failure: "passwordMismatch" }); return; } void account.confirmPasswordReset(resetCode, password).then(setResult(setFeedback)); }} password={password} placeholderTextColor={styles.placeholder.color as string} text={text} /> : null}{mode === "signIn" ? <Button onPress={() => setMode("register")} testID="account-entry-register" variant="ghost">{text.needAccount}</Button> : mode === "register" ? <Button onPress={() => setMode("signIn")} testID="account-entry-sign-in" variant="ghost">{text.alreadyHaveAccount}</Button> : mode !== "entry" ? <Button onPress={() => setMode("entry")} testID="account-entry-home" variant="ghost">{text.account}</Button> : null}</Screen>;
}

function EntryActions({ onApple, onGoogle, onRegister, onSignIn, text }: Readonly<{ onApple?: () => void; onGoogle: () => void; onRegister: () => void; onSignIn: () => void; text: AccountCopy }>) {
  return <View style={{ gap: spacing.md }}><Button onPress={onRegister} testID="account-register" variant="primary">{text.register}</Button><Button onPress={onSignIn} testID="account-sign-in" variant="secondary">{text.signIn}</Button>{onApple ? <Button onPress={onApple} testID="account-apple" variant="secondary">{text.continueWithApple}</Button> : null}<Button onPress={onGoogle} testID="account-google" variant="secondary">{text.continueWithGoogle}</Button></View>;
}

function CredentialsForm({ buttonLabel, confirmation, email, forgotPasswordLabel, inputStyle, onConfirmationChange, onEmailChange, onForgotPassword, onPasswordChange, onSubmit, password, placeholderTextColor, text, testID }: Readonly<{ buttonLabel: string; confirmation?: string; email: string; forgotPasswordLabel?: string; inputStyle: StyleProp<TextStyle>; onConfirmationChange?: (value: string) => void; onEmailChange: (value: string) => void; onForgotPassword?: () => void; onPasswordChange: (value: string) => void; onSubmit: () => void; password: string; placeholderTextColor: string; text: AccountCopy; testID: string }>) {
  return <Card style={{ gap: spacing.md }}><TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={onEmailChange} placeholder={text.email} placeholderTextColor={placeholderTextColor} secureTextEntry={false} style={inputStyle} testID="account-email" value={email} /><TextInput autoCapitalize="none" autoComplete="password" onChangeText={onPasswordChange} placeholder={text.password} placeholderTextColor={placeholderTextColor} secureTextEntry style={inputStyle} testID="account-password" value={password} />{confirmation !== undefined && onConfirmationChange ? <TextInput autoCapitalize="none" autoComplete="password" onChangeText={onConfirmationChange} placeholder={text.confirmPassword} placeholderTextColor={placeholderTextColor} secureTextEntry style={inputStyle} testID="account-password-confirmation" value={confirmation} /> : null}<Button onPress={onSubmit} testID={testID} variant="primary">{buttonLabel}</Button>{forgotPasswordLabel && onForgotPassword ? <Button onPress={onForgotPassword} testID="account-forgot-password" variant="ghost">{forgotPasswordLabel}</Button> : null}</Card>;
}

function RecoveryForm({ code, descriptionStyle, email, inputStyle, onCodeChange, onConsume, onEmailChange, onSubmit, placeholderTextColor, text }: Readonly<{ code: string; descriptionStyle: StyleProp<TextStyle>; email: string; inputStyle: StyleProp<TextStyle>; onCodeChange: (value: string) => void; onConsume: () => void; onEmailChange: (value: string) => void; onSubmit: () => void; placeholderTextColor: string; text: AccountCopy }>) {
  return <Card style={{ gap: spacing.md }}><Text style={descriptionStyle}>{text.recoveryDescription}</Text><TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={onEmailChange} placeholder={text.email} placeholderTextColor={placeholderTextColor} secureTextEntry={false} style={inputStyle} testID="account-recovery-email" value={email} /><Button onPress={onSubmit} testID="account-recovery-submit" variant="primary">{text.sendRecovery}</Button><TextInput autoCapitalize="characters" onChangeText={onCodeChange} placeholder={text.recoveryCode} placeholderTextColor={placeholderTextColor} secureTextEntry style={inputStyle} testID="account-recovery-code" value={code} /><Button onPress={onConsume} testID="account-recovery-code-submit" variant="secondary">{text.consumeRecoveryCode}</Button></Card>;
}

function ResetPasswordForm({ confirmation, descriptionStyle, inputStyle, onConfirmationChange, onPasswordChange, onSubmit, password, placeholderTextColor, text }: Readonly<{ confirmation: string; descriptionStyle: StyleProp<TextStyle>; inputStyle: StyleProp<TextStyle>; onConfirmationChange: (value: string) => void; onPasswordChange: (value: string) => void; onSubmit: () => void; password: string; placeholderTextColor: string; text: AccountCopy }>) {
  return <Card style={{ gap: spacing.md }}><Text style={descriptionStyle}>{text.resetPassword}</Text><TextInput autoCapitalize="none" autoComplete="password-new" onChangeText={onPasswordChange} placeholder={text.password} placeholderTextColor={placeholderTextColor} secureTextEntry style={inputStyle} testID="account-reset-password" value={password} /><TextInput autoCapitalize="none" autoComplete="password-new" onChangeText={onConfirmationChange} placeholder={text.confirmPassword} placeholderTextColor={placeholderTextColor} secureTextEntry style={inputStyle} testID="account-reset-password-confirmation" value={confirmation} /><Button onPress={onSubmit} testID="account-reset-submit" variant="primary">{text.reset}</Button></Card>;
}

function renderFeedback(feedback: Feedback | null, text: AccountCopy) {
  if (!feedback) return null;
  if (feedback.kind === "success" && feedback.next === "recoveryAccepted") return <InfoBlock body={text.recoveryAcceptedDescription} title={text.recoveryAccepted} testID="account-recovery-accepted" tone="success" />;
  if (feedback.kind === "success") return <InfoBlock body={text.accountDescription} title={text.account} tone="success" />;
  const message = text[feedback.failure];
  return <InfoBlock body={message} title={text.invalid} testID={`account-feedback-${feedback.failure}`} tone="warning" />;
}

function PublicDeletionLink({ text }: Readonly<{ text: AccountCopy }>) {
  const publicLinks = readPublicLegalLinksFromRuntime();
  const [openFailure, setOpenFailure] = useState(false);
  const available = publicLinks.kind === "configured";
  const url = available ? publicLinks.value.publicDeletionUrl : null;

  const openPublicDeletionLink = async () => {
    if (!url) return;
    setOpenFailure(false);
    try {
      await Linking.openURL(url);
    } catch {
      setOpenFailure(true);
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {available ? null : <InfoBlock body={publicLinks.reason === "invalid_public_environment" ? text.publicDeletionLinkInvalid : text.publicDeletionLinkUnavailable} title={text.publicDeletionLink} testID="account-public-deletion-unavailable" tone="warning" />}
      {openFailure ? <InfoBlock body={text.publicDeletionLinkOpenFailed} title={text.publicDeletionLinkOpenFailedTitle} testID="account-public-deletion-open-failed" tone="warning" /> : null}
      <PublicLinkRow
        available={available}
        detail={available ? text.publicDeletionLinkDetail : text.publicDeletionLinkUnavailable}
        icon="trash"
        onPress={() => { void openPublicDeletionLink(); }}
        testID="account-public-deletion-link"
        title={text.publicDeletionLink}
      />
    </View>
  );
}

function AccountDataPanel({ accountData, onConfirm, onRetry, text }: Readonly<{ accountData: import("../../application/account/accountDataService").AccountDataSession; onConfirm: (resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[]) => void; onRetry: () => void; text: AccountCopy }>) {
  const [resolutions, setResolutions] = useState<Record<string, "keep_guest" | "keep_account">>({});
  if (accountData.status === "previewReady" && accountData.preview) {
    const plan = accountData.preview.plan;
    const complete = plan.conflictRecordIds.every((id) => resolutions[id] !== undefined);
    return <Card testID="account-adoption-preview" style={{ gap: spacing.md }}><Text maxFontSizeMultiplier={2} style={{ ...typography.bodyStrong }}>{text.adoptionPreview}</Text><Text maxFontSizeMultiplier={2} style={{ ...typography.small }}>{text.adoptionPreviewDescription}</Text><Text maxFontSizeMultiplier={2}>{`${text.preserve}: ${plan.localRecordCount} · ${text.upload}: ${plan.uploadRecordIds.length} · ${text.restore}: ${plan.restoreRecordIds.length} · ${text.deduplicated}: ${plan.deduplicatedRecordIds.length}`}</Text>{plan.conflictRecordIds.length > 0 ? <View style={{ gap: spacing.sm }}><Text maxFontSizeMultiplier={2} style={{ ...typography.bodyStrong }}>{`${text.decisions}: ${plan.conflictRecordIds.length}`}</Text>{plan.conflictRecordIds.map((id) => <View key={id} style={{ gap: spacing.xs }}><Text maxFontSizeMultiplier={2}>{id}</Text><View style={{ flexDirection: "row", gap: spacing.sm }}><Button onPress={() => setResolutions((current) => ({ ...current, [id]: "keep_guest" }))} variant={resolutions[id] === "keep_guest" ? "primary" : "secondary"}>{text.keepGuest}</Button><Button onPress={() => setResolutions((current) => ({ ...current, [id]: "keep_account" }))} variant={resolutions[id] === "keep_account" ? "primary" : "secondary"}>{text.keepAccount}</Button></View></View>)}</View> : null}<Button disabled={!complete} onPress={() => onConfirm(plan.conflictRecordIds.map((conflictId) => ({ conflictId, resolution: resolutions[conflictId]! })))} testID="account-adoption-confirm" variant="primary">{text.confirmAdoption}</Button></Card>;
  }
  if (accountData.status === "synced") return <InfoBlock body={text.syncCompleteDescription} title={text.syncComplete} testID="account-sync-synced" tone="success" />;
  if (accountData.status === "offlinePending") return <Card testID="account-sync-pending" style={{ gap: spacing.md }}><InfoBlock body={text.pendingDescription} title={text.pending} tone="warning" /><Button onPress={onRetry} testID="account-sync-retry" variant="primary">{text.retrySync}</Button></Card>;
  if (accountData.status === "signOutPending") return <InfoBlock body={text.signOutPendingDescription} title={text.signOutPending} testID="account-sign-out-pending" tone="warning" />;
  if (accountData.status === "remoteDeletionPending") return <InfoBlock body={text.deletionPendingDescription} title={text.deletionPending} testID="account-deletion-pending" tone="warning" />;
  if (accountData.status === "localCleanupPending") return <InfoBlock body={text.localCleanupPendingDescription} title={text.localCleanupPending} testID="account-deletion-local-cleanup-pending" tone="warning" />;
  if (accountData.activeSessionBlocked || accountData.lastFailureCode === "active_session_adoption_blocked") return <InfoBlock body={text.activeSessionBlocked} title={text.adoptionPreview} testID="account-adoption-active-session" tone="warning" />;
  if (accountData.lastFailureCode === "journal_recovery_required") return <InfoBlock body={text.journalBlocked} title={text.adoptionPreview} testID="account-adoption-journal" tone="warning" />;
  if (accountData.status === "conflict") return <Card testID="account-sync-conflict" style={{ gap: spacing.md }}><InfoBlock body={text.conflictDescription} title={text.conflict} tone="warning" /><Button onPress={onRetry} testID="account-sync-retry" variant="primary">{text.retrySync}</Button></Card>;
  if (accountData.status === "failed") return <Card testID="account-sync-failed" style={{ gap: spacing.md }}><InfoBlock body={text.dataFailureDescription} title={text.dataFailure} tone="warning" /><Button onPress={onRetry} testID="account-sync-retry" variant="primary">{text.retrySync}</Button></Card>;
  return <InfoBlock body={text.syncing} title={text.syncing} testID="account-syncing" />;
}

function setResult(setFeedback: (feedback: Feedback) => void) {
  return (result: AccountCommandResult) => setFeedback(result);
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  email: { ...typography.bodyStrong, color: palette.textPrimary },
  formDescription: { ...typography.small, color: palette.textSecondary },
  input: { backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: 10, borderWidth: 1, color: palette.textPrimary, minHeight: 48, paddingHorizontal: 14 },
  placeholder: { color: palette.textMuted },
});
