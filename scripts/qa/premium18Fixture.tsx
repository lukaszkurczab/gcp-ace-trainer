/** Isolated native acceptance entry. Never imported by the production app. No account/storage providers or real SDK. */
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { registerRootComponent } from "expo";
import i18n from "../../src/i18n";
import { AppPreferencesPresentationProvider, deriveAppPreferencesPresentation } from "../../src/preferences/appPreferencesContext";
import { PremiumPurchaseView, type PremiumPurchaseViewProps } from "../../src/features/premium/PremiumPurchaseScreen";
import { createPremiumPurchaseCoordinator, type PremiumVerification } from "../../src/application/account/premiumPurchaseCoordinator";
import { createPurchasesAdapter } from "../../src/infrastructure/purchases";
import type { LocalPurchaseAttempt } from "../../src/storage/repositories/premiumPurchaseAttemptRepository";
import type { PurchaseAttemptDto } from "../../src/infrastructure/clients/PatternlyApiClientAdapter";
import { ROUTES } from "../../src/constants/routes";
import { TermsOfServiceScreen } from "../../src/features/home/TermsOfServiceScreen";
import { PrivacyPolicyScreen } from "../../src/features/home/PrivacyPolicyScreen";
import type { AvailableLocale } from "../../src/preferences/localeResolver";

const KEY = Symbol.for("patternly.premium18.fixture");
const scenarios = ["ready", "pending", "unknown", "cancelled", "active", "restore-failure", "checkout-off", "guest", "offline", "manage-unavailable", "offer-failure"];
const pkg = { identifier: "$rc_monthly", product: { identifier: "com.lkurczab.patternly.premium.monthly", priceString: "49,99 zł", productType: "AUTO_RENEWABLE_SUBSCRIPTION", subscriptionPeriod: "P1M" } };
const confirmation = { confirmationId: "00000000-0000-4000-8000-000000000018", termsVersion: "fixture", productIdentifier: pkg.product.identifier, storefrontPrice: pkg.product.priceString, locale: "pl", immediateStartRequested: true } as const;
const baseAttempt: PurchaseAttemptDto = { attemptId: confirmation.confirmationId, outcome: "initiated", acceptedAt: "2026-10-15T00:00:00.000Z", startExpiresAt: "2026-10-15T00:15:00.000Z", initiatedAt: "2026-10-15T00:01:00.000Z", transactionKey: null, resolutionReason: null, dispatchAllowed: true };

