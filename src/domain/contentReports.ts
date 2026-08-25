import type { TrackId } from "./learning/trackIdentity";

export const CONTENT_REPORT_REASONS = ["incorrect_answer", "unclear_explanation", "outdated_content", "technical_issue", "other"] as const;
export type ContentReportReason = (typeof CONTENT_REPORT_REASONS)[number];
export type ContentReportModeRoute = "practice_feedback_details" | "answer_review";
export type ContentReportLocale = "en" | "pl";
export type ContentReportPlatform = "ios" | "android";

export type ContentReportContext = Readonly<{
  releasePackageId: string;
  trackNode: string | null;
  modeRoute: ContentReportModeRoute;
  locale: ContentReportLocale;
  appBuild: string;
  platform: ContentReportPlatform;
  occurredAt: string;
}>;

export type ContentReportInput = Readonly<{
  clientSubmissionId: string;
  trackId: TrackId;
  contentVersion: string;
  itemId: string;
  reason: ContentReportReason;
  description: string;
  context: ContentReportContext;
  linkAccount?: boolean;
  contactEmail?: string;
}>;

export type ContentReportOutboxStatus = "queued" | "retrying" | "failed" | "accepted";
export type ContentReportOutboxEntry = Readonly<{
  input: ContentReportInput;
  status: ContentReportOutboxStatus;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  lastErrorCode: string | null;
}>;
