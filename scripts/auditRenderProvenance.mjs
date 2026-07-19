import { createHash } from "node:crypto";
import { readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

import ts from "typescript";

export const AUDIT_PROVENANCE_MODULE_PATH = "scripts/auditRenderProvenance.mjs";
export const AUDIT_RENDER_ENTRYPOINTS = Object.freeze([
  "audit/algorithms-ui/index.ts",
  "audit/algorithms-ui/App.tsx",
  "audit/algorithms-ui/AlgorithmsVisualHarness.tsx",
  "audit/algorithms-ui/fixtureCatalog.ts",
]);
export const AUDIT_RENDER_FIXED_INPUTS = Object.freeze([
  "audit/algorithms-ui/app.json",
  "audit/algorithms-ui/metro.config.js",
]);

const MODULE_EXTENSIONS = Object.freeze([".ts", ".tsx", ".js", ".mjs", ".json", ".svg"]);
const PARSED_MODULE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs"]);

export function collectAuditRenderGraph(root, entrypoints = AUDIT_RENDER_ENTRYPOINTS) {
  const absoluteRoot = path.resolve(root);
  const realRoot = realpathSync(absoluteRoot);
  const pending = [...new Set(entrypoints)].sort();
  const visited = new Set();

  while (pending.length > 0) {
    const relativePath = pending.shift();
    if (visited.has(relativePath)) continue;
    const absolutePath = resolveRepositoryFile(absoluteRoot, realRoot, relativePath, `audit render entrypoint ${relativePath}`);
    visited.add(relativePath);
    if (!PARSED_MODULE_EXTENSIONS.has(path.extname(relativePath))) continue;

    const source = readFileSync(absolutePath, "utf8");
    for (const importedFile of ts.preProcessFile(source, true, true).importedFiles) {
      const specifier = importedFile.fileName;
      if (!isRelativeSpecifier(specifier)) continue;
      const dependency = resolveRelativeModule(absoluteRoot, realRoot, relativePath, specifier);
      if (!visited.has(dependency)) pending.push(dependency);
    }
    pending.sort();
  }

  return Object.freeze([...visited].sort());
}

export function canonicalAuditProvenancePaths(root, platformInputs) {
  const absoluteRoot = path.resolve(root);
  const realRoot = realpathSync(absoluteRoot);
  const canonicalPaths = [...new Set([
    AUDIT_PROVENANCE_MODULE_PATH,
    ...AUDIT_RENDER_FIXED_INPUTS,
    ...collectAuditRenderGraph(root),
    ...platformInputs,
  ])].sort();
  for (const relativePath of canonicalPaths) {
    resolveRepositoryFile(absoluteRoot, realRoot, relativePath, `audit provenance input ${relativePath}`);
  }
  return Object.freeze(canonicalPaths);
}

export function computeCanonicalAuditSourceSha256(root, platformInputs) {
  const hash = createHash("sha256");
  for (const relativePath of canonicalAuditProvenancePaths(root, platformInputs)) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(path.join(root, relativePath)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function resolveRelativeModule(root, realRoot, importer, specifier) {
  const unresolvedPath = path.resolve(path.dirname(path.join(root, importer)), specifier);
  assertInsideRepository(root, unresolvedPath, `relative import ${JSON.stringify(specifier)} from ${importer}`);
  const explicitExtension = path.extname(unresolvedPath);
  let candidates = [];
  const caseMismatches = [];

  if (explicitExtension) {
    if (!MODULE_EXTENSIONS.includes(explicitExtension)) {
      throw new Error(`Unsupported relative import extension ${JSON.stringify(explicitExtension)} in ${importer}: ${specifier}`);
    }
    collectCandidate(root, realRoot, unresolvedPath, candidates, caseMismatches);
  } else {
    for (const extension of MODULE_EXTENSIONS) {
      const fileCandidate = `${unresolvedPath}${extension}`;
      const indexCandidate = path.join(unresolvedPath, `index${extension}`);
      collectCandidate(root, realRoot, fileCandidate, candidates, caseMismatches);
      collectCandidate(root, realRoot, indexCandidate, candidates, caseMismatches);
    }
  }

  const relativeCandidates = [...new Set(candidates.map((candidate) => repositoryRelativePath(root, candidate)))].sort();
  if (relativeCandidates.length === 0 && caseMismatches.length > 0) {
    throw new Error(`Case mismatch in relative import ${JSON.stringify(specifier)} from ${importer}: ${[...new Set(caseMismatches)].sort().join("; ")}`);
  }
  if (relativeCandidates.length === 0) throw new Error(`Missing relative import ${JSON.stringify(specifier)} from ${importer}`);
  if (relativeCandidates.length > 1) {
    throw new Error(`Ambiguous relative import ${JSON.stringify(specifier)} from ${importer}; candidates: ${relativeCandidates.join(", ")}`);
  }
  return relativeCandidates[0];
}

function resolveRepositoryFile(root, realRoot, relativePath, description) {
  if (path.isAbsolute(relativePath)) throw new Error(`${description} must be repository-relative`);
  const absolutePath = path.resolve(root, relativePath);
  assertInsideRepository(root, absolutePath, description);
  const inspection = inspectRepositoryFile(root, realRoot, absolutePath);
  if (inspection.caseMismatch) throw new Error(`Case mismatch in ${description}: ${inspection.caseMismatch}`);
  if (!inspection.exists) throw new Error(`Missing ${description}`);
  return absolutePath;
}

function collectCandidate(root, realRoot, absolutePath, candidates, caseMismatches) {
  const inspection = inspectRepositoryFile(root, realRoot, absolutePath);
  if (inspection.caseMismatch) caseMismatches.push(inspection.caseMismatch);
  if (inspection.exists) candidates.push(absolutePath);
}

function inspectRepositoryFile(root, realRoot, absolutePath) {
  const relativePath = repositoryRelativePath(root, absolutePath);
  const segments = relativePath.split("/");
  let lexicalPath = root;
  for (const segment of segments) {
    const entries = readdirSync(lexicalPath);
    if (!entries.includes(segment)) {
      const caseMatches = entries.filter((entry) => entry.toLocaleLowerCase("en-US") === segment.toLocaleLowerCase("en-US"));
      return caseMatches.length > 0
        ? Object.freeze({ exists: false, caseMismatch: `${repositoryRelativePath(root, path.join(lexicalPath, segment))} must use ${caseMatches.sort().join(" or ")}` })
        : Object.freeze({ exists: false, caseMismatch: null });
    }
    lexicalPath = path.join(lexicalPath, segment);
    const realSegmentPath = realpathSync(lexicalPath);
    assertInsideRealRepository(realRoot, realSegmentPath, repositoryRelativePath(root, lexicalPath));
  }
  return Object.freeze({ exists: statSync(lexicalPath).isFile(), caseMismatch: null });
}

function isRelativeSpecifier(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

function assertInsideRepository(root, absolutePath, description) {
  const relativePath = path.relative(root, absolutePath);
  if (relativePath === "" || (relativePath !== ".." && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath))) return;
  throw new Error(`${description} resolves outside the repository`);
}

function assertInsideRealRepository(realRoot, realPath, description) {
  const relativePath = path.relative(realRoot, realPath);
  if (relativePath === "" || (relativePath !== ".." && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath))) return;
  throw new Error(`${description} resolves outside the real repository root`);
}

function repositoryRelativePath(root, absolutePath) {
  assertInsideRepository(root, absolutePath, absolutePath);
  return path.relative(root, absolutePath).split(path.sep).join("/");
}
