import { useEffect, useMemo, useRef, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import * as Crypto from "expo-crypto";

import { usePatternlyAccount } from "../../application/account/AccountSessionProvider";
import { Button, Icon, InfoBlock, Screen, ScreenHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import { createPurchasesAdapter, createRevenueCatGateway, readPurchaseConfig, type PurchasesAdapter, type RevenueCatPackage } from "../../infrastructure/purchases";
import { createPremiumPurchaseCoordinator, type PremiumPurchaseActor, type PremiumPurchaseState } from "../../application/account/premiumPurchaseCoordinator";
import { capturePremiumPurchaseJournal } from "../../storage/repositories/premiumPurchaseAttemptRepository";
import { legalVariables } from "../../legal/legalVariables";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";

export function hasConfirmedPremiumScope(value: string): boolean {
  return value.trim().length > 0 && !/^\[(?:TO BE COMPLETED|DO UZUPEŁNIENIA):/u.test(value);
}

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PREMIUM_PURCHASE>;
const emptyPurchaseState: PremiumPurchaseState = { access: "pending", blocked: true, storeActive: false, notice: "checking", receiptIssue: false };
export type PremiumOfferLoadState = Readonly<{ kind: "loading" } | { kind: "ready"; package: RevenueCatPackage } | { kind: "unavailable" | "failure" }>;

export function PremiumPurchaseScreen({ navigation }: Props) {
  const { locale } = useAppPreferences();
  const legalLocale = locale === "pl" ? "pl" : "en";
  const account = usePatternlyAccount();
  const [instantStartAccepted, setInstantStartAccepted] = useState(false);
  const [loadState, setLoadState] = useState<PremiumOfferLoadState>({ kind: "loading" });
  const [busy, setBusy] = useState<"purchase" | "restore" | "manage" | null>(null);
  const [ownedPurchaseState, setOwnedPurchaseState] = useState<Readonly<{ owner: object | null; state: PremiumPurchaseState }>>({ owner: null, state: emptyPurchaseState });
  const [managementFailure, setManagementFailure] = useState<"unavailable" | "failure" | null>(null);
  const actionLockedRef = useRef(false);
  const actorRef = useRef<PremiumPurchaseActor | null>(null);
  if (!actorRef.current?.isCurrent()) actorRef.current = account.capturePremiumPurchaseActor();
  const actor = actorRef.current;
  const adapter = useMemo<PurchasesAdapter | null>(() => {
    if (Platform.OS !== "ios" || !actor) return null;
    const config = readPurchaseConfig(process.env, actor.accountId);
    return config ? createPurchasesAdapter(createRevenueCatGateway(), { config, platform: Platform.OS, isCurrent: actor.isCurrent }) : null;
  }, [actor]);
  const foregroundRef = useRef({ active: AppState.currentState === "active", epoch: 0 });
  const coordinator = useMemo(() => actor && adapter ? createPremiumPurchaseCoordinator({
    actor, adapter, journal: capturePremiumPurchaseJournal(actor.accountId, actor.isCurrent),
    monotonicNow: () => performance.now(),
    dispatchEpoch: () => foregroundRef.current.active ? foregroundRef.current.epoch : null,
  }) : null, [actor, adapter]);
  const purchaseState = ownedPurchaseState.owner === coordinator && actor?.isCurrent() ? ownedPurchaseState.state : emptyPurchaseState;
  const coordinatorRef = useRef(coordinator);
  coordinatorRef.current = coordinator;

  useEffect(() => {
    let active = true;
    actionLockedRef.current = false;
    setBusy(null);
    setInstantStartAccepted(false);
    setManagementFailure(null);
    setOwnedPurchaseState({ owner: coordinator, state: coordinator?.getState() ?? emptyPurchaseState });
    if (!adapter || !coordinator) {
      setLoadState({ kind: "unavailable" });
      return;
    }
    const unsubscribe = coordinator.subscribe((state) => { if (active) setOwnedPurchaseState({ owner: coordinator, state }); });
    void coordinator.reload();
    setLoadState({ kind: legalVariables.premiumCheckoutEnabled ? "loading" : "unavailable" });
    if (legalVariables.premiumCheckoutEnabled) void adapter.getMonthlyPackage().then((offer) => {
      if (!active || !actor?.isCurrent()) return;
      setLoadState(offer.status === "success" && offer.package ? { kind: "ready", package: offer.package } : { kind: offer.status === "failure" ? "failure" : "unavailable" });
    });
    const providerUnsubscribe = adapter.subscribe(() => { if (active) void coordinator.reload(); });
    return () => { active = false; coordinator.invalidateDispatch(); unsubscribe(); providerUnsubscribe(); };
  }, [coordinator, adapter, actor]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      const returned = !foregroundRef.current.active && next === "active";
      if (next !== "active") foregroundRef.current.epoch += 1;
      foregroundRef.current.active = next === "active";
      if (returned) void coordinatorRef.current?.reload();
    });
    return () => subscription.remove();
  }, []);

  async function run(action: "purchase" | "restore" | "manage") {
    if (actionLockedRef.current || !adapter || !actor || !coordinator || !actor.isCurrent()) return;
    if (action === "purchase" && (!purchaseEnabled || loadState.kind !== "ready")) return;
    actionLockedRef.current = true;
    setBusy(action);
    setManagementFailure(null);
    try {
      if (action === "manage") {
        const management = await adapter.managementURL();
        if (!actor.isCurrent() || coordinatorRef.current !== coordinator) return;
        if (management.status !== "success" || !management.url) { setManagementFailure(management.status === "unavailable" ? "unavailable" : "failure"); return; }
        await Linking.openURL(management.url);
      } else if (action === "restore") await coordinator.restore();
      else if (loadState.kind === "ready") await coordinator.purchase(loadState.package, {
        confirmationId: Crypto.randomUUID(), termsVersion: legalVariables.documentVersion.en,
        productIdentifier: loadState.package.product.identifier, storefrontPrice: loadState.package.product.priceString,
        locale: legalLocale, immediateStartRequested: true,
      });
    } catch {
      if (actor.isCurrent() && coordinatorRef.current === coordinator) setManagementFailure("failure");
    } finally {
      if (actor.isCurrent() && coordinatorRef.current === coordinator) { actionLockedRef.current = false; setBusy(null); }
    }
  }

  const hasCurrentLegalAcceptance = account.state.kind === "authenticated" && account.state.backendUser.acceptedTermsVersion === legalVariables.documentVersion.en;
  const purchaseEnabled = legalVariables.premiumCheckoutEnabled && hasConfirmedPremiumScope(legalVariables.terms.premiumServiceScope[legalLocale]) && hasCurrentLegalAcceptance && loadState.kind === "ready" && instantStartAccepted && busy === null && !purchaseState.blocked;
  return <PremiumPurchaseView navigation={navigation} accountKind={account.state.kind} hasCurrentLegalAcceptance={hasCurrentLegalAcceptance}
    checkoutEnabled={legalVariables.premiumCheckoutEnabled} loadState={loadState} busy={busy} purchaseState={purchaseState}
    managementFailure={managementFailure} instantStartAccepted={instantStartAccepted} purchaseEnabled={purchaseEnabled}
    serviceAvailable={adapter !== null} onToggleConsent={() => setInstantStartAccepted((accepted) => !accepted)}
    onAction={(action) => void run(action)} onRefresh={() => void coordinator?.reload()} />;
}

