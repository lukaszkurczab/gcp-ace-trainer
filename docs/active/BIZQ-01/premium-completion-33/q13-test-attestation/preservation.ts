export const Q13_PRESERVATION_SCHEMA = "bizq01-q13-preservation-v1" as const;
export const Q13_SEMANTIC_PROJECTION = "canonicalSerialize-envelope-v1-timer-exceptions-v1" as const;

export const Q13_REQUIRED_CATEGORIES = Object.freeze([
  "active-track",
  "learning-lifecycle",
  "learning-progress",
  "goals-and-plans",
  "user-settings",
  "reminder-settings",
  "learning-identity-history",
] as const);

export type Q13PreservationCategory = (typeof Q13_REQUIRED_CATEGORIES)[number];
export type Q13InventoryCategory = Q13PreservationCategory | "account-lifecycle-redacted" | "profile-metadata-unread" | "content-report-outbox-unread";
export type Q13InventoryEntry = Readonly<{ keySha256: string; category: Q13InventoryCategory | "outside_canonical_namespace" }>;
export type Q13KeyDigest = Readonly<{
  keySha256: string;
  category: Q13PreservationCategory;
  present: boolean;
  rawValueSha256?: string;
  semanticSha256?: string;
}>;
export type Q13PreservationSnapshot = Readonly<{
  schema: typeof Q13_PRESERVATION_SCHEMA;
  semanticProjection: typeof Q13_SEMANTIC_PROJECTION;
  profileKind: "account";
  transitionActive: false;
  keyInventory: readonly Q13InventoryEntry[];
  categories: Readonly<Record<Q13PreservationCategory, readonly Q13KeyDigest[]>>;
  session: Readonly<{
    status: "active";
    trackId: string;
    contentVersion: string;
    artifactSha256: string;
    actualLength: 1;
    currentItemIndex: 0;
    orderedItemsSha256: string;
    orderedOptionsSha256: string;
    attemptCount: 0;
    draftResponseCount: 0;
    activeJournalPresent: false;
    persistedOldPin: true;
  }>;
}>;

export type Q13ReadStorage = Readonly<{
  getAllKeys(): readonly string[];
  getString(key: string): string | undefined;
}>;
export type Q13PublishedProfile = Readonly<{ kind: string }>;
export type Q13ExpectedSession = Readonly<{
  id: string;
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  actualLength: number;
  currentItemIndex: number;
  itemOrder: readonly unknown[];
  optionOrderByOccurrence: Readonly<Record<string, readonly string[]>>;
}>;
export type Q13PreservationContract = Readonly<{
  namespace: string;
  trackId: string;
  oldPin: Readonly<{ contentVersion: string; artifactSha256: string }>;
  hashUtf8(value: string): string;
  canonicalSerialize(value: unknown): string;
  keys: Readonly<{
    ACTIVE_TRACK: string;
    ACTIVE_TRAINING_SESSION: string;
    ACTIVE_TRAINING_SESSION_DRAFT: string;
    ACTIVE_FOREGROUND_TIMER: string;
    ACTIVE_JOURNAL: string;
    TRAINING_ATTEMPT_INDEX: string;
    trainingSession(id: string): string;
    trainingAttempt(id: string): string;
  }>;
}>;

const UNREADABLE = new Error("preservation_unreadable");
const SAFE_FAILURE_CATEGORIES = new Set([
  "preservation_profile_unavailable", "preservation_transition_active", "preservation_session_unavailable",
  "preservation_key_inventory_unavailable", "preservation_key_inventory_invalid", "preservation_unclassified_key",
  "preservation_unreadable", "preservation_active_track_mismatch", "preservation_active_pointer_mismatch",
  "preservation_active_session_mismatch", "preservation_old_pin_mismatch", "preservation_one_item_fixture_mismatch",
  "preservation_attempts_present", "preservation_draft_responses_present", "preservation_active_journal_present",
  "preservation_storage_unpublished",
]);

export function q13PreservationFailureCategory(error: unknown): string {
  return error instanceof Error && SAFE_FAILURE_CATEGORIES.has(error.message) ? error.message : "preservation_read_failed";
}

