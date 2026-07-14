export class ContentError extends Error {
  constructor(message: string, readonly code: string) { super(message); this.name = "ContentError"; }
}
export class ContentConfigurationError extends ContentError { constructor() { super("Patternly content base URL is not configured.", "configuration"); } }
export class ContentHttpError extends ContentError { constructor(status: number, url: string) { super(`Content request failed (${status}): ${url}`, "http"); } }
export class ContentTimeoutError extends ContentError { constructor(url: string) { super(`Content request timed out: ${url}`, "timeout"); } }
export class ContentValidationError extends ContentError { constructor(message: string) { super(message, "validation"); } }
export class ContentChecksumError extends ContentError { constructor() { super("Downloaded content checksum does not match its manifest.", "checksum"); } }
export class ContentUnavailableError extends ContentError { constructor() { super("No validated content is available.", "unavailable"); } }
export class CorruptContentCacheError extends ContentError { constructor() { super("The active content cache is corrupt.", "corrupt_cache"); } }
