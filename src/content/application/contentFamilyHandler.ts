import type { PublishedTrackManifest } from "../contracts";

/**
 * Composition-facing contract. Payload validation and catalog installation stay
 * in the family that owns the payload; the loader only resolves an opaque
 * family handler.
 */
export type ContentFamilyHandler = Readonly<{
  familyId: string;
  validate(payload: unknown, manifest: PublishedTrackManifest): void;
  install(payload: unknown, manifest: PublishedTrackManifest): void;
}>;