export type PremiumPurchaseViewProps = Readonly<{
  navigation: Pick<Props["navigation"], "navigate" | "goBack">;
  accountKind: string; hasCurrentLegalAcceptance: boolean; checkoutEnabled: boolean;
  loadState: PremiumOfferLoadState; busy: "purchase" | "restore" | "manage" | null;
  purchaseState: PremiumPurchaseState; managementFailure: "unavailable" | "failure" | null;
  instantStartAccepted: boolean; purchaseEnabled: boolean; serviceAvailable: boolean;
  onToggleConsent: () => void; onAction: (action: "purchase" | "restore" | "manage") => void; onRefresh: () => void;
}>;

/** The production view is also used by the isolated native state/locale acceptance fixture. */
export function PremiumPurchaseView({ navigation, accountKind, hasCurrentLegalAcceptance, checkoutEnabled, loadState, busy, purchaseState, managementFailure, instantStartAccepted, purchaseEnabled, serviceAvailable, onToggleConsent, onAction, onRefresh }: PremiumPurchaseViewProps) {
  const styles = useThemedStyles(createStyles);
  const { locale } = useAppPreferences();
  const legalLocale = locale === "pl" ? "pl" : "en";
  const { t } = useTranslation("settings");
  const { t: legalText } = useTranslation("legal");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const terms = legalVariables.terms;
  const productName = terms.premiumProductName[legalLocale];
  const serviceScope = terms.premiumServiceScope[legalLocale];
  const hasServiceScope = hasConfirmedPremiumScope(serviceScope);
  const isAuthenticated = accountKind === "authenticated";
  const isLocalOfflineAccount = accountKind === "localOffline";
  const price = loadState.kind === "ready" ? loadState.package.product.priceString : null;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader backAction={{ onPress: () => navigation.goBack() }} context={t("appSettings")} title={t("premiumTitle")} />
      <View style={styles.hero} testID="premium-offer-summary">
        <Text maxFontSizeMultiplier={2} style={styles.title}>{productName}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.body}>{hasServiceScope ? t("premiumServiceScopeSummary") : t("premiumScopeUnavailableDetail")}</Text>
        {price ? <Text maxFontSizeMultiplier={2} style={styles.price} testID="premium-storefront-price">{t("premiumMonthlyPrice", { price })}</Text> : null}
        <Text maxFontSizeMultiplier={2} style={styles.caption}>{t("premiumRenewalSummary")}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.caption}>{t("premiumCancellationDetail")}</Text>
      </View>

      {!isAuthenticated ? <InfoBlock
        body={t(isLocalOfflineAccount ? "premiumOfflineAccountRequiredDetail" : "premiumAccountRequiredDetail")}
        title={t(isLocalOfflineAccount ? "premiumOfflineAccountRequired" : "premiumAccountRequired")}
        testID="premium-account-required"
        tone="warning"
      /> : null}
      {isAuthenticated && purchaseState.access !== "verified" && loadState.kind === "loading" ? <InfoBlock body={t("premiumLoadingDetail")} title={t("premiumLoading")} testID="premium-loading" /> : null}
      {isAuthenticated && purchaseState.access !== "verified" && loadState.kind === "unavailable" ? <InfoBlock body={t("premiumUnavailableDetail")} title={t("premiumUnavailable")} testID="premium-unavailable" tone="warning" /> : null}
      {isAuthenticated && purchaseState.access !== "verified" && loadState.kind === "failure" ? <InfoBlock body={t("premiumLoadFailedDetail")} title={t("premiumLoadFailed")} testID="premium-load-failed" tone="warning" /> : null}

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsVisible }} onPress={() => setDetailsVisible((visible) => !visible)} style={styles.detailsToggle} testID="premium-show-details">
        <Text maxFontSizeMultiplier={2} style={styles.detailsToggleText}>{detailsVisible ? t("premiumHideDetails") : t("premiumShowDetails")}</Text>
        <Icon name={detailsVisible ? "chevron-up" : "chevron-down"} size={20} />
      </Pressable>
      {detailsVisible ? (
        <View style={styles.details} testID="premium-details">
          <Detail label={t("premiumSeller")} value={terms.merchantOfRecord[legalLocale]} />
          <Detail label={t("premiumPayment")} value={t("premiumPaymentDetail")} />
          <Detail label={t("premiumCancellation")} value={t("premiumCancellationDetail")} />
          <Detail label={t("premiumWithdrawal")} value={t("premiumWithdrawalDetail")} />
        </View>
      ) : null}

      {isAuthenticated && checkoutEnabled && hasServiceScope && !purchaseState.blocked ? (
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: instantStartAccepted }} onPress={onToggleConsent} style={styles.checkboxRow} testID="premium-instant-start-checkbox">
          <View style={[styles.checkbox, instantStartAccepted ? styles.checkboxChecked : null]}>{instantStartAccepted ? <Icon color={styles.checkboxIcon.color as string} name="check" size={16} /> : null}</View>
          <Text maxFontSizeMultiplier={2} style={styles.checkboxText}>{t("premiumInstantStartConsent")}</Text>
        </Pressable>
      ) : null}

      {isAuthenticated && purchaseState.notice ? <InfoBlock
        body={t(({ restoreCancelled: "premiumCancelledDetail", notStarted: "premiumNotStartedDetail", checking: "premiumCheckingDetail", active: "premiumSuccessDetail", pending: "premiumPaymentPendingDetail", unknown: "premiumUnknownDetail", cancelled: "premiumCancelledDetail", failure: "premiumActionFailedDetail", denied: "premiumVerificationDeniedDetail" } as const)[purchaseState.notice])}
        title={t(({ restoreCancelled: "premiumRestoreCancelled", notStarted: "premiumNotStarted", checking: "premiumChecking", active: "premiumSuccess", pending: "premiumPaymentPending", unknown: "premiumUnknown", cancelled: "premiumCancelled", failure: "premiumActionFailed", denied: "premiumVerificationDenied" } as const)[purchaseState.notice])}
        testID={`premium-${purchaseState.notice}`} tone={purchaseState.notice === "active" ? "success" : purchaseState.notice === "cancelled" || purchaseState.notice === "restoreCancelled" || purchaseState.notice === "checking" ? "neutral" : "warning"}
      /> : null}
      {isAuthenticated && purchaseState.receiptIssue ? <InfoBlock title={t("premiumReceiptIssue")} body={t("premiumReceiptIssueDetail")} testID="premium-receipt-issue" tone="warning" /> : null}
      {managementFailure ? <InfoBlock title={t(managementFailure === "unavailable" ? "premiumManageUnavailable" : "premiumActionFailed")} body={t(managementFailure === "unavailable" ? "premiumManageUnavailableDetail" : "premiumActionFailedDetail")} testID="premium-management-failure" tone="warning" /> : null}
      {isAuthenticated && !hasCurrentLegalAcceptance ? <InfoBlock title={t("premiumTermsRequired")} body={t("premiumTermsRequiredDetail")} testID="premium-terms-required" tone="warning" /> : null}

      <Button onPress={() => navigation.navigate(ROUTES.TERMS_OF_SERVICE)} testID="premium-terms" variant="ghost">{legalText("termsLink")}</Button>
      <Button onPress={() => navigation.navigate(ROUTES.PRIVACY_POLICY)} testID="premium-privacy" variant="ghost">{legalText("privacyLink")}</Button>
      {!isAuthenticated && !isLocalOfflineAccount ? <Button onPress={() => navigation.navigate(ROUTES.ACCOUNT_ENTRY)} testID="premium-account-entry" variant="secondary">{t("premiumAccountRequired")}</Button> : null}
      {isAuthenticated && purchaseState.access !== "verified" && !purchaseState.storeActive ? <Button disabled={!purchaseEnabled || !hasServiceScope} loading={busy === "purchase"} onPress={() => onAction("purchase")} testID="premium-purchase">{price ? t("premiumPurchaseFor", { price }) : t("premiumPurchase")}</Button> : null}
      {isAuthenticated && serviceAvailable ? <Button disabled={busy !== null} onPress={onRefresh} testID="premium-refresh" variant="ghost">{t("premiumRefresh")}</Button> : null}

      <View style={styles.secondaryActions}>
        <Button disabled={!serviceAvailable || busy !== null} loading={busy === "restore"} onPress={() => onAction("restore")} testID="premium-restore" variant="secondary">{t("premiumRestore")}</Button>
        <Button disabled={!serviceAvailable || busy !== null} loading={busy === "manage"} onPress={() => onAction("manage")} testID="premium-manage" variant="ghost">{t("premiumManage")}</Button>
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
  detailsToggleText: { ...typography.button, color: palette.primary, flexShrink: 1 },
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
