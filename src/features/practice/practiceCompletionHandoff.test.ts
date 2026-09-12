import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
test("practice completion handoff retains canonical question identity",async()=>{const c=await loadCanonicalRuntimeCatalog();const t=c.getTrack(c.tracks[0]!);const q=t.questions[0]!;assert.equal(t.getQuestion(q.questionId)?.questionId,q.questionId);});
