import { legalVariables } from "../../legal/legalVariables";
import type { SubscriptionOption } from "react-native-purchases";
import { parsePublicPremiumMap, type PremiumStoreBinding } from "../../application/account/premiumStoreMap";

export type PurchaseStatus = "unavailable" | "misconfigured" | "failure" | "cancelled" | "pending" | "unknown" | "success";
export type PurchaseResult = Readonly<{ status: PurchaseStatus; transactionId?: string; hasActiveSubscription?: boolean }>;
export type PremiumStore = "APP_STORE" | "PLAY_STORE";
export type StoreBinding = PremiumStoreBinding;
export type PurchaseConfig = Readonly<{ apiKey: string; accountId: string; binding: StoreBinding }>;

export type RevenueCatPackage = Readonly<{
  identifier: string;
  product: Readonly<{
    identifier: string;
    priceString: string;
    introPrice?: unknown | null;
    discounts?: readonly unknown[] | null;
    productType?: string;
    subscriptionPeriod?: string | null;
    subscriptionOptions?: readonly SubscriptionOption[] | null;
  }>;
  store?: PremiumStore;
  /** Actual product identifier used by the API consent and correlation contracts. */
  purchaseProductIdentifier?: string;
  basePlanId?: string | null;
  subscriptionOption?: SubscriptionOption;
}>;
export type RevenueCatGateway = Readonly<{
  configure(config: { apiKey: string; appUserID: string }): Promise<void>;
  getOfferings(): Promise<{ current: { monthly?: RevenueCatPackage | null } | null }>;
  purchasePackage(pkg: RevenueCatPackage): Promise<unknown>;
  purchaseSubscriptionOption?(option: SubscriptionOption): Promise<unknown>;
  restorePurchases(): Promise<unknown>;
  getCustomerInfo(fresh?: boolean): Promise<unknown>;
  managementURL: () => Promise<string | null>;
  subscribe?: (listener: () => void) => () => void;
}>;

// One native SDK and one lane across every account adapter, including a store sheet.
let nativeGateway: RevenueCatGateway | null = null;
export type RevenueCatLogCategory = "debug" | "info" | "warning" | "error" | "unknown";
let lastLogCategory: RevenueCatLogCategory | null = null;

/** RAM-only, bounded diagnostic. SDK text, customers and transactions are never retained. */
export function readRevenueCatLogCategory(): RevenueCatLogCategory | null { return lastLogCategory; }

function sanitizeRevenueCatLog(level: unknown): void {
  switch (level) {
    case "DEBUG": lastLogCategory = "debug"; break;
    case "INFO": lastLogCategory = "info"; break;
    case "WARN": lastLogCategory = "warning"; break;
    case "ERROR": lastLogCategory = "error"; break;
    default: lastLogCategory = "unknown";
  }
}

let sdkTail: Promise<void> = Promise.resolve();
function inSdkLane<T>(work: () => Promise<T>): Promise<T> {
  const result = sdkTail.then(work, work);
  sdkTail = result.then(() => undefined, () => undefined);
  return result;
}

/** The installed SDK types define the original operation's transaction, never CustomerInfo history. */
export function createRevenueCatGateway(): RevenueCatGateway {
  if (nativeGateway) return nativeGateway;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Purchases = (require("react-native-purchases") as typeof import("react-native-purchases")).default;
  // Install before any SDK call. configure otherwise installs its raw console handler.
  Purchases.setLogHandler(sanitizeRevenueCatLog);
  nativeGateway = {
    configure: async (config) => {
      if (!await Purchases.isConfigured()) Purchases.configure(config);
      else if (await Purchases.getAppUserID() !== config.appUserID) await Purchases.logIn(config.appUserID);
    },
    getOfferings: () => Purchases.getOfferings(),
    purchasePackage: (pkg) => Purchases.purchasePackage(pkg as import("react-native-purchases").PurchasesPackage),
    purchaseSubscriptionOption: (option) => Purchases.purchaseSubscriptionOption(option),
    restorePurchases: () => Purchases.restorePurchases(),
    getCustomerInfo: async (fresh) => { if (fresh) await Purchases.invalidateCustomerInfoCache(); return Purchases.getCustomerInfo(); },
    managementURL: async () => (await Purchases.getCustomerInfo()).managementURL ?? null,
    subscribe: (listener) => {
      // Invalidation only. This callback cannot select a transaction or grant access.
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
    },
  };
  return nativeGateway;
}

