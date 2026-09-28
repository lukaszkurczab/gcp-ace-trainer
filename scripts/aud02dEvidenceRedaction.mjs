import { randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { lstat, open, readdir, realpath, rename, unlink } from "node:fs/promises";
import path from "node:path";

const REDACTED = Buffer.from("[redacted]");

export function redactExactBytes(bytes, secrets) {
  return redactBytes(bytes, secretBuffers(secrets));
}

export function snapshotForEvidence(manifest, secrets) {
  const serialized = Buffer.from(JSON.stringify(manifest));
  return JSON.parse(redactExactBytes(serialized, secrets).toString("utf8"));
}

function redactBytes(bytes, secrets) {
  let output = Buffer.from(bytes);
  for (const secret of secrets) {
    const chunks = [];
    let offset = 0;
    let match;
    while ((match = output.indexOf(secret, offset)) !== -1) {
      chunks.push(output.subarray(offset, match), REDACTED);
      offset = match + secret.length;
    }
    if (offset > 0) {
      chunks.push(output.subarray(offset));
      output = Buffer.concat(chunks);
    }
  }
  return output;
}

export async function sanitizeAndScanOutputRoot(root, secrets) {
  const secretBytes = secretBuffers(secrets);
  const absoluteRoot = path.resolve(root);
  let canonicalRoot;
  try { canonicalRoot = await realpath(absoluteRoot); }
  catch { throw new Error("AUD-02D output root could not be resolved."); }
  const findings = { unredactedFiles: false, unsafeEntries: false };
  await visit(absoluteRoot, canonicalRoot, secretBytes, findings);
  if (findings.unredactedFiles || findings.unsafeEntries) {
    const reasons = [findings.unredactedFiles && "unredacted credentials", findings.unsafeEntries && "symbolic links or other unsafe entries"].filter(Boolean).join(" and ");
    throw new Error(`AUD-02D output scan failed: ${reasons}; unsafe files were removed.`);
  }
}

export async function assertOutputRootIsRealDirectory(root) {
  const info = await lstat(path.resolve(root));
  if (info.isSymbolicLink() || !info.isDirectory()) throw new Error("AUD-02D output root must be a real directory.");
}

function secretBuffers(secrets) {
  return [...new Set(secrets.filter((secret) => typeof secret === "string" && secret.length > 0))]
    .map((secret) => Buffer.from(secret, "utf8"))
    .sort((left, right) => right.length - left.length);
}

async function visit(directory, canonicalRoot, secrets, findings) {
  const beforeRead = await inspectDirectory(directory, canonicalRoot);
  if (!beforeRead) { findings.unsafeEntries = true; return; }
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch { findings.unsafeEntries = true; return; }
  const afterRead = await inspectDirectory(directory, canonicalRoot);
  if (!afterRead || !sameDirectoryIdentity(beforeRead, afterRead)) { findings.unsafeEntries = true; return; }

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const filePath = path.join(directory, entry.name);
    let info;
    try { info = await lstat(filePath); }
    catch { findings.unsafeEntries = true; continue; }
    if (info.isSymbolicLink()) { findings.unsafeEntries = true; continue; }
    if (info.isDirectory()) {
      await visit(filePath, canonicalRoot, secrets, findings);
      continue;
    }
    if (!info.isFile()) { findings.unsafeEntries = true; continue; }
    let handle;
    let bytes;
    let openedInfo;
    let readFailed = false;
    try {
      handle = await open(filePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
      openedInfo = await handle.stat();
      if (!openedInfo.isFile() || !sameFileIdentity(info, openedInfo)) { findings.unsafeEntries = true; readFailed = true; }
      if (readFailed) continue;
      bytes = await handle.readFile();
    } catch {
      findings.unsafeEntries = true;
      readFailed = true;
    } finally {
      try { await handle?.close(); } catch { findings.unsafeEntries = true; }
    }
    if (readFailed) continue;
    let pathAfterRead;
    try { pathAfterRead = await lstat(filePath); }
    catch { findings.unsafeEntries = true; continue; }
    if (pathAfterRead.isSymbolicLink() || !sameFileIdentity(openedInfo, pathAfterRead)) { findings.unsafeEntries = true; continue; }
    const redacted = [".json", ".log"].includes(path.extname(filePath)) ? redactBytes(bytes, secrets) : bytes;
    if (containsSecret(redacted, secrets)) {
      try { await unlink(filePath); }
      catch { findings.unsafeEntries = true; }
      findings.unredactedFiles = true;
      continue;
    }
    if (!redacted.equals(bytes)) {
      try { await replaceAtomically(filePath, redacted, info.mode & 0o777); }
      catch { findings.unsafeEntries = true; }
    }
  }
}

async function inspectDirectory(directory, canonicalRoot) {
  try {
    const before = await lstat(directory);
    if (before.isSymbolicLink() || !before.isDirectory()) return null;
    const resolved = await realpath(directory);
    const after = await lstat(directory);
    if (after.isSymbolicLink() || !after.isDirectory() || !sameDirectoryIdentity(before, after)) return null;
    const resolvedInfo = await lstat(resolved);
    if (resolvedInfo.isSymbolicLink() || !resolvedInfo.isDirectory() || !sameDirectoryIdentity(after, resolvedInfo)) return null;
    const relative = path.relative(canonicalRoot, resolved);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
    return { ...after, resolved };
  } catch {
    return null;
  }
}

function sameDirectoryIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.resolved === right.resolved;
}

function sameFileIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function containsSecret(bytes, secrets) {
  return secrets.some((secret) => bytes.indexOf(secret) !== -1);
}

async function replaceAtomically(filePath, bytes, mode) {
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  let handle;
  try {
    handle = await open(temporaryPath, "wx", mode);
    await handle.writeFile(bytes);
    await handle.close();
    handle = undefined;
    await rename(temporaryPath, filePath);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}
