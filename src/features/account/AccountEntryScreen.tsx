import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import accountCopy from "../../locales/en/account.json";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  useWindowDimensions,
} from "react-native";
import type { Edge } from "react-native-safe-area-context";
import * as Google from "expo-auth-session/providers/google";
import * as Clipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import GoogleIcon from "../../assets/icons/google.svg";

import {
  Button,
  Card,
  Icon,
  InfoBlock,
  PublicLinkRow,
  Screen,
  ScreenHeader,
} from "../../components";
import { PatternlyMark } from "../../components/PatternlyMark";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import {
  usePatternlyAccount,
  type AccountCommandResult,
} from "../../application/account/AccountSessionProvider";
import type { AccountDataSession } from "../../application/account/accountDataService";
import {
  readFirebaseClientConfiguration,
  readPublicLegalLinksFromRuntime,
} from "../../infrastructure/firebase/publicConfig";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import {
  spacing,
  typography,
  type AppColors,
} from "../../theme";
import { useAccountCommand } from "./useAccountCommand";

type AccountEntryProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.ACCOUNT_ENTRY
>;
type AccountMode = NonNullable<
  NonNullable<RootStackParamList[typeof ROUTES.ACCOUNT_ENTRY]>["initialMode"]
>;
type Feedback = AccountCommandResult;


type AccountCopy = Record<keyof typeof accountCopy | "invalidEmail", string>;
type AccountContext = ReturnType<typeof usePatternlyAccount>;

function AuthText({ maxFontSizeMultiplier = 2, ...props }: TextProps) {
  const { fontScale } = useWindowDimensions();
  return <Text key={fontScale} maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
}

