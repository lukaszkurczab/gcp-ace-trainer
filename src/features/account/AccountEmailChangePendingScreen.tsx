import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { Button, InfoBlock, Screen, ScreenHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation/types";
import { useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { getAccountEmailChangePendingStatus, normalizeAccountEmail } from "./accountEmailChangePendingStatus";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ACCOUNT_EMAIL_CHANGE_PENDING>;

export function AccountEmailChangePendingScreen({ navigation, route }: Props) {
  const account = usePatternlyAccount();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("settings");
  const status = getAccountEmailChangePendingStatus({
    currentState: account.state,
    expectedUid: route.params.uid,
    refreshFailure: account.refreshAccountIdentityFailure,
    requestedEmail: route.params.requestedEmail,
  });
  const targetEmail = normalizeAccountEmail(route.params.requestedEmail) ?? route.params.requestedEmail;

  const statusBlock = status === "waiting"
    ? <InfoBlock body={t("emailChangePendingWaiting")} title={t("emailChangePendingWaitingTitle")} testID="email-change-waiting" />
    : status === "confirmed"
      ? <InfoBlock body={t("emailChangePendingConfirmed")} title={t("emailChangePendingConfirmedTitle")} testID="email-change-confirmed" tone="success" />
      : status === "refreshError"
        ? <InfoBlock accessibilityAlert body={t("emailChangePendingRefreshError")} title={t("emailChangePendingRefreshErrorTitle")} testID="email-change-refresh-error" tone="warning" />
        : <InfoBlock accessibilityAlert body={t("emailChangePendingUnavailable")} title={t("emailChangePendingUnavailableTitle")} testID="email-change-unavailable" tone="warning" />;

  return (
    <Screen edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader backAction={{ onPress: () => navigation.goBack() }} context={t("appSettings")} contextTone="primary" title={t(status === "waiting" ? "emailChangePendingTitle" : "changeEmail")} />
      {status !== "unavailable" ? <Text selectable maxFontSizeMultiplier={2} style={styles.target} testID="email-change-target">{t("emailChangePendingTarget", { email: targetEmail })}</Text> : null}
      {statusBlock}
      <Button onPress={() => navigation.goBack()} testID="email-change-return" variant="secondary">{t("emailChangeReturn")}</Button>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  screen: { gap: spacing.lg },
  target: { ...typography.bodyStrong, color: palette.textPrimary },
});
