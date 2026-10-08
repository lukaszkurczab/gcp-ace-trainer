#!/usr/bin/env node
import { chmodSync, copyFileSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const categories = ["learningProgress", "settings", "profileLifecycle", "packagePointers", "premiumCache", "premiumTestRuntime"];
const flow = resolve(dirname(fileURLToPath(import.meta.url)), "../.maestro/q13-readonly-scroll.yaml");
const maxPasses = 24;
const childTimeoutMs = 60_000;
process.umask(0o077);

function argsOf(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!["--device", "--output", "--initial-hierarchy"].includes(key) || !argv[i + 1] || argv[i + 1].startsWith("--")) throw Error("arguments_invalid");
    result[key] = argv[++i];
  }
  if (!result["--device"] || !result["--output"]) throw Error("arguments_missing");
  return result;
}

function receiptRows(tree) {
  const rows = new Map();
  const visit = (node) => {
    const a = node?.attributes ?? {};
    const id = a["resource-id"] ?? "";
    if (id.startsWith("patternly:q13:")) {
      const text = a.accessibilityText || a.text || "";
      if (rows.has(id) && rows.get(id) !== text) throw Error("duplicate_id_text_changed");
      rows.set(id, text);
    }
    for (const child of node?.children ?? []) visit(child);
  };
  visit(tree);
  return rows;
}

function inventoryTarget(rows) {
  const header = rows.get("patternly:q13:inventory") ?? "";
  const match = /Inventory: \d+ physical keys; (\d+) registered profiles; SHA-256 [a-f0-9]{64}/u.exec(header);
  if (!match) return { count: null, profileIds: [] };
  const profileIds = [...rows.keys()].flatMap((id) => {
    const m = /^patternly:q13:profile-inventory:([a-f0-9]{64})$/u.exec(id);
    return m ? [m[1]] : [];
  });
  return { count: Number(match[1]), profileIds };
}

function missingRequirements(rows) {
  const { count, profileIds } = inventoryTarget(rows);
  const missing = [];
  if (count === null || profileIds.length !== count) missing.push("profile_rows");
  for (const profileId of profileIds) for (const category of categories) {
    if (!rows.has(`patternly:q13:profile-category-inventory:${profileId}:${category}`)) missing.push("profile_categories");
  }
  for (const id of ["control-inventory", "secure-control-inventory", "packages", "actor", "secure-store", "close"]) {
    if (!rows.has(`patternly:q13:${id}`)) missing.push(id);
  }
  for (const category of ["premium_cache", "premium_test_runtime"]) {
    if (![...rows.keys()].some((id) => id.startsWith(`patternly:q13:global-inventory:${category}`))) missing.push("global_rows");
  }
  return [...new Set(missing)];
}

function writePrivate(path, data) {
  writeFileSync(path, data, { mode: 0o600 });
  chmodSync(path, 0o600);
}

function restrictTree(path) {
  chmodSync(path, 0o700);
  for (const entry of readdirSync(path)) {
    const child = join(path, entry);
    const stat = lstatSync(child);
    if (stat.isSymbolicLink()) throw Error("artifact_symlink_found");
    if (stat.isDirectory()) restrictTree(child);
    else chmodSync(child, 0o600);
  }
}

function main() {
  let out;
  let createdOutput = false;
  let state = "failed";
  let stage = "arguments";
  const rows = new Map();
  let errorCategory = null;
  try {
    const options = argsOf(process.argv.slice(2));
    out = resolve(options["--output"]);
    mkdirSync(out, { mode: 0o700 });
    createdOutput = true;
    chmodSync(out, 0o700);
    stage = "capture";
    if (options["--initial-hierarchy"]) {
      const initialPath = resolve(options["--initial-hierarchy"]);
      copyFileSync(initialPath, resolve(out, "hierarchy-000-initial.json"));
      chmodSync(resolve(out, "hierarchy-000-initial.json"), 0o600);
      const found = receiptRows(JSON.parse(readFileSync(initialPath, "utf8")));
      for (const [id, text] of found) rows.set(id, text);
    }
    let complete = false;
    for (let pass = 1; pass <= maxPasses; pass += 1) {
      stage = "hierarchy";
      const hierarchy = spawnSync("maestro", ["--device", options["--device"], "hierarchy"], { encoding: "utf8", timeout: childTimeoutMs });
      if (hierarchy.error || hierarchy.status !== 0) throw Error(hierarchy.error?.code === "ETIMEDOUT" ? "hierarchy_timeout" : "hierarchy_command_failed");
      writePrivate(resolve(out, `hierarchy-${String(pass).padStart(3, "0")}.json`), hierarchy.stdout);
      const found = receiptRows(JSON.parse(hierarchy.stdout));
      for (const [id, text] of found) {
        if (rows.has(id) && rows.get(id) !== text) throw Error("same_id_text_changed");
        rows.set(id, text);
      }
      const missing = missingRequirements(rows);
      process.stdout.write(`stage=hierarchy pass=${pass} rows=${rows.size}\n`);
      if (!missing.length && found.has("patternly:q13:secure-store") && found.has("patternly:q13:close")) { complete = true; break; }
      if (pass === maxPasses) { errorCategory = "scroll_limit_incomplete"; break; }
      stage = "scroll";
      const artifacts = resolve(out, `maestro-artifacts/pass-${String(pass).padStart(3, "0")}`);
      mkdirSync(artifacts, { recursive: true, mode: 0o700 });
      const scroll = spawnSync("maestro", ["--device", options["--device"], "test", "--test-output-dir", artifacts, flow], { encoding: "utf8", timeout: childTimeoutMs });
      restrictTree(artifacts);
      writePrivate(resolve(out, `scroll-${String(pass).padStart(3, "0")}.stdout.txt`), scroll.stdout ?? "");
      writePrivate(resolve(out, `scroll-${String(pass).padStart(3, "0")}.stderr.txt`), scroll.stderr ?? "");
      if (scroll.error || scroll.status !== 0) throw Error(scroll.error?.code === "ETIMEDOUT" ? "scroll_timeout" : "scroll_flow_failed");
    }
    state = complete ? "complete" : "incomplete";
    if (!complete && !errorCategory) errorCategory = "required_rows_missing";
  } catch (error) {
    errorCategory ??= error.message === "same_id_text_changed" || error.message === "duplicate_id_text_changed" ? "same_id_text_changed" : error.message === "hierarchy_timeout" ? "hierarchy_timeout" : error.message === "hierarchy_command_failed" ? "hierarchy_command_failed" : error.message === "scroll_timeout" ? "scroll_timeout" : error.message === "scroll_flow_failed" ? "scroll_flow_failed" : error.message === "arguments_invalid" || error.message === "arguments_missing" ? "arguments_invalid" : "capture_failed";
  }
  if (createdOutput) {
    const inv = inventoryTarget(rows);
    const receipt = { complete: state === "complete", status: state, errorCategory, observedProfileCount: inv.profileIds.length, declaredProfileCount: inv.count, sanitizedRows: [...rows].map(([resourceId, text]) => ({ resourceId, text })) };
    try { writePrivate(resolve(out, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`); } catch { state = "failed"; errorCategory = "receipt_write_failed"; }
  }
  const count = rows.size;
  process.stdout.write(`stage=${stage} status=${state} rows=${count} output=${out ?? "unavailable"}\n`);
  process.exitCode = state === "complete" ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { inventoryTarget, missingRequirements, receiptRows };