export function AccountEntryScreen({ navigation, route }: AccountEntryProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.3;
  const { locale } = useAppPreferences();
  const { t } = useTranslation("account");
  const text = {
  account: t("account"),
  accountDescription: t("accountDescription"),
  accountManagementDescription: t("accountManagementDescription"),
  accountSignedInAs: t("accountSignedInAs"),
  welcomeTitle: t("welcomeTitle"),
  welcomeDescription: t("welcomeDescription"),
  continueWithoutAccount: t("continueWithoutAccount"),
  emailFormatError: t("emailFormatError"),
  signInCredentialsError: t("signInCredentialsError"),
  signInProblem: t("signInProblem"),
  enterEmail: t("enterEmail"),
  enterPassword: t("enterPassword"),
  or: t("or"),
  unavailable: t("unavailable"),
  unavailableDescription: t("unavailableDescription"),
  authRestoreTimeout: t("authRestoreTimeout"),
  authRestoreTimeoutDescription: t("authRestoreTimeoutDescription"),
  register: t("register"),
  signIn: t("signIn"),
  email: t("email"),
  password: t("password"),
  confirmPassword: t("confirmPassword"),
  create: t("create"),
  continueWithGoogle: t("continueWithGoogle"),
  continueWithApple: t("continueWithApple"),
  forgotPassword: t("forgotPassword"),
  alreadyHaveAccount: t("alreadyHaveAccount"),
  needAccount: t("needAccount"),
  sendRecovery: t("sendRecovery"),
  consumeRecoveryCode: t("consumeRecoveryCode"),
  recoveryCode: t("recoveryCode"),
  recoveryDescription: t("recoveryDescription"),
  recoveryCodeOption: t("recoveryCodeOption"),
  recoveryCodeDescription: t("recoveryCodeDescription"),
  backToEmailRecovery: t("backToEmailRecovery"),
  recoveryAccepted: t("recoveryAccepted"),
  recoveryAcceptedDescription: t("recoveryAcceptedDescription"),
  resetPasswordComplete: t("resetPasswordComplete"),
  resetPasswordCompleteDescription: t("resetPasswordCompleteDescription"),
  verification: t("verification"),
  verificationDescription: t("verificationDescription"),
  resend: t("resend"),
  check: t("check"),
  signOut: t("signOut"),
  signOutPending: t("signOutPending"),
  signOutPendingDescription: t("signOutPendingDescription"),
  deleteAccount: t("deleteAccount"),
  deleteAccountDescription: t("deleteAccountDescription"),
  confirmDeletion: t("confirmDeletion"),
  publicDeletionLink: t("publicDeletionLink"),
  publicDeletionLinkDetail: t("publicDeletionLinkDetail"),
  publicDeletionLinkUnavailable: t("publicDeletionLinkUnavailable"),
  publicDeletionLinkInvalid: t("publicDeletionLinkInvalid"),
  publicDeletionLinkOpenFailedTitle: t("publicDeletionLinkOpenFailedTitle"),
  publicDeletionLinkOpenFailed: t("publicDeletionLinkOpenFailed"),
  deleting: t("deleting"),
  deletionPending: t("deletionPending"),
  deletionPendingDescription: t("deletionPendingDescription"),
  localCleanupPending: t("localCleanupPending"),
  localCleanupPendingDescription: t("localCleanupPendingDescription"),
  remoteDeletionPending: t("remoteDeletionPending"),
  localCleanupFailure: t("localCleanupFailure"),
  sessionRevocationPending: t("sessionRevocationPending"),
  reauthenticationRequired: t("reauthenticationRequired"),
  recoveryCodes: t("recoveryCodes"),
  recoveryCodesDescription: t("recoveryCodesDescription"),
  recoveryCodesIntro: t("recoveryCodesIntro"),
  copyRecoveryCodes: t("copyRecoveryCodes"),
  recoveryCodesCopied: t("recoveryCodesCopied"),
  recoveryCodesCopyFailed: t("recoveryCodesCopyFailed"),
  accountReadyTitle: t("accountReadyTitle"),
  accountReadyDescription: t("accountReadyDescription"),
  issueRecoveryCodes: t("issueRecoveryCodes"),
  accountEntryTitle: t("accountEntryTitle"),
  accountEntryDescription: t("accountEntryDescription"),
  transferGuestData: t("transferGuestData"),
  transferGuestDataDescription: t("transferGuestDataDescription"),
  discardGuestDataDescription: t("discardGuestDataDescription"),
  conflictChoiceTitle: t("conflictChoiceTitle"),
  conflictChoiceDescription: t("conflictChoiceDescription"),
  keepGuestData: t("keepGuestData"),
  keepAccountData: t("keepAccountData"),
  accountEntryContinue: t("accountEntryContinue"),
  recoveryCodesSaved: t("recoveryCodesSaved"),
  recoveryCodesSaveRequired: t("recoveryCodesSaveRequired"),
  recoveryCodeReauthDescription: t("recoveryCodeReauthDescription"),
  recoveryCodeSignInAgain: t("recoveryCodeSignInAgain"),
  recoveryCodeSignInAgainButton: t("recoveryCodeSignInAgainButton"),
  accountRecoveryTitle: t("accountRecoveryTitle"),
  accountBindingMismatch: t("accountBindingMismatch"),
  accountBindingMismatchDescription: t("accountBindingMismatchDescription"),
  accountBindingMismatchGuestDescription: t("accountBindingMismatchGuestDescription"),
  accountRecoveryDescription: t("accountRecoveryDescription"),
  retrySync: t("retrySync"),
  syncing: t("syncing"),
  syncComplete: t("syncComplete"),
  syncCompleteDescription: t("syncCompleteDescription"),
  pending: t("pending"),
  pendingDescription: t("pendingDescription"),
  conflict: t("conflict"),
  conflictDescription: t("conflictDescription"),
  dataFailure: t("dataFailure"),
  dataFailureDescription: t("dataFailureDescription"),
  resumeRequired: t("resumeRequired"),
  resumeRequiredDescription: t("resumeRequiredDescription"),
  activeSessionBlocked: t("activeSessionBlocked"),
  journalBlocked: t("journalBlocked"),
  pendingSyncRequiresNetwork: t("pendingSyncRequiresNetwork"),
  journalRecoveryFailure: t("journalRecoveryFailure"),
  localDeletionFailure: t("localDeletionFailure"),
  remoteFailure: t("remoteFailure"),
  account_revision_conflict: t("account_revision_conflict"),
  version_conflict: t("version_conflict"),
  adoption_conflict: t("adoption_conflict"),
  journal_recovery_required: t("journal_recovery_required"),
  account_data_unavailable: t("account_data_unavailable"),
  backendUnavailable: t("backendUnavailable"),
  backendUnavailableDescription: t("backendUnavailableDescription"),
  revokedSession: t("revokedSession"),
  revokedSessionDescription: t("revokedSessionDescription"),
  resetPassword: t("resetPassword"),
  resetPasswordDescription: t("resetPasswordDescription"),
  reset: t("reset"),
  backToSignIn: t("backToSignIn"),
  acceptTermsPrefix: t("acceptTermsPrefix"),
  termsOfService: t("termsOfService"),
  privacyPolicy: t("privacyPolicy"),
  and: t("and"),
  showPassword: t("showPassword"),
  hidePassword: t("hidePassword"),
  passwordMismatch: t("passwordMismatch"),
  termsRequired: t("termsRequired"),
  termsUnavailable: t("termsUnavailable"),
  weakPassword: t("weakPassword"),
  invalid: t("invalid"),
  invalidEmail: t("emailFormatError"),
  duplicate: t("duplicate"),
  rateLimited: t("rateLimited"),
  offline: t("offline"),
  expiredAction: t("expiredAction"),
  providerUnavailable: t("providerUnavailable"),
  invalidCredential: t("invalidCredential"),
  invalidRecoveryCode: t("invalidRecoveryCode"),
  recoveryCodeUsed: t("recoveryCodeUsed"),
  unverifiedIdentity: t("unverifiedIdentity"),
  };
  const account = usePatternlyAccount();
  const accountRef = useRef(account);
  accountRef.current = account;
  const [mode, setMode] = useState<AccountMode>(
    route.params?.initialMode ?? "entry",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryMethod, setRecoveryMethod] = useState<"email" | "code">("email");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const backAction = navigation.canGoBack()
    ? { onPress: () => navigation.goBack() }
    : undefined;
  const continueWithoutAccount = () => {
    if (account.state.kind === "guest" && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    account.continueAsGuest();
  };
  const beginRegistration = () => {
    setFeedback(null);
    setAcceptedTerms(false);
    setMode("register");
  };
  const firebaseConfig = useMemo(() => readFirebaseClientConfiguration(), []);
  const [googleRequest, googleResponse, promptGoogle] =
    Google.useIdTokenAuthRequest(
      {
        androidClientId:
          firebaseConfig.kind === "configured"
            ? firebaseConfig.value.googleAndroidClientId
            : undefined,
        iosClientId:
          firebaseConfig.kind === "configured"
            ? firebaseConfig.value.googleIosClientId
            : undefined,
        selectAccount: true,
        webClientId:
          firebaseConfig.kind === "configured"
            ? firebaseConfig.value.googleWebClientId
            : undefined,
      },
      { scheme: "com.lkurczab.patternly" },
    );

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type !== "success") {
      if (googleResponse.type === "error")
        setFeedback({ kind: "failure", failure: "providerUnavailable" });
      return;
    }
    const idToken = googleResponse.params.id_token;
    void accountRef.current
      .signInWithGoogle(idToken ?? "")
      .then(setResult(setFeedback));
  }, [googleResponse]);

  useEffect(() => {
    const consumeUrl = (url: string | null) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get("oobCode");
        const action = parsed.searchParams.get("mode");
        if (!code) return;
        if (action === "verifyEmail")
          void accountRef.current
            .applyVerificationCode(code)
            .then(setResult(setFeedback));
        if (action === "resetPassword") {
          setResetCode(code);
          setMode("resetPassword");
        }
        if (action !== "verifyEmail" && action !== "resetPassword")
          setFeedback({ kind: "failure", failure: "invalid" });
      } catch {
        setFeedback({ kind: "failure", failure: "invalid" });
      }
    };
    void Linking.getInitialURL().then(consumeUrl);
    const subscription = Linking.addEventListener("url", (event) =>
      consumeUrl(event.url),
    );
    return () => subscription.remove();
  }, []);

  const screenEdges: Edge[] = ["top", "bottom"];
  if (account.state.kind === "unavailable") {
    const authRestoreTimedOut = account.state.reason === "auth_restore_timeout";
    return (
      <AuthStatusScreen
        action={authRestoreTimedOut
          ? { label: text.check, onPress: account.retrySessionRestore, testID: "account-retry-session-restore" }
          : { label: text.continueWithoutAccount, onPress: continueWithoutAccount, testID: "account-unavailable-guest" }}
        backAction={backAction}
        body={authRestoreTimedOut ? text.authRestoreTimeoutDescription : text.unavailableDescription}
        testID="account-unavailable"
        title={authRestoreTimedOut ? text.authRestoreTimeout : text.unavailable}
      >
        {authRestoreTimedOut ? (
          <Button onPress={continueWithoutAccount} testID="account-unavailable-guest" variant="ghost">
            {text.continueWithoutAccount}
          </Button>
        ) : null}
      </AuthStatusScreen>
    );
  }
  if (account.state.kind === "guestAccessBlocked" && mode === "entry")
    return (
      <AuthStatusScreen
        action={{ label: text.signIn, onPress: () => setMode("signIn"), testID: "account-binding-sign-in" }}
        backAction={backAction}
        body={text.accountBindingMismatchGuestDescription}
        testID="account-guest-access-blocked"
        title={text.accountBindingMismatch}
      />
    );
  if (account.state.kind === "verificationPending")
    return (
      <AuthStatusScreen
        backAction={backAction}
        body={text.verificationDescription}
        detail={account.state.user.email ?? email}
        testID="account-verification-pending"
        title={text.verification}
      >
        {renderFeedback(feedback, text)}
        <Button
          loading={false}
          onPress={() =>
            void account.resendVerification().then(setResult(setFeedback))
          }
          testID="account-resend-verification"
          variant="primary"
        >
          {text.resend}
        </Button>
        <Button
          onPress={() =>
            void account.refreshVerification().then(setResult(setFeedback))
          }
          testID="account-check-verification"
          variant="secondary"
        >
          {text.check}
        </Button>
        <Button
          onPress={() => void account.signOut()}
          testID="account-sign-out"
          variant="ghost"
        >
          {text.signOut}
        </Button>
      </AuthStatusScreen>
    );
  if (account.state.kind === "authenticated")
    return isHealthyAccountData(account.state.accountData) ? (
      <AccountManagementScreen
        key={account.state.user.uid}
        account={account}
        backAction={backAction}
        text={text}
      />
    ) : account.state.accountData.status === "previewReady" ? (
      <AccountAdoptionScreen
        key={account.state.user.uid}
        account={account}
        accountData={account.state.accountData}
        backAction={backAction}
        text={text}
      />
    ) : (
      <AccountRecoveryScreen
        key={account.state.user.uid}
        account={account}
        accountData={account.state.accountData}
        backAction={backAction}
        text={text}
      />
    );
  if (account.state.kind === "signingOut")
    return (
      <Screen edges={screenEdges}>
        <ScreenHeader backAction={backAction} title={text.signOut} />
        <InfoBlock
          body={text.signOutPendingDescription}
          title={text.signOutPending}
          testID="account-sign-out-pending"
          tone="warning"
        />
      </Screen>
    );
  if (account.state.kind === "deleting")
    return (
      <Screen edges={screenEdges}>
        <ScreenHeader backAction={backAction} title={text.deleteAccount} />
        <InfoBlock
          body={text.deletionPendingDescription}
          title={text.deleting}
          testID="account-deletion-pending"
          tone="warning"
        />
      </Screen>
    );
  if (account.state.kind === "backendUnavailable")
    return (
      <AuthStatusScreen
        backAction={backAction}
        body={text.backendUnavailableDescription}
        testID="account-backend-unavailable"
        title={text.backendUnavailable}
      >
        <Button
          onPress={() =>
            void account.refreshVerification().then(setResult(setFeedback))
          }
          testID="account-retry-backend"
          variant="primary"
        >
          {text.check}
        </Button>
        <Button
          onPress={() => void account.signOut()}
          testID="account-sign-out"
          variant="ghost"
        >
          {text.signOut}
        </Button>
      </AuthStatusScreen>
    );
  if (account.state.kind === "revokedSession")
    return (
      <AuthStatusScreen
        backAction={backAction}
        body={text.revokedSessionDescription}
        testID="account-revoked-session"
        title={text.revokedSession}
      >
        <Button
          onPress={() => void account.signOut()}
          testID="account-sign-out"
          variant="primary"
        >
          {text.signOut}
        </Button>
      </AuthStatusScreen>
    );

  if (mode === "entry") {
    return (
      <WelcomeScreen
        onContinueAsGuest={continueWithoutAccount}
        onRegister={beginRegistration}
        onSignIn={() => {
          setFeedback(null);
          setMode("signIn");
        }}
        text={text}
      />
    );
  }

  if (mode === "signIn") {
    const retainedDataNotice = account.state.kind === "guestAccessBlocked" ? (
      <AuthText style={styles.authDescription} testID="account-binding-sign-in-notice">
        {text.accountBindingMismatchGuestDescription}
      </AuthText>
    ) : null;
    return (
      <Screen
        ambient
        ambientVariant="auth"
        edges={screenEdges}
        footer={
          account.state.kind === "guestAccessBlocked" ? undefined : (
            <Button
              labelStyle={styles.guestActionLabel}
              onPress={continueWithoutAccount}
              testID="account-sign-in-guest"
              variant="ghost"
            >
              {text.continueWithoutAccount}
            </Button>
          )
        }
        footerVariant="sticky"
        style={[styles.authScreen, largeText ? styles.authScreenLargeText : null]}
      >
        <View style={[styles.authPanel, largeText ? styles.authPanelLargeText : null]}>
          <AuthText style={styles.authTitle}>
            {text.signIn}
          </AuthText>
          {retainedDataNotice}
          <SignInForm
            email={email}
            feedback={feedback}
            inputStyle={styles.authInput}
            onEmailChange={(value) => {
              setFeedback(null);
              setEmail(value);
            }}
            onPasswordChange={(value) => {
              setFeedback(null);
              setPassword(value);
            }}
            onSubmit={() =>
              void account.signIn(email, password).then(setResult(setFeedback))
            }
            password={password}
            placeholderTextColor={styles.authPlaceholder.color as string}
            text={text}
          />
          <View style={[styles.authLinks, largeText ? styles.authLinksLargeText : null]}>
            <Button
              labelStyle={styles.textActionLabel}
              onPress={() => setMode("recovery")}
              variant="ghost"
            >
              {text.forgotPassword}
            </Button>
            <Button
              labelStyle={styles.textActionLabel}
              onPress={beginRegistration}
              testID="account-entry-register"
              variant="ghost"
            >
              {text.register}
            </Button>
          </View>
          <Divider label={text.or} />
          {Platform.OS === "ios" ? (
            <ProviderButton
              icon="apple"
              onPress={() =>
                void account.signInWithApple().then(setResult(setFeedback))
              }
              text={text.continueWithApple}
            />
          ) : null}
          <ProviderButton
            icon="google"
            onPress={() => {
              if (!googleRequest) {
                setFeedback({
                  kind: "failure",
                  failure: "providerUnavailable",
                });
                return;
              }
              void promptGoogle();
            }}
            text={text.continueWithGoogle}
          />
        </View>
      </Screen>
    );
  }

  const modeTitle = mode === "register"
    ? text.register
    : mode === "recovery"
      ? recoveryMethod === "code" ? text.consumeRecoveryCode : text.forgotPassword
      : mode === "resetPassword"
        ? text.resetPassword
        : text.account;
  const modeDescription = mode === "recovery"
    ? recoveryMethod === "code" ? text.recoveryCodeDescription : text.recoveryDescription
    : mode === "resetPassword"
      ? text.resetPasswordDescription
      : null;

  if (mode === "recovery" && feedback?.kind === "success" && feedback.next === "recoveryAccepted")
    return (
      <AuthStatusScreen
        backAction={backAction}
        body={text.recoveryAcceptedDescription}
        footerAction={{ label: text.backToSignIn, onPress: () => { setFeedback(null); setMode("signIn"); }, testID: "account-recovery-back-to-sign-in" }}
        testID="account-recovery-accepted"
        title={text.recoveryAccepted}
      />
    );
  if (mode === "resetPassword" && feedback?.kind === "success")
    return (
      <AuthStatusScreen
        action={{ label: text.signIn, onPress: () => { setFeedback(null); setMode("signIn"); }, testID: "account-reset-back-to-sign-in" }}
        backAction={backAction}
        body={text.resetPasswordCompleteDescription}
        testID="account-reset-complete"
        title={text.resetPasswordComplete}
      />
    );

  return (
    <Screen
      ambient
      ambientVariant="auth"
      edges={screenEdges}
      footer={
        <Button
          labelStyle={styles.textActionLabel}
          onPress={() => {
            setFeedback(null);
            setMode("signIn");
          }}
          testID="account-back-to-sign-in"
          variant="ghost"
        >
          {mode === "register" ? text.alreadyHaveAccount : text.backToSignIn}
        </Button>
      }
      footerVariant="sticky"
      style={[styles.authScreen, largeText ? styles.authScreenLargeText : null]}
    >
      <View style={[styles.authPanel, largeText ? styles.authPanelLargeText : null]}>
        <AuthText
          style={[
            styles.authTitle,
            mode === "recovery" && recoveryMethod === "code"
              ? styles.recoveryCodeTitle
              : null,
          ]}
        >
          {modeTitle}
        </AuthText>
        {modeDescription ? (
          <AuthText style={styles.authDescription}>{modeDescription}</AuthText>
        ) : null}
      {mode === "register" && isRegisterFieldFailure(feedback) ? null : isAuthFieldFailure(mode, recoveryMethod, feedback) ? null : renderFeedback(feedback, text)}
      {mode === "register" ? (
        <CredentialsForm
          acceptedTerms={acceptedTerms}
          buttonLabel={text.create}
          confirmation={confirmation}
          email={email}
          feedback={feedback}
          inputStyle={styles.authInput}
          onAcceptedTermsChange={setAcceptedTerms}
          onConfirmationChange={(value) => { setFeedback(null); setConfirmation(value); }}
          onEmailChange={(value) => { setFeedback(null); setEmail(value); }}
          onPasswordChange={(value) => { setFeedback(null); setPassword(value); }}
          onSubmit={() => {
            if (password !== confirmation) {
              setFeedback({ kind: "failure", failure: "passwordMismatch" });
              return;
            }
            void account.register(email, password).then(setResult(setFeedback));
          }}
          password={password}
          placeholderTextColor={styles.authPlaceholder.color as string}
          text={text}
          testID="account-register-submit"
        />
      ) : null}
      {mode === "recovery" ? (
        <RecoveryForm
          code={recoveryCode}
          email={email}
          feedback={feedback}
          inputStyle={styles.authInput}
          method={recoveryMethod}
          onCodeChange={(value) => { setFeedback(null); setRecoveryCode(value); }}
          onConsume={() =>
            void account
              .consumeRecoveryCode(recoveryCode)
              .then(setResult(setFeedback))
          }
          onEmailChange={(value) => { setFeedback(null); setEmail(value); }}
          onSelectCode={() => { setFeedback(null); setRecoveryMethod("code"); }}
          onSelectEmail={() => { setFeedback(null); setRecoveryMethod("email"); }}
          onSubmit={() =>
            void account
              .requestPasswordRecovery(email)
              .then(setResult(setFeedback))
          }
          placeholderTextColor={styles.authPlaceholder.color as string}
          text={text}
        />
      ) : null}
      {mode === "resetPassword" ? (
        <ResetPasswordForm
          confirmation={confirmation}
          feedback={feedback}
          inputStyle={styles.authInput}
          onConfirmationChange={(value) => { setFeedback(null); setConfirmation(value); }}
          onPasswordChange={(value) => { setFeedback(null); setPassword(value); }}
          onSubmit={() => {
            if (password !== confirmation) {
              setFeedback({ kind: "failure", failure: "passwordMismatch" });
              return;
            }
            void account
              .confirmPasswordReset(resetCode, password)
              .then(setResult(setFeedback));
          }}
          password={password}
          placeholderTextColor={styles.authPlaceholder.color as string}
          text={text}
        />
      ) : null}
      </View>
    </Screen>
  );
}

