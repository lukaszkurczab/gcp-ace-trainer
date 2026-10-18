import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import test from 'node:test';
import { affectedFlows, flowDigest, roleFor, compare, render, repositories, safePath, scan, writeAtlas, checkNotes, checkGraph, folderNote, fileNote, checkNameCollisions, runAtlas, captureAtlas } from './atlas.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'patternly-atlas-contract-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path, content) => { const target = join(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, content); };
  for (const repo of repositories) {
    mkdirSync(join(root, repo));
    execFileSync('git', ['init', '-q', join(root, repo)]);
    put(`${repo}/.gitignore`, 'private/\nnode_modules/\n.env.local\n');
    put(`${repo}/package.json`, '{"name":"fixture","private":true}\n');
    put(`${repo}/src/index.ts`, 'export { run } from "./worker";\n');
    put(`${repo}/src/worker.ts`, 'export function run() { return 42; }\n');
    execFileSync('git', ['-C', join(root, repo), 'add', '.']);
    execFileSync('git', ['-C', join(root, repo), '-c', 'user.name=Atlas Fixture', '-c', 'user.email=atlas@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture']);
  }
  return { root, put };
}

test('real Git worktree scan includes dirty/new files and classifies ignored boundaries without reading secrets or following symlinks', t => {
  const { root, put } = fixture(t);
  put('patternly/.env.local', 'SECRET=do-not-copy');
  put('patternly/private/evidence.json', '{"private":"do-not-copy"}');
  put('patternly/src/excluded.ts', 'import "../private/evidence.json";');
  put('patternly/node_modules/pkg/index.js', 'do-not-copy');
  put('patternly/src/new.ts', 'export const added = 1;\n');
  put('patternly/src/worker.test.ts', 'test("rejects duplicate writes for admin@example.invalid", () => {});\n');
  symlinkSync(join(root, 'patternly/private'), join(root, 'patternly/src/link'));
  const data = scan(root).repositories.patternly;
  assert.ok(data.files.some(file => file.path === 'src/new.ts'));
  assert.ok(data.boundaries.some(item => item.path.includes('nazwy ukryte')));
  assert.ok(data.boundaries.some(item => item.path === 'private'));
  assert.ok(data.boundaries.some(item => item.path === 'node_modules'));
  assert.ok(data.boundaries.some(item => item.path === 'src/link'));
  assert.ok(!JSON.stringify(data).includes('do-not-copy'));
  assert.ok(!JSON.stringify(data).includes('private/evidence.json'));
  assert.equal(data.files.find(file=>file.path==='src/excluded.ts').imports[0].resolution, 'excluded-private');
  assert.ok(!JSON.stringify(data).includes('.env.local'));
  const entry = data.files.find(file => file.path === 'src/index.ts');
  assert.equal(entry.imports[0].target, 'src/worker.ts');
  assert.deepEqual(data.files.find(file => file.path === 'src/worker.ts').symbols, ['run']);
  const testcase = data.files.find(file => file.path === 'src/worker.test.ts');
  assert.deepEqual(testcase.testNames, ['rejects duplicate writes for [adres]']);
  const role = roleFor('patternly', testcase.path, { files: {}, areas: [] }, testcase);
  assert.match(role.description, /rejects duplicate writes/u);
  assert.match(role.level, /nie wynik wykonania/u);
});

test('freshness compares file bytes rather than unchanged commit identity and reports additions and removals', t => {
  const { root, put } = fixture(t);
  const before = scan(root);
  put('patternly/src/worker.ts', 'export function run() { return 43; }\n');
  put('patternly/src/deep/new.ts', 'export const newFile = true;\n');
  rmSync(join(root, 'patternly-web/src/index.ts'));
  const after = scan(root);
  assert.equal(before.repositories.patternly.head, after.repositories.patternly.head);
  const changes = compare(before, after);
  assert.ok(changes.some(item => item.path === 'src/worker.ts' && item.kind === 'changed-needs-review'));
  assert.ok(changes.some(item => item.path === 'src/deep/new.ts' && item.kind === 'new-unmapped'));
  assert.ok(changes.some(item => item.path === 'src/deep' && item.kind === 'new-folder'));
  assert.ok(changes.some(item => item.repo === 'patternly-web' && item.kind === 'removed-needs-link-review'));
});

