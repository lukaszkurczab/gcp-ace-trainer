import assert from "node:assert/strict";
import test from "node:test";

import { findLegacyContentIdentityLeaks } from "./validateContentBoundary.mjs";

test("content boundary rejects legacy identity types and fields in active runtime code", () => {
  const failures = findLegacyContentIdentityLeaks([{
    path: "/workspace/src/content/canonical/questionCatalog.ts",
    source: `
      import type { ContentPackagePin } from "legacy";
      const packagePin = contentPackagePin;
      export const catalog = { packagePin };
      const serialized = { "contentPackagePin": packagePin };
    `,
  }]);

  assert.equal(failures.length, 1);
  assert.match(failures[0], /ContentPackagePin/u);
  assert.match(failures[0], /packagePin/u);
  assert.match(failures[0], /contentPackagePin/u);
});

test("content boundary permits legacy shape only at private migration and report transport boundaries", () => {
  const failures = findLegacyContentIdentityLeaks([
    {
      path: "/workspace/src/domain/learning/legacyContentIdentityMapper.ts",
      source: "type ContentPackagePin = { packagePin: unknown; contentPackagePin: unknown };",
    },
    {
      path: "/workspace/src/infrastructure/clients/PatternlyApiClientAdapter.ts",
      source: "const payload = { packagePin, contentPackagePin };",
    },
  ]);

  assert.deepEqual(failures, []);
});

test("content boundary permits quoted legacy keys used only by fail-closed rejection guards", () => {
  const failures = findLegacyContentIdentityLeaks([{
    path: "/workspace/src/domain/learning/resolvedContentRef.ts",
    source: `
      const keys = new Set(["packagePin", "contentPackagePin"]);
      if (key === "packagePin") return true;
    `,
  }]);

  assert.deepEqual(failures, []);
});
