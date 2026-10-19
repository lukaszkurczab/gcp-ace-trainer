import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { verifyBundledCurrentContent } from "./verifyBundledCurrentContent.mjs";
import { syncCanonicalContent } from "./syncBundledContentRelease.mjs";

const appRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

export async function prepareEasBuild(argv = process.argv.slice(2), options = {}) {
  const prepareOnly = argv[0] === "--prepare-only";
  const easArgs = prepareOnly ? argv.slice(1) : argv;
  const applicationRoot = options.applicationRoot ?? appRoot;
  const contentRoot = options.contentRoot ?? process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(applicationRoot, "../patternly-content");
  const sync = options.sync ?? syncCanonicalContent;
  const verify = options.verify ?? verifyBundledCurrentContent;
  const expectedContentCommit = process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA;
  const actualContentCommit = await (options.getContentHead ?? (() => execFileSync("git", ["-C", contentRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()))(contentRoot);
  if (expectedContentCommit && actualContentCommit !== expectedContentCommit) throw new Error("Selected content checkout HEAD differs from the expected exact SHA.");
  await sync({ mode: "sync", appRoot: applicationRoot, producerRoot: contentRoot });
  const bundle = await verify({ root: applicationRoot });
  if (bundle.sourceRepositoryCommit !== actualContentCommit) throw new Error("Prepared APP bundle does not identify the selected exact content checkout.");
  if (prepareOnly) return { prepared: true, bundle };
  const child = (options.spawn ?? spawn)(options.command ?? "npx", ["eas", "build", ...easArgs], { cwd: applicationRoot, env: process.env, stdio: "inherit" });
  return await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ prepared: true, bundle, code: code ?? 1, signal }));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareEasBuild().then((result) => {
    if (result.code !== undefined) process.exitCode = result.code;
    process.stdout.write(`EAS_BUILD_INPUT=prepared sourceCommit=${result.bundle.sourceRepositoryCommit} fingerprint=${result.bundle.sourceInputFingerprint} tracks=${result.bundle.trackCount}\n`);
  }).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