export function captureQ13PreservationSnapshot(input: Readonly<{
  storage: Q13ReadStorage;
  profile: Q13PublishedProfile | null;
  transitionActive: boolean;
  expectedSession: Q13ExpectedSession;
  contract: Q13PreservationContract;
}>): Q13PreservationSnapshot {
  if (input.profile?.kind !== "account") throw new Error("preservation_profile_unavailable");
  if (input.transitionActive !== false) throw new Error("preservation_transition_active");
  const contract = input.contract;
  if (!input.expectedSession || input.expectedSession.trackId !== contract.trackId) throw new Error("preservation_session_unavailable");

  let listedKeys: readonly string[];
  try { listedKeys = input.storage.getAllKeys(); } catch { throw new Error("preservation_key_inventory_unavailable"); }
  if (!Array.isArray(listedKeys) || listedKeys.some((key) => typeof key !== "string") || new Set(listedKeys).size !== listedKeys.length) {
    throw new Error("preservation_key_inventory_invalid");
  }
  const allKeys = [...listedKeys].sort();
  const canonicalKeys = allKeys.filter((key) => key.startsWith(contract.namespace));
  const keyInventory: Q13InventoryEntry[] = [];
  const categories = Object.fromEntries(
    Q13_REQUIRED_CATEGORIES.map((category) => [category, []]),
  ) as unknown as Record<Q13PreservationCategory, Q13KeyDigest[]>;
  const payloads = new Map<string, unknown>();

  for (const key of allKeys) {
    const category = classifyQ13CanonicalKey(key, contract);
    if (category === "unclassified-canonical-key-unread") throw new Error("preservation_unclassified_key");
    if (!category) throw new Error("preservation_unclassified_key");
    keyInventory.push(Object.freeze({ keySha256: contract.hashUtf8(key), category }));
  }

  for (const key of canonicalKeys) {
    const category = classifyQ13CanonicalKey(key, contract);
    if (!category) throw new Error("preservation_unclassified_key");
    const keySha256 = contract.hashUtf8(key);
    const requiredCategory = Q13_REQUIRED_CATEGORIES.find((candidate) => candidate === category);
    if (!requiredCategory) continue;
    let raw: string | undefined;
    try { raw = input.storage.getString(key); } catch { throw UNREADABLE; }
    if (raw === undefined) {
      categories[requiredCategory].push(Object.freeze({ keySha256, category: requiredCategory, present: false }));
      continue;
    }
    const envelope = readEnvelope(raw);
    const semantic = semanticEnvelope(key, envelope, contract);
    const digest = Object.freeze({
      keySha256,
      category: requiredCategory,
      present: true,
      rawValueSha256: contract.hashUtf8(raw),
      semanticSha256: contract.hashUtf8(contract.canonicalSerialize(semantic)),
    });
    categories[requiredCategory].push(digest);
    payloads.set(key, envelope.payload);
  }

  for (const category of Q13_REQUIRED_CATEGORIES) categories[category].sort((left, right) => left.keySha256.localeCompare(right.keySha256));

  if (payloads.get(contract.keys.ACTIVE_TRACK) !== contract.trackId) throw new Error("preservation_active_track_mismatch");
  const activePointer = payloads.get(contract.keys.ACTIVE_TRAINING_SESSION);
  if (typeof activePointer !== "string" || activePointer !== input.expectedSession.id) throw new Error("preservation_active_pointer_mismatch");
  const activeSessionKey = contract.keys.trainingSession(activePointer);
  const session = record(payloads.get(activeSessionKey));
  if (!session || session.status !== "active" || session.id !== input.expectedSession.id || session.trackId !== contract.trackId
    || session.contentVersion !== input.expectedSession.contentVersion || session.artifactSha256 !== input.expectedSession.artifactSha256) {
    throw new Error("preservation_active_session_mismatch");
  }
  if (session.contentVersion !== contract.oldPin.contentVersion || session.artifactSha256 !== contract.oldPin.artifactSha256) {
    throw new Error("preservation_old_pin_mismatch");
  }
  if (!Array.isArray(session.itemOrder) || session.itemOrder.length !== 1 || session.actualLength !== 1 || session.currentItemIndex !== 0
    || input.expectedSession.actualLength !== session.actualLength || input.expectedSession.currentItemIndex !== session.currentItemIndex
    || contract.canonicalSerialize(input.expectedSession.itemOrder) !== contract.canonicalSerialize(session.itemOrder)
    || contract.canonicalSerialize(input.expectedSession.optionOrderByOccurrence) !== contract.canonicalSerialize(session.optionOrderByOccurrence)) {
    throw new Error("preservation_one_item_fixture_mismatch");
  }

  const attemptIds = payloads.get(contract.keys.TRAINING_ATTEMPT_INDEX);
  if (attemptIds !== undefined && !isStringArray(attemptIds)) throw UNREADABLE;
  for (const attemptId of (attemptIds as string[] | undefined) ?? []) {
    const attemptKey = contract.keys.trainingAttempt(attemptId);
    if (!payloads.has(attemptKey)) throw UNREADABLE;
  }
  let attemptCount = 0;
  for (const [key, payload] of payloads) {
    if (!key.startsWith(`${contract.namespace}training-attempt:`)) continue;
    const attempt = record(payload);
    if (!attempt || typeof attempt.sessionId !== "string") throw UNREADABLE;
    if (attempt.sessionId === activePointer) attemptCount += 1;
  }
  if (attemptCount !== 0) throw new Error("preservation_attempts_present");

  let draftResponseCount = 0;
  const draft = payloads.get(contract.keys.ACTIVE_TRAINING_SESSION_DRAFT);
  if (draft !== undefined) {
    const parsedDraft = record(draft);
    if (!parsedDraft || parsedDraft.sessionId !== activePointer || !record(parsedDraft.responsesByOccurrenceId)) throw UNREADABLE;
    draftResponseCount = Object.keys(parsedDraft.responsesByOccurrenceId as Record<string, unknown>).length;
  }
  if (draftResponseCount !== 0) throw new Error("preservation_draft_responses_present");

  const journalPresent = payloads.has(contract.keys.ACTIVE_JOURNAL);
  if (journalPresent) throw new Error("preservation_active_journal_present");
  const itemVector = (session.itemOrder as unknown[]).map((entry) => {
    const occurrence = record(entry);
    const item = record(occurrence?.item);
    if (!occurrence || typeof occurrence.occurrenceId !== "string" || !item) throw UNREADABLE;
    return Object.freeze({ occurrenceId: occurrence.occurrenceId, item });
  });
  const options = record(session.optionOrderByOccurrence);
  if (!options) throw UNREADABLE;
  const optionVector = itemVector.map(({ occurrenceId }) => {
    const optionIds = options[occurrenceId];
    if (!isStringArray(optionIds)) throw UNREADABLE;
    return Object.freeze({ occurrenceId, optionIds: [...optionIds] });
  });

  return Object.freeze({
    schema: Q13_PRESERVATION_SCHEMA,
    semanticProjection: Q13_SEMANTIC_PROJECTION,
    profileKind: "account",
    transitionActive: false,
    keyInventory: Object.freeze(keyInventory),
    categories: Object.freeze(Object.fromEntries(Q13_REQUIRED_CATEGORIES.map((category) => [category, Object.freeze(categories[category])])) as Record<Q13PreservationCategory, readonly Q13KeyDigest[]>),
    session: Object.freeze({
      status: "active",
      trackId: session.trackId as string,
      contentVersion: session.contentVersion as string,
      artifactSha256: session.artifactSha256 as string,
      actualLength: 1,
      currentItemIndex: 0,
      orderedItemsSha256: contract.hashUtf8(contract.canonicalSerialize(itemVector)),
      orderedOptionsSha256: contract.hashUtf8(contract.canonicalSerialize(optionVector)),
      attemptCount: 0,
      draftResponseCount: 0,
      activeJournalPresent: false,
      persistedOldPin: true,
    }),
  });
}

