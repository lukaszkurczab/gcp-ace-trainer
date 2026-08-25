import * as Crypto from "expo-crypto";

export function createContentReportSubmissionId(): string {
  return Crypto.randomUUID();
}
