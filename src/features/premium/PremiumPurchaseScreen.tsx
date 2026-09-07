import { useEffect, useMemo, useRef, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import * as Crypto from "expo-crypto";

import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { Button, Icon, InfoBlock, Screen, ScreenHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import { createPurchasesAdapter, createRevenueCatGateway, readPurchaseConfig, type PurchaseResult, type PurchasesAdapter, type RevenueCatPackage } from "../../infrastructure/purchases";
import { legalVariables } from "../../legal/legalVariables";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PREMIUM_PURCHASE>;
type LoadState = Readonly<{ kind: "loading" } | { kind: "ready"; package: RevenueCatPackage } | { kind: "unavailable" | "failure" }>;

export function PremiumPurchaseScreen({ navigation }: Props) {
  const styles = useThemedStyles(createStyles);
  const { locale } = useAppPreferences();
  const { t } = useTranslation("settings");
  const account = usePatternlyAccount();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [instantStartAccepted, setInstantStartAccepted] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });
  const [busy, setBusy] = useState<"purchase" | "restore" | "manage" | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const actionLockedRef = useRef(false);
  const terms = legalVariables.terms;
  const accountId = account.state.kind === "authenticated" ? account.state.backendUser.id : undefined;
  const accountIdRef = useRef(accountId);
  accountIdRef.current = accountId;
  const adapter = useMemo<PurchasesAdapter | null>(() => {
    if (Platform.OS !== "ios") return null;
    const config = readPurchaseConfig(process.env, accountId);
    return config ? createPurchasesAdapter(createRevenueCatGateway(), { config, platform: Platform.OS }) : null;
  }, [accountId]);

  useEffect(() => {
    let active = true;
    setResult(null);
    if (!adapter) {
      setLoadState({ kind: "unavailable" });
      return () => { active = false; };
    }
    setLoadState({ kind: "loading" });
    void adapter.getMonthlyPackage().then((offer) => {
      if (!active) return;
      setLoadState(offer.status === "success" && offer.package ? { kind: "ready", package: offer.package } : { kind: offer.status === "failure" ? "failure" : "unavailable" });
    });
    return () => { active = false; };
  }, [adapter]);

  async function run(action: "purchase" | "restore" | "manage") {
    if (actionLockedRef.current || !adapter || (action === "purchase" && loadState.kind !== "ready")) return;
    actionLockedRef.current = true;
    const initiatingAccountId = accountId;
    setBusy(action);
    setResult(null);
    try {
      if (action === "manage") {
        const management = await adapter.managementURL();
        setResult(management);
        if (management.status === "success" && management.url) await Linking.openURL(management.url);
        return;
      }
      let next: PurchaseResult;
      if (action === "restore") next = await adapter.restorePurchases();
      else {
        if (loadState.kind !== "ready") return;
        const confirmation = await account.recordPurchaseConfirmation({
          confirmationId: Crypto.randomUUID(),
          termsVersion: legalVariables.documentVersion.en,
          productIdentifier: loadState.package.product.identifier,
          storefrontPrice: loadState.package.product.priceString,
          locale,
          immediateStartRequested: true,
        });
        if (confirmation.kind !== "success") { setResult({ status: "failure" }); return; }
        if (!initiatingAccountId || accountIdRef.current !== initiatingAccountId) { setResult({ status: "failure" }); return; }
        next = await adapter.purchasePackage(loadState.package);
      }
      setResult(next);
    } catch {
      setResult({ status: "failure" });
    } finally {
      actionLockedRef.current = false;
      setBusy(null);
    }
  }

  const productName = terms.premiumProductName[locale];
  const serviceScope = terms.premiumServiceScope[locale];
  const isAuthenticated = account.state.kind === "authenticated";
  const hasCurrentLegalAcceptance = account.state.kind === "authenticated" && account.state.backendUser.acceptedTermsVersion === legalVariables.documentVersion.en;
  const price = loadState.kind === "ready" ? loadState.package.product.priceString : null;
  const purchaseEnabled = hasCurrentLegalAcceptance && loadState.kind === "ready" && instantStartAccepted && busy === null;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader backAction={{ onPress: () => navigation.goBack() }} context={t("settings")} title={t("premiumTitle")} />
      <View style={styles.hero} testID="premium-offer-summary">
        <Text maxFontSizeMultiplier={2} style={styles.title}>{productName}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.body}>{serviceScope}</Text>
        {price ? <Text maxFontSizeMultiplier={2} style={styles.price} testID="premium-storefront-price">{t("premiumMonthlyPrice", { price })}</Text> : null}
        <Text maxFontSizeMultiplier={2} style={styles.caption}>{t("premiumRenewalSummary")}</Text>
      </View>

      {!isAuthenticated ? <InfoBlock body={t("premiumAccountRequiredDetail")} title={t("premiumAccountRequired")} testID="premium-account-required" tone="warning" /> : null}
      {isAuthenticated && loadState.kind === "loading" ? <InfoBlock body={t("premiumLoadingDetail")} title={t("premiumLoading")} testID="premium-loading" /> : null}
      {isAuthenticated && loadState.kind === "unavailable" ? <InfoBlock body={t("premiumUnavailableDetail")} title={t("premiumUnavailable")} testID="premium-unavailable" tone="warning" /> : null}
      {isAuthenticated && loadState.kind === "failure" ? <InfoBlock body={t("premiumLoadFailedDetail")} title={t("premiumLoadFailed")} testID="premium-load-failed" tone="warning" /> : null}

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsVisible }} onPress={() => setDetailsVisible((visible) => !visible)} style={styles.detailsToggle} testID="premium-show-details">
        <Text maxFontSizeMultiplier={2} style={styles.detailsToggleText}>{detailsVisible ? t("premiumHideDetails") : t("premiumShowDetails")}</Text>
        <Icon name={detailsVisible ? "chevron-up" : "chevron-down"} size={20} />
      </Pressable>
      {detailsVisible ? (
        <View style={styles.details} testID="premium-details">
          <Detail label={t("premiumSeller")} value={terms.merchantOfRecord[locale]} />
          <Detail label={t("premiumPayment")} value={t("premiumPaymentDetail")} />
          <Detail label={t("premiumCancellation")} value={t("premiumCancellationDetail")} />
          <Detail label={t("premiumWithdrawal")} value={t("premiumWithdrawalDetail")} />
        </View>
      ) : null}

      {isAuthenticated ? (
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: instantStartAccepted }} onPress={() => setInstantStartAccepted((accepted) => !accepted)} style={styles.checkboxRow} testID="premium-instant-start-checkbox">
          <View style={[styles.checkbox, instantStartAccepted ? styles.checkboxChecked : null]}>{instantStartAccepted ? <Icon color={styles.checkboxIcon.color as string} name="check" size={16} /> : null}</View>
          <Text maxFontSizeMultiplier={2} style={styles.checkboxText}>{t("premiumInstantStartConsent")}</Text>
        </Pressable>
      ) : null}

      {result?.status === "success" ? <InfoBlock body={t("premiumSuccessDetail")} title={t("premiumSuccess")} testID="premium-success" tone="success" /> : null}
      {result?.status === "cancelled" ? <InfoBlock body={t("premiumCancelledDetail")} title={t("premiumCancelled")} testID="premium-cancelled" /> : null}
      {result?.status === "failure" || result?.status === "misconfigured" || result?.status === "unavailable" ? <InfoBlock body={t("premiumActionFailedDetail")} title={t("premiumActionFailed")} testID="premium-action-failed" tone="warning" /> : null}

      <Button disabled={!purchaseEnabled} loading={busy === "purchase"} onPress={() => void run("purchase")} testID="premium-purchase">{price ? t("premiumPurchaseFor", { price }) : t("premiumPurchase")}</Button>
      <View style={styles.secondaryActions}>
        <Button disabled={!adapter || loadState.kind === "loading" || busy !== null} loading={busy === "restore"} onPress={() => void run("restore")} testID="premium-restore" variant="secondary">{t("premiumRestore")}</Button>
        <Button disabled={!adapter || loadState.kind === "loading" || busy !== null} loading={busy === "manage"} onPress={() => void run("manage")} testID="premium-manage" variant="ghost">{t("premiumManage")}</Button>
      </View>
    </Screen>
  );
}

