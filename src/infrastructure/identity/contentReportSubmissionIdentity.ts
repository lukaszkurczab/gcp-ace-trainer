import { randomUUID } from "node:crypto";

export function createContentReportSubmissionId(): string {
  return randomUUID();
}