export function capturePublishedQ13PreservationSnapshot(input: Readonly<{
  getStorage(): Q13ReadStorage;
  getProfile(): Q13PublishedProfile | null;
  isTransitionActive(): boolean;
  expectedSession: Q13ExpectedSession;
  contract: Q13PreservationContract;
}>): Q13PreservationSnapshot {
  let profile: Q13PublishedProfile | null;
  let transitionActive: boolean;
  let storage: Q13ReadStorage;
  try {
    profile = input.getProfile();
    transitionActive = input.isTransitionActive();
    if (!profile) throw new Error("preservation_profile_unavailable");
    if (profile.kind !== "account") throw new Error("preservation_profile_unavailable");
    if (transitionActive) throw new Error("preservation_transition_active");
    storage = input.getStorage();
  } catch (error) {
    if (error instanceof Error && ["preservation_profile_unavailable", "preservation_transition_active"].includes(error.message)) throw error;
    throw new Error("preservation_storage_unpublished");
  }
  return captureQ13PreservationSnapshot({ storage, profile, transitionActive, expectedSession: input.expectedSession, contract: input.contract });
}

export function classifyQ13CanonicalKey(key: string, contract: Q13PreservationContract): Q13InventoryCategory | "unclassified-canonical-key-unread" | "outside_canonical_namespace" | null {
  if (!key.startsWith(contract.namespace)) return "outside_canonical_namespace";
  const name = key.slice(contract.namespace.length);
  if (name === "active-track") return "active-track";
  if (name === "active-training-session" || name === "active-training-session-draft" || name === "active-foreground-timer" || name === "journal:active") return "learning-lifecycle";
  if (name === "training-session-index" || name.startsWith("training-session:") || name.startsWith("training-session-result:") || name === "training-attempt-index" || name.startsWith("training-attempt:") || name === "review-index" || name.startsWith("review-entry:")) return "learning-progress";
  if (name.startsWith("goal:") || name.startsWith("learning-plan:") || name === "goal-onboarding-preferences") return "goals-and-plans";
  if (name === "settings") return "user-settings";
  if (name === "notification-settings" || name === "notification-settings-journal") return "reminder-settings";
  if (name === "archival-history-index" || name.startsWith("archival-history:") || name === "unavailable-active-index" || name.startsWith("unavailable-active:") || name === "unavailable-review-index" || name.startsWith("unavailable-review:")) return "learning-identity-history";
  if (name === "account-sync" || name === "account-sign-out" || name === "account-deletion") return "account-lifecycle-redacted";
  if (name === "guest-installation" || name === "guest-access" || name === "metadata") return "profile-metadata-unread";
  if (name === "content-report-outbox") return "content-report-outbox-unread";
  return "unclassified-canonical-key-unread";
}

