export type LegalVariablesValidationMode = "test" | "release";

export interface LegalVariablesIssue {
  path: string;
  message: string;
}

const locales = ["en", "pl"] as const;
const placeholder = /^\[(?:TO BE COMPLETED|DO UZUPEŁNIENIA):\s*[A-Za-z][A-Za-z0-9]*\]$/;
const termsKeys = [
  "adrEntity", "adrPosition", "competentCourts", "complaintEmail", "distributionTerritories", "effectiveDate",
  "governingLaw", "merchantOfRecord", "minimumUserAge", "minimumUserAgeScope", "operatorBusinessForm",
  "operatorEmail", "operatorLegalName", "operatorPhone", "operatorRegisteredAddress", "operatorRegistrationNumber",
  "operatorTaxIdentifier", "premiumBillingPeriod", "premiumPriceIncludingTaxes", "premiumProductIdentifier",
  "premiumProductName", "premiumRenewalPriceIncludingTaxes", "premiumServiceScope", "supportCommitment",
  "technicalRequirements", "withdrawalEmail",
] as const;
const privacyKeys = [
  "activeCloudProcessors", "activeIndependentRecipients", "anonymousReportRetentionDays", "backupPurgeDisclosure",
  "clipboardRecoveryCodeRetentionMinutes", "completedSyncOperationRetentionDays", "consumerRequestRetentionYears",
  "controllerAddress", "controllerBusinessForm", "controllerLegalName", "controllerPhone", "deletionEvidenceRetentionYears",
  "deletionTombstoneRetentionDays", "distributionTerritories", "dpoContact", "effectiveDate", "emailDeliveryProvider",
  "hostingRegions", "internationalTransferSafeguards", "linkedReportRetentionDays", "localReportOutboxRetentionDays",
  "operationalLogRetentionDays", "privacyEmail", "reportRateLimitIdentifierRetentionSeconds", "processingRegisterDisclosure",
  "registrationNumber", "retentionRegisterDisclosure", "revenueCatStatus", "securityLogRetentionDays", "supervisoryAuthority",
  "taxIdentifier",
] as const;
const localizedKeys = (keys: readonly string[]) => Object.fromEntries(keys.map((key) => [key, { en: "", pl: "" }]));
const expectedLegalVariables = {
  documentVersion: { en: "", pl: "" },
  premiumCheckoutEnabled: false,
  publicLinks: { privacyUrl: "", termsUrl: "", supportUrl: "" },
  terms: localizedKeys(termsKeys),
  privacy: localizedKeys(privacyKeys),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameKeys(actual: Record<string, unknown>, expected: readonly string[]): boolean {
  return Object.keys(actual).length === expected.length && expected.every((key) => Object.hasOwn(actual, key));
}

function publicLinkIssue(value: string, path: string): string | null {
  let parsed: URL;
  try { parsed = new URL(value); } catch { return "Expected an HTTPS URL."; }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) return "Expected an HTTPS URL without user information.";
  if (path !== "publicLinks.supportUrl" && (/[?#]/u.test(value) || parsed.search || parsed.hash)) return "Query strings and fragments are not allowed.";
  if (path === "publicLinks.privacyUrl" && parsed.pathname !== "/privacy") return "Expected the /privacy path.";
  if (path === "publicLinks.termsUrl" && parsed.pathname !== "/terms") return "Expected the /terms path.";
  return null;
}

/** Validates legal variables against the explicit legal variable contract and locale shape. */
export function validateLegalVariables(
  value: unknown,
  mode: LegalVariablesValidationMode = "test",
): LegalVariablesIssue[] {
  const issues: LegalVariablesIssue[] = [];
  const visit = (candidate: unknown, reference: unknown, path: string): void => {
    if (isRecord(reference) && sameKeys(reference, locales)) {
      if (!isRecord(candidate)) {
        issues.push({ path, message: "Expected an { en, pl } string pair." });
        return;
      }
      if (!sameKeys(candidate, locales)) {
        for (const locale of locales) {
          if (!Object.hasOwn(candidate, locale)) issues.push({ path: `${path}.${locale}`, message: "Required locale is missing." });
        }
        for (const key of Object.keys(candidate)) {
          if (!(locales as readonly string[]).includes(key)) issues.push({ path: `${path}.${key}`, message: "Unexpected locale key." });
        }
      }
      for (const locale of locales) {
        if (!Object.hasOwn(candidate, locale)) continue;
        const fieldPath = `${path}.${locale}`;
        const localized = candidate[locale];
        if (typeof localized !== "string") {
          issues.push({ path: fieldPath, message: "Expected a string." });
        } else if (localized.length === 0 || localized.trim().length === 0 || localized !== localized.trim()) {
          issues.push({ path: fieldPath, message: "Expected a non-empty string without leading or trailing whitespace." });
        } else if (mode === "release" && placeholder.test(localized)) {
          issues.push({ path: fieldPath, message: "Unresolved legal placeholder." });
        }
      }
      return;
    }
    if (isRecord(reference)) {
      if (!isRecord(candidate)) {
        issues.push({ path, message: "Expected an object." });
        return;
      }
      const expectedKeys = Object.keys(reference);
      for (const key of expectedKeys) {
        if (!Object.hasOwn(candidate, key)) issues.push({ path: `${path}.${key}`, message: "Required key is missing." });
      }
      for (const key of Object.keys(candidate)) {
        if (!Object.hasOwn(reference, key)) issues.push({ path: `${path}.${key}`, message: "Unexpected key." });
      }
      for (const key of expectedKeys) {
        if (Object.hasOwn(candidate, key)) visit(candidate[key], reference[key], path ? `${path}.${key}` : key);
      }
      return;
    }

    if (path === "premiumCheckoutEnabled") {
      if (typeof candidate !== "boolean") issues.push({ path, message: "Expected a boolean." });
      return;
    }

    if (path.startsWith("publicLinks.")) {
      if (typeof candidate !== "string") {
        issues.push({ path, message: "Expected a string." });
      } else if (candidate.length === 0 || candidate.trim().length === 0 || candidate !== candidate.trim()) {
        issues.push({ path, message: "Expected a non-empty string without leading or trailing whitespace." });
      } else if (mode === "release" && placeholder.test(candidate)) {
        issues.push({ path, message: "Unresolved legal placeholder." });
      } else if (!(mode === "test" && placeholder.test(candidate))) {
        const message = publicLinkIssue(candidate, path);
        if (message) issues.push({ path, message });
      }
      return;
    }

    issues.push({ path, message: "Unexpected scalar value." });
  };

  if (mode !== "test" && mode !== "release") {
    return [{ path: "mode", message: "Expected test or release mode." }];
  }
  visit(value, expectedLegalVariables, "");
  return issues;
}
