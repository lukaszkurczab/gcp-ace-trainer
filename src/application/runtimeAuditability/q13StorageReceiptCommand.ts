export const Q13_STORAGE_RECEIPT_URL = "com.lkurczab.patternly://audit/q13-storage-receipt";
export const Q13_BOOTSTRAP_DIAGNOSTIC_URL = "com.lkurczab.patternly://audit/q13-bootstrap-diagnostic";

export type Q13StorageReceiptCommandContext = Readonly<{ development: boolean; smoke: boolean }>;

export type Q13StorageReceiptCommandDecision = "unavailable_in_production" | "ignored" | "inspect";

/** Owns URL deduplication and fences asynchronous receipt results after close or command replacement. */
export function createQ13CommandLifecycle() {
  let generation = 0;
  let lastHandledUrl: string | null = null;
  let initialUrlDeliveryClaimed = false;
  let initialUrlResolved = false;
  let initialUrlDispatched = false;
  let initialUrlSuppressed = false;
  let initialUrl: string | null = null;
  let initialUrlHandler: ((url: string | null) => void) | null = null;
  const inFlightUrls = new Set<string>();

  const dispatchInitialUrlIfReady = () => {
    if (!initialUrlResolved || initialUrlDispatched) return;
    if (initialUrlSuppressed) {
      initialUrlDispatched = true;
      initialUrl = null;
      return;
    }
    if (!initialUrlHandler) return;
    initialUrlDispatched = true;
    const url = initialUrl;
    initialUrl = null;
    initialUrlHandler(url);
  };

  return Object.freeze({
    shouldHandle(url: string | null): url is string {
      return url !== null && url.length > 0 && lastHandledUrl !== url && !inFlightUrls.has(url);
    },
    claimInitialUrlDelivery(): boolean {
      if (initialUrlDeliveryClaimed) return false;
      initialUrlDeliveryClaimed = true;
      return true;
    },
    setInitialUrlHandler(handler: (url: string | null) => void): void {
      initialUrlHandler = handler;
      dispatchInitialUrlIfReady();
    },
    clearInitialUrlHandler(handler: (url: string | null) => void): void {
      if (initialUrlHandler === handler) initialUrlHandler = null;
    },
    resolveInitialUrl(url: string | null): void {
      if (initialUrlResolved) return;
      initialUrlResolved = true;
      initialUrl = url === Q13_STORAGE_RECEIPT_URL || url === Q13_BOOTSTRAP_DIAGNOSTIC_URL ? url : null;
      dispatchInitialUrlIfReady();
    },
    begin(url: string): number {
      lastHandledUrl = url;
      generation += 1;
      return generation;
    },
    isCurrent(attempt: number): boolean {
      return generation === attempt;
    },
    markInFlight(url: string): void {
      inFlightUrls.add(url);
    },
    settle(url: string): void {
      inFlightUrls.delete(url);
    },
    close(): void {
      generation += 1;
      lastHandledUrl = null;
      if (initialUrlDeliveryClaimed && !initialUrlResolved) initialUrlSuppressed = true;
    },
    invalidate(): void {
      generation += 1;
      lastHandledUrl = null;
    },
  });
}

export function decideQ13StorageReceiptCommand(
  url: string | null,
  context: Q13StorageReceiptCommandContext,
): Q13StorageReceiptCommandDecision {
  if (!context.development || !context.smoke) return "unavailable_in_production";
  return url === Q13_STORAGE_RECEIPT_URL ? "inspect" : "ignored";
}

/** Read the bounded in-memory bootstrap step without starting the storage inventory probe. */
export function decideQ13BootstrapDiagnosticCommand(
  url: string | null,
  context: Q13StorageReceiptCommandContext,
): Q13StorageReceiptCommandDecision {
  if (!context.development || !context.smoke) return "unavailable_in_production";
  return url === Q13_BOOTSTRAP_DIAGNOSTIC_URL ? "inspect" : "ignored";
}
