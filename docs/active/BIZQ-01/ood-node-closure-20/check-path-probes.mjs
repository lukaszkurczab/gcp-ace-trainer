import { cp, mkdtemp, mkdir, realpath, rename, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MigrationVerificationError, verifyMigration } from "../../../../../patternly-content/scripts/content/verify-migration.mjs";

const packetDirectory = path.dirname(fileURLToPath(import.meta.url));
const contentRepository = path.resolve(packetDirectory, "../../../../../patternly-content");
const temporaryParent = await realpath(await mkdtemp(path.join(os.tmpdir(), "ood20-path-probes-")));
const fixtureRoot = path.join(temporaryParent, "repo");
const proofRelative = "evidence/business-quality/bizq-01-ood-node-closure-20.json";
const sourceRelative = "content/object-oriented-design-interview/interfaces_polymorphism_substitution_and_extensibility/OOD-N04-B01.json";
const sourceDirectoryRelative = "content/object-oriented-design-interview/interfaces_polymorphism_substitution_and_extensibility";

async function expectedFailure(name, expectedCode) {
  try {
    await verifyMigration({ contentRoot: path.join(fixtureRoot, "content") });
    throw new Error(`${name}: verifier unexpectedly accepted the mutation`);
  } catch (error) {
    if (!(error instanceof MigrationVerificationError) || error.code !== expectedCode) {
      throw new Error(`${name}: expected ${expectedCode}; got ${error.code ?? error.name}: ${error.message}`);
    }
    return { name, expected: expectedCode, observed: error.code, stage: error.message.split(":", 2)[1]?.trim() };
  }
}

async function withMovedPath(target, name, mutate, expectedCode) {
  const held = path.join(temporaryParent, `${path.basename(target)}.ood20-probe-held`);
  await rename(target, held);
  try {
    await mutate(held, target);
    return await expectedFailure(name, expectedCode);
  } finally {
    await rm(target, { recursive: true, force: true });
    await rename(held, target);
  }
}

try {
  await cp(path.join(contentRepository, "content"), path.join(fixtureRoot, "content"), { recursive: true });
  await cp(path.join(contentRepository, "evidence"), path.join(fixtureRoot, "evidence"), { recursive: true });

  const results = [];
  results.push(await withMovedPath(
    path.join(fixtureRoot, proofRelative),
    "v20 proof directory",
    async (_held, target) => mkdir(target),
    "UNSAFE_PATH",
  ));
  results.push(await withMovedPath(
    path.join(fixtureRoot, sourceRelative),
    "N04 source directory",
    async (_held, target) => mkdir(target),
    "UNSAFE_PATH",
  ));
  results.push(await withMovedPath(
    path.join(fixtureRoot, sourceDirectoryRelative),
    "N04 source symlink ancestor",
    async (held, target) => symlink(held, target),
    "SYMLINK_PATH",
  ));
  results.push(await withMovedPath(
    path.join(fixtureRoot, "evidence/business-quality"),
    "proof symlink ancestor",
    async (held, target) => symlink(held, target),
    "SYMLINK_PATH",
  ));

  process.stdout.write(`${JSON.stringify({ verdict: "PASS", cases: results }, null, 2)}\n`);
} finally {
  await rm(temporaryParent, { recursive: true, force: true });
}