export const IOS_PREMIUM_BINDING: StoreBinding = Object.freeze({
  platform: "ios", store: "APP_STORE", appId: "app7b06e9a4c1",
  rcProductId: "prod8d07384c8c", storeProductId: "com.lkurczab.patternly.premium.monthly", basePlanId: null,
});

/** Reads the public store map only after pinning its project, schema version and runtime environment. */
const defaultPurchaseEnvironment = () => ({
  EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: process.env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY,
  EXPO_PUBLIC_PATTERNLY_REVENUECAT_ANDROID_API_KEY: process.env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_ANDROID_API_KEY,
  EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP: process.env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP,
  EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT,
});

export function readPurchaseConfig(env: Readonly<Record<string, string | undefined>> = defaultPurchaseEnvironment(), accountId?: string, platform: string = "ios", allowTestFixtures = false): PurchaseConfig | null {
  const apiKey = platform === "ios" ? env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY
    : platform === "android" ? env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_ANDROID_API_KEY : null;
  if (typeof apiKey !== "string" || apiKey.trim() === "" || typeof accountId !== "string" || accountId.trim() === "") return null;
  if (platform === "ios") {
    if (env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP) {
      const storeMap = parsePublicPremiumMap(env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP, env, allowTestFixtures);
      const binding = storeMap?.bindings.find((candidate) => candidate.platform === "ios" && candidate.store === "APP_STORE");
      if (!binding) return null;
      return { apiKey, accountId, binding };
    }
    return { apiKey, accountId, binding: IOS_PREMIUM_BINDING };
  }
  if (platform !== "android") return null;
  const storeMap = parsePublicPremiumMap(env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP, env, allowTestFixtures);
  const binding = storeMap?.bindings.find((candidate) => candidate.platform === "android" && candidate.store === "PLAY_STORE");
  return binding ? { apiKey, accountId, binding } : null;
}

