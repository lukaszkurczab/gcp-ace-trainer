import { createIdentityNonce } from "./identityNonce";

export function createContentReportSubmissionId(): string {
  return createIdentityNonce();
}
