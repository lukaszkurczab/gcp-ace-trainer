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
