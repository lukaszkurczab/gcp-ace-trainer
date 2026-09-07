import { legalVariables } from "../../legal/legalVariables";

export type PurchaseStatus = "unavailable" | "misconfigured" | "failure" | "cancelled" | "success";
export type PurchaseResult = Readonly<{ status: PurchaseStatus }>;
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
  getCustomerInfo(): Promise<unknown>;
  managementURL: () => Promise<string | null>;
}>;

/** Thin v10.9 bridge; all policy remains in the injected adapter above. */
export function createRevenueCatGateway(): RevenueCatGateway {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Purchases = (require("react-native-purchases") as { default: {
    configure: (config: { apiKey: string; appUserID: string }) => Promise<void> | void;
    isConfigured: () => Promise<boolean>;
    logIn: (appUserID: string) => Promise<unknown>;
    getOfferings: () => Promise<{ current: { monthly?: RevenueCatPackage | null } | null }>;
    purchasePackage: (pkg: RevenueCatPackage) => Promise<unknown>;
    restorePurchases: () => Promise<unknown>;
    getCustomerInfo: () => Promise<{ managementURL?: string | null }>;
  } }).default;
  return {
    configure: async (config) => {
      if (await Purchases.isConfigured()) await Purchases.logIn(config.appUserID);
      else await Purchases.configure(config);
    },
    getOfferings: () => Purchases.getOfferings(),
    purchasePackage: (pkg) => Purchases.purchasePackage(pkg),
    restorePurchases: () => Purchases.restorePurchases(),
    getCustomerInfo: () => Purchases.getCustomerInfo(),
    managementURL: async () => (await Purchases.getCustomerInfo()).managementURL ?? null,
  };
}

export function readPurchaseConfig(env: Readonly<Record<string, string | undefined>> = process.env, accountId?: string, checkoutEnabled: boolean = legalVariables.premiumCheckoutEnabled): PurchaseConfig | null {
  const apiKey = env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY;
  if (!checkoutEnabled) return null;
  if (typeof apiKey !== "string" || apiKey.trim() === "" || typeof accountId !== "string" || accountId.trim() === "") return null;
  return { apiKey, accountId };
}

export function createPurchasesAdapter(gateway: RevenueCatGateway, options: { platform?: string; config: PurchaseConfig }): PurchasesAdapter {
  const platform = options.platform ?? "ios";
  let configured = false;
  let configurePromise: Promise<PurchaseResult> | null = null;
  const configure = async (): Promise<PurchaseResult> => {
    if (platform !== "ios") return { status: "unavailable" };
    if (!options.config.apiKey.trim() || !options.config.accountId.trim()) return { status: "misconfigured" };
    if (configured) return { status: "success" };
    if (configurePromise) return configurePromise;
    configurePromise = (async () => {
      try {
        await gateway.configure({ apiKey: options.config.apiKey, appUserID: options.config.accountId });
        configured = true;
        return { status: "success" } as const;
      } catch {
        return { status: "failure" } as const;
      } finally {
        if (!configured) configurePromise = null;
      }
    })();
    return configurePromise;
  };
  const call = async (action: () => Promise<unknown>): Promise<PurchaseResult> => {
    const setup = await configure();
    if (setup.status !== "success") return setup;
    try { await action(); return { status: "success" }; }
    catch (error) {
      const code = (error as { code?: unknown })?.code;
      return code === "1" || (error as { userCancelled?: unknown })?.userCancelled === true ? { status: "cancelled" } : { status: "failure" };
    }
  };
  return {
    configure,
    async getMonthlyPackage() {
      const setup = await configure(); if (setup.status !== "success") return { status: setup.status };
      try {
        const monthly = (await gateway.getOfferings()).current?.monthly;
        const expected = legalVariables.terms.premiumProductIdentifier.en;
        if (!monthly || monthly.product.identifier !== expected || !monthly.product.priceString || monthly.product.introPrice || (monthly.product.discounts?.length ?? 0) > 0 || monthly.product.subscriptionPeriod !== "P1M" || monthly.product.productType !== "AUTO_RENEWABLE_SUBSCRIPTION") return { status: "unavailable" };
        return { status: "success", package: monthly };
      } catch { return { status: "failure" }; }
    },
    purchasePackage: (pkg) => call(() => gateway.purchasePackage(pkg)),
    restorePurchases: () => call(() => gateway.restorePurchases()),
    getCustomerInfo: () => call(() => gateway.getCustomerInfo()),
    async managementURL() { const setup = await configure(); if (setup.status !== "success") return { status: setup.status }; try { const url = await gateway.managementURL(); return url ? { status: "success", url } : { status: "unavailable" }; } catch { return { status: "failure" }; } },
  };
}

export type PurchasesAdapter = Readonly<{
  configure: () => Promise<PurchaseResult>;
  getMonthlyPackage: () => Promise<PurchaseResult & { package?: RevenueCatPackage }>;
  purchasePackage: (pkg: RevenueCatPackage) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  getCustomerInfo: () => Promise<PurchaseResult>;
  managementURL: () => Promise<PurchaseResult & { url?: string | null }>;
}>;
