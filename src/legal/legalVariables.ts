import releaseLegalVariables from "../../config/public-legal.release.json";
import { legalVariablesLocalFixture, localReportOutboxRetentionDays } from "./legalVariablesLocalFixture";

export type LegalLocale = "en" | "pl";

export { localReportOutboxRetentionDays };

export type LegalVariables = typeof legalVariablesLocalFixture;

const isReleaseRuntime = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "release";

/** Legal content is public release data only in a release runtime. */
export const legalVariables: LegalVariables = isReleaseRuntime
  ? (releaseLegalVariables as LegalVariables)
  : legalVariablesLocalFixture;
