import { EXAM_DOMAIN_LABELS } from "../constants";
import type { CertificationDomain } from "../tracks/certification/domain";

export function getDomainLabel(domain: CertificationDomain): string {
  return EXAM_DOMAIN_LABELS[domain] ?? domain.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