type BackAction = Readonly<{ onPress: () => void }> | undefined;
function RecoveryCodesDisplay({ codes, text }: Readonly<{ codes: readonly string[]; text: AccountCopy }>) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppPreferences();
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "failed">("idle");
  const copyCodes = async () => {
    setCopyState("copying");
    try {
      const copied = await Clipboard.setStringAsync(codes.join("\n"));
      setCopyState(copied ? "copied" : "failed");
    } catch {
      setCopyState("failed");
    }
  };
  return (
    <View style={styles.accountActionGroup}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copyState === "copied" ? `${text.recoveryCodesCopied}. ${text.copyRecoveryCodes}` : text.copyRecoveryCodes}
        accessibilityState={{ busy: copyState === "copying", disabled: copyState === "copying" }}
        disabled={copyState === "copying"}
        onPress={() => void copyCodes()}
        style={styles.copyCodesButton}
        testID="account-copy-recovery-codes"
      >
        <Icon color={colors.primary} name={copyState === "copied" ? "check" : "copy"} size={20} />
        <AuthText accessibilityLiveRegion="polite" style={styles.copyCodesLabel}>
          {copyState === "copied" ? text.recoveryCodesCopied : text.copyRecoveryCodes}
        </AuthText>
      </Pressable>
      <View style={styles.recoveryCodeSheet}>
        <AuthText selectable style={styles.accountCode}>{codes.join("\n")}</AuthText>
      </View>
      {copyState === "failed" ? <AuthText accessibilityRole="alert" style={styles.fieldError}>{text.recoveryCodesCopyFailed}</AuthText> : null}
    </View>
  );
}

