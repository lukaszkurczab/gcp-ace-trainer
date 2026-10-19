import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureAtlas, defaultWorkspace, render, safePath, scan } from './atlas.mjs';

const HEADER = '<!-- patternly-atlas:generated-v1 -->';
const SCHEMA = 'patternly-atlas-retirement-v1';
const sha = value => createHash('sha256').update(value).digest('hex');
const canonical = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const digest = value => sha(canonical(value));
const read = path => readFileSync(path, 'utf8');
const fail = category => { throw new Error(`atlas-retirement/${category}`); };
const journalPath = workspace => safePath(workspace, 'patternly/.agent/private/docAtlas-retirement/journal.json');
const indexPath = workspace => safePath(workspace, 'patternly/scripts/docAtlas/atlas-index.json');

function atomic(path, text) {
  const temporary = `${path}.tmp-${randomUUID()}`;
  writeFileSync(temporary, text, { flag: 'wx', mode: 0o600 });
  renameSync(temporary, path);
}

function ownerAlive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; }
}

function inputs(workspace, vault) {
  workspace = realpathSync(workspace);
  vault = realpathSync(vault ?? process.env.PATTERNLY_VAULT_ROOT ?? resolve(workspace, '../../Vaults/Patternly'));
  const catalogText = read(safePath(workspace, 'patternly/scripts/docAtlas/catalog.json'));
  const capture = captureAtlas(scan(workspace), catalogText);
  // Private journal/boundary creation cannot change the source inventory binding.
  const source = Object.fromEntries(Object.entries(capture.snapshot.repositories).map(([repo, data]) =>
    [repo, { files: data.files, folders: data.folders }]));
  return { workspace, vault, capture, notes: render(capture.snapshot, capture.catalog), catalogSha256: sha(catalogText), sourceSha256: digest(source) };
}

function noteIdentity(text) {
  const kind = text.match(/^atlas_kind: (folder|file)$/mu)?.[1];
  const repo = text.match(/^repo: ([\w-]+)$/mu)?.[1];
  let sourcePath;
  try { sourcePath = JSON.parse(text.match(/^source_path: (.+)$/mu)?.[1]); } catch { fail('invalid-note-identity'); }
  if (!text.includes(HEADER) || !kind || !['patternly', 'patternly-content', 'patternly-backend', 'patternly-web'].includes(repo) || typeof sourcePath !== 'string') fail('invalid-note-identity');
  return { kind, repo, sourcePath };
}

function verifyRow(state, before, row, allowMissing = false) {
  if (!row || typeof row.path !== 'string' || !row.path.startsWith('Atlas/Struktura/') || before.notes[row.path] !== row.sha256 || Object.hasOwn(state.notes, row.path)) fail('unapproved-or-live-note');
  const path = safePath(state.vault, row.path);
  if (!existsSync(path)) { if (allowMissing) return; fail('missing-note-before-retirement'); }
  const info = lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink()) fail('nonregular-note');
  const text = read(path);
  if (sha(text) !== row.sha256 || canonical(noteIdentity(text)) !== canonical({ kind: row.kind, repo: row.repo, sourcePath: row.sourcePath })) fail('edited-or-rebound-note');
}

export function prepareRetirement({ workspace = defaultWorkspace, vault } = {}) {
  const state = inputs(workspace, vault);
  if (existsSync(journalPath(state.workspace))) fail('pending-journal-resume-required');
  const beforeText = read(indexPath(state.workspace));
  const before = JSON.parse(beforeText);
  const rows = Object.keys(before.notes).filter(path => !Object.hasOwn(state.notes, path)).sort().map(path => {
    const text = read(safePath(state.vault, path));
    const row = { path, sha256: before.notes[path], ...noteIdentity(text) };
    verifyRow(state, before, row);
    return row;
  });
  return { schemaVersion: SCHEMA, workspace: state.workspace, vault: state.vault, indexSha256: sha(beforeText), catalogSha256: state.catalogSha256, sourceSha256: state.sourceSha256, rows };
}

