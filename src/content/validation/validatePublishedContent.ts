import type { PublishedAlgorithmsBank, PublishedCertificationBank, PublishedRootManifest, PublishedRootTrack, PublishedTrackManifest } from "../contracts";
import { ContentValidationError } from "../errors";
import { validateAlgorithmInteractionItem } from "../../tracks/algorithms/algorithmInteractionHandlers";

function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new ContentValidationError("Published content payload must be an object."); return value as Record<string, unknown>; }
function keys(value: Record<string, unknown>, allowed: readonly string[]): void { if (Object.keys(value).some((key) => !allowed.includes(key))) throw new ContentValidationError("Published content contains an unknown envelope field."); }
function string(value: unknown, field: string): string { if (typeof value !== "string" || !value) throw new ContentValidationError(`${field} must be a non-empty string.`); return value; }
function array(value: unknown, field: string): readonly unknown[] { if (!Array.isArray(value)) throw new ContentValidationError(`${field} must be an array.`); return value; }

export function validateRootManifest(value: unknown): PublishedRootManifest {
  const root = record(value); keys(root, ["formatVersion", "publishedAt", "tracks"]);
  if (root.formatVersion !== 1) throw new ContentValidationError("Unsupported root manifest format.");
  string(root.publishedAt, "publishedAt");
  const ids = new Set<string>();
  const tracks = array(root.tracks, "tracks").map((entry): PublishedRootTrack => {
    const track = record(entry); keys(track, ["trackId", "familyId", "contentVersion", "manifestPath"]);
    const trackId = string(track.trackId, "trackId"); if (ids.has(trackId)) throw new ContentValidationError("Root manifest contains a duplicate track."); ids.add(trackId);
    return { trackId, familyId: string(track.familyId, "familyId"), contentVersion: string(track.contentVersion, "contentVersion"), manifestPath: string(track.manifestPath, "manifestPath") };
  });
  return { formatVersion: 1, publishedAt: root.publishedAt as string, tracks };
}
export function validateTrackManifest(value: unknown, entry: PublishedRootTrack): PublishedTrackManifest {
  const manifest = record(value); keys(manifest, ["formatVersion", "trackId", "familyId", "contentVersion", "itemCount", "bankPath", "sha256"]);
  if (manifest.formatVersion !== 1) throw new ContentValidationError("Unsupported track manifest format.");
  const result: PublishedTrackManifest = { formatVersion: 1, trackId: string(manifest.trackId, "trackId"), familyId: string(manifest.familyId, "familyId"), contentVersion: string(manifest.contentVersion, "contentVersion"), itemCount: typeof manifest.itemCount === "number" && Number.isInteger(manifest.itemCount) && manifest.itemCount >= 0 ? manifest.itemCount : (() => { throw new ContentValidationError("itemCount must be a non-negative integer."); })(), bankPath: string(manifest.bankPath, "bankPath"), sha256: string(manifest.sha256, "sha256") };
  if (result.trackId !== entry.trackId || result.familyId !== entry.familyId || result.contentVersion !== entry.contentVersion) throw new ContentValidationError("Track manifest identity does not match root manifest.");
  return result;
}
function validateItems(items: readonly unknown[], expectedCount: number): readonly Record<string, unknown>[] {
  if (items.length !== expectedCount) throw new ContentValidationError("Bank item count does not match manifest.");
  const ids = new Set<string>();
  return items.map((item) => { const question = record(item); const id = string(question.id, "item id"); if (ids.has(id)) throw new ContentValidationError("Bank contains a duplicate item ID."); ids.add(id); return question; });
}
export function validateAlgorithmsBank(value: unknown, manifest: PublishedTrackManifest): PublishedAlgorithmsBank {
  const bank = record(value); keys(bank, ["formatVersion", "trackId", "familyId", "contentVersion", "groups", "items"]);
  if (bank.formatVersion !== 1 || bank.trackId !== "algorithms" || bank.familyId !== "algorithms" || bank.contentVersion !== manifest.contentVersion) throw new ContentValidationError("Algorithms bank identity is invalid.");
  const items = validateItems(array(bank.items, "items"), manifest.itemCount);
  for (const item of items) {
    try { validateAlgorithmInteractionItem(item as PublishedAlgorithmsBank["items"][number]); }
    catch (error) { throw new ContentValidationError(error instanceof Error ? error.message : "Algorithms interaction contract is invalid."); }
  }
  const itemIds = new Set(items.map((item) => item.id as string)); const assigned = new Set<string>();
  const groups = array(bank.groups, "groups").map((entry) => { const group = record(entry); keys(group, ["roadmapNodeId", "itemIds"]); const roadmapNodeId = string(group.roadmapNodeId, "roadmapNodeId"); const itemIdsInGroup = array(group.itemIds, "group itemIds").map((id) => string(id, "group itemId")); for (const id of itemIdsInGroup) { if (!itemIds.has(id) || assigned.has(id)) throw new ContentValidationError("Algorithms group membership is invalid."); assigned.add(id); } return { roadmapNodeId, itemIds: itemIdsInGroup }; });
  if (assigned.size !== itemIds.size) throw new ContentValidationError("Algorithms bank omits a grouped item.");
  return { formatVersion: 1, trackId: "algorithms", familyId: "algorithms", contentVersion: manifest.contentVersion, groups, items: items as PublishedAlgorithmsBank["items"] };
}
export function validateCertificationBank(value: unknown, manifest: PublishedTrackManifest): PublishedCertificationBank {
  const bank = record(value); keys(bank, ["formatVersion", "trackId", "familyId", "contentVersion", "items"]);
  if (bank.formatVersion !== 1 || bank.trackId !== "cloud-certification" || bank.familyId !== "certification" || bank.contentVersion !== manifest.contentVersion) throw new ContentValidationError("Certification bank identity is invalid.");
  const items = validateItems(array(bank.items, "items"), manifest.itemCount);
  for (const item of items) { const options = array(item.options, "options"); const correct = array(item.correctOptionIds, "correctOptionIds"); const optionIds = new Set(options.map((option) => string(record(option).id, "option id"))); if (optionIds.size !== options.length || correct.some((id) => !optionIds.has(string(id, "correct option id")))) throw new ContentValidationError("Certification response shape is invalid."); }
  return { formatVersion: 1, trackId: "cloud-certification", familyId: "certification", contentVersion: manifest.contentVersion, items: items as PublishedCertificationBank["items"] };
}