function AccountManagementScreen({
  account,
  backAction,
  text,
}: Readonly<{
  account: AccountContext;
  backAction: BackAction;
  text: AccountCopy;
}>) {
  const styles = useThemedStyles(createStyles);
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<readonly string[] | null>(null);
  const [recoveryFeedback, setRecoveryFeedback] = useState<Feedback | null>(null);
  const [recoveryNeedsReauthentication, setRecoveryNeedsReauthentication] = useState(false);
  const [deletionPassword, setDeletionPassword] = useState("");
  const [deletionFeedback, setDeletionFeedback] = useState<Feedback | null>(null);
  const [accountFeedback, setAccountFeedback] = useState<Feedback | null>(null);
  const { busyAction, runCommand } = useAccountCommand();

  const authenticated = account.state.kind === "authenticated" ? account.state : null;
  if (!authenticated) return null;

  const recoveryUsesPassword = authenticated.user.provider === "password";
  const issueCodes = () => {
    runCommand(
      "recovery",
      () => account.issueRecoveryCodes(recoveryNeedsReauthentication ? recoveryPassword : undefined),
      (result) => {
        if (
          result.kind === "success" &&
          result.next === "recoveryCodesIssued" &&
          result.recoveryCodes &&
          result.recoveryCodes.length > 0
        ) {
          setRecoveryCodes(result.recoveryCodes);
          setRecoveryPassword("");
          setRecoveryNeedsReauthentication(false);
          setRecoveryFeedback(null);
          return;
        }
        if (result.kind === "failure" && isReauthenticationFailure(result)) setRecoveryNeedsReauthentication(true);
        setRecoveryFeedback(
          result.kind === "failure"
            ? result
            : { kind: "failure", failure: "remoteFailure" },
        );
      },
    );
  };
  const deleteAccount = () => {
    runCommand("delete", () => account.deleteAccount(deletionPassword), setDeletionFeedback);
  };
  const signOut = () => {
    runCommand("signOut", () => account.signOut(), setAccountFeedback);
  };

  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        <Button
          disabled={busyAction !== null}
          loading={busyAction === "signOut"}
          onPress={signOut}
          testID="account-sign-out"
          variant="ghost"
        >
          {text.signOut}
        </Button>
      }
      footerVariant="sticky"
    >
      <ScreenHeader backAction={backAction} title={text.account} />
      <View style={styles.accountIntro}>
        <AuthText style={styles.accountBody}>{text.accountManagementDescription}</AuthText>
        {authenticated.user.email ? <AuthText style={styles.accountIdentity}>{`${text.accountSignedInAs}: ${authenticated.user.email}`}</AuthText> : null}
      </View>
      {accountFeedback ? renderFeedback(accountFeedback, text, text.account) : null}
      <Card style={styles.accountCard} testID="account-recovery-codes-panel">
        <AuthText style={styles.accountHeading}>{text.recoveryCodes}</AuthText>
        <AuthText style={styles.accountBody}>{recoveryCodes ? text.recoveryCodesDescription : text.recoveryCodesIntro}</AuthText>
        {recoveryCodes ? (
          <View testID="account-recovery-codes"><RecoveryCodesDisplay codes={recoveryCodes} text={text} /></View>
        ) : (
          <View style={styles.accountActionGroup}>
            {recoveryFeedback && !isReauthenticationFailure(recoveryFeedback) ? renderFeedback(recoveryFeedback, text, text.recoveryCodes) : null}
            {recoveryNeedsReauthentication && recoveryUsesPassword ? (
              <View style={styles.accountActionGroup}>
                <AuthText style={styles.accountBody}>{text.recoveryCodeReauthDescription}</AuthText>
                <AuthPasswordInput
                  error={isReauthenticationFailure(recoveryFeedback) ? text.reauthenticationRequired : undefined}
                  errorTestID="account-recovery-reauth-password-error"
                  inputStyle={styles.input}
                  label={text.password}
                  onChangeText={(value) => {
                    setRecoveryPassword(value);
                    setRecoveryFeedback(null);
                  }}
                  placeholder={text.password}
                  placeholderTextColor={styles.placeholder.color as string}
                  testID="account-recovery-reauth-password"
                  text={text}
                  value={recoveryPassword}
                />
              </View>
            ) : recoveryNeedsReauthentication ? (
              <InfoBlock
                body={text.recoveryCodeSignInAgain}
                title={text.recoveryCodes}
                testID="account-recovery-sign-in-required"
                tone="warning"
              />
            ) : null}
            {recoveryNeedsReauthentication && !recoveryUsesPassword ? (
              <Button
                disabled={busyAction !== null}
                loading={busyAction === "signOut"}
                onPress={signOut}
                testID="account-recovery-sign-in-again"
                variant="secondary"
              >
                {text.recoveryCodeSignInAgainButton}
              </Button>
            ) : (
              <Button
                disabled={busyAction !== null}
                loading={busyAction === "recovery"}
                onPress={issueCodes}
                testID="account-recovery-codes-submit"
                variant="secondary"
              >
                {text.issueRecoveryCodes}
              </Button>
            )}
          </View>
        )}
      </Card>
      <Card style={styles.accountCard} testID="account-delete-panel">
        <AuthText style={styles.accountHeading}>{text.deleteAccount}</AuthText>
        <AuthText style={styles.accountBody}>{text.deleteAccountDescription}</AuthText>
        <PublicDeletionLink text={text} />
        {deletionFeedback && !isReauthenticationFailure(deletionFeedback) ? renderFeedback(deletionFeedback, text, text.deleteAccount) : null}
        <AuthPasswordInput
          error={isReauthenticationFailure(deletionFeedback) ? text.reauthenticationRequired : undefined}
          errorTestID="account-delete-reauth-password-error"
          inputStyle={styles.input}
          label={text.password}
          onChangeText={(value) => {
            setDeletionPassword(value);
            setDeletionFeedback(null);
          }}
          placeholder={text.password}
          placeholderTextColor={styles.placeholder.color as string}
          testID="account-delete-reauth-password"
          text={text}
          value={deletionPassword}
        />
        <Button
          disabled={busyAction !== null}
          loading={busyAction === "delete"}
          onPress={deleteAccount}
          testID="account-delete-submit"
          variant="secondary"
        >
          {text.confirmDeletion}
        </Button>
      </Card>
    </Screen>
  );
}

function AccountAdoptionScreen({
  account,
  accountData,
  backAction,
  text,
}: Readonly<{
  account: AccountContext;
  accountData: AccountDataSession;
  backAction: BackAction;
  text: AccountCopy;
}>) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppPreferences();
  const plan = accountData.preview?.plan;
  const [entryChoice, setEntryChoice] = useState<"transfer" | "discard">("transfer");
  const [conflictChoice, setConflictChoice] = useState<"guest" | "account" | null>(null);
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<readonly string[] | null>(null);
  const [recoveryCodesSaved, setRecoveryCodesSaved] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<Feedback | null>(null);
  const [recoveryNeedsReauthentication, setRecoveryNeedsReauthentication] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState<Feedback | null>(null);
  const { busyAction, runCommand } = useAccountCommand();

  if (!plan) return null;
  const authenticated = account.state.kind === "authenticated" ? account.state : null;
  if (!authenticated) return null;
  const recoveryUsesPassword = authenticated.user.provider === "password";
  const issueCodes = () => {
    runCommand(
      "recovery",
      () => account.issueRecoveryCodes(recoveryNeedsReauthentication ? recoveryPassword : undefined),
      (result) => {
        if (
          result.kind === "success" &&
          result.next === "recoveryCodesIssued" &&
          result.recoveryCodes &&
          result.recoveryCodes.length > 0
        ) {
          setRecoveryCodes(result.recoveryCodes);
          setRecoveryCodesSaved(false);
          setRecoveryPassword("");
          setRecoveryNeedsReauthentication(false);
          setRecoveryFeedback(null);
          return;
        }
        if (result.kind === "failure" && isReauthenticationFailure(result)) setRecoveryNeedsReauthentication(true);
        setRecoveryFeedback(
          result.kind === "failure"
            ? result
            : { kind: "failure", failure: "remoteFailure" },
        );
      },
    );
  };
  const hasGuestData = plan.localRecordCount > 0;
  const effectiveChoice = hasGuestData ? entryChoice : "discard";
  const continueEntry = () => {
    if (effectiveChoice === "transfer" && plan.conflictRecordIds.length > 0 && !conflictChoice) return;
    const resolutions = plan.conflictRecordIds.map((conflictId) => ({
      conflictId,
      resolution: conflictChoice === "guest" ? "keep_guest" : "keep_account",
    } as const));
    runCommand(
      "continue",
      () => effectiveChoice === "discard" ? account.discardGuestData() : account.confirmAdoption(resolutions),
      setCommandFeedback,
    );
  };
  const signOut = () => {
    runCommand("signOut", () => account.signOut(), setCommandFeedback);
  };
  const canContinue =
    (effectiveChoice === "discard" || plan.conflictRecordIds.length === 0 || conflictChoice !== null) &&
    (recoveryCodes === null || recoveryCodesSaved);

  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        <Button
          disabled={!canContinue || busyAction !== null}
          loading={busyAction === "continue"}
          onPress={continueEntry}
          testID="account-entry-continue"
          variant="primary"
        >
          {text.accountEntryContinue}
        </Button>
      }
      footerVariant="sticky"
    >
      <ScreenHeader backAction={backAction} title={hasGuestData ? text.accountEntryTitle : text.accountReadyTitle} />
      <View style={styles.accountIntro}>
        <AuthText style={styles.accountBody}>{hasGuestData ? text.accountEntryDescription : text.accountReadyDescription}</AuthText>
      </View>
      {hasGuestData ? <View style={styles.accountSection} testID="account-entry-choice">
        <View style={styles.progressToggleRow}>
          <AuthText style={[styles.accountHeading, styles.progressToggleLabel]}>{text.transferGuestData}</AuthText>
          <Switch
            accessibilityLabel={text.transferGuestData}
            disabled={busyAction !== null}
            onValueChange={(keepProgress) => {
              setEntryChoice(keepProgress ? "transfer" : "discard");
              setConflictChoice(null);
              setCommandFeedback(null);
            }}
            testID="account-keep-progress-toggle"
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            value={entryChoice === "transfer"}
          />
        </View>
        <AuthText style={styles.accountBody} testID="account-progress-choice-description">
          {entryChoice === "transfer" ? text.transferGuestDataDescription : text.discardGuestDataDescription}
        </AuthText>
        {entryChoice === "transfer" && plan.conflictRecordIds.length > 0 ? (
          <View style={styles.accountActionGroup} testID="account-conflict-choice">
            <AuthText style={styles.accountHeading}>{text.conflictChoiceTitle}</AuthText>
            <AuthText style={styles.accountBody}>{text.conflictChoiceDescription}</AuthText>
            <RadioOption
              description={text.keepGuestData}
              disabled={busyAction !== null}
              label={text.keepGuestData}
              onPress={() => setConflictChoice("guest")}
              selected={conflictChoice === "guest"}
              testID="account-conflicts-keep-guest"
            />
            <RadioOption
              description={text.keepAccountData}
              disabled={busyAction !== null}
              label={text.keepAccountData}
              onPress={() => setConflictChoice("account")}
              selected={conflictChoice === "account"}
              testID="account-conflicts-keep-account"
            />
          </View>
        ) : null}
      </View> : null}
      <View style={styles.recoverySection} testID="account-recovery-codes-panel">
        <AuthText style={styles.accountHeading}>{text.recoveryCodes}</AuthText>
        <AuthText style={styles.accountBody}>{recoveryCodes ? text.recoveryCodesDescription : text.recoveryCodesIntro}</AuthText>
        {recoveryCodes ? (
          <View style={styles.accountActionGroup} testID="account-recovery-codes">
            <RecoveryCodesDisplay codes={recoveryCodes} text={text} />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: recoveryCodesSaved, disabled: busyAction !== null }}
              disabled={busyAction !== null}
              onPress={() => setRecoveryCodesSaved((current) => !current)}
              style={styles.recoveryCodesSavedRow}
              testID="account-recovery-codes-saved-checkbox"
            >
              <View style={[styles.termsCheckbox, recoveryCodesSaved ? styles.termsCheckboxChecked : null]}>
                {recoveryCodesSaved ? <Icon color={styles.termsCheckboxIcon.color as string} name="check" size={16} /> : null}
              </View>
              <AuthText style={styles.termsCopy}>{text.recoveryCodesSaved}</AuthText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.accountActionGroup}>
            {recoveryFeedback && !isReauthenticationFailure(recoveryFeedback) ? renderFeedback(recoveryFeedback, text, text.recoveryCodes) : null}
            {recoveryNeedsReauthentication && recoveryUsesPassword ? (
              <View style={styles.accountActionGroup}>
                <AuthText style={styles.accountBody}>{text.recoveryCodeReauthDescription}</AuthText>
                <AuthPasswordInput
                  error={isReauthenticationFailure(recoveryFeedback) ? text.reauthenticationRequired : undefined}
                  errorTestID="account-recovery-reauth-password-error"
                  inputStyle={styles.input}
                  label={text.password}
                  onChangeText={(value) => {
                    setRecoveryPassword(value);
                    setRecoveryFeedback(null);
                  }}
                  placeholder={text.password}
                  placeholderTextColor={styles.placeholder.color as string}
                  testID="account-recovery-reauth-password"
                  text={text}
                  value={recoveryPassword}
                />
              </View>
            ) : recoveryNeedsReauthentication ? (
              <InfoBlock
                body={text.recoveryCodeSignInAgain}
                title={text.recoveryCodes}
                testID="account-recovery-sign-in-required"
                tone="warning"
              />
            ) : null}
            {recoveryNeedsReauthentication && !recoveryUsesPassword ? (
              <Button
                disabled={busyAction !== null}
                loading={busyAction === "signOut"}
                onPress={signOut}
                testID="account-recovery-sign-in-again"
                variant="secondary"
              >
                {text.recoveryCodeSignInAgainButton}
              </Button>
            ) : (
              <Button
                disabled={busyAction !== null}
                loading={busyAction === "recovery"}
                onPress={issueCodes}
                testID="account-recovery-codes-submit"
                variant="secondary"
              >
                {text.issueRecoveryCodes}
              </Button>
            )}
          </View>
        )}
        {recoveryCodes && !recoveryCodesSaved ? <AuthText style={styles.accountBody}>{text.recoveryCodesSaveRequired}</AuthText> : null}
      </View>
      {commandFeedback ? renderFeedback(commandFeedback, text, text.account) : null}
    </Screen>
  );
}