function Fixture() {
  const [config, setConfig] = useState({ locale: "pl" as AvailableLocale, scenario: "ready", sequence: 0 });
  const [route, setRoute] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState<PremiumPurchaseViewProps["busy"]>(null);
  const [managementFailure, setManagementFailure] = useState<PremiumPurchaseViewProps["managementFailure"]>(null);
  const epoch = useRef(1);
  const fixture = useMemo(() => {
    let marker: LocalPurchaseAttempt | null = null, attempt = baseAttempt;
    let access: PremiumVerification = config.scenario === "active" ? "verified" : "denied";
    const events: string[] = [];
    const adapter = createPurchasesAdapter({
      configure: async () => {}, getOfferings: async () => ({ current: { monthly: pkg } }),
      getCustomerInfo: async () => ({ activeSubscriptions: access === "verified" ? [pkg.product.identifier] : [] }),
      purchasePackage: async () => {
        events.push("SDK");
        if (config.scenario === "pending") throw { code: "20" };
        if (config.scenario === "unknown") throw { code: "2" };
        if (config.scenario === "cancelled") throw { code: "1" };
        access = "verified";
        return { productIdentifier: pkg.product.identifier, transaction: { productIdentifier: pkg.product.identifier, transactionIdentifier: "fixture-exact-T" } };
      },
      restorePurchases: async () => { events.push("restore"); if (config.scenario === "restore-failure") throw Error("fixture_restore_failure"); access = "verified"; return { activeSubscriptions: [pkg.product.identifier] }; },
      managementURL: async () => config.scenario === "manage-unavailable" ? null : "https://apps.apple.com/account/subscriptions",
    }, { config: { apiKey: "fixture", accountId: "fixture-A", binding: { platform: "ios", store: "APP_STORE", appId: "fixture-ios", rcProductId: "fixture-rc-ios", storeProductId: pkg.product.identifier, basePlanId: null } }, checkoutEnabled: config.scenario !== "checkout-off" });
    const coordinator = createPremiumPurchaseCoordinator({ actor: {
      accountId: "fixture-A", isCurrent: () => true, record: async () => { events.push("record"); },
      attempt: async () => ({ attempt }), command: async (_id, command) => {
        events.push(command.action);
        attempt = { ...attempt, outcome: command.action === "candidate" ? "bound" : command.action === "cancelled" ? "cancelled" : command.action === "pending" ? "pending" : "initiated", transactionKey: command.action === "candidate" ? "a".repeat(64) : null };
        return { attempt };
      }, cases: async () => ({ items: [], truncated: false }), refresh: async () => { events.push("backend"); return access; },
    }, adapter, journal: { read: () => marker, save: (v) => { marker = v; }, clear: () => { marker = null; } }, monotonicNow: () => performance.now(), dispatchEpoch: () => AppState.currentState === "active" ? epoch.current : null });
    return { adapter, coordinator, events, approve: () => { access = "verified"; }, marker: () => marker };
  }, [config.scenario, config.sequence]);
  const [state, setState] = useState(fixture.coordinator.getState());
  const action = async (value: "purchase" | "restore" | "manage") => {
    setBusy(value); setManagementFailure(null);
    try {
      if (value === "purchase") await fixture.coordinator.purchase(pkg, confirmation);
      if (value === "restore") await fixture.coordinator.restore();
      if (value === "manage") { const result = await fixture.adapter.managementURL(); if (result.status !== "success") setManagementFailure("unavailable"); }
    } finally { setBusy(null); }
  };
  const preferences = { ...deriveAppPreferencesPresentation("dark", config.locale, "dark", config.locale), ready: true, setAppearance: async () => {}, setLanguage: async () => {} };
  useEffect(() => {
    setAccepted(false); setRoute(null); setManagementFailure(null); setState(fixture.coordinator.getState());
    const unsubscribe = fixture.coordinator.subscribe(setState); void fixture.coordinator.reload();
    let previous = AppState.currentState;
    const sub = AppState.addEventListener("change", (next) => { if (next !== "active") epoch.current++; if (previous !== "active" && next === "active") void fixture.coordinator.reload(); previous = next; });
    return () => { unsubscribe(); sub.remove(); fixture.coordinator.invalidateDispatch(); };
  }, [fixture]);
  useEffect(() => {
    const runtime = globalThis as unknown as Record<symbol, unknown>;
    runtime[KEY] = {
      select: async (locale: AvailableLocale, scenario: string) => {
        if (!["en", "pl", "de", "fr", "es", "it", "et"].includes(locale) || !scenarios.includes(scenario)) throw Error("fixture_input_rejected");
        await i18n.changeLanguage(locale); setConfig((v) => ({ locale, scenario, sequence: v.sequence + 1 })); return true;
      },
      action, approve: () => { fixture.approve(); }, providerUpdate: () => fixture.coordinator.reload(),
      read: () => ({ fixture: true, config, state: fixture.coordinator.getState(), events: fixture.events, markerPhase: fixture.marker()?.phase ?? null, route }),
    };
    return () => { delete runtime[KEY]; };
  });
  const navigation = { navigate: (name: string) => setRoute(name), goBack: () => setRoute(null) } as unknown as PremiumPurchaseViewProps["navigation"];
  return <SafeAreaProvider><AppPreferencesPresentationProvider value={preferences}><View style={{ flex: 1 }}>
    {route === ROUTES.TERMS_OF_SERVICE ? <TermsOfServiceScreen navigation={navigation as never} route={{} as never} /> : route === ROUTES.PRIVACY_POLICY ? <PrivacyPolicyScreen navigation={navigation as never} route={{} as never} /> : <PremiumPurchaseView
      navigation={navigation} accountKind={config.scenario === "guest" ? "guest" : config.scenario === "offline" ? "localOffline" : "authenticated"}
      hasCurrentLegalAcceptance checkoutEnabled={config.scenario !== "checkout-off"}
      loadState={config.scenario === "offer-failure" ? { kind: "failure" } : ["checkout-off", "guest", "offline"].includes(config.scenario) ? { kind: "unavailable" } : { kind: "ready", package: pkg }}
      busy={busy} purchaseState={state} managementFailure={managementFailure} instantStartAccepted={accepted} serviceAvailable={!['guest', 'offline'].includes(config.scenario)}
      purchaseEnabled={accepted && !state.blocked && config.scenario !== "checkout-off"} storeActionsAvailable={!['guest', 'offline'].includes(config.scenario)} onToggleConsent={() => setAccepted((v) => !v)} onAction={(v) => void action(v)} onRefresh={() => void fixture.coordinator.reload()} />}
  </View></AppPreferencesPresentationProvider></SafeAreaProvider>;
}
if (typeof __DEV__ === "undefined" || !__DEV__) throw Error("development_fixture_only");
registerRootComponent(Fixture);
