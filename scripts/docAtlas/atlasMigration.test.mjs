import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { migrateNameNotes, rewriteVaultLinks } from './atlasMigration.mjs';
const hash = text => createHash('sha256').update(text).digest('hex');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'patternly-atlas-migration-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const vault=join(root,'vault'), journalDir=join(root,'private'); mkdirSync(vault);
  const put=(path,text)=>{ const target=join(vault,path); mkdirSync(dirname(target),{recursive:true}); writeFileSync(target,text); };
  const old='Atlas/Struktura/app/_Mapa.md', next='Atlas/Struktura/app/app — repozytorium.md';
  const original='<!-- patternly-atlas:generated-v1 -->\n# Old\n', updated='<!-- patternly-atlas:generated-v1 -->\n# New\n';
  put(old,original);
  return {vault,journalDir,put,old,next,original,updated,args:{vault,journalDir,previous:{[old]:hash(original)},notes:{[next]:updated},mapping:{[old]:next}}};
}

test('migration rewrites wiki embeds, aliases, anchors, relative links and file URLs without rewriting other prose',t=>{
  const {vault,old,next}=fixture(t);
  const original=`Keep this prose. ![[${old.slice(0,-3)}#Section|Alias]]\n[[${old.slice(0,-3)}#Section\\|Table alias]]\n[relative](<${old}#Section>)\n[file](<${pathToFileURL(join(vault,old)).href}#Section>)\n[external](https://example.invalid/Atlas/Struktura/app/_Mapa.md)\n`;
  const after=rewriteVaultLinks(original,'Start.md',{[old]:next},vault);
  assert.ok(after.startsWith('Keep this prose.'));
  assert.ok(after.includes(`![[${next.slice(0,-3)}#Section|Alias]]`));
  assert.ok(after.includes(`${next.slice(0,-3)}#Section\\|Table alias]]`));
  assert.ok(after.includes('app%20%E2%80%94%20repozytorium.md#Section'));
  assert.ok(after.includes('https://example.invalid/Atlas/Struktura/app/_Mapa.md'));
});

test('preflight rejects edited sources and unowned destinations before modifying any note',t=>{
  const f=fixture(t);
  f.put(f.old,f.original+'edited');
  assert.throws(()=>migrateNameNotes(f.args),/source-edited/u);
  assert.ok(!existsSync(join(f.vault,f.next)));
  f.put(f.old,f.original); f.put(f.next,'unowned');
  assert.throws(()=>migrateNameNotes(f.args),/target-collision/u);
  assert.equal(readFileSync(join(f.vault,f.old),'utf8'),f.original);
});

test('interrupted migration resumes only exact known states and preserves handwritten content and backups',t=>{
  const f=fixture(t);
  const hand=`# Important requirement\n[[${f.old.slice(0,-3)}|Map]]\nUnrelated text.\n`;
  f.put('Start.md',hand); f.put('.obsidian/graph.json','do not touch');
  assert.throws(()=>migrateNameNotes({...f.args,afterWrite:()=>{throw new Error('interrupted');}}),/interrupted/u);
  const plan=JSON.parse(readFileSync(join(f.journalDir,'journal.json'),'utf8'));
  assert.equal(plan.operations.find(op=>op.path==='Start.md').before,hand);
  assert.equal(plan.operations.find(op=>op.path===f.old).before,f.original);
  f.put('Start.md',hand+'concurrent user edit');
  assert.throws(()=>migrateNameNotes(f.args),/state-edited/u);
  assert.ok(existsSync(join(f.vault,f.old)));
  f.put('Start.md',hand);
  const result=migrateNameNotes(f.args);
  assert.equal(result.rewrittenManualNotes,1);
  assert.ok(!existsSync(join(f.vault,f.old)));
  assert.equal(readFileSync(join(f.vault,'Start.md'),'utf8'),rewriteVaultLinks(hand,'Start.md',f.args.mapping,f.vault));
  assert.equal(readFileSync(join(f.vault,'.obsidian/graph.json'),'utf8'),'do not touch');
  assert.deepEqual(migrateNameNotes(f.args),result);
  assert.throws(()=>migrateNameNotes({...f.args,notes:{[f.next]:'changed after interruption'}}),/plan-changed/u);
});

test('migration refuses symlink destinations and ambiguous short wiki names',t=>{
  const f=fixture(t);
  const outside=join(f.journalDir,'outside'); mkdirSync(outside,{recursive:true});
  symlinkSync(outside,join(f.vault,'link'));
  assert.throws(()=>migrateNameNotes({...f.args,notes:{'link/file.md':'No'},mapping:{[f.old]:'link/file.md'}}),/symlink/u);
  assert.throws(()=>rewriteVaultLinks('[[_Mapa]]','Start.md',{'one/_Mapa.md':'one/new.md','two/_Mapa.md':'two/new.md'},f.vault),/ambiguous-link/u);
});