function AccountRecoveryScreen({
  account,
  accountData,
  backAction,
  text,
}: Readonly<{
  account: AccountContext;
  accountData: AccountDataSession;
  backAction: BackAction;
  text: AccountCopy;
}>) {
  const styles = useThemedStyles(createStyles);
  const { busyAction, runCommand } = useAccountCommand();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [feedbackAction, setFeedbackAction] = useState<"retry" | "signOut" | null>(null);
  const previousStatusRef = useRef(accountData.status);
  useEffect(() => {
    if (previousStatusRef.current === accountData.status) return;
    previousStatusRef.current = accountData.status;
    if (feedbackAction === "retry") {
      setFeedback(null);
      setFeedbackAction(null);
    }
  }, [accountData.status, feedbackAction]);
  const retry = () => {
    setFeedback(null);
    setFeedbackAction("retry");
    runCommand("retry", () => account.retryAccountSync(), (result) => {
      if (result.kind === "failure") setFeedback(result);
      else setFeedbackAction(null);
    });
  };
  const signOut = () => {
    setFeedback(null);
    setFeedbackAction("signOut");
    runCommand("signOut", () => account.signOut(), (result) => {
      if (result.kind === "failure") setFeedback(result);
      else setFeedbackAction(null);
    });
  };
  const status = getAccountRecoveryPresentation(accountData, text);
  const actionFailure = feedback?.kind === "failure" && !(feedbackAction === "retry" && isRetryFailureCoveredByStatus(accountData, feedback.failure))
    ? { body: text[feedback.failure], testID: `account-feedback-${feedback.failure}`, title: text.accountRecoveryTitle }
    : null;
  const presentation = actionFailure ?? status;
  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        <Button
          disabled={busyAction !== null}
          loading={busyAction === "signOut"}
          onPress={signOut}
          testID="account-sign-out"
          variant="ghost"
        >
          {text.signOut}
        </Button>
      }
      footerVariant="sticky"
    >
      <ScreenHeader backAction={backAction} title={text.account} />
      <View style={styles.accountRecoveryStatus} testID={status.testID}>
        <View style={styles.accountRecoveryStatus} testID={actionFailure?.testID}>
          <AuthText accessibilityRole="header" style={styles.accountHeading}>{presentation.title}</AuthText>
          <AuthText style={styles.accountBody}>{presentation.body}</AuthText>
        </View>
        {status.retry ? (
          <Button
            disabled={busyAction !== null}
            loading={busyAction === "retry"}
            onPress={retry}
            style={styles.accountRecoveryAction}
            testID="account-sync-retry"
            variant="primary"
          >
            {text.retrySync}
          </Button>
        ) : null}
      </View>
    </Screen>
  );
}

type AccountRecoveryPresentation = Readonly<{
  body: string;
  retry: boolean;
  testID: string;
  title: string;
}>;

function getAccountRecoveryPresentation(accountData: AccountDataSession, text: AccountCopy): AccountRecoveryPresentation {
  if (accountData.status === "resumeRequired") return { body: text.resumeRequiredDescription, retry: true, testID: "account-sync-resume-required", title: text.resumeRequired };
  if (accountData.status === "offlinePending") return { body: text.pendingDescription, retry: true, testID: "account-sync-pending", title: text.pending };
  if (accountData.status === "signOutPending") return { body: text.signOutPendingDescription, retry: false, testID: "account-sign-out-pending", title: text.signOutPending };
  if (accountData.status === "remoteDeletionPending") return { body: text.deletionPendingDescription, retry: false, testID: "account-deletion-pending", title: text.deletionPending };
  if (accountData.status === "localCleanupPending") return { body: text.localCleanupPendingDescription, retry: false, testID: "account-deletion-local-cleanup-pending", title: text.localCleanupPending };
  if (accountData.activeSessionBlocked || accountData.lastFailureCode === "active_session_adoption_blocked") {
    return { body: text.activeSessionBlocked, retry: true, testID: "account-adoption-active-session", title: text.accountRecoveryTitle };
  }
  if (accountData.lastFailureCode === "journal_recovery_required") {
    return { body: text.journalBlocked, retry: true, testID: "account-adoption-journal", title: text.accountRecoveryTitle };
  }
  if (accountData.lastFailureCode === "account_binding_mismatch") {
    return { body: text.accountBindingMismatchDescription, retry: false, testID: "account-sync-binding-mismatch", title: text.accountBindingMismatch };
  }
  if (accountData.pendingMutationCount > 0) return { body: text.pendingDescription, retry: true, testID: "account-sync-pending", title: text.pending };
  if (accountData.blockingConflictCode !== null) return { body: text.conflictDescription, retry: true, testID: "account-sync-conflict", title: text.conflict };
  if (accountData.lastFailureCode !== null) return { body: text.dataFailureDescription, retry: true, testID: "account-sync-failed", title: text.dataFailure };
  if (accountData.status === "conflict") return { body: text.conflictDescription, retry: true, testID: "account-sync-conflict", title: text.conflict };
  if (accountData.status === "failed") return { body: text.dataFailureDescription, retry: true, testID: "account-sync-failed", title: text.dataFailure };
  if (accountData.status === "initialSyncRequired") return { body: text.accountRecoveryDescription, retry: true, testID: "account-sync-initial-required", title: text.accountRecoveryTitle };
  return { body: text.syncing, retry: false, testID: "account-syncing", title: text.accountRecoveryTitle };
}

function isHealthyAccountData(accountData: AccountDataSession): boolean {
  return accountData.status === "synced"
    && accountData.pendingMutationCount === 0
    && accountData.blockingConflictCode === null
    && accountData.lastFailureCode === null;
}

function isRetryFailureCoveredByStatus(accountData: AccountDataSession, failure: string): boolean {
  return (accountData.status === "offlinePending" && failure === "offline")
    || (accountData.status === "conflict" && failure === "conflict")
    || (accountData.status === "failed" && failure === "remoteFailure");
}

function RadioOption({
  description,
  disabled,
  label,
  onPress,
  selected,
  testID,
}: Readonly<{
  description: string;
  disabled: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
}>) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.radioOption, selected ? styles.radioOptionSelected : null]}
      testID={testID}
    >
      <View style={[styles.radioControl, selected ? styles.radioControlSelected : null]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.radioCopy}>
        <AuthText style={styles.accountHeading}>{label}</AuthText>
        <AuthText style={styles.accountBody}>{description}</AuthText>
      </View>
    </Pressable>
  );
}

function WelcomeScreen({
  onContinueAsGuest,
  onRegister,
  onSignIn,
  text,
}: Readonly<{
  onContinueAsGuest: () => void;
  onRegister: () => void;
  onSignIn: () => void;
  text: AccountCopy;
}>) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.3;
  const { colorMode, colors } = useAppPreferences();
  return (
    <Screen
      backgroundColor={colors.background}
      edges={["top", "bottom"]}
      style={[styles.welcomeScreen, largeText ? styles.welcomeScreenLargeText : null]}
    >
      <StatusBar style={colorMode === "dark" ? "light" : "dark"} />
      <View style={styles.welcomeHero}>
        <PatternlyMark size={88} treatment={colorMode === "dark" ? "white" : "navy"} />
        <AuthText style={styles.welcomeBrand}>
          Patternly
        </AuthText>
        <AuthText style={styles.welcomeTitle}>
          {text.welcomeTitle}
        </AuthText>
        <AuthText style={styles.welcomeDescription}>
          {text.welcomeDescription}
        </AuthText>
      </View>
      <View style={styles.welcomeActions}>
        <EntryButton
          onPress={onSignIn}
          testID="account-sign-in"
          text={text.signIn}
          variant="primary"
        />
        <EntryButton
          onPress={onRegister}
          testID="account-register"
          text={text.register}
          variant="secondary"
        />
        <EntryButton
          onPress={onContinueAsGuest}
          testID="account-guest"
          text={text.continueWithoutAccount}
          variant="guest"
        />
      </View>
    </Screen>
  );
}