test('generated-note preflight preserves manual content, detects edits and orphans before writing any target', t => {
  const { root, put } = fixture(t);
  const vault = join(root, 'vault'); mkdirSync(vault);
  const note = '<!-- patternly-atlas:generated-v1 -->\n# First\n';
  const hashes = writeAtlas(vault, { 'Atlas/a.md': note });
  assert.deepEqual(writeAtlas(vault, { 'Atlas/a.md': note }, hashes), hashes);
  put('vault/Atlas/manual.md', '# Handwritten\n');
  assert.throws(() => writeAtlas(vault, { 'Atlas/a.md': note+'new', 'Atlas/manual.md': note }, hashes), /collision-or-edited/u);
  assert.equal(readFileSync(join(vault, 'Atlas/a.md'), 'utf8'), note);
  put('vault/Atlas/a.md', note+'user edit');
  assert.throws(() => writeAtlas(vault, { 'Atlas/a.md': note+'new' }, hashes), /collision-or-edited/u);
  assert.throws(() => writeAtlas(vault, {}, hashes), /orphaned-notes/u);
  assert.throws(() => safePath(vault, '../escape.md'), /outside-root/u);
  symlinkSync(join(root, 'patternly'), join(vault, 'link'));
  assert.throws(() => safePath(vault, 'link/write.md'), /symlink/u);
});

test('each included folder and selected file has a note, and broken wiki anchors are detected', t => {
  const { root } = fixture(t);
  const snapshot = scan(root);
  const catalog = { date: '2026-10-17', areas: [], files: { 'patternly/src/worker.ts': { description: 'Worker' } }, flows: [] };
  const notes = render(snapshot, catalog);
  const folders = Object.values(snapshot.repositories).reduce((count, repo) => count + repo.folders.length, 0);
  assert.equal(Object.keys(notes).length, folders + 8);
  assert.ok(notes[folderNote('patternly', 'src')].includes('nie stanowią dowodu działania'));
  assert.ok(notes[folderNote('patternly', 'src')].includes('\\|patternly/src/worker.ts]]'));
  const vault = join(root, 'vault'); mkdirSync(vault);
  const hashes = writeAtlas(vault, { 'Atlas/a.md': '<!-- patternly-atlas:generated-v1 -->\n| Link |\n| --- |\n| [[Atlas/b#Existing\\|Etykieta w tabeli]] |\n[[Atlas/b#Missing]]\n', 'Atlas/b.md': '<!-- patternly-atlas:generated-v1 -->\n# Existing\n' });
  const issues = checkNotes(vault, { notes: hashes });
  assert.ok(issues.some(issue => issue.includes('missing-anchor')));
  assert.ok(!issues.some(issue => issue.includes('missing-wikilink')));
});

test('source changes invalidate related handwritten flows without pretending that regeneration reviews them', t => {
  const { root, put } = fixture(t);
  const before = scan(root);
  const flow = { name: 'Session', prefixes: ['patternly/src'] };
  const catalog = { flows: [flow], files: {} };
  const digest = flowDigest(before, catalog, flow);
  put('patternly/src/worker.ts', 'export function run() { throw new Error("failed"); }\n');
  const after = scan(root);
  assert.deepEqual(affectedFlows(compare(before, after), catalog), ['Session']);
  assert.notEqual(digest, flowDigest(after, catalog, flow));
  put('patternly-backend/src/worker.ts', 'export const extra = false;\n');
  assert.deepEqual(affectedFlows(compare(after, scan(root)), catalog), []);
});

test('known interrupted-batch hashes permit recovery but never accept later manual edits', t => {
  const { root, put } = fixture(t);
  const vault = join(root, 'vault'); mkdirSync(vault);
  const original = '<!-- patternly-atlas:generated-v1 -->\nOriginal\n';
  const partial = '<!-- patternly-atlas:generated-v1 -->\nPartial generation\n';
  const next = '<!-- patternly-atlas:generated-v1 -->\nNext generation\n';
  const previous = writeAtlas(vault, { 'Atlas/a.md': original, 'Atlas/b.md': original });
  put('vault/Atlas/a.md', partial);
  const digest = createHash('sha256').update(partial).digest('hex');
  const accepted = { ...previous, 'Atlas/a.md': [previous['Atlas/a.md'], digest] };
  assert.throws(() => writeAtlas(vault, { 'Atlas/b.md': next }, { ...accepted, 'Atlas/pending-only.md': digest }), /orphaned-notes-review-required.*pending-only/u);
  writeAtlas(vault, { 'Atlas/a.md': next, 'Atlas/b.md': next }, accepted);
  assert.equal(readFileSync(join(vault, 'Atlas/a.md'), 'utf8'), next);
  put('vault/Atlas/a.md', partial+'manual edit');
  assert.throws(() => writeAtlas(vault, { 'Atlas/a.md': next, 'Atlas/b.md': next }, accepted), /collision-or-edited/u);
});


