export const Q13_STORAGE_RECEIPT_URL = "com.lkurczab.patternly://audit/q13-storage-receipt";

export type Q13StorageReceiptCommandContext = Readonly<{ development: boolean; smoke: boolean }>;

export type Q13StorageReceiptCommandDecision = "unavailable_in_production" | "ignored" | "inspect";

export function decideQ13StorageReceiptCommand(
  url: string | null,
  context: Q13StorageReceiptCommandContext,
): Q13StorageReceiptCommandDecision {
  if (!context.development || !context.smoke) return "unavailable_in_production";
  return url === Q13_STORAGE_RECEIPT_URL ? "inspect" : "ignored";
}
