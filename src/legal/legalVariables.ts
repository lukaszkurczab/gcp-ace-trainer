import releaseLegalVariables from "../../config/public-legal.release.json";
import { legalVariablesLocalFixture, localReportOutboxRetentionDays } from "./legalVariablesLocalFixture";

export type LegalLocale = "en" | "pl";

export { localReportOutboxRetentionDays };

/** Raw approval metadata; runtime checks establish whether release use is allowed. */
export type LegalDocumentApproval = Readonly<{
  status: string;
  renderedDocumentsSha256: string | null;
}>;

/** Shared document data; local fixtures deliberately have no release approval. */
export type LegalVariables = Readonly<{
  documentVersion: Readonly<Record<LegalLocale, string>>;
  premiumCheckoutEnabled: boolean;
  publicLinks: Readonly<Record<keyof typeof legalVariablesLocalFixture.publicLinks, string>>;
  terms: Readonly<Record<keyof typeof legalVariablesLocalFixture.terms, Readonly<Record<LegalLocale, string>>>>;
  privacy: Readonly<Record<keyof typeof legalVariablesLocalFixture.privacy, Readonly<Record<LegalLocale, string>>>>;
  legalDocumentApproval?: LegalDocumentApproval;
}>;

const isReleaseRuntime = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "release";

if (isReleaseRuntime && releaseLegalVariables.legalDocumentApproval?.status !== "APPROVED") {
  throw new Error("Production legal documents are unapproved; release runtime is disabled.");
}

/** Legal content is public release data only in a release runtime. */
export const legalVariables: LegalVariables = isReleaseRuntime
  ? releaseLegalVariables
  : legalVariablesLocalFixture;