export function createPurchasesAdapter(gateway: RevenueCatGateway, options: {
  platform?: string; config: PurchaseConfig; binding?: StoreBinding | null; checkoutEnabled?: boolean; isCurrent?: () => boolean;
}): PurchasesAdapter {
  const current = options.isCurrent ?? (() => true);
  const binding = options.binding === undefined ? options.config.binding : options.binding;
  const platform = options.platform ?? binding?.platform ?? "ios";
  const bindingValid = binding !== null && binding !== undefined && binding.platform === platform
    && ((binding.store === "APP_STORE" && binding.platform === "ios" && binding.basePlanId === null)
      || (binding.store === "PLAY_STORE" && binding.platform === "android" && typeof binding.basePlanId === "string" && binding.basePlanId.trim() !== ""))
    && [binding.appId, binding.rcProductId, binding.storeProductId].every((value) => typeof value === "string" && value.trim() !== "");
  const setup = async (): Promise<PurchaseResult> => {
    if (!current()) return { status: "unavailable" };
    if ((platform !== "ios" && platform !== "android") || !bindingValid) return { status: "unavailable" };
    if (!options.config.apiKey.trim() || !options.config.accountId.trim()) return { status: "misconfigured" };
    try {
      await gateway.configure({ apiKey: options.config.apiKey, appUserID: options.config.accountId });
      return { status: current() ? "success" : "unavailable" };
    } catch { return { status: "failure" }; }
  };
  const call = <T extends PurchaseResult>(action: () => Promise<T>, canDispatch: () => boolean = current): Promise<T | PurchaseResult> => inSdkLane(async () => {
    const configured = await setup();
    if (configured.status !== "success") return configured;
    if (!current() || !canDispatch()) return { status: "unavailable" };
    return action();
  });
  const read = (action: () => Promise<unknown>): Promise<PurchaseResult> => call(async () => {
    try {
      const info = await action() as { activeSubscriptions?: unknown };
      return Array.isArray(info?.activeSubscriptions) ? { status: "success", hasActiveSubscription: info.activeSubscriptions.length > 0 } : { status: "failure" };
    } catch (error) { return classifyPurchaseError(error, false); }
  });
  return {
    configure: () => inSdkLane(setup),
    getMonthlyPackage: () => call(async () => {
      if (!(options.checkoutEnabled ?? legalVariables.premiumCheckoutEnabled)) return { status: "unavailable" };
      try {
        const monthly = (await gateway.getOfferings()).current?.monthly;
        if (!monthly || monthly.product.identifier !== binding!.storeProductId || !monthly.product.priceString.trim() || monthly.product.introPrice || (monthly.product.discounts?.length ?? 0) > 0 || monthly.product.subscriptionPeriod !== "P1M" || monthly.product.productType !== "AUTO_RENEWABLE_SUBSCRIPTION") return { status: "unavailable" };
        if (binding!.store === "APP_STORE") return { status: "success", package: { ...monthly, store: binding!.store, purchaseProductIdentifier: binding!.storeProductId, basePlanId: null } };
        const expectedStoreProductId = `${binding!.storeProductId}:${binding!.basePlanId}`;
        const option = monthly.product.subscriptionOptions?.find((candidate) => candidate.isBasePlan && candidate.id === binding!.basePlanId
          && candidate.productId === binding!.storeProductId && candidate.storeProductId === expectedStoreProductId
          && !candidate.isPrepaid && candidate.billingPeriod?.iso8601 === "P1M"
          && candidate.pricingPhases.length === 1 && (candidate.pricingPhases[0]?.price.amountMicros ?? 0) > 0);
        if (!option) return { status: "unavailable" };
        return { status: "success", package: { ...monthly, store: binding!.store, purchaseProductIdentifier: expectedStoreProductId, basePlanId: binding!.basePlanId, subscriptionOption: option } };
      } catch { return { status: "failure" }; }
    }),
    purchasePackage: (pkg, canDispatch) => call(async () => {
      if (!(options.checkoutEnabled ?? legalVariables.premiumCheckoutEnabled)) return { status: "unavailable" };
      try {
        const result = (pkg.store === "PLAY_STORE"
          ? (pkg.subscriptionOption && gateway.purchaseSubscriptionOption ? await gateway.purchaseSubscriptionOption(pkg.subscriptionOption) : null)
          : pkg.store === "APP_STORE" ? await gateway.purchasePackage(pkg) : null) as { productIdentifier?: unknown; transaction?: { transactionIdentifier?: unknown; productIdentifier?: unknown } } | null;
        const transaction = result?.transaction;
        if (!result || result.productIdentifier !== pkg.product.identifier || transaction?.productIdentifier !== pkg.product.identifier
          || typeof transaction.transactionIdentifier !== "string" || !transaction.transactionIdentifier.trim() || transaction.transactionIdentifier.length > 256) return { status: "unknown" };
        return { status: "success", transactionId: transaction.transactionIdentifier };
      } catch (error) { return classifyPurchaseError(error, true); }
    }, canDispatch),
    restorePurchases: () => read(() => gateway.restorePurchases()),
    getCustomerInfo: (fresh) => read(() => gateway.getCustomerInfo(fresh)),
    managementURL: () => call(async () => {
      try {
        const url = await gateway.managementURL();
        if (!url) return { status: "unavailable" };
        const parsed = new URL(url);
        const expectedHost = binding?.store === "APP_STORE" ? "apps.apple.com" : binding?.store === "PLAY_STORE" ? "play.google.com" : null;
        return parsed.protocol === "https:" && !parsed.username && !parsed.password && parsed.hostname === expectedHost
          ? { status: "success", url } : { status: "unavailable" };
      } catch { return { status: "failure" }; }
    }),
    subscribe: (listener) => gateway.subscribe?.(() => { if (current()) listener(); }) ?? (() => undefined),
  };
}

export function classifyPurchaseError(error: unknown, purchase: boolean): PurchaseResult {
  const value = error as { code?: unknown; userCancelled?: unknown } | null;
  const code = String(value?.code ?? "");
  if (code === "20") return { status: "pending" };
  if (code === "1" || value?.userCancelled === true) return { status: "cancelled" };
  // Store/network/unknown failures cannot prove that a purchase had no effect.
  return { status: purchase ? "unknown" : "failure" };
}

export type PurchasesAdapter = Readonly<{
  configure: () => Promise<PurchaseResult>;
  getMonthlyPackage: () => Promise<PurchaseResult & { package?: RevenueCatPackage }>;
  purchasePackage: (pkg: RevenueCatPackage, canDispatch?: () => boolean) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  getCustomerInfo: (fresh?: boolean) => Promise<PurchaseResult>;
  managementURL: () => Promise<PurchaseResult & { url?: string | null }>;
  subscribe: (listener: () => void) => () => void;
}>;
