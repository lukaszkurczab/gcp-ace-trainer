import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "./canonical/runtimeCatalog";
import { getProductSimulationModeConfig } from "./canonical/productModeConfig";
test("canonical admission exposes nine launch tracks", async () => { const c=await loadCanonicalRuntimeCatalog(); assert.equal(c.tracks.length,9); for(const id of c.tracks) assert.ok(c.getTrack(id).modes.length>0); });
test("Coding Mock stays outside ordinary modes and resolves its exact declared profile", async () => {
  const c = await loadCanonicalRuntimeCatalog();
  const track = c.getTrack("coding-interview-dsa-problem-solving");
  assert.throws(() => track.getMode("coding-interview-simulation"), /unavailable/);
  const simulation = getProductSimulationModeConfig(track.trackId, track.simulationProfiles);
  assert.equal(simulation.config.modeId, "coding-interview-simulation");
  assert.equal(simulation.profile.profileId, "algorithms-interview-simulation-v1");
  if (simulation.profile.familyId !== "coding_interview") throw new Error("Expected the Coding Interview profile.");
  assert.equal(simulation.profile.familyConfig.eligibleQuestionIds.length, 40);
});
