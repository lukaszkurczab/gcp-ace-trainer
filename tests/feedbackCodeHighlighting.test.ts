import assert from "node:assert/strict";
import test from "node:test";

import { tokenizeFeedbackCode } from "../src/features/practice/feedbackCodeHighlighting";

test("syntax tokenizer preserves every character for all declared feedback languages", () => {
  for (const language of ["pseudocode", "typescript", "python", "java", "cpp", "go", "sql"] as const) {
    const code = language === "sql" ? "SELECT count(*) FROM items -- explain" : "if value >= 10 { return 'ok'; } // explain";
    const tokens = tokenizeFeedbackCode(language, code);
    assert.equal(tokens.map((token) => token.text).join(""), code, language);
    assert.ok(tokens.some((token) => token.kind === "keyword"), language);
  }
});
