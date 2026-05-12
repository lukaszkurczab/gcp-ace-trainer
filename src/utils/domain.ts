import { EXAM_DOMAIN_LABELS } from "../constants";
import type { ExamDomain } from "../types";

export function getDomainLabel(domain: ExamDomain): string {
  return EXAM_DOMAIN_LABELS[domain];
}
