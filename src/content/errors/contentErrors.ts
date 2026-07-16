export class ContentError extends Error {
  constructor(message: string, readonly code: string) { super(message); this.name = "ContentError"; }
}
export class ContentValidationError extends ContentError { constructor(message: string) { super(message, "validation"); } }
export class ContentUnavailableError extends ContentError { constructor() { super("No validated content is available.", "unavailable"); } }
