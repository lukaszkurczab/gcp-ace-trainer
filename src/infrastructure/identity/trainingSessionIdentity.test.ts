import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { setIdentityNonceGeneratorForTests } from "./identityNonceShared";
import { trainingSessionIdentity } from "./trainingSessionIdentity";
test("session identity is anchored to canonical track, version, and artifact SHA",async()=>{const c=await loadCanonicalRuntimeCatalog();const t=c.getTrack(c.tracks[0]!);assert.match(t.artifactSha256,/^[a-f0-9]{64}$/u);assert.equal(c.getTrack(t.trackId),t);assert.equal("getTrackByPin" in c,false);});
test("training session identity keeps its established track/mode/UUID format through the shared entropy owner", async () => {
  setIdentityNonceGeneratorForTests(() => "123e4567-e89b-42d3-a456-426614174000");
  try {
    assert.equal(await trainingSessionIdentity.create({ trackId: "certification-google-cloud-associate", modeId: "focus" }), "certification-google-cloud-associate:focus:123e4567-e89b-42d3-a456-426614174000");
  } finally {
    setIdentityNonceGeneratorForTests(null);
  }
});
test("training session identity keeps its explicit failure contract when secure entropy fails", async () => {
  setIdentityNonceGeneratorForTests(() => { throw new Error("injected"); });
  try {
    await assert.rejects(() => trainingSessionIdentity.create({ trackId: "certification-google-cloud-associate", modeId: "focus" }), /Training session identity generation failed/u);
  } finally {
    setIdentityNonceGeneratorForTests(null);
  }
});
