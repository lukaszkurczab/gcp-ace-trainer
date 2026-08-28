import assert from "node:assert/strict";
import test from "node:test";
import { STORAGE_KEYS } from "../keys";
test("canonical keys use the one Patternly namespace", () => { assert.equal(STORAGE_KEYS.METADATA, "patternly:canonical:v1:metadata"); assert.equal(STORAGE_KEYS.ACTIVE_TRACK, "patternly:canonical:v1:active-track"); assert.equal(STORAGE_KEYS.trainingAttempt("a"), "patternly:canonical:v1:training-attempt:a"); });
