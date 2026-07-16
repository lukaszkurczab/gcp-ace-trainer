import { ContentUnavailableError } from "../errors";

/**
 * This build intentionally contains no bundled content bank.  The absence is
 * explicit: content is never fetched, cached, translated, or copied into
 * user-owned storage.  A release that ships a bank must replace this with
 * structural validation of that bundled manifest before navigation is ready.
 */
export async function validateBundledContent(): Promise<void> {
  throw new ContentUnavailableError();
}
