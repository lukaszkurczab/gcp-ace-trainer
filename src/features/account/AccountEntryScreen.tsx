import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import accountCopy from "../../locales/en/account.json";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import type { Edge } from "react-native-safe-area-context";
import * as Google from "expo-auth-session/providers/google";
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
  type AccountFailure,
} from "../../application/account/AccountSessionProvider";
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

type AccountEntryProps = NativeStackScreenProps<
  RootStackParamList,
  typeof ROUTES.ACCOUNT_ENTRY
>;
type AccountMode = NonNullable<
  NonNullable<RootStackParamList[typeof ROUTES.ACCOUNT_ENTRY]>["initialMode"]
>;
type Feedback = AccountCommandResult;


type AccountCopy = Record<keyof typeof accountCopy, string>;

export function AccountEntryScreen({ navigation, route }: AccountEntryProps) {
  const styles = useThemedStyles(createStyles);
  const { locale } = useAppPreferences();
  const { t } = useTranslation("account");
  const text = {
  account: t("account"),
  accountDescription: t("accountDescription"),
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
  issueRecoveryCodes: t("issueRecoveryCodes"),
  accountReady: t("accountReady"),
  accountReadyDescription: t("accountReadyDescription"),
  adoptionPreview: t("adoptionPreview"),
  adoptionPreviewDescription: t("adoptionPreviewDescription"),
  preserve: t("preserve"),
  upload: t("upload"),
  restore: t("restore"),
  deduplicated: t("deduplicated"),
  decisions: t("decisions"),
  keepGuest: t("keepGuest"),
  keepAccount: t("keepAccount"),
  confirmAdoption: t("confirmAdoption"),
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
  activeSessionBlocked: t("activeSessionBlocked"),
  journalBlocked: t("journalBlocked"),
  pendingSyncRequiresNetwork: t("pendingSyncRequiresNetwork"),
  journalRecoveryFailure: t("journalRecoveryFailure"),
  localDeletionFailure: t("localDeletionFailure"),
  remoteFailure: t("remoteFailure"),
  account_revision_conflict: t("account_revision_conflict"),
  version_conflict: t("version_conflict"),
  adoption_conflict: t("adoption_conflict"),
  active_session_sync_deferred: t("active_session_sync_deferred"),
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
  invalid: t("invalid"),
  duplicate: t("duplicate"),
  rateLimited: t("rateLimited"),
  offline: t("offline"),
  expiredAction: t("expiredAction"),
  providerUnavailable: t("providerUnavailable"),
  invalidCredential: t("invalidCredential"),
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
  const [deletionPassword, setDeletionPassword] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<readonly string[] | null>(
    null,
  );
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
  if (account.state.kind === "unavailable")
    return (
      <AuthStatusScreen
        action={{ label: text.continueWithoutAccount, onPress: continueWithoutAccount, testID: "account-unavailable-guest" }}
        backAction={backAction}
        body={text.unavailableDescription}
        testID="account-unavailable"
        title={text.unavailable}
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
    return (
      <Screen edges={screenEdges}>
        <ScreenHeader backAction={backAction} title={text.account} />
        <InfoBlock
          body={text.accountReadyDescription}
          title={text.accountReady}
          testID="account-authenticated"
          tone="success"
        />
        <AccountDataPanel
          accountData={account.state.accountData}
          onConfirm={(resolutions) =>
            void account
              .confirmAdoption(resolutions)
              .then(setResult(setFeedback))
          }
          onRetry={() =>
            void account.retryAccountSync().then(setResult(setFeedback))
          }
          text={text}
        />
        {feedback ? renderFeedback(feedback, text) : null}
        {recoveryCodes ? (
          <Card testID="account-recovery-codes" style={{ gap: spacing.md }}>
            <Text
              maxFontSizeMultiplier={2}
              style={{ ...typography.bodyStrong }}
            >
              {text.recoveryCodes}
            </Text>
            <Text maxFontSizeMultiplier={2} style={{ ...typography.small }}>
              {text.recoveryCodesDescription}
            </Text>
            <Text selectable maxFontSizeMultiplier={2}>
              {recoveryCodes.join("\n")}
            </Text>
          </Card>
        ) : (
          <Card
            style={{ gap: spacing.md }}
            testID="account-recovery-codes-panel"
          >
            <Text
              maxFontSizeMultiplier={2}
              style={{ ...typography.bodyStrong }}
            >
              {text.recoveryCodes}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={setRecoveryPassword}
              placeholder={text.password}
              placeholderTextColor={styles.placeholder.color as string}
              secureTextEntry
              style={styles.input}
              testID="account-recovery-reauth-password"
              value={recoveryPassword}
            />
            <Button
              onPress={() =>
                void account
                  .issueRecoveryCodes(recoveryPassword)
                  .then((result) => {
                    if (result.kind === "success")
                      setRecoveryCodes(result.recoveryCodes ?? []);
                    setFeedback(result);
                  })
              }
              testID="account-recovery-codes-submit"
              variant="secondary"
            >
              {text.issueRecoveryCodes}
            </Button>
          </Card>
        )}
        <Card style={{ gap: spacing.md }} testID="account-delete-panel">
          <Text maxFontSizeMultiplier={2} style={{ ...typography.bodyStrong }}>
            {text.deleteAccount}
          </Text>
          <Text maxFontSizeMultiplier={2} style={{ ...typography.small }}>
            {text.deleteAccountDescription}
          </Text>
          <PublicDeletionLink text={text} />
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setDeletionPassword}
            placeholder={text.password}
            placeholderTextColor={styles.placeholder.color as string}
            secureTextEntry
            style={styles.input}
            testID="account-delete-reauth-password"
            value={deletionPassword}
          />
          <Button
            onPress={() =>
              void account
                .deleteAccount(deletionPassword)
                .then(setResult(setFeedback))
            }
            testID="account-delete-submit"
            variant="secondary"
          >
            {text.confirmDeletion}
          </Button>
        </Card>
        <Button
          onPress={() => void account.signOut().then(setResult(setFeedback))}
          testID="account-sign-out"
          variant="secondary"
        >
          {text.signOut}
        </Button>
      </Screen>
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
    return (
      <Screen
        ambient
        ambientVariant="auth"
        edges={screenEdges}
        footer={
          <Button
            labelStyle={styles.guestActionLabel}
            onPress={continueWithoutAccount}
            testID="account-sign-in-guest"
            variant="ghost"
          >
            {text.continueWithoutAccount}
          </Button>
        }
        footerVariant="sticky"
        style={styles.authScreen}
      >
        <View style={styles.authPanel}>
          <Text maxFontSizeMultiplier={2} style={styles.authTitle}>
            {text.signIn}
          </Text>
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
          <View style={styles.authLinks}>
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
        action={{ label: text.backToSignIn, onPress: () => { setFeedback(null); setMode("signIn"); }, testID: "account-recovery-back-to-sign-in" }}
        backAction={backAction}
        body={text.recoveryAcceptedDescription}
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
      style={styles.authScreen}
    >
      <View style={styles.authPanel}>
        <Text
          maxFontSizeMultiplier={2}
          style={[
            styles.authTitle,
            mode === "recovery" && recoveryMethod === "code"
              ? styles.recoveryCodeTitle
              : null,
          ]}
        >
          {modeTitle}
        </Text>
        {modeDescription ? (
          <Text maxFontSizeMultiplier={2} style={styles.authDescription}>{modeDescription}</Text>
        ) : null}
      {mode === "register" && isRegisterFieldFailure(feedback) ? null : renderFeedback(feedback, text)}
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
  const { colorMode, colors } = useAppPreferences();
  return (
    <Screen
      backgroundColor={colors.background}
      edges={["top", "bottom"]}
      scroll={false}
      style={styles.welcomeScreen}
    >
      <StatusBar style={colorMode === "dark" ? "light" : "dark"} />
      <View style={styles.welcomeHero}>
        <PatternlyMark size={88} treatment={colorMode === "dark" ? "white" : "navy"} />
        <Text maxFontSizeMultiplier={2} style={styles.welcomeBrand}>
          Patternly
        </Text>
        <Text maxFontSizeMultiplier={2} style={styles.welcomeTitle}>
          {text.welcomeTitle}
        </Text>
        <Text maxFontSizeMultiplier={2} style={styles.welcomeDescription}>
          {text.welcomeDescription}
        </Text>
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
  testID,
  title,
}: Readonly<{
  action?: Readonly<{ label: string; onPress: () => void; testID: string }>;
  backAction?: Readonly<{ onPress: () => void }>;
  body: string;
  children?: ReactNode;
  detail?: string;
  testID: string;
  title: string;
}>) {
  const styles = useThemedStyles(createStyles);
  return (
    <Screen ambient ambientVariant="auth" edges={["top", "bottom"]} style={styles.authScreen}>
      {backAction ? <ScreenHeader backAction={backAction} title="" /> : null}
      <View style={styles.authPanel} testID={testID}>
        <View style={styles.statusCopy}>
          <Text maxFontSizeMultiplier={2} style={styles.authTitle}>{title}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.authDescription}>{body}</Text>
          {detail ? <Text maxFontSizeMultiplier={2} style={styles.statusDetail}>{detail}</Text> : null}
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
      <Text
        maxFontSizeMultiplier={2}
        style={[styles.entryButtonLabel, labelStyle]}
      >
        {text}
      </Text>
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
  const invalidEmail = feedback?.kind === "failure" && feedback.failure === "invalid" && !hasValidEmailFormat(email);
  const credentialsError = feedback?.kind === "failure" && (feedback.failure === "invalidCredential" || (feedback.failure === "invalid" && !invalidEmail));
  return (
    <View style={styles.signInForm}>
      <View style={styles.fieldGroup}>
        <Text maxFontSizeMultiplier={2} style={styles.fieldLabel}>
          {text.email}
        </Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={onEmailChange}
          placeholder={text.enterEmail}
          placeholderTextColor={placeholderTextColor}
          style={[inputStyle, styles.centeredInput, invalidEmail ? styles.authInputError : null]}
          testID="account-email"
          value={email}
        />
        {invalidEmail ? <Text accessibilityLabel={`${text.email}. ${text.emailFormatError}`} accessibilityLiveRegion="polite" accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.fieldError} testID="account-email-error">{text.emailFormatError}</Text> : null}
      </View>
      <View style={styles.fieldGroup}>
        <Text maxFontSizeMultiplier={2} style={styles.fieldLabel}>
          {text.password}
        </Text>
        <View>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={onPasswordChange}
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
        {credentialsError ? <Text accessibilityLabel={`${text.password}. ${text.signInCredentialsError}`} accessibilityLiveRegion="polite" accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.fieldError} testID="account-password-error">{text.signInCredentialsError}</Text> : null}
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
      <Text maxFontSizeMultiplier={2} style={styles.dividerLabel}>
        {label}
      </Text>
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
      <View style={styles.providerIcon}>
        {icon === "apple" ? (
          <Icon color={colors.provider.appleIcon} name="apple" size={26} />
        ) : <GoogleIcon height={18} width={18} />}
      </View>
      <Text maxFontSizeMultiplier={2} style={styles.providerLabel}>
        {text}
      </Text>
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
  const invalidEmail = feedback?.kind === "failure" && feedback.failure === "invalid" && !hasValidEmailFormat(email);
  const emailError = invalidEmail
    ? text.emailFormatError
    : feedback?.kind === "failure" && feedback.failure === "duplicate"
      ? text.duplicate
      : undefined;
  const passwordError = feedback?.kind === "failure" && (feedback.failure === "invalidCredential" || (feedback.failure === "invalid" && !invalidEmail))
    ? text.invalid
    : undefined;
  return (
    <View style={styles.authForm}>
      <FormField error={emailError} errorTestID="account-register-email-error" label={text.email}>
        <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={onEmailChange} placeholder={text.enterEmail} placeholderTextColor={placeholderTextColor} style={[inputStyle, styles.centeredInput, emailError ? styles.authInputError : null]} testID="account-email" value={email} />
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
    <View style={styles.termsCheckboxRow}>
      <Pressable accessibilityLabel={`${text.acceptTermsPrefix} ${text.termsOfService} ${text.and} ${text.privacyPolicy}`} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} hitSlop={8} onPress={() => onChange(!accepted)} style={styles.termsCheckboxControl} testID="account-register-terms-checkbox">
        <View style={[styles.termsCheckbox, accepted ? styles.termsCheckboxChecked : null]}>{accepted ? <Icon color={styles.termsCheckboxIcon.color as string} name="check" size={16} /> : null}</View>
      </Pressable>
      <View style={styles.termsLinks}>
        <Text maxFontSizeMultiplier={2} style={styles.termsCopy}>{text.acceptTermsPrefix}</Text>
        {links ? <><Pressable accessibilityRole="link" onPress={() => void Linking.openURL(links.termsUrl)} testID="account-register-terms-link"><Text maxFontSizeMultiplier={2} style={styles.termsLink}>{text.termsOfService}</Text></Pressable><Text maxFontSizeMultiplier={2} style={styles.termsCopy}>{text.and}</Text><Pressable accessibilityRole="link" onPress={() => void Linking.openURL(links.privacyUrl)} testID="account-register-privacy-link"><Text maxFontSizeMultiplier={2} style={styles.termsLink}>{text.privacyPolicy}</Text></Pressable></> : <Text maxFontSizeMultiplier={2} style={styles.termsCopy}>{`${text.termsOfService} ${text.and} ${text.privacyPolicy}`}</Text>}
      </View>
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
      <Text maxFontSizeMultiplier={2} style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text accessibilityLabel={`${label}. ${error}`} accessibilityLiveRegion="polite" accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.fieldError} testID={errorTestID}>{error}</Text> : null}
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
      <View>
        <TextInput autoCapitalize="none" autoComplete={autoComplete} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={placeholderTextColor} secureTextEntry={!visible} style={[inputStyle, styles.centeredInput, styles.passwordInput, error ? styles.authInputError : null]} testID={testID} value={value} />
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
  const invalidEmail = feedback?.kind === "failure" && feedback.failure === "invalid" && !hasValidEmailFormat(email);
  if (method === "code")
    return (
      <View style={styles.authForm}>
        <FormField label={text.recoveryCode}>
          <TextInput autoCapitalize="characters" autoCorrect={false} onChangeText={onCodeChange} placeholder={text.recoveryCode} placeholderTextColor={placeholderTextColor} style={[inputStyle, styles.centeredInput]} testID="account-recovery-code" value={code} />
        </FormField>
        <Button labelStyle={styles.authPrimaryLabel} onPress={onConsume} style={styles.authPrimaryButton} testID="account-recovery-code-submit" variant="primary">{text.consumeRecoveryCode}</Button>
        <Button labelStyle={styles.textActionLabel} onPress={onSelectEmail} testID="account-recovery-email-option" variant="ghost">{text.backToEmailRecovery}</Button>
      </View>
    );
  return (
    <View style={styles.authForm}>
      <FormField error={invalidEmail ? text.emailFormatError : undefined} label={text.email}>
        <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={onEmailChange} placeholder={text.enterEmail} placeholderTextColor={placeholderTextColor} style={[inputStyle, styles.centeredInput, invalidEmail ? styles.authInputError : null]} testID="account-recovery-email" value={email} />
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
  return (
    <View style={styles.authForm}>
      <AuthPasswordInput autoComplete="password-new" inputStyle={inputStyle} onChangeText={onPasswordChange} placeholder={text.password} placeholderTextColor={placeholderTextColor} testID="account-reset-password" text={text} value={password} />
      <AuthPasswordInput autoComplete="password-new" error={passwordMismatch ? text.passwordMismatch : undefined} inputStyle={inputStyle} label={text.confirmPassword} onChangeText={onConfirmationChange} placeholder={text.confirmPassword} placeholderTextColor={placeholderTextColor} testID="account-reset-password-confirmation" text={text} value={confirmation} />
      <Button labelStyle={styles.authPrimaryLabel} onPress={onSubmit} style={styles.authPrimaryButton} testID="account-reset-submit" variant="primary">{text.reset}</Button>
    </View>
  );
}

function renderFeedback(feedback: Feedback | null, text: AccountCopy) {
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
      title={text.signInProblem}
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
      {available ? null : (
        <InfoBlock
          body={
            publicLinks.reason === "invalid_public_environment"
              ? text.publicDeletionLinkInvalid
              : text.publicDeletionLinkUnavailable
          }
          title={text.publicDeletionLink}
          testID="account-public-deletion-unavailable"
          tone="warning"
        />
      )}
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

function AccountDataPanel({
  accountData,
  onConfirm,
  onRetry,
  text,
}: Readonly<{
  accountData: import("../../application/account/accountDataService").AccountDataSession;
  onConfirm: (
    resolutions: readonly Readonly<{
      conflictId: string;
      resolution: "keep_guest" | "keep_account";
    }>[],
  ) => void;
  onRetry: () => void;
  text: AccountCopy;
}>) {
  const [resolutions, setResolutions] = useState<
    Record<string, "keep_guest" | "keep_account">
  >({});
  if (accountData.status === "previewReady" && accountData.preview) {
    const plan = accountData.preview.plan;
    const complete = plan.conflictRecordIds.every(
      (id) => resolutions[id] !== undefined,
    );
    return (
      <Card testID="account-adoption-preview" style={{ gap: spacing.md }}>
        <Text maxFontSizeMultiplier={2} style={{ ...typography.bodyStrong }}>
          {text.adoptionPreview}
        </Text>
        <Text maxFontSizeMultiplier={2} style={{ ...typography.small }}>
          {text.adoptionPreviewDescription}
        </Text>
        <Text
          maxFontSizeMultiplier={2}
        >{`${text.preserve}: ${plan.localRecordCount} · ${text.upload}: ${plan.uploadRecordIds.length} · ${text.restore}: ${plan.restoreRecordIds.length} · ${text.deduplicated}: ${plan.deduplicatedRecordIds.length}`}</Text>
        {plan.conflictRecordIds.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text
              maxFontSizeMultiplier={2}
              style={{ ...typography.bodyStrong }}
            >{`${text.decisions}: ${plan.conflictRecordIds.length}`}</Text>
            {plan.conflictRecordIds.map((id) => (
              <View key={id} style={{ gap: spacing.xs }}>
                <Text maxFontSizeMultiplier={2}>{id}</Text>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Button
                    onPress={() =>
                      setResolutions((current) => ({
                        ...current,
                        [id]: "keep_guest",
                      }))
                    }
                    variant={
                      resolutions[id] === "keep_guest" ? "primary" : "secondary"
                    }
                  >
                    {text.keepGuest}
                  </Button>
                  <Button
                    onPress={() =>
                      setResolutions((current) => ({
                        ...current,
                        [id]: "keep_account",
                      }))
                    }
                    variant={
                      resolutions[id] === "keep_account"
                        ? "primary"
                        : "secondary"
                    }
                  >
                    {text.keepAccount}
                  </Button>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        <Button
          disabled={!complete}
          onPress={() =>
            onConfirm(
              plan.conflictRecordIds.map((conflictId) => ({
                conflictId,
                resolution: resolutions[conflictId]!,
              })),
            )
          }
          testID="account-adoption-confirm"
          variant="primary"
        >
          {text.confirmAdoption}
        </Button>
      </Card>
    );
  }
  if (accountData.status === "synced")
    return (
      <InfoBlock
        body={text.syncCompleteDescription}
        title={text.syncComplete}
        testID="account-sync-synced"
        tone="success"
      />
    );
  if (accountData.status === "offlinePending")
    return (
      <Card testID="account-sync-pending" style={{ gap: spacing.md }}>
        <InfoBlock
          body={text.pendingDescription}
          title={text.pending}
          tone="warning"
        />
        <Button onPress={onRetry} testID="account-sync-retry" variant="primary">
          {text.retrySync}
        </Button>
      </Card>
    );
  if (accountData.status === "signOutPending")
    return (
      <InfoBlock
        body={text.signOutPendingDescription}
        title={text.signOutPending}
        testID="account-sign-out-pending"
        tone="warning"
      />
    );
  if (accountData.status === "remoteDeletionPending")
    return (
      <InfoBlock
        body={text.deletionPendingDescription}
        title={text.deletionPending}
        testID="account-deletion-pending"
        tone="warning"
      />
    );
  if (accountData.status === "localCleanupPending")
    return (
      <InfoBlock
        body={text.localCleanupPendingDescription}
        title={text.localCleanupPending}
        testID="account-deletion-local-cleanup-pending"
        tone="warning"
      />
    );
  if (
    accountData.activeSessionBlocked ||
    accountData.lastFailureCode === "active_session_adoption_blocked"
  )
    return (
      <InfoBlock
        body={text.activeSessionBlocked}
        title={text.adoptionPreview}
        testID="account-adoption-active-session"
        tone="warning"
      />
    );
  if (accountData.lastFailureCode === "journal_recovery_required")
    return (
      <InfoBlock
        body={text.journalBlocked}
        title={text.adoptionPreview}
        testID="account-adoption-journal"
        tone="warning"
      />
    );
  if (accountData.status === "conflict")
    return (
      <Card testID="account-sync-conflict" style={{ gap: spacing.md }}>
        <InfoBlock
          body={text.conflictDescription}
          title={text.conflict}
          tone="warning"
        />
        <Button onPress={onRetry} testID="account-sync-retry" variant="primary">
          {text.retrySync}
        </Button>
      </Card>
    );
  if (accountData.status === "failed")
    return (
      <Card testID="account-sync-failed" style={{ gap: spacing.md }}>
        <InfoBlock
          body={text.dataFailureDescription}
          title={text.dataFailure}
          tone="warning"
        />
        <Button onPress={onRetry} testID="account-sync-retry" variant="primary">
          {text.retrySync}
        </Button>
      </Card>
    );
  return (
    <InfoBlock
      body={text.syncing}
      title={text.syncing}
      testID="account-syncing"
    />
  );
}

function setResult(setFeedback: (feedback: Feedback) => void) {
  return (result: AccountCommandResult) => setFeedback(result);
}

function isRegisterFieldFailure(feedback: Feedback | null): boolean {
  return feedback?.kind === "failure" && (
    feedback.failure === "duplicate" ||
    feedback.failure === "invalid" ||
    feedback.failure === "invalidCredential" ||
    feedback.failure === "passwordMismatch"
  );
}

function hasValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email.trim());
}

const createStyles = (palette: AppColors) =>
  StyleSheet.create({
    authScreen: { justifyContent: "center" },
    authPanel: { alignSelf: "stretch", gap: spacing.md },
    authForm: { gap: spacing.md },
    termsCheckboxRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm },
    termsCheckboxControl: { paddingTop: 1 },
    termsCheckbox: { alignItems: "center", borderColor: palette.borderStrong, borderRadius: 5, borderWidth: 1, height: 22, justifyContent: "center", width: 22 },
    termsCheckboxChecked: { backgroundColor: palette.primary, borderColor: palette.primary },
    termsCheckboxIcon: { color: palette.onPrimary },
    termsCopy: { color: palette.textSecondary, fontSize: 13, lineHeight: 18 },
    termsLinks: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    termsLink: { color: palette.primary, fontSize: 13, lineHeight: 18, textDecorationLine: "underline" },
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
      lineHeight: 22,
      height: 52,
      paddingHorizontal: spacing.lg,
      paddingVertical: 0,
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
    visibilityButton: {
      alignItems: "center",
      height: 44,
      justifyContent: "center",
      position: "absolute",
      right: spacing.sm,
      top: 5,
      width: 44,
    },
    icon: { color: palette.textPrimary },
    authLinks: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: -spacing.sm,
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
      position: "relative",
    },
    providerIcon: {
      alignItems: "center",
      height: 32,
      justifyContent: "center",
      left: spacing.lg,
      position: "absolute",
      width: 32,
    },
    providerLabel: {
      color: palette.provider.brandedLabel,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 22,
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
