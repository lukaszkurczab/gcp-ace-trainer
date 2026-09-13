import assert from "node:assert/strict";
import test from "node:test";

import { detailLines } from "./feedbackDetails";

test("structured Claude feedback renders explanatory text without leaking block metadata", () => {
  assert.deepEqual(detailLines({
    blocks: [
      { text: "First explanation.", type: "paragraph" },
      { text: "Second explanation.", type: "paragraph" },
    ],
  }), ["First explanation.", "Second explanation."]);
});

test("feedback detail projection keeps scalar and nested explanatory values", () => {
  assert.deepEqual(detailLines({ heading: "Why", notes: ["One", "Two"], score: 2 }), ["Why", "One", "Two", "2"]);
});
