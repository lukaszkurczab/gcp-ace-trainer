import { getForegroundSessionTimerFacade } from "../trainingLifecycle";

export const DEVELOPMENT_EXPIRE_CODING_MOCK_URL = "com.lkurczab.patternly://audit/coding-mock/expire";

export type CodingMockCountdownAuditContext = Readonly<{ development: boolean; smoke: boolean }>;
export type CodingMockCountdownAuditResult = "unavailable_in_production" | "ignored" | "expired";

export function isCodingMockCountdownAuditCommand(url: string | null, context: CodingMockCountdownAuditContext): boolean {
  return context.development && context.smoke && url === DEVELOPMENT_EXPIRE_CODING_MOCK_URL;
}

export async function handleCodingMockCountdownAuditUrl(
  url: string | null,
  context: CodingMockCountdownAuditContext,
): Promise<CodingMockCountdownAuditResult> {
  if (!context.development || !context.smoke) return "unavailable_in_production";
  if (!isCodingMockCountdownAuditCommand(url, context)) return "ignored";
  await getForegroundSessionTimerFacade().advanceActiveCodingMockCountdownForAudit();
  return "expired";
}
