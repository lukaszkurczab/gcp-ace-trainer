export const CONTENT_REPORT_DESCRIPTION_MAX_LENGTH = 280 as const;
export const EMPTY_CONTENT_REPORT_DESCRIPTION = "No additional details provided." as const;

export type ContentReportDescriptionIssue = "too_long" | "private_data";

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu;
const URL = /(?:https?:\/\/|www\.)\S+|\b[A-Z0-9-]+\.(?:com|org|net|edu|gov|io|dev|app|pl|eu)(?:[/?#]\S*)?/iu;
const PHONE = /(?:^|[^\w])(?:\+?\d[\s().-]*){7,15}(?!\w)/u;
const SECRET = /\b(?:password|passwd|passcode|hasło|pin|otp|verification\s+code|recovery\s+code|kod(?:\s+(?:dostępu|weryfikacyjny|jednorazowy))?)\b\s*(?:[:=#-]\s*\S{4,}|\s+\d{4,})/iu;
const NUMERIC_CODE = /\b(?:code|kod)\b\s*[:=#-]?\s*\d{4,}\b/iu;
const RECOVERY_CODE = /\b[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}\b/u;

export function contentReportDescriptionIssue(value: string): ContentReportDescriptionIssue | null {
  const description = value.trim();
  if (description.length > CONTENT_REPORT_DESCRIPTION_MAX_LENGTH) return "too_long";
  return EMAIL.test(description) || URL.test(description) || PHONE.test(description) || SECRET.test(description) || NUMERIC_CODE.test(description) || RECOVERY_CODE.test(description)
    ? "private_data"
    : null;
}

export function prepareContentReportDescription(value: string): string {
  const issue = contentReportDescriptionIssue(value);
  if (issue) throw new Error(`content_report_description_${issue}`);
  return value.trim() || EMPTY_CONTENT_REPORT_DESCRIPTION;
}