/** Retire only the reviewed unchanged generated notes. Normal rendering remains a separate guarded step. */
export function applyRetirement(plan, { workspace = defaultWorkspace, vault, onRowRetired = () => {} } = {}) {
  const state = inputs(workspace, vault);
  if (plan?.schemaVersion !== SCHEMA || plan.workspace !== state.workspace || plan.vault !== state.vault || !Array.isArray(plan.rows)) fail('invalid-plan');
  const activePath = journalPath(state.workspace);
  let journal;
  if (existsSync(activePath)) {
    journal = JSON.parse(read(activePath));
    if (journal.planDigest !== digest(plan) || digest(journal.plan) !== journal.planDigest) fail('journal-plan-conflict');
    if (ownerAlive(journal.ownerPid)) fail('live-owner');
  } else {
    if (digest(prepareRetirement({ workspace: state.workspace, vault: state.vault })) !== digest(plan)) fail('stale-plan');
    const beforeText = read(indexPath(state.workspace));
    const before = JSON.parse(beforeText);
    const pruned = structuredClone(before);
    for (const row of plan.rows) delete pruned.notes[row.path];
    journal = { planDigest: digest(plan), plan, beforeText, prunedText: `${JSON.stringify(pruned, null, 2)}\n`, ownerPid: null, token: randomUUID() };
  }
  if (sha(journal.beforeText) !== plan.indexSha256 || state.catalogSha256 !== plan.catalogSha256 || state.sourceSha256 !== plan.sourceSha256) fail('changed-baseline-or-source');
  const before = JSON.parse(journal.beforeText);
  const expected = structuredClone(before);
  for (const row of plan.rows) delete expected.notes[row.path];
  if (`${JSON.stringify(expected, null, 2)}\n` !== journal.prunedText) fail('invalid-pruned-index');
  const currentIndex = read(indexPath(state.workspace));
  if (currentIndex !== journal.beforeText && currentIndex !== journal.prunedText) fail('concurrent-index-change');
  const expectedRows = Object.keys(before.notes).filter(path => !Object.hasOwn(state.notes, path)).sort();
  if (canonical(expectedRows) !== canonical(plan.rows.map(row => row.path))) fail('incomplete-or-extra-plan');
  const prunedAlready = currentIndex === journal.prunedText;
  for (const row of plan.rows) verifyRow(state, before, row, prunedAlready);
  if (!plan.rows.length) return { retiredNotes: 0 };
  mkdirSync(dirname(activePath), { recursive: true, mode: 0o700 });
  safePath(state.workspace, 'patternly/.agent/private/docAtlas-retirement/journal.json');
  journal.ownerPid = process.pid;
  if (!existsSync(activePath)) writeFileSync(activePath, `${JSON.stringify(journal)}\n`, { flag: 'wx', mode: 0o600 });
  else atomic(activePath, `${JSON.stringify(journal)}\n`);
  try {
    // Recheck every row and the accepted index before the first mutation.
    for (const row of plan.rows) verifyRow(state, before, row, prunedAlready);
    if (read(indexPath(state.workspace)) !== currentIndex) fail('concurrent-index-change');
    if (!prunedAlready) atomic(indexPath(state.workspace), journal.prunedText);
    for (const row of plan.rows) {
      verifyRow(state, before, row, true);
      const target = safePath(state.vault, row.path);
      if (existsSync(target)) unlinkSync(target);
      onRowRetired(row);
    }
    if (read(indexPath(state.workspace)) !== journal.prunedText) fail('concurrent-index-change');
    unlinkSync(activePath);
    return { retiredNotes: plan.rows.length, next: 'Run the canonical Atlas build after source and narrative review.' };
  } catch (error) {
    if (existsSync(activePath) && JSON.parse(read(activePath)).token === journal.token) {
      journal.ownerPid = null;
      atomic(activePath, `${JSON.stringify(journal)}\n`);
    }
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, planFile] = process.argv.slice(2);
    if (command === 'preview' && !planFile) console.log(JSON.stringify(prepareRetirement(), null, 2));
    else if (command === 'apply' && planFile) console.log(JSON.stringify(applyRetirement(JSON.parse(read(resolve(planFile))))));
    else fail('usage: preview | apply <reviewed-plan.json>');
  } catch (error) {
    console.error(error.message?.startsWith('atlas-retirement/') ? error.message : 'atlas-retirement/operation-failed; preserve journal and inspect permissions');
    process.exitCode = 1;
  }
}
