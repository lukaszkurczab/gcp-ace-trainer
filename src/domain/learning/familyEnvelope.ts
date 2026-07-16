import type { TrackFamilyId } from "./trackIdentity";

/**
 * An opaque family-owned value carried by a shared record. The learning kernel
 * validates the family identity and preserves the value; only the matching
 * family runtime may validate or interpret `details`.
 */
export type FamilyEnvelope<TDetails = unknown> = Readonly<{
  familyId: TrackFamilyId;
  details: TDetails;
}>;

export function createFamilyEnvelope<TDetails>(input: FamilyEnvelope<TDetails>): FamilyEnvelope<TDetails> {
  if (!input.familyId.trim()) throw new Error("A family envelope requires a family identity.");
  return deepFreeze({ familyId: input.familyId, details: input.details });
}

export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}