test('graph names identify the source, repository and parent; reserved Obsidian characters remain unambiguous', t => {
  const { root, put } = fixture(t);
  put('patternly/src/a#b.ts', 'export const one = 1;');
  put('patternly/src/unicode.ts', 'import { one } from "./a#b"; import "./zażółć";');
  put('patternly/src/zażółć.ts', 'export const local = 1;');
  put('patternly/src/a%23b.ts', 'export const two = 2;');
  put('patternly/src/a~23~b.ts', 'export const encodedLookingName = 3;');
  put('patternly/.github/workflows/ci.yml', 'name: Example');
  put('patternly/src/other/index.ts', 'export const three = 3;');
  const catalog = { date: '2026-10-18', areas: [], files: {}, flows: [] };
  const snapshot = scan(root), notes = render(snapshot, catalog);
  assert.deepEqual(checkGraph(snapshot, catalog, notes).issues, []);
  assert.notEqual(fileNote('patternly', 'src/a#b.ts'), fileNote('patternly', 'src/a%23b.ts'));
  assert.notEqual(fileNote('patternly', 'src/a#b.ts'), fileNote('patternly', 'src/a~23~b.ts'));
  assert.match(basename(fileNote('patternly', 'src/other/index.ts')), /index.ts — aplikacja · src › other/u);
  assert.match(basename(folderNote('patternly', 'src')), /src — folder aplikacja/u);
  assert.ok(Object.keys(notes).every(path => !path.endsWith('/_Mapa.md')));
  assert.ok(Object.keys(notes).every(path=>path.split('/').every(part=>!part.startsWith('.'))));
  assert.ok(notes[folderNote('patternly','.github')].includes('source_path: ".github"'));
  assert.equal(checkNameCollisions(notes, ['Manual/'+basename(fileNote('patternly','src/index.ts')).toUpperCase()]).length, 1);
});

test('real imports map to exact file notes across repositories, assets, aliases, type loads and Node extension substitution', t => {
  const { root, put } = fixture(t);
  put('patternly/tsconfig.json', JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['src/*'] }, resolveJsonModule: true } }));
  put('patternly/src/edges.ts', `
import type { run } from '@/worker';
export { run as other } from './worker';
const load = () => import('./worker');
const common = require('./worker');
import '../styles.css';
import icon from '../icon.svg?raw';
import json from '../fixture.json';
import { run as remote } from '../../patternly-backend/src/worker.js';
type External = import('../../patternly-backend/src/worker.js');
const dynamic = import(variablePath);
import fs from 'node:fs';
`);
  put('patternly/styles.css', 'body {}'); put('patternly/icon.svg', '<svg/>'); put('patternly/fixture.json', '{}');
  put('patternly/src/equals.cts', 'import worker = require("./worker");');
  const snapshot = scan(root);
  const catalog = { date: '2026-10-18', areas: [], files: {}, flows: [] };
  const notes = render(snapshot, catalog), stats = checkGraph(snapshot, catalog, notes);
  assert.deepEqual(stats.issues, []);
  assert.equal(stats.crossRepositoryEdges, 1);
  assert.equal(stats.dynamicLoads, 1);
  const source = notes[fileNote('patternly', 'src/edges.ts')];
  for (const [repo, path] of [['patternly','src/worker.ts'],['patternly','styles.css'],['patternly','icon.svg'],['patternly','fixture.json'],['patternly-backend','src/worker.ts']]) {
    assert.ok(source.includes(`[[${fileNote(repo, path).slice(0,-3)}|`), path);
    assert.ok(notes[fileNote(repo,path)]);
  }
  assert.match(source, /node:fs/u);
  const broken = { ...notes, [fileNote('patternly', 'src/edges.ts')]: source.replaceAll(fileNote('patternly-backend','src/worker.ts').slice(0,-3), fileNote('patternly','src/worker.ts').slice(0,-3)) };
  assert.ok(checkGraph(snapshot,catalog,broken).issues.some(issue => issue.startsWith('missing-import-edge')));
  put('patternly/src/missing.ts', 'import "./does-not-exist";');
  const changed=scan(root);
  assert.ok(checkGraph(changed,catalog,render(changed,catalog)).issues.some(issue=>issue.startsWith('unresolved-local-import')));
});