export function semanticEnvelope(key: string, envelope: Readonly<{ schemaIdentity: string; revision: number; payload: unknown }>, contract: Q13PreservationContract): Readonly<{ schemaIdentity: string; payload: unknown }> {
  const payload = clonePlain(envelope.payload);
  if (key === contract.keys.ACTIVE_FOREGROUND_TIMER) {
    const value = record(payload);
    if (value) {
      delete value.accumulatedForegroundMs;
      delete value.checkpointRevision;
      delete value.lastCheckpointAt;
    }
  } else if (key.startsWith(`${contract.namespace}training-session:`)) {
    const value = record(payload);
    if (value) delete value.activeForegroundMs;
  }
  return Object.freeze({ schemaIdentity: envelope.schemaIdentity, payload });
}

function readEnvelope(raw: string): Readonly<{ schemaIdentity: string; revision: number; payload: unknown }> {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw UNREADABLE; }
  const value = record(parsed);
  if (!value || Object.keys(value).length !== 3 || value.schemaIdentity !== "patternly:canonical:v1"
    || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1 || !Object.hasOwn(value, "payload")) throw UNREADABLE;
  return value as Readonly<{ schemaIdentity: string; revision: number; payload: unknown }>;
}

function clonePlain(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return value;
  if (Array.isArray(value)) return value.map(clonePlain);
  const source = record(value);
  if (!source) throw UNREADABLE;
  return Object.fromEntries(Object.entries(source).map(([key, entry]) => [key, clonePlain(entry)]));
}

function record(value: unknown): Record<string, any> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, any> : null;
}

function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every((entry) => typeof entry === "string"); }
