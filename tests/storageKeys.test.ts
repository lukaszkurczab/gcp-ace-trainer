import assert from "node:assert/strict";
import test from "node:test";
import { STORAGE_KEYS } from "../src/storage";
test("canonical keys use the one Patternly namespace", () => { assert.equal(STORAGE_KEYS.ACTIVE_TRACK, "patternly:v1:active-track"); assert.equal(STORAGE_KEYS.trainingAttempt("a"), "patternly:v1:training-attempt:a"); assert.equal(STORAGE_KEYS.contentVersion("algorithms", "v1"), "patternly:v1:content:version:algorithms:v1"); });
