import { legalVariables } from "../../legal/legalVariables";

export type PurchaseStatus = "unavailable" | "misconfigured" | "failure" | "cancelled" | "pending" | "unknown" | "success";
export type PurchaseResult = Readonly<{ status: PurchaseStatus; transactionId?: string; hasActiveSubscription?: boolean }>;
export type PurchaseConfig = Readonly<{ apiKey: string; accountId: string }>;

export type RevenueCatPackage = Readonly<{
  identifier: string;
  product: Readonly<{
    identifier: string;
    priceString: string;
    introPrice?: unknown | null;
    discounts?: readonly unknown[] | null;
    productType?: string;
    subscriptionPeriod?: string | null;
  }>;
}>;
export type RevenueCatGateway = Readonly<{
  configure(config: { apiKey: string; appUserID: string }): Promise<void>;
  getOfferings(): Promise<{ current: { monthly?: RevenueCatPackage | null } | null }>;
  purchasePackage(pkg: RevenueCatPackage): Promise<unknown>;
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

export function readPurchaseConfig(env: Readonly<Record<string, string | undefined>> = process.env, accountId?: string): PurchaseConfig | null {
  const apiKey = env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY;
  if (typeof apiKey !== "string" || apiKey.trim() === "" || typeof accountId !== "string" || accountId.trim() === "") return null;
  return { apiKey, accountId };
}

export function createPurchasesAdapter(gateway: RevenueCatGateway, options: {
  platform?: string; config: PurchaseConfig; checkoutEnabled?: boolean; isCurrent?: () => boolean;
}): PurchasesAdapter {
  const current = options.isCurrent ?? (() => true);
  const setup = async (): Promise<PurchaseResult> => {
    if (!current()) return { status: "unavailable" };
    if ((options.platform ?? "ios") !== "ios") return { status: "unavailable" };
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
        const expected = legalVariables.terms.premiumProductIdentifier.en;
        if (!monthly || monthly.product.identifier !== expected || !monthly.product.priceString.trim() || monthly.product.introPrice || (monthly.product.discounts?.length ?? 0) > 0 || monthly.product.subscriptionPeriod !== "P1M" || monthly.product.productType !== "AUTO_RENEWABLE_SUBSCRIPTION") return { status: "unavailable" };
        return { status: "success", package: monthly };
      } catch { return { status: "failure" }; }
    }),
    purchasePackage: (pkg, canDispatch) => call(async () => {
      if (!(options.checkoutEnabled ?? legalVariables.premiumCheckoutEnabled)) return { status: "unavailable" };
      try {
        const result = await gateway.purchasePackage(pkg) as { productIdentifier?: unknown; transaction?: { transactionIdentifier?: unknown; productIdentifier?: unknown } };
        const transaction = result?.transaction;
        if (result?.productIdentifier !== pkg.product.identifier || transaction?.productIdentifier !== pkg.product.identifier
          || typeof transaction.transactionIdentifier !== "string" || !transaction.transactionIdentifier.trim() || transaction.transactionIdentifier.length > 256) return { status: "unknown" };
        return { status: "success", transactionId: transaction.transactionIdentifier };
      } catch (error) { return classifyPurchaseError(error, true); }
    }, canDispatch),
    restorePurchases: () => read(() => gateway.restorePurchases()),
    getCustomerInfo: (fresh) => read(() => gateway.getCustomerInfo(fresh)),
    managementURL: () => call(async () => {
      try {
        const url = await gateway.managementURL();
        return url && /^https:\/\//u.test(url) ? { status: "success", url } : { status: "unavailable" };
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
