export class UnknownTrackError extends Error {
  constructor(trackId: string) {
    super(`Unknown track id: ${trackId}`);
    this.name = "UnknownTrackError";
  }
}

export class UnknownTrackFamilyError extends Error {
  constructor(familyId: string) {
    super(`Unknown track family id: ${familyId}`);
    this.name = "UnknownTrackFamilyError";
  }
}

export class InvalidTrainingSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTrainingSessionError";
  }
}

export class InvalidAttemptResultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAttemptResultError";
  }
}

export class UnsupportedStoredRecordError extends Error {
  constructor(recordName: string) {
    super(`Unsupported stored ${recordName} record.`);
    this.name = "UnsupportedStoredRecordError";
  }
}

export class MissingContentItemError extends Error {
  constructor(trackId: string, itemId: string) {
    super(`Missing content item ${itemId} for track ${trackId}.`);
    this.name = "MissingContentItemError";
  }
}

/** Typed optimistic-concurrency failure; callers must never classify its copy. */
export class StaleDraftRevisionError extends Error {
  constructor(readonly expectedRevision: number | null, readonly actualRevision: number | null) {
    super("Training session draft expected revision is stale.");
    this.name = "StaleDraftRevisionError";
  }
}
