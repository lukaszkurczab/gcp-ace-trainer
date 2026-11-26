import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PRODUCT_MODE_CONFIGS } from "../../content/canonical/productModeConfig";
import { isPracticeSetupReviewEvidenceMissing, PRACTICE_SETUP_REVIEW_EVIDENCE_MODE_IDS, practiceSetupNeedsReviewRead } from "./practiceSetupModel";

// 8B.R3 observation: Weak Area Review setup stayed on the stack after its only
// eligible item was completed and still offered an active Start session, which
// then failed as "Cloud Practice unavailable". The setup must use the same
// review-evidence gate as the Practice hub.
test("an evidence-conditioned review setup without current review evidence is unavailable", () => {
  assert.equal(isPracticeSetupReviewEvidenceMissing({ availability: "evidence_conditioned", hasReviewEvidence: false }), true);
  assert.equal(isPracticeSetupReviewEvidenceMissing({ availability: "evidence_conditioned", hasReviewEvidence: true }), false);
  assert.equal(isPracticeSetupReviewEvidenceMissing({ availability: "immediate", hasReviewEvidence: false }), false);
});

test("explicit session-miss review routes keep their own evidence", () => {
  assert.equal(isPracticeSetupReviewEvidenceMissing({ availability: "evidence_conditioned", hasReviewEvidence: false, reviewSource: "session_misses" }), false);
  assert.equal(isPracticeSetupReviewEvidenceMissing({ availability: "evidence_conditioned", hasReviewEvidence: false, hasReviewItemRefs: true }), false);
});

test("Practice setup reads the review queue and gates Start on review evidence", () => {
  const screen = readFileSync(new URL("./PracticeSetupScreen.tsx", import.meta.url), "utf8");
  assert.match(screen, /usePracticeReadModel\(\{[\s\S]*?includeReviews: practiceSetupNeedsReviewRead\(route\.params\?\.mode\),[\s\S]*?\}\)/u);
  assert.match(screen, /isPracticeSetupReviewEvidenceMissing\(\{[\s\S]*?hasReviewEvidence: readState\.hasReviewEvidence/u);
  assert.match(screen, /renderUnavailable\(t\("There are no questions to review right now\."\)\)/u);
});

test("only review-mode setups read the review queue", () => {
  assert.equal(practiceSetupNeedsReviewRead("certification-weak-area-review"), true);
  assert.equal(practiceSetupNeedsReviewRead("certification-quick-review"), true);
  assert.equal(practiceSetupNeedsReviewRead("certification-focus-practice"), false);
  assert.equal(practiceSetupNeedsReviewRead(undefined), false);
  const evidenceModes = [...new Set(PRODUCT_MODE_CONFIGS.filter((config) => config.availability === "evidence_conditioned").map((config) => config.modeId))].sort();
  assert.deepEqual([...PRACTICE_SETUP_REVIEW_EVIDENCE_MODE_IDS].sort(), evidenceModes);
});