function Detail({ label, value }: Readonly<{ label: string; value: string }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.detailRow}><Text maxFontSizeMultiplier={2} style={styles.detailLabel}>{label}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{value}</Text></View>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  hero: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.xl, borderWidth: 1, gap: spacing.sm, padding: spacing.xl },
  title: { ...typography.title, color: palette.textPrimary },
  price: { ...typography.title, color: palette.primary, marginTop: spacing.sm },
  body: { ...typography.body, color: palette.textSecondary },
  caption: { ...typography.caption, color: palette.textMuted },
  detailsToggle: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 48 },
  detailsToggleText: { ...typography.button, color: palette.primary },
  details: { backgroundColor: palette.surface, borderRadius: radius.xl, gap: spacing.lg, padding: spacing.xl },
  detailRow: { gap: spacing.xs },
  detailLabel: { ...typography.bodyStrong, color: palette.textPrimary },
  checkboxRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.md, minHeight: 48 },
  checkbox: { alignItems: "center", borderColor: palette.borderStrong, borderRadius: 5, borderWidth: 1, height: 22, justifyContent: "center", marginTop: 1, width: 22 },
  checkboxChecked: { backgroundColor: palette.primary, borderColor: palette.primary },
  checkboxIcon: { color: palette.onPrimary },
  checkboxText: { ...typography.body, color: palette.textSecondary, flex: 1 },
  secondaryActions: { gap: spacing.sm },
});
