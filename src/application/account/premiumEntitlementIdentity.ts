import { PREMIUM_ENTITLEMENT, type PremiumEnvironment, type PremiumIdentity } from "../../domain/entitlements";
import { legalVariables } from "../../legal/legalVariables";
import { premiumMapIdentity } from "./premiumStoreMap";

export { PREMIUM_MAP_PROJECT_ID } from "./premiumStoreMap";
export { DEFAULT_PREMIUM_MAP_VERSION as PREMIUM_MAP_VERSION } from "./premiumStoreMap";

/** APP pins the public reader scope it was built to understand; unknown local environments fail closed. */
export function premiumIdentityForAccount(accountId: string, env: Readonly<Record<string, string | undefined>> = {
  EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT,
  EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP: process.env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP,
}): PremiumIdentity | null {
  if (!accountId.trim()) return null;
  const mapIdentity = premiumMapIdentity(env);
  if (!mapIdentity) return null;
  const environment: PremiumEnvironment = mapIdentity.environment;
  return Object.freeze({ accountId, entitlement: PREMIUM_ENTITLEMENT, productId: legalVariables.terms.premiumProductIdentifier.en,
    ...mapIdentity, environment });
}