test('a reviewed capture can be published once without rescanning, while freshness remains a live check', async t => {
  const { root, put } = fixture(t);
  const vault = join(root, 'vault'); mkdirSync(vault);
  put('patternly/scripts/docAtlas/catalog.json', JSON.stringify({ date: '2026-10-18', areas: [], files: {}, flows: [] }));
  put('vault/Atlas/Atlas aplikacji.md', '# Atlas');
  const snapshot = scan(root);
  const captured = captureAtlas(snapshot);
  assert.throws(()=>{snapshot.workspace="tampered";}, TypeError);
  assert.throws(()=>captureAtlas({...snapshot}), /capture-requires-scan-result/u);
  const originalHash = captured.snapshot.repositories.patternly.files.find(file=>file.path==='src/worker.ts').sha256;
  put('patternly/src/worker.ts', 'export function run() { return 99; }');
  t.mock.method(console, 'log', ()=>{});
  await runAtlas('build', {workspace:root,vault,capture:captured});
  const index=JSON.parse(readFileSync(join(root,'patternly/scripts/docAtlas/atlas-index.json'),'utf8'));
  assert.equal(index.repositories.patternly.files.find(file=>file.path==='src/worker.ts').sha256, originalHash);
  assert.ok(compare(index,scan(root)).some(change=>change.path==='src/worker.ts'));
  await assert.rejects(()=>runAtlas('check',{workspace:root,vault,capture:captured}),/check-requires-live-scan/u);
  await assert.rejects(()=>runAtlas('build',{workspace:join(root,'patternly'),vault,capture:captured}),/workspace-mismatch/u);
});


test('name migration commits the same captured source and catalog; tampering and late catalog edits fail before writes', async t => {
  const {root,put}=fixture(t);
  const vault=join(root,'vault'); mkdirSync(vault);
  const path='patternly/scripts/docAtlas/catalog.json';
  const text=JSON.stringify({date:'2026-10-18',areas:[],files:{},flows:[]}); put(path,text);
  const source=scan(root), captured=captureAtlas(source);
  const oldPath='Atlas/Struktura/patternly/src/_Mapa.md';
  const oldText='---\natlas_kind: folder\nrepo: patternly\nsource_path: "src"\n---\n<!-- patternly-atlas:generated-v1 -->\n# Old map\n'; put('vault/'+oldPath,oldText);
  put('vault/Atlas/Atlas aplikacji.md','# Atlas');
  const {workspace:local,...portable}=source;
  put('patternly/scripts/docAtlas/atlas-index.json',JSON.stringify({...portable,catalogHash:captured.catalogHash,notes:{[oldPath]:createHash('sha256').update(oldText).digest('hex')}}));
  put('patternly/src/worker.ts','export function run(){ return 99; }');
  t.mock.method(console,'log',()=>{});
  await assert.rejects(()=>runAtlas('migrate-names',{workspace:root,vault,capture:{...captured}}),/unknown-capture/u);
  put(path,text+' ');
  await assert.rejects(()=>runAtlas('migrate-names',{workspace:root,vault,capture:captured}),/catalog-changed-during-capture/u);
  assert.equal(readFileSync(join(vault,oldPath),'utf8'),oldText);
  put(path,text);
  await runAtlas('migrate-names',{workspace:root,vault,capture:captured});
  const index=JSON.parse(readFileSync(join(root,'patternly/scripts/docAtlas/atlas-index.json'),'utf8'));
  assert.equal(index.catalogHash,captured.catalogHash);
  assert.equal(index.repositories.patternly.files.find(file=>file.path==='src/worker.ts').sha256,source.repositories.patternly.files.find(file=>file.path==='src/worker.ts').sha256);
  assert.deepEqual(checkNotes(vault,index),[]);
  assert.ok(compare(index,scan(root)).some(change=>change.path==='src/worker.ts'));
});
