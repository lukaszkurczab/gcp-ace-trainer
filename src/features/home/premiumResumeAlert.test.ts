import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/HomeScreen.tsx", "utf8");

test("Home explains Premium denial and unavailable access only for typed resume failures", () => {
  assert.match(source, /import \{ TrainingApplicationFailure \} from "\.\.\/\.\.\/application\/trainingLifecycle\/contracts"/);

  const catchBlock = source.match(/\} catch \(error\) \{([\s\S]*?)\n    \}\n  \}\n\n  async function handleHomePlanAction/)?.[1];
  assert.ok(catchBlock, "recommendation action keeps a single explicit failure boundary");
  assert.match(catchBlock, /action\.kind === "resume_certification_practice"/);
  assert.match(catchBlock, /action\.kind === "resume_design_interview"/);
  assert.match(catchBlock, /action\.kind === "resume_active_practice"/);
  assert.match(catchBlock, /error instanceof TrainingApplicationFailure/);
  assert.match(catchBlock, /error\.code === "premium_entitlement_denied"/);
  assert.match(catchBlock, /error\.code === "premium_entitlement_unavailable"/);
  assert.match(catchBlock, /tLearningPlan\(denied \? "Premium access required" : "Premium access unavailable"\)/);
  assert.match(catchBlock, /"Your session and saved answers are preserved\. Premium access is required to resume\."/);
  assert.match(catchBlock, /"Your session and saved answers are preserved\. Premium access could not be verified\. Try again\."/);
  assert.match(catchBlock, /return;/);
  assert.match(catchBlock, /Alert\.alert\("Recommendation unavailable", describeOperationalFailure\(error, "The recommended session could not be opened\."\)\)/);
  assert.doesNotMatch(catchBlock, /error\.(?:message|stack)/);
});
