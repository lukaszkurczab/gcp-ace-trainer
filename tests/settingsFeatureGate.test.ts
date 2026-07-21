import assert from "node:assert/strict";
import test from "node:test";

import {
  throwSettingsFeatureNotImplemented,
  type DeferredSettingsFeature,
} from "../src/features/home/settingsFeatureGate";

const deferredFeatures: readonly DeferredSettingsFeature[] = [
  "feedback",
  "subscription",
];

test("every deferred Settings entry fails loudly with its stable feature identifier", () => {
  for (const feature of deferredFeatures) {
    assert.throws(
      () => throwSettingsFeatureNotImplemented(feature),
      new RegExp(`SETTINGS_FEATURE_NOT_IMPLEMENTED: ${feature}`),
    );
  }
});
