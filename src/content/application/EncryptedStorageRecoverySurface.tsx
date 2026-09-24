import { useEffect, useRef } from "react";
import { Animated, Platform, Settings, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button, HoldToConfirmButton, Icon, Screen } from "../../components";
import { PatternlyMark } from "../../components/PatternlyMark";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { spacing, typography, type AppColors } from "../../theme";
import { recoveryDeviceLocale } from "./recoveryDeviceLocale";

export type EncryptedStorageRecoveryStatus = "base" | "removing" | "success" | "error";

type Props = Readonly<{
  canRetry: boolean;
  error?: string;
  onContinue: () => void;
  onRemovingPresented: (presented: boolean) => void;
  onRemove: () => void;
  onRetryBootstrap: () => void;
  onReturn: () => void;
  retryLimitReached: boolean;
  status: EncryptedStorageRecoveryStatus;
}>;

const REMOVING_PRESENTATION_DURATION_MS = 200;

export function EncryptedStorageRecoverySurface({ canRetry, error, onContinue, onRemove, onRemovingPresented, onRetryBootstrap, onReturn, retryLimitReached, status }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colorMode, colors: palette } = useAppPreferences();
  const { i18n } = useTranslation("common");
  const locale = Platform.OS === "ios"
    ? recoveryDeviceLocale(Settings.get("AppleLanguages"), Settings.get("AppleLocale"))
    : "en";
  const t = i18n.getFixedT(locale, "common");
  const removing = status === "removing";
  const success = status === "success";
  const failed = status === "error";
  const removingOpacity = useRef(new Animated.Value(1)).current;
  const onRemovingPresentedRef = useRef(onRemovingPresented);
  onRemovingPresentedRef.current = onRemovingPresented;

  useEffect(() => {
    if (!removing) {
      removingOpacity.setValue(1);
      return;
    }
    removingOpacity.setValue(0.65);
    const animation = Animated.timing(removingOpacity, {
      duration: REMOVING_PRESENTATION_DURATION_MS,
      toValue: 1,
      useNativeDriver: true,
    });
    const onPresentationComplete = onRemovingPresentedRef.current;
    animation.start(({ finished }) => { onPresentationComplete(finished); });
    return () => { animation.stop(); };
  }, [removing, removingOpacity]);

  return (
    <Screen ambientVariant="auth" edges={["top", "bottom"]} style={styles.screen}>
      <View accessibilityLabel="Patternly" accessibilityRole="header" style={styles.brand}>
        <PatternlyMark decorative size={36} treatment={colorMode === "dark" ? "mint" : "navy"} />
        <Text maxFontSizeMultiplier={2} style={styles.brandText}>Patternly</Text>
      </View>

      <View style={styles.hero}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.documentIcon}>
          <Icon color={palette.textSecondary} name="clipboard" size={48} />
          <View style={styles.lockIcon}><Icon color={palette.primary} name="shield" size={23} /></View>
        </View>
        <Text accessibilityRole="header" maxFontSizeMultiplier={2} style={styles.title}>{t("Data on this device can’t be opened")}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.description}>{t("The key protecting local data is missing. Try again. If the key cannot be recovered, you can remove the unavailable data from this device.")}</Text>
      </View>

      {canRetry ? <Button disabled={removing || success || failed} onPress={onRetryBootstrap} testID={runtimeSelectors.content.encryptedStorageRetry()}>{t("Try again")}</Button> : null}
      {retryLimitReached ? <Text maxFontSizeMultiplier={2} style={styles.hint}>{t("You’ve reached the retry limit. You can remove unavailable local data to continue.")}</Text> : null}

      <View style={styles.divider} />

      {success ? (
        <View accessibilityLiveRegion="polite" style={styles.section} testID={runtimeSelectors.content.encryptedStorageSuccess()}>
          <View style={styles.statusIcon}><Icon color={palette.success} name="check" size={30} /></View>
          <Text accessibilityRole="header" maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Unavailable data removed")}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.sectionDescription}>{t("The local data that couldn’t be opened has been removed. Account data saved in the cloud was not changed.")}</Text>
          <Button onPress={onContinue} testID={runtimeSelectors.content.encryptedStorageContinue()}>{t("Continue")}</Button>
          <Text maxFontSizeMultiplier={2} style={styles.hint}>{t("Patternly can now open safely.")}</Text>
        </View>
      ) : (
        <Animated.View accessibilityLiveRegion={failed ? "assertive" : "polite"} style={[styles.section, { opacity: removingOpacity }]} testID={runtimeSelectors.content.encryptedStorageRemoval(status)}>
          {failed ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.statusIcon, styles.statusErrorIcon]}><Icon color={palette.danger} name="alert-triangle" size={30} /></View> : null}
          <Text accessibilityRole="header" maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t(failed ? "Unavailable data removal could not be completed" : removing ? "Removing unavailable data" : "Remove unavailable data")}</Text>
          <Text accessibilityLiveRegion={failed ? "assertive" : "none"} accessibilityRole={failed ? "alert" : undefined} maxFontSizeMultiplier={2} style={styles.sectionDescription}>{t(failed ? "Some local data may already have been removed. You can retry removal or return to the recovery options." : removing ? "Unsent sessions and guest progress are being removed. Account data saved in the cloud will remain." : "Account data previously saved in the cloud will remain.")}</Text>
          {failed && error ? <Text maxFontSizeMultiplier={2} style={styles.error}>{error}</Text> : null}
          <HoldToConfirmButton
            accessibilityLabel={t(failed ? "Hold to retry removal" : "Hold to remove")}
            disabled={removing}
            hint={t("Hold for at least 3 seconds, then release. Releasing early cancels.")}
            loading={removing}
            onConfirm={onRemove}
            testID={runtimeSelectors.content.encryptedStorageHold()}
            variant="secondary"
          >
            {t(failed ? "Hold to retry removal" : removing ? "Removing…" : "Hold to remove")}
          </HoldToConfirmButton>
          {removing ? <Text maxFontSizeMultiplier={2} style={styles.hint}>{t("Keep Patternly open while this finishes.")}</Text> : null}
          {failed ? <Button onPress={onReturn} testID={runtimeSelectors.content.encryptedStorageReturn()} variant="ghost">{t("Return")}</Button> : null}
        </Animated.View>
      )}
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  brand: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "center" },
  brandText: { ...typography.heading, color: palette.textPrimary },
  description: { ...typography.body, color: palette.textSecondary, textAlign: "center" },
  divider: { backgroundColor: palette.border, height: StyleSheet.hairlineWidth, width: "100%" },
  documentIcon: { alignItems: "center", height: 58, justifyContent: "center", width: 58 },
  error: { ...typography.caption, color: palette.danger, textAlign: "center" },
  hero: { alignItems: "center", gap: spacing.md },
  hint: { ...typography.caption, color: palette.textSecondary, textAlign: "center" },
  lockIcon: { bottom: 0, position: "absolute", right: 0 },
  screen: { gap: spacing.xl, justifyContent: "flex-start", marginHorizontal: "auto", maxWidth: 430, paddingTop: spacing.lg, width: "100%" },
  section: { alignItems: "stretch", gap: spacing.md },
  sectionDescription: { ...typography.body, color: palette.textSecondary, textAlign: "center" },
  sectionTitle: { ...typography.heading, color: palette.textPrimary, textAlign: "center" },
  statusIcon: { alignItems: "center", alignSelf: "center", borderColor: palette.success, borderRadius: 999, borderWidth: 3, height: 54, justifyContent: "center", width: 54 },
  statusErrorIcon: { borderColor: palette.danger },
  title: { ...typography.heading, color: palette.textPrimary, textAlign: "center" },
});
