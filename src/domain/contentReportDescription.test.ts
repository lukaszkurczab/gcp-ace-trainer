import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTENT_REPORT_DESCRIPTION_MAX_LENGTH,
  EMPTY_CONTENT_REPORT_DESCRIPTION,
  contentReportDescriptionIssue,
  prepareContentReportDescription,
} from "./contentReportDescription";

test("content report description is optional, trimmed and bounded", () => {
  assert.equal(prepareContentReportDescription("   "), EMPTY_CONTENT_REPORT_DESCRIPTION);
  assert.equal(prepareContentReportDescription("  The explanation skips a step.  "), "The explanation skips a step.");
  assert.equal(contentReportDescriptionIssue("a".repeat(CONTENT_REPORT_DESCRIPTION_MAX_LENGTH)), null);
  assert.equal(contentReportDescriptionIssue("a".repeat(CONTENT_REPORT_DESCRIPTION_MAX_LENGTH + 1)), "too_long");
});

test("content report description rejects obvious contact and secret data", () => {
  for (const value of [
    "Email me at learner@example.com",
    "Call +48 123 456 789",
    "See https://example.com/private",
    "More details at example.edu",
    "More details at example.gov",
    "password: secret123",
    "kod: 123456",
    "ABCD-EFGH-IJKL-MNOP",
  ]) {
    assert.equal(contentReportDescriptionIssue(value), "private_data", value);
    assert.throws(() => prepareContentReportDescription(value), /content_report_description_private_data/);
  }
});

test("ordinary technical language is not mistaken for a secret", () => {
  assert.equal(contentReportDescriptionIssue("The code example has the wrong complexity."), null);
  assert.equal(contentReportDescriptionIssue("The answer should be O(n), not O(n squared)."), null);
});
