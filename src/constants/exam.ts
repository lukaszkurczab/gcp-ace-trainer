import { findTrackDescriptor } from "../domain/tracks/trackAdmission";
import type { CertificationDomain } from "../tracks/certification/domain/certificationModes";

export const EXAM_DOMAIN_LABELS = Object.freeze(Object.fromEntries(
  findTrackDescriptor("google-cloud-associate-cloud-engineer")!.presentation.progressDomains.map(value => [value.id, value.title]),
)) as Readonly<Record<CertificationDomain, string>>;
