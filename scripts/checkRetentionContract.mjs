import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "tsx/cjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = resolve(process.env.PATTERNLY_BACKEND_ROOT ?? resolve(appRoot, "../patternly-backend"));
const require = createRequire(import.meta.url);
const { RETENTION_POLICY } = require(resolve(backendRoot, "src/modules/retention/policy.ts"));
const { ACCOUNT_DELETION_TOMBSTONE_RETENTION_MS } = require(resolve(backendRoot, "src/modules/account-lifecycle/firestoreAccountErasure.ts"));
const { LEGAL_TRANSLATION_LOCALES } = require(resolve(appRoot, "src/legal/legalVariablesSchema.ts"));
const { legalVariablesLocalFixture } = require(resolve(appRoot, "src/legal/legalVariablesLocalFixture.ts"));
const { RETIRED_RECOVERY_CLIPBOARD_RETENTION_MS } = require(resolve(appRoot, "src/infrastructure/security/retiredAccountSecrets.ts"));
const canonical = JSON.parse(readFileSync(resolve(appRoot, "config/public-legal.release.json"), "utf8"));
const logPolicy = JSON.parse(readFileSync(resolve(backendRoot, "config/log-retention-policy.json"), "utf8"));
assert.equal(logPolicy.status, "desired_unapplied");
assert.equal(logPolicy.buckets.find(({ id }) => id === "_Default")?.retentionDays, RETENTION_POLICY.ordinaryOperationalLogDays);
assert.equal(logPolicy.buckets.find(({ id }) => id === "patternly-security")?.retentionDays, RETENTION_POLICY.selectedSecurityLogDays);
const localPair = (value) => {
  if (Array.isArray(value)) return value.map(localPair);
  if (!value || typeof value !== "object") return value;
  if (Object.hasOwn(value, "en") && Object.hasOwn(value, "pl")) return { en: value.en, pl: value.pl };
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "legalDocumentApproval").map(([key, nested]) => [key, localPair(nested)]));
};
assert.deepEqual(localPair(canonical), legalVariablesLocalFixture, "canonical legal data EN/PL differs from local fixture");
for (const [field, expected] of [
  ["contentReportRetentionDays", RETENTION_POLICY.contentReportDays],
  ["deletionEvidenceRetentionMonths", RETENTION_POLICY.accountDeletionProofMonths],
  ["deletionTombstoneRetentionDays", ACCOUNT_DELETION_TOMBSTONE_RETENTION_MS / 86_400_000],
  ["operationalLogRetentionDays", RETENTION_POLICY.ordinaryOperationalLogDays],
  ["securityLogRetentionDays", RETENTION_POLICY.selectedSecurityLogDays],
  ["clipboardRecoveryCodeRetentionMinutes", RETIRED_RECOVERY_CLIPBOARD_RETENTION_MS / 60_000],
]) {
  for (const locale of LEGAL_TRANSLATION_LOCALES) assert.equal(canonical.privacy[field][locale], String(expected), `${field}.${locale}`);
}
const { minimizeContentReportInput } = require(resolve(appRoot, "src/domain/contentReports.ts"));
const { createContentReportSchema } = require(resolve(backendRoot, "src/modules/content-reports/contracts.ts"));
const report = {
  clientSubmissionId: "af61e3f3-f23e-467c-b92a-9b8fd0514f25",
  trackId: "coding-interview-dsa-problem-solving", contentVersion: "contract-check", itemId: "question-1",
  reason: "unclear_explanation", description: "The explanation omits the boundary condition.",
  context: { releasePackageId: "contract-check", trackNode: null, modeRoute: "answer_review", locale: "en", appBuild: "0.1.0", platform: "ios", occurredAt: "2026-10-16T00:00:00.000Z" },
  linkAccount: true, contactEmail: "private@example.test",
};
assert.equal(createContentReportSchema.safeParse(report).success, false, "backend must reject removed identity fields");
const minimized = minimizeContentReportInput(report);
assert.equal(Object.hasOwn(minimized, "linkAccount"), false);
assert.equal(Object.hasOwn(minimized, "contactEmail"), false);
assert.deepEqual(createContentReportSchema.parse(minimized), minimized, "actual APP projection must satisfy actual backend schema");
process.stdout.write("RETENTION_CONTRACT=passed backend-policy→APP-canonical seven locales/local EN/PL; APP report projection→backend schema; no service acceptance\n");