function AuthStatusScreen({
  action,
  backAction,
  body,
  children,
  detail,
  footerAction,
  testID,
  title,
}: Readonly<{
  action?: Readonly<{ label: string; onPress: () => void; testID: string }>;
  backAction?: Readonly<{ onPress: () => void }>;
  body: string;
  children?: ReactNode;
  detail?: string;
  footerAction?: Readonly<{ label: string; onPress: () => void; testID: string }>;
  testID: string;
  title: string;
}>) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.3;
  return (
    <Screen
      ambient
      ambientVariant="auth"
      edges={["top", "bottom"]}
      footer={footerAction ? <Button onPress={footerAction.onPress} testID={footerAction.testID} variant="ghost">{footerAction.label}</Button> : undefined}
      footerVariant={footerAction ? "sticky" : undefined}
      style={[styles.authScreen, largeText ? styles.authScreenLargeText : null]}
    >
      {backAction ? <ScreenHeader backAction={backAction} title="" /> : null}
      <View style={[styles.authPanel, largeText ? styles.authPanelLargeText : null]} testID={testID}>
        <View style={styles.statusCopy}>
          <AuthText style={styles.authTitle}>{title}</AuthText>
          <AuthText style={styles.authDescription}>{body}</AuthText>
          {detail ? <AuthText style={styles.statusDetail}>{detail}</AuthText> : null}
        </View>
        {children}
        {action ? (
          <Button onPress={action.onPress} testID={action.testID} variant="primary">
            {action.label}
          </Button>
        ) : null}
      </View>
    </Screen>
  );
}

function EntryButton({
  onPress,
  testID,
  text,
  variant,
}: Readonly<{
  onPress: () => void;
  testID: string;
  text: string;
  variant: "primary" | "secondary" | "guest";
}>) {
  const styles = useThemedStyles(createStyles);
  const variantStyle =
    variant === "primary"
      ? styles.entryButtonPrimary
      : variant === "secondary"
        ? styles.entryButtonSecondary
        : styles.entryButtonGuest;
  const labelStyle =
    variant === "primary"
      ? styles.entryButtonPrimaryLabel
      : variant === "secondary"
        ? styles.entryButtonSecondaryLabel
        : styles.entryButtonGuestLabel;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.entryButton,
        variantStyle,
        pressed ? styles.entryButtonPressed : null,
      ]}
      testID={testID}
    >
      <AuthText style={[styles.entryButtonLabel, labelStyle]}>
        {text}
      </AuthText>
    </Pressable>
  );
}

function SignInForm({
  email,
  feedback,
  inputStyle,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  password,
  placeholderTextColor,
  text,
}: Readonly<{
  email: string;
  feedback: Feedback | null;
  inputStyle: StyleProp<TextStyle>;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  password: string;
  placeholderTextColor: string;
  text: AccountCopy;
}>) {
  const styles = useThemedStyles(createStyles);
  const [visible, setVisible] = useState(false);
  const invalidEmail = feedback?.kind === "failure" && feedback.failure === "invalidEmail";
  const credentialsError = feedback?.kind === "failure" && (feedback.failure === "invalidCredential" || (feedback.failure === "invalid" && !invalidEmail));
  const showGlobalFeedback = feedback?.kind === "failure" && !invalidEmail && !credentialsError;
  return (
    <View style={styles.signInForm}>
      {showGlobalFeedback ? renderFeedback(feedback, text) : null}
      <View style={styles.fieldGroup}>
        <AuthText style={styles.fieldLabel}>
          {text.email}
        </AuthText>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          maxFontSizeMultiplier={2}
          onChangeText={onEmailChange}
          placeholder={text.enterEmail}
          placeholderTextColor={placeholderTextColor}
          style={[inputStyle, styles.centeredInput, invalidEmail ? styles.authInputError : null]}
          testID="account-email"
          value={email}
        />
        {invalidEmail ? <AuthText accessibilityLabel={`${text.email}. ${text.invalidEmail}`} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.fieldError} testID="account-email-error">{text.invalidEmail}</AuthText> : null}
      </View>
      <View style={styles.fieldGroup}>
        <AuthText style={styles.fieldLabel}>
          {text.password}
        </AuthText>
        <View style={styles.passwordField}>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={onPasswordChange}
            maxFontSizeMultiplier={2}
            placeholder={text.enterPassword}
            placeholderTextColor={placeholderTextColor}
            secureTextEntry={!visible}
            style={[inputStyle, styles.centeredInput, styles.passwordInput, credentialsError ? styles.authInputError : null]}
            testID="account-password"
            value={password}
          />
          <Pressable
            accessibilityLabel={visible ? text.hidePassword : text.showPassword}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setVisible((current) => !current)}
            style={styles.visibilityButton}
          >
            <Icon
              color={styles.icon.color as string}
              name={visible ? "eye-off" : "eye"}
              size={24}
            />
          </Pressable>
        </View>
        {credentialsError ? <AuthText accessibilityLabel={`${text.password}. ${text.signInCredentialsError}`} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.fieldError} testID="account-password-error">{text.signInCredentialsError}</AuthText> : null}
      </View>
      <Button
        labelStyle={styles.authPrimaryLabel}
        onPress={onSubmit}
        style={styles.authPrimaryButton}
        testID="account-sign-in-submit"
        variant="primary"
      >
        {text.signIn}
      </Button>
    </View>
  );
}

function Divider({ label }: Readonly<{ label: string }>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <AuthText style={styles.dividerLabel}>
        {label}
      </AuthText>
      <View style={styles.dividerLine} />
    </View>
  );
}

function ProviderButton({
  icon,
  onPress,
  text,
}: Readonly<{ icon: "apple" | "google"; onPress: () => void; text: string }>) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppPreferences();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      accessibilityLabel={text}
      style={({ pressed }) => [
        styles.providerButton,
        pressed ? styles.providerPressed : null,
      ]}
      testID={`account-provider-${icon}`}
    >
      <View style={styles.providerContent}>
        <View style={styles.providerIcon}>
          {icon === "apple" ? (
            <Icon color={colors.provider.appleIcon} name="apple" size={26} />
          ) : <GoogleIcon height={18} width={18} />}
        </View>
        <AuthText style={styles.providerLabel}>
          {text}
        </AuthText>
      </View>
    </Pressable>
  );
}

function CredentialsForm({
  acceptedTerms,
  buttonLabel,
  confirmation,
  email,
  feedback,
  inputStyle,
  onAcceptedTermsChange,
  onConfirmationChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  password,
  placeholderTextColor,
  text,
  testID,
}: Readonly<{
  acceptedTerms?: boolean;
  buttonLabel: string;
  confirmation?: string;
  email: string;
  feedback: Feedback | null;
  inputStyle: StyleProp<TextStyle>;
  onAcceptedTermsChange?: (accepted: boolean) => void;
  onConfirmationChange?: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  password: string;
  placeholderTextColor: string;
  text: AccountCopy;
  testID: string;
}>) {
  const styles = useThemedStyles(createStyles);
  const passwordMismatch = feedback?.kind === "failure" && feedback.failure === "passwordMismatch";
  const invalidEmail = feedback?.kind === "failure" && feedback.failure === "invalidEmail";
  const emailError = invalidEmail
    ? text.invalidEmail
    : feedback?.kind === "failure" && feedback.failure === "duplicate"
      ? text.duplicate
      : undefined;
  const passwordError = feedback?.kind === "failure" && feedback.failure === "weakPassword"
    ? text.weakPassword
    : feedback?.kind === "failure" && (feedback.failure === "invalidCredential" || (feedback.failure === "invalid" && !invalidEmail))
      ? text.invalid
    : undefined;
  return (
    <View style={styles.authForm}>
      <FormField error={emailError} errorTestID="account-register-email-error" label={text.email}>
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" maxFontSizeMultiplier={2} onChangeText={onEmailChange} placeholder={text.enterEmail} placeholderTextColor={placeholderTextColor} style={[inputStyle, styles.centeredInput, emailError ? styles.authInputError : null]} testID="account-email" value={email} />
      </FormField>
          <AuthPasswordInput error={passwordError} errorTestID="account-register-password-error" inputStyle={inputStyle} onChangeText={onPasswordChange} placeholder={text.enterPassword} placeholderTextColor={placeholderTextColor} testID="account-password" text={text} value={password} />
      {confirmation !== undefined && onConfirmationChange ? (
        <AuthPasswordInput error={passwordMismatch ? text.passwordMismatch : undefined} errorTestID="account-password-confirmation-error" inputStyle={inputStyle} label={text.confirmPassword} onChangeText={onConfirmationChange} placeholder={text.confirmPassword} placeholderTextColor={placeholderTextColor} testID="account-password-confirmation" text={text} value={confirmation} />
      ) : null}
      {acceptedTerms !== undefined && onAcceptedTermsChange ? <TermsAcceptance accepted={acceptedTerms} onChange={onAcceptedTermsChange} text={text} /> : null}
      <Button disabled={acceptedTerms === false} labelStyle={styles.authPrimaryLabel} onPress={onSubmit} style={styles.authPrimaryButton} testID={testID} variant="primary">
        {buttonLabel}
      </Button>
    </View>
  );
}

