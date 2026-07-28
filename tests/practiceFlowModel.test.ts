import assert from "node:assert/strict";
import test from "node:test";

import { getTrackDisplay } from "../src/domain";
import { buildPracticeModes } from "../src/features/practice/practiceFlowModel";
import { ALGORITHM_MODE_IDS } from "../src/tracks/algorithms";

test("Algorithms practice hub exposes only the three deliberate alternatives to Continue practice", () => {
  const modes = buildPracticeModes(getTrackDisplay("algorithms"));

  assert.deepEqual(
    modes.map(({ mode, title }) => ({ mode, title })),
    [
      { mode: ALGORITHM_MODE_IDS.weakAreaReview, title: "Weak Area Review" },
      { mode: ALGORITHM_MODE_IDS.independentPractice, title: "Mixed Practice" },
      { mode: ALGORITHM_MODE_IDS.interviewSimulation, title: "Interview Simulation" },
    ],
  );
});

test("Certification practice hub exposes every declared mode, including the canonical Exam Simulation", () => {
  const modes = buildPracticeModes(getTrackDisplay("cloud-certification"));

  assert.deepEqual(
    modes.map(({ mode, title }) => ({ mode, title })),
    [
      { mode: "certification-diagnostic-baseline", title: "Diagnostic Baseline" },
      { mode: "certification-focus-practice", title: "Focus Practice" },
      { mode: "certification-scenario-practice", title: "Scenario Practice" },
      { mode: "certification-weak-area-review", title: "Weak Area Review" },
      { mode: "certification-mixed-practice", title: "Mixed Practice" },
      { mode: "certification-quick-review", title: "Quick Review" },
      { mode: "certification-exam-simulation", title: "Exam Simulation" },
    ],
  );
});
