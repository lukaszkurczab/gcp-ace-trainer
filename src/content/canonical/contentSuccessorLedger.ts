import type { TrackId } from "../../domain/learning/trackIdentity";

export type ContentTrackIdentity = Readonly<{ contentVersion: string; artifactSha256: string }>;
export type ContentPlanningPolicyIdentity = ContentTrackIdentity & Readonly<{ policyVersion: string }>;
export type ContentSuccessorLedgerEntry = Readonly<{
  trackId: TrackId;
  training: ContentTrackIdentity & Readonly<{ questionCount: number }>;
  planningPolicy: ContentPlanningPolicyIdentity;
}>;
export type ContentSuccessorLedger = Readonly<{ schemaVersion: "patternly-content-successor-ledger-v1"; tracks: readonly ContentSuccessorLedgerEntry[] }>;

const TRACK_IDS = Object.freeze([
  "aws-certified-solutions-architect-associate", "backend-system-design-interview",
  "claude-certified-architect-professional-certification", "coding-interview-dsa-problem-solving",
  "frontend-system-design-interview", "google-cloud-associate-cloud-engineer",
  "microsoft-azure-administrator-associate-az-104", "microsoft-azure-ai-fundamentals-ai-901",
  "object-oriented-design-interview",
]);
const HASH = /^[a-f0-9]{64}$/u;
const VERSION = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) => JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());

export function assertValidContentSuccessorLedger(value: unknown): asserts value is ContentSuccessorLedger {
  if (!record(value) || !exactKeys(value, ["schemaVersion", "tracks"]) || value.schemaVersion !== "patternly-content-successor-ledger-v1" || !Array.isArray(value.tracks)) throw new Error("Content successor ledger is invalid.");
  const entries = value.tracks;
  const ids = entries.map((entry) => record(entry) ? entry.trackId : undefined);
  if (entries.length !== TRACK_IDS.length || JSON.stringify(ids) !== JSON.stringify([...TRACK_IDS].sort())) throw new Error("Content successor ledger track set is invalid.");
  for (const entry of entries) {
    if (!record(entry) || !exactKeys(entry, ["trackId", "training", "planningPolicy"]) || typeof entry.trackId !== "string" || !TRACK_IDS.includes(entry.trackId as typeof TRACK_IDS[number])) throw new Error("Content successor ledger entry is invalid.");
    if (!record(entry.training) || !exactKeys(entry.training, ["contentVersion", "artifactSha256", "questionCount"]) || typeof entry.training.contentVersion !== "string" || !VERSION.test(entry.training.contentVersion) || typeof entry.training.artifactSha256 !== "string" || !HASH.test(entry.training.artifactSha256) || !Number.isSafeInteger(entry.training.questionCount) || (entry.training.questionCount as number) < 1) throw new Error("Content successor training identity is invalid.");
    if (!record(entry.planningPolicy) || !exactKeys(entry.planningPolicy, ["contentVersion", "artifactSha256", "policyVersion"]) || typeof entry.planningPolicy.contentVersion !== "string" || !VERSION.test(entry.planningPolicy.contentVersion) || typeof entry.planningPolicy.artifactSha256 !== "string" || !HASH.test(entry.planningPolicy.artifactSha256) || typeof entry.planningPolicy.policyVersion !== "string" || !entry.planningPolicy.policyVersion.trim()) throw new Error("Content successor planning-policy identity is invalid.");
  }
}

export function contentSuccessorLedgerEntry(value: ContentSuccessorLedger, trackId: string): ContentSuccessorLedgerEntry {
  const entry = value.tracks.find((candidate) => candidate.trackId === trackId);
  if (!entry) throw new Error(`Content successor ledger has no identity for ${trackId}.`);
  return entry;
}