function TermsAcceptance({ accepted, onChange, text }: Readonly<{ accepted: boolean; onChange: (accepted: boolean) => void; text: AccountCopy }>) {
  const styles = useThemedStyles(createStyles);
  const publicLinks = readPublicLegalLinksFromRuntime();
  const links = publicLinks.kind === "configured" ? publicLinks.value : null;
  return (
    <View style={styles.termsAcceptance}>
      <View style={styles.termsCheckboxRow}>
        <Pressable accessibilityLabel={`${text.acceptTermsPrefix} ${text.termsOfService} ${text.and} ${text.privacyPolicy}`} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} hitSlop={8} onPress={() => onChange(!accepted)} style={styles.termsCheckboxControl} testID="account-register-terms-checkbox">
          <View style={[styles.termsCheckbox, accepted ? styles.termsCheckboxChecked : null]}>{accepted ? <Icon color={styles.termsCheckboxIcon.color as string} name="check" size={16} /> : null}</View>
        </Pressable>
        <View style={styles.termsLinks}>
          <AuthText style={styles.termsCopy}>{text.acceptTermsPrefix}</AuthText>
          {links ? <><Pressable accessibilityRole="link" onPress={() => void Linking.openURL(links.termsUrl)} style={styles.termsLinkPressable} testID="account-register-terms-link"><AuthText style={styles.termsLink}>{text.termsOfService}</AuthText></Pressable><AuthText style={styles.termsCopy}>{text.and}</AuthText><Pressable accessibilityRole="link" onPress={() => void Linking.openURL(links.privacyUrl)} style={styles.termsLinkPressable} testID="account-register-privacy-link"><AuthText style={styles.termsLink}>{text.privacyPolicy}</AuthText></Pressable></> : <AuthText style={styles.termsCopy}>{`${text.termsOfService} ${text.and} ${text.privacyPolicy}`}</AuthText>}
        </View>
      </View>
      {!links ? <AuthText style={styles.termsUnavailable} testID="account-terms-unavailable">{text.termsUnavailable}</AuthText> : null}
      {!accepted ? <AuthText accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.termsRequired} testID="account-register-terms-error">{text.termsRequired}</AuthText> : null}
    </View>
  );
}

function FormField({
  children,
  error,
  errorTestID,
  label,
}: Readonly<{ children: ReactNode; error?: string; errorTestID?: string; label: string }>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.fieldGroup}>
      <AuthText style={styles.fieldLabel}>{label}</AuthText>
      {children}
      {error ? <AuthText accessibilityLabel={`${label}. ${error}`} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.fieldError} testID={errorTestID}>{error}</AuthText> : null}
    </View>
  );
}

function AuthPasswordInput({
  autoComplete = "password",
  error,
  errorTestID,
  inputStyle,
  label,
  onChangeText,
  placeholder,
  placeholderTextColor,
  testID,
  text,
  value,
}: Readonly<{
  autoComplete?: "password" | "password-new";
  error?: string;
  errorTestID?: string;
  inputStyle: StyleProp<TextStyle>;
  label?: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  testID: string;
  text: AccountCopy;
  value: string;
}>) {
  const styles = useThemedStyles(createStyles);
  const [visible, setVisible] = useState(false);
  return (
    <FormField error={error} errorTestID={errorTestID} label={label ?? text.password}>
      <View style={styles.passwordField}>
        <TextInput autoCapitalize="none" autoComplete={autoComplete} maxFontSizeMultiplier={2} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={placeholderTextColor} secureTextEntry={!visible} style={[inputStyle, styles.centeredInput, styles.passwordInput, error ? styles.authInputError : null]} testID={testID} value={value} />
        <Pressable accessibilityLabel={visible ? text.hidePassword : text.showPassword} accessibilityRole="button" hitSlop={8} onPress={() => setVisible((current) => !current)} style={styles.visibilityButton} testID={`${testID}-visibility`}>
          <Icon color={styles.icon.color as string} name={visible ? "eye-off" : "eye"} size={24} />
        </Pressable>
      </View>
    </FormField>
  );
}

function RecoveryForm({
  code,
  email,
  feedback,
  inputStyle,
  method,
  onCodeChange,
  onConsume,
  onEmailChange,
  onSelectCode,
  onSelectEmail,
  onSubmit,
  placeholderTextColor,
  text,
}: Readonly<{
  code: string;
  email: string;
  feedback: Feedback | null;
  inputStyle: StyleProp<TextStyle>;
  method: "email" | "code";
  onCodeChange: (value: string) => void;
  onConsume: () => void;
  onEmailChange: (value: string) => void;
  onSelectCode: () => void;
  onSelectEmail: () => void;
  onSubmit: () => void;
  placeholderTextColor: string;
  text: AccountCopy;
}>) {
  const styles = useThemedStyles(createStyles);
  const invalidEmail = feedback?.kind === "failure" && feedback.failure === "invalidEmail";
  const invalidRecoveryCode = feedback?.kind === "failure" && (feedback.failure === "invalidRecoveryCode" || feedback.failure === "recoveryCodeUsed");
  if (method === "code")
    return (
      <View style={styles.authForm}>
        <FormField error={invalidRecoveryCode ? feedback?.failure === "recoveryCodeUsed" ? text.recoveryCodeUsed : text.invalidRecoveryCode : undefined} errorTestID="account-recovery-code-error" label={text.recoveryCode}>
          <TextInput autoCapitalize="characters" autoCorrect={false} maxFontSizeMultiplier={2} onChangeText={onCodeChange} placeholder={text.recoveryCode} placeholderTextColor={placeholderTextColor} style={[inputStyle, styles.centeredInput, invalidRecoveryCode ? styles.authInputError : null]} testID="account-recovery-code" value={code} />
        </FormField>
        <Button labelStyle={styles.authPrimaryLabel} onPress={onConsume} style={styles.authPrimaryButton} testID="account-recovery-code-submit" variant="primary">{text.consumeRecoveryCode}</Button>
        <Button labelStyle={styles.textActionLabel} onPress={onSelectEmail} testID="account-recovery-email-option" variant="ghost">{text.backToEmailRecovery}</Button>
      </View>
    );
  return (
    <View style={styles.authForm}>
        <FormField error={invalidEmail ? text.invalidEmail : undefined} errorTestID="account-recovery-email-error" label={text.email}>
        <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" maxFontSizeMultiplier={2} onChangeText={onEmailChange} placeholder={text.enterEmail} placeholderTextColor={placeholderTextColor} style={[inputStyle, styles.centeredInput, invalidEmail ? styles.authInputError : null]} testID="account-recovery-email" value={email} />
      </FormField>
      <Button labelStyle={styles.authPrimaryLabel} onPress={onSubmit} style={styles.authPrimaryButton} testID="account-recovery-submit" variant="primary">{text.sendRecovery}</Button>
      <Button labelStyle={styles.textActionLabel} onPress={onSelectCode} testID="account-recovery-code-option" variant="ghost">{text.recoveryCodeOption}</Button>
    </View>
  );
}

function ResetPasswordForm({
  confirmation,
  feedback,
  inputStyle,
  onConfirmationChange,
  onPasswordChange,
  onSubmit,
  password,
  placeholderTextColor,
  text,
}: Readonly<{
  confirmation: string;
  feedback: Feedback | null;
  inputStyle: StyleProp<TextStyle>;
  onConfirmationChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  password: string;
  placeholderTextColor: string;
  text: AccountCopy;
}>) {
  const styles = useThemedStyles(createStyles);
  const passwordMismatch = feedback?.kind === "failure" && feedback.failure === "passwordMismatch";
  const weakPassword = feedback?.kind === "failure" && feedback.failure === "weakPassword";
  return (
    <View style={styles.authForm}>
      <AuthPasswordInput autoComplete="password-new" error={weakPassword ? text.weakPassword : undefined} errorTestID="account-reset-password-error" inputStyle={inputStyle} onChangeText={onPasswordChange} placeholder={text.password} placeholderTextColor={placeholderTextColor} testID="account-reset-password" text={text} value={password} />
      <AuthPasswordInput autoComplete="password-new" error={passwordMismatch ? text.passwordMismatch : undefined} errorTestID="account-reset-password-confirmation-error" inputStyle={inputStyle} label={text.confirmPassword} onChangeText={onConfirmationChange} placeholder={text.confirmPassword} placeholderTextColor={placeholderTextColor} testID="account-reset-password-confirmation" text={text} value={confirmation} />
      <Button labelStyle={styles.authPrimaryLabel} onPress={onSubmit} style={styles.authPrimaryButton} testID="account-reset-submit" variant="primary">{text.reset}</Button>
    </View>
  );
}

function renderFeedback(
  feedback: Feedback | null,
  text: AccountCopy,
  title = text.signInProblem,
) {
  if (!feedback) return null;
  if (feedback.kind === "success" && feedback.next === "recoveryAccepted")
    return (
      <InfoBlock
        body={text.recoveryAcceptedDescription}
        title={text.recoveryAccepted}
        testID="account-recovery-accepted"
        tone="success"
      />
    );
  if (feedback.kind === "success")
    return (
      <InfoBlock
        body={text.accountDescription}
        title={text.account}
        tone="success"
      />
    );
  const message = text[feedback.failure];
  return (
    <InfoBlock
      body={message}
      title={title}
      testID={`account-feedback-${feedback.failure}`}
      tone="warning"
    />
  );
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
      {openFailure ? (
        <InfoBlock
          body={text.publicDeletionLinkOpenFailed}
          title={text.publicDeletionLinkOpenFailedTitle}
          testID="account-public-deletion-open-failed"
          tone="warning"
        />
      ) : null}
      <PublicLinkRow
        available={available}
        detail={
          available
            ? text.publicDeletionLinkDetail
            : publicLinks.reason === "invalid_public_environment"
              ? text.publicDeletionLinkInvalid
              : text.publicDeletionLinkUnavailable
        }
        icon="trash"
        onPress={() => {
          void openPublicDeletionLink();
        }}
        testID="account-public-deletion-link"
        title={text.publicDeletionLink}
      />
    </View>
  );
}

