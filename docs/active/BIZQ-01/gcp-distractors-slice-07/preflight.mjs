import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MigrationVerificationError, verifyMigration } from "../../../../../patternly-content/scripts/content/verify-migration.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const contentRepository = path.resolve(here, "../../../../../patternly-content");
const proposalPath = path.join(here, "PROPOSAL.json");
const sourceRelativePath = "content/google-cloud-associate-cloud-engineer/organization_projects_policies_services_quotas_and_assets/GCPACE-N01-B02.json";
const questionId = "gcp-ace-gcpace-n01-b02-001";

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const tempParent = await realpath(await mkdtemp(path.join(os.tmpdir(), "bizq01-gcp-distractor-proof-")));
  const fixtureRoot = path.join(tempParent, "repo");
  const contentRoot = path.join(fixtureRoot, "content");

  try {
    await mkdir(fixtureRoot, { recursive: true });
    await Promise.all([
      cp(path.join(contentRepository, "content"), contentRoot, { recursive: true }),
      cp(path.join(contentRepository, "evidence"), path.join(fixtureRoot, "evidence"), { recursive: true })
    ]);

    const baseline = await verifyMigration({ contentRoot });
    assert.equal(baseline.result, "passed");

    const proposal = JSON.parse(await readFile(proposalPath, "utf8"));
    const sourcePath = path.join(fixtureRoot, sourceRelativePath);
    const questions = JSON.parse(await readFile(sourcePath, "utf8"));
    const index = questions.findIndex((question) => question.questionId === questionId);
    assert.notEqual(index, -1, `Expected ${questionId} in copied source fixture.`);
    questions[index] = proposal.proposedQuestion;
    await writeJson(sourcePath, questions);

    const catalogPath = path.join(contentRoot, "catalog.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    const track = catalog.tracks.find((entry) => entry.trackId === proposal.trackId);
    assert.ok(track, `Expected ${proposal.trackId} in copied catalog.`);
    track.contentVersion = proposal.proposedContentVersion;
    await writeJson(catalogPath, catalog);

    try {
      await verifyMigration({ contentRoot });
      throw new Error("Expected the current migration verifier to reject the proposed GCP correction.");
    } catch (error) {
      if (!(error instanceof MigrationVerificationError)) throw error;
      assert.equal(error.code, "HASH_MISMATCH");
      console.log(JSON.stringify({
        baseline: baseline.result,
        changedFixture: "one copied GCP question plus its catalog contentVersion",
        verifierResult: "rejected",
        errorCode: error.code,
        errorMessage: error.message
      }, null, 2));
    }
  } finally {
    await rm(tempParent, { recursive: true, force: true });
  }
}

await main();
