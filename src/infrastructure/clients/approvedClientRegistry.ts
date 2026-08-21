import type { PublicEnvironment } from "./publicEnvironment";

export const APPROVED_CLIENT_IDS = [
  "account_auth",
  "entitlement",
  "package_delivery",
  "analytics_crash",
  "content_report",
] as const;

export type ApprovedClientId = (typeof APPROVED_CLIENT_IDS)[number];
export type ClientAvailability = "available" | "unconfigured" | "provider_not_composed";
export type ApprovedClient = Readonly<{ availability: ClientAvailability; id: ApprovedClientId }>;
export type ApprovedClientRegistry = Readonly<Record<ApprovedClientId, ApprovedClient>>;

/** The only filenames allowed to contain transport code, once their owning
 * provider tasks compose them. Exports are part of the static privacy boundary. */
export const APPROVED_CLIENT_ADAPTERS = Object.freeze({
  account_auth: Object.freeze({ exportName: "createPatternlyApiClient", fileName: "PatternlyApiClientAdapter.ts" }),
  entitlement: Object.freeze({ exportName: "createEntitlementClientAdapter", fileName: "EntitlementClientAdapter.ts" }),
  package_delivery: Object.freeze({ exportName: "createPackageDeliveryClientAdapter", fileName: "PackageDeliveryClientAdapter.ts" }),
  analytics_crash: Object.freeze({ exportName: "createAnalyticsCrashClientAdapter", fileName: "AnalyticsCrashClientAdapter.ts" }),
  content_report: Object.freeze({ exportName: "createContentReportClientAdapter", fileName: "ContentReportClientAdapter.ts" }),
} satisfies Record<ApprovedClientId, Readonly<{ exportName: string; fileName: string }>>);

/**
 * This is the sole app-side inventory of remote client categories. It does not
 * create a transport: provider adapters are added only by their owning task.
 * Until then both local and configured builds expose an explicit unavailable
 * state instead of guessing an endpoint or silently sending data.
 */
export function createApprovedClientRegistry(environment: PublicEnvironment): ApprovedClientRegistry {
  const unavailable: ClientAvailability = environment.kind === "configured" ? "provider_not_composed" : "unconfigured";
  return Object.freeze(Object.fromEntries(APPROVED_CLIENT_IDS.map((id) => [id, Object.freeze({ availability: id === "account_auth" && environment.kind === "configured" ? "available" : unavailable, id })])) as ApprovedClientRegistry);
}
