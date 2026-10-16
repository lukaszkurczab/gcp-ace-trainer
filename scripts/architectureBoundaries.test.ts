import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { checkRepository, formatViolations } from "./architecture/checkBoundaries";

// These are dependency contracts. Runtime behavior has separate owner tests.
for (const [platform, mode] of [["typescript", "release"], ["ios", "release"], ["ios", "smoke"], ["android", "release"], ["android", "smoke"]] as const) {
  test(`resolved architecture boundaries: ${platform}/${mode}`, () => {
    const { graph, violations } = checkRepository(process.cwd(), platform, mode);
    if (platform !== "typescript") assert.equal(graph.resolveModule("./src/testing/Perf06ListFixtureRoot", join(graph.root, "App.tsx"), "runtime"), join(graph.root, `src/testing/Perf06ListFixtureRoot.${mode === "smoke" ? "smoke" : "disabled"}.tsx`));
    assert.deepEqual(violations, [], formatViolations(violations));
  });
}
