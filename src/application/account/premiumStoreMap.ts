import type { PremiumEnvironment } from "../../domain/entitlements";
import { parseConfiguredPublicEnvironment } from "../../infrastructure/clients/publicEnvironment";

export const PREMIUM_MAP_PROJECT_ID = "proj8ae78267";
export const DEFAULT_PREMIUM_MAP_VERSION = "premium-map-v1";
export type PremiumStoreBinding = Readonly<{ platform: "ios" | "android"; store: "APP_STORE" | "PLAY_STORE"; appId: string; rcProductId: string; storeProductId: string; basePlanId: string | null }>;
export type PublicPremiumMap = Readonly<{ version: string; projectId: string; entitlementId: "premium"; environment: PremiumEnvironment; bindings: readonly PremiumStoreBinding[] }>;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,254}$/u;
const forbiddenPattern = /(?:placeholder|example|your[-_ ]?(?:id|key)|changeme|test[-_ ]?only|(?:^|[-_.])(?:fixture|test)(?:[-_.]|$))/iu;

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

function defaultPremiumMapEnvironment() { return { EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT }; }

export function parsePublicPremiumMap(raw: string | undefined, env: Readonly<Record<string, string | undefined>> = defaultPremiumMapEnvironment(), allowTestFixtures = false): PublicPremiumMap | null {
  if (typeof raw !== "string" || raw.trim() !== raw || raw.length === 0) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || !["bindings", "entitlementId", "environment", "projectId", "version"].every((key) => Object.hasOwn(value, key))
      || Object.keys(value).some((key) => !["bindings", "entitlementId", "environment", "fixture", "projectId", "version"].includes(key))
      || typeof value.version !== "string" || !idPattern.test(value.version)
      || (value.projectId !== PREMIUM_MAP_PROJECT_ID && !(allowTestFixtures && value.projectId === "fixture-project")) || value.entitlementId !== "premium"
      || (value.environment !== "SANDBOX" && value.environment !== "PRODUCTION")
      || !Array.isArray(value.bindings) || value.bindings.length < 1 || value.bindings.length > 2
      || (value.fixture !== undefined && typeof value.fixture !== "boolean") || (value.fixture === true && !allowTestFixtures)
      || (value.fixture === true && value.projectId !== "fixture-project")
      || (value.projectId === "fixture-project" && (value.version !== "premium-map-fixture-v1" || value.environment !== "SANDBOX" || value.fixture !== true))) return null;
    const publicRaw = env.EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT;
    if (typeof publicRaw !== "string" || publicRaw.trim() !== publicRaw) return null;
    const publicEnvironment = parseConfiguredPublicEnvironment(JSON.parse(publicRaw) as unknown);
    const expectedEnvironment = publicEnvironment.environment === "production" ? "PRODUCTION" : "SANDBOX";
    if (value.environment !== expectedEnvironment) return null;
    const bindings: PremiumStoreBinding[] = [];
    const platforms = new Set<string>();
    for (const entry of value.bindings) {
      if (!isRecord(entry) || Object.keys(entry).sort().join(":") !== "appId:basePlanId:platform:rcProductId:store:storeProductId"
        || (entry.platform !== "ios" && entry.platform !== "android")
        || (entry.store !== "APP_STORE" && entry.store !== "PLAY_STORE")
        || typeof entry.appId !== "string" || !idPattern.test(entry.appId)
        || typeof entry.rcProductId !== "string" || !idPattern.test(entry.rcProductId)
        || typeof entry.storeProductId !== "string" || !idPattern.test(entry.storeProductId)
        || (entry.basePlanId !== null && (typeof entry.basePlanId !== "string" || !idPattern.test(entry.basePlanId)))) return null;
      const binding = entry as PremiumStoreBinding;
      if (platforms.has(binding.platform) || (binding.platform === "ios" && (binding.store !== "APP_STORE" || binding.basePlanId !== null))
        || (binding.platform === "android" && (binding.store !== "PLAY_STORE" || binding.basePlanId === null))) return null;
      platforms.add(binding.platform);
      if (!allowTestFixtures && [binding.appId, binding.rcProductId, binding.storeProductId, binding.basePlanId ?? ""].some((id) => forbiddenPattern.test(id))) return null;
      if (binding.platform === "ios" && (binding.appId !== (value.projectId === "fixture-project" ? "fixture-ios" : "app7b06e9a4c1")
        || binding.rcProductId !== (value.projectId === "fixture-project" ? "fixture-rc-ios" : "prod8d07384c8c")
        || binding.storeProductId !== (value.projectId === "fixture-project" ? "fixture.ios.monthly" : "com.lkurczab.patternly.premium.monthly"))) return null;
      if (binding.platform === "android" && value.projectId === "fixture-project"
        && (binding.appId !== "fixture-play" || binding.rcProductId !== "fixture-rc-play" || binding.storeProductId !== "fixture_play_monthly" || binding.basePlanId !== "monthly")) return null;
      bindings.push(binding);
    }
    const identifiers = bindings.flatMap((binding) => [binding.appId, binding.rcProductId, binding.storeProductId]);
    if (new Set(identifiers).size !== identifiers.length) return null;
    if (value.projectId === "fixture-project" && (bindings.length !== 2
      || !bindings.some((binding) => binding.platform === "ios" && binding.appId === "fixture-ios" && binding.rcProductId === "fixture-rc-ios" && binding.storeProductId === "fixture.ios.monthly")
      || !bindings.some((binding) => binding.platform === "android" && binding.appId === "fixture-play" && binding.rcProductId === "fixture-rc-play" && binding.storeProductId === "fixture_play_monthly" && binding.basePlanId === "monthly"))) return null;
    return Object.freeze({ version: value.version, projectId: value.projectId, entitlementId: "premium", environment: value.environment, bindings: Object.freeze(bindings) });
  } catch { return null; }
}

function defaultIdentityEnvironment() { return { EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT, EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP: process.env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP }; }

export function premiumMapIdentity(env: Readonly<Record<string, string | undefined>> = defaultIdentityEnvironment()): Readonly<{ projectId: string; mapVersion: string; environment: PremiumEnvironment }> | null {
  const rawMap = env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP;
  if (rawMap) {
    const map = parsePublicPremiumMap(rawMap, env);
    if (!map) return null;
    return { projectId: map.projectId, mapVersion: map.version, environment: map.environment };
  }
  try {
    const rawEnvironment = env.EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT;
    if (!rawEnvironment || rawEnvironment.trim() !== rawEnvironment) return null;
    const configured = parseConfiguredPublicEnvironment(JSON.parse(rawEnvironment) as unknown);
    return { projectId: PREMIUM_MAP_PROJECT_ID, mapVersion: DEFAULT_PREMIUM_MAP_VERSION, environment: configured.environment === "production" ? "PRODUCTION" : "SANDBOX" };
  } catch { return null; }
}