function setResult(setFeedback: (feedback: Feedback) => void) {
  return (result: AccountCommandResult) => setFeedback(result);
}

function isReauthenticationFailure(feedback: Feedback | null): boolean {
  return feedback?.kind === "failure" && feedback.failure === "reauthenticationRequired";
}

function isRegisterFieldFailure(feedback: Feedback | null): boolean {
  return feedback?.kind === "failure" && (
    feedback.failure === "duplicate" ||
    feedback.failure === "invalidEmail" ||
    feedback.failure === "invalidCredential" ||
    feedback.failure === "passwordMismatch" ||
    feedback.failure === "weakPassword"
  );
}

function isAuthFieldFailure(
  mode: AccountMode,
  recoveryMethod: "email" | "code",
  feedback: Feedback | null,
): boolean {
  if (feedback?.kind !== "failure") return false;
  if (mode === "recovery") {
    return recoveryMethod === "code"
      ? feedback.failure === "invalidRecoveryCode" || feedback.failure === "recoveryCodeUsed"
      : feedback.failure === "invalidEmail";
  }
  if (mode === "resetPassword") {
    return feedback.failure === "passwordMismatch" || feedback.failure === "weakPassword";
  }
  return false;
}

  const createStyles = (palette: AppColors) =>
  StyleSheet.create({
    accountIntro: { gap: spacing.sm },
    accountSection: { gap: spacing.md },
    recoverySection: { borderTopColor: palette.border, borderTopWidth: 1, paddingTop: spacing.xl, gap: spacing.md },
    progressToggleRow: { alignItems: "center", flexDirection: "row", gap: spacing.lg },
    progressToggleLabel: { flex: 1, minWidth: 0 },
    copyCodesButton: { maxWidth: "100%", alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: spacing.sm, minHeight: 44, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 12, backgroundColor: palette.surface },
    copyCodesLabel: { ...typography.small, color: palette.primary, flexShrink: 1 },
    recoveryCodeSheet: { backgroundColor: palette.surfaceInput, borderRadius: 16, padding: spacing.md },
    accountCard: { gap: spacing.md },
    accountActionGroup: { gap: spacing.sm },
    accountRecoveryStatus: { gap: spacing.md },
    accountRecoveryAction: { alignSelf: "stretch" },
    accountHeading: {
      ...typography.bodyStrong,
      color: palette.textPrimary,
    },
    accountBody: {
      ...typography.small,
      color: palette.textSecondary,
    },
    accountIdentity: {
      ...typography.small,
      color: palette.textPrimary,
      fontWeight: "600",
    },
    accountCode: {
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      color: palette.textPrimary,
      fontSize: 14,
      lineHeight: 26,
    },
    recoveryCodesSavedRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      minHeight: 44,
    },
    radioOption: {
      alignItems: "flex-start",
      borderColor: palette.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 64,
      padding: spacing.md,
    },
    radioOptionSelected: {
      backgroundColor: palette.surfaceInput,
      borderColor: palette.primary,
    },
    radioControl: {
      alignItems: "center",
      borderColor: palette.borderStrong,
      borderRadius: 12,
      borderWidth: 2,
      height: 24,
      justifyContent: "center",
      marginTop: 1,
      width: 24,
    },
    radioControlSelected: { borderColor: palette.primary },
    radioDot: {
      backgroundColor: palette.primary,
      borderRadius: 6,
      height: 12,
      width: 12,
    },
    radioCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
    authScreen: { justifyContent: "center" },
    authScreenLargeText: { justifyContent: "flex-start", paddingTop: spacing.md },
    authPanel: { alignSelf: "stretch", gap: spacing.md, minWidth: 0 },
    authPanelLargeText: { gap: spacing.lg },
    authForm: { gap: spacing.md, minWidth: 0 },
    termsAcceptance: { gap: spacing.xs, minWidth: 0 },
    termsCheckboxRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minWidth: 0 },
    termsCheckboxControl: { alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 44 },
    termsCheckbox: { alignItems: "center", borderColor: palette.borderStrong, borderRadius: 5, borderWidth: 1, height: 22, justifyContent: "center", width: 22 },
    termsCheckboxChecked: { backgroundColor: palette.primary, borderColor: palette.primary },
    termsCheckboxIcon: { color: palette.onPrimary },
    termsCopy: { color: palette.textSecondary, flexShrink: 1, fontSize: 13, lineHeight: 20 },
    termsLinks: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, minWidth: 0 },
    termsLinkPressable: { alignSelf: "flex-start", flexShrink: 1, maxWidth: "100%" },
    termsLink: { color: palette.primary, flexShrink: 1, fontSize: 13, lineHeight: 20, textDecorationLine: "underline" },
    termsUnavailable: { color: palette.textSecondary, flexShrink: 1, fontSize: 13, lineHeight: 20 },
    termsRequired: { color: palette.danger, fontSize: 12, lineHeight: 17, marginLeft: 44 + spacing.sm },
    authTitle: {
      ...typography.display,
      color: palette.textPrimary,
      fontSize: 38,
      lineHeight: 44,
      letterSpacing: -0.8,
    },
    recoveryCodeTitle: {
      flexShrink: 1,
      fontSize: 34,
      lineHeight: 40,
      maxWidth: "100%",
    },
    authDescription: {
      color: palette.textSecondary,
      flexShrink: 1,
      fontSize: 15,
      lineHeight: 22,
    },
    statusCopy: { gap: spacing.md },
    statusDetail: {
      ...typography.bodyStrong,
      color: palette.textPrimary,
    },
    signInForm: { gap: spacing.md },
    fieldGroup: { gap: spacing.xs },
    fieldLabel: {
      color: palette.textSecondary,
      flexShrink: 1,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
    },
    authInput: {
      backgroundColor: palette.surface,
      borderColor: palette.borderStrong,
      borderRadius: 16,
      borderWidth: 1,
      color: palette.textPrimary,
      fontSize: 16,
      minHeight: 52,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    centeredInput: { textAlignVertical: "center" },
    authInputError: { borderColor: palette.danger },
    fieldError: {
      color: palette.danger,
      fontSize: 12,
      lineHeight: 16,
    },
    authPlaceholder: { color: palette.textMuted },
    authPrimaryButton: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    authPrimaryLabel: { color: palette.onPrimary },
    passwordInput: { paddingRight: 56 },
    passwordField: { minWidth: 0, position: "relative" },
    visibilityButton: {
      alignItems: "center",
      bottom: 0,
      justifyContent: "center",
      position: "absolute",
      right: spacing.sm,
      top: 0,
      width: 44,
    },
    icon: { color: palette.textPrimary },
    authLinks: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: -spacing.sm,
    },
    authLinksLargeText: {
      alignItems: "stretch",
      flexDirection: "column",
      gap: spacing.xs,
      marginHorizontal: 0,
    },
    textActionLabel: {
      color: palette.primary,
      fontSize: 14,
      fontWeight: "500",
      textDecorationLine: "underline",
    },
    divider: { alignItems: "center", flexDirection: "row", gap: spacing.lg },
    dividerLine: { backgroundColor: palette.borderStrong, flex: 1, height: 1 },
    dividerLabel: {
      color: palette.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    providerButton: {
      alignItems: "center",
      backgroundColor: palette.provider.brandedSurface,
      borderColor: palette.provider.brandedBorder,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: spacing.xl,
    },
    providerContent: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "center",
      maxWidth: "100%",
      minWidth: 0,
    },
    providerIcon: {
      alignItems: "center",
      flexShrink: 0,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    providerLabel: {
      color: palette.provider.brandedLabel,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 22,
      flexShrink: 1,
      textAlign: "center",
    },
    providerPressed: { opacity: 0.78 },
    guestActionLabel: {
      color: palette.textSecondary,
      fontSize: 14,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    welcomeScreen: {
      justifyContent: "space-between",
      paddingBottom: 34,
      paddingTop: 120,
    },
    welcomeScreenLargeText: {
      gap: spacing.xxxl,
      justifyContent: "flex-start",
      paddingBottom: spacing.lg,
      paddingTop: spacing.xl,
    },
    welcomeHero: { alignItems: "center", gap: spacing.lg },
    welcomeBrand: {
      color: palette.textPrimary,
      fontSize: 36,
      fontWeight: "700",
      letterSpacing: -0.6,
      lineHeight: 44,
    },
    welcomeTitle: {
      color: palette.textPrimary,
      fontSize: 30,
      fontWeight: "700",
      lineHeight: 38,
      marginTop: spacing.xl,
      textAlign: "center",
    },
    welcomeDescription: {
      color: palette.textSecondary,
      flexShrink: 1,
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
    },
    welcomeActions: { gap: spacing.md },
    entryButton: {
      alignItems: "center",
      borderRadius: 16,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 56,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
    entryButtonPrimary: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    entryButtonSecondary: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
    },
    entryButtonGuest: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      minHeight: 44,
      paddingVertical: spacing.sm,
    },
    entryButtonPressed: { opacity: 0.78 },
    entryButtonLabel: {
      flexShrink: 1,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 22,
      textAlign: "center",
    },
    entryButtonPrimaryLabel: { color: palette.onPrimary },
    entryButtonSecondaryLabel: { color: palette.textPrimary },
    entryButtonGuestLabel: { color: palette.primary },
    input: {
      backgroundColor: palette.surfaceInput,
      borderColor: palette.border,
      borderRadius: 10,
      borderWidth: 1,
      color: palette.textPrimary,
      height: 52,
      paddingHorizontal: 14,
      paddingVertical: 0,
      textAlignVertical: "center",
    },
    placeholder: { color: palette.textMuted },
  });
