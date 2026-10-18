import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const hash = text => createHash('sha256').update(text).digest('hex');
const read = path => readFileSync(path, 'utf8');
function safe(root, path) {
  const target = resolve(root, path), rel = relative(root, target);
  if (rel === '..' || rel.startsWith(`..${sep}`) || rel.startsWith(sep)) throw new Error('atlas/migration-outside-root');
  let part = target;
  while (part !== root) {
    if (existsSync(part) && lstatSync(part).isSymbolicLink()) throw new Error('atlas/migration-symlink');
    part = dirname(part);
  }
  return target;
}
function atomic(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}`;
  writeFileSync(temp, text, { flag: 'wx' }); renameSync(temp, path);
}
export function markdownFiles(root, prefix = '') {
  const paths = [];
  for (const entry of readdirSync(safe(root, prefix), { withFileTypes: true })) {
    if (entry.isSymbolicLink() || entry.name.startsWith('.')) continue;
    const path = posix.join(prefix, entry.name);
    if (entry.isDirectory()) paths.push(...markdownFiles(root, path));
    else if (entry.isFile() && path.endsWith('.md')) paths.push(path);
  }
  return paths;
}

export function rewriteVaultLinks(text, note, mapping, vault) {
  const withoutMd = path => path.replace(/\.md$/u, '');
  const wikiTarget = path => {
    const exact = path.endsWith('.md') ? path : `${path}.md`;
    if (mapping[exact]) return withoutMd(mapping[exact]);
    const relativePath = posix.normalize(posix.join(posix.dirname(note), exact));
    if (mapping[relativePath]) return withoutMd(mapping[relativePath]);
    if (!path.includes('/')) {
      const matches = Object.keys(mapping).filter(key => posix.basename(key) === exact);
      if (matches.length > 1) throw new Error(`atlas/migration-ambiguous-link: ${note}`);
      if (matches.length === 1) return withoutMd(mapping[matches[0]]);
    }
    return path;
  };
  text = text.replace(/\[\[([^\]]+)\]\]/gu, (whole, content) => {
    const split = content.search(/\\?\|/u);
    const address = split < 0 ? content : content.slice(0, split);
    const alias = split < 0 ? '' : content.slice(split);
    const anchor = address.indexOf('#');
    const path = anchor < 0 ? address : address.slice(0, anchor);
    return `[[${wikiTarget(path)}${anchor < 0 ? '' : address.slice(anchor)}${alias}]]`;
  });
  return text.replace(/(\]\()(<[^>]+>|[^\s)]+)(\))/gu, (whole, open, raw, close) => {
    const angle = raw.startsWith('<');
    const url = angle ? raw.slice(1, -1) : raw;
    const anchorAt = url.indexOf('#');
    const address = anchorAt < 0 ? url : url.slice(0, anchorAt);
    const anchor = anchorAt < 0 ? '' : url.slice(anchorAt);
    let absolute;
    try { absolute = address.startsWith('file:') ? fileURLToPath(address) : /^[a-z][a-z+.-]*:/iu.test(address) ? null : resolve(vault, dirname(note), decodeURIComponent(address)); } catch { return whole; }
    if (!absolute) return whole;
    const target = relative(vault, absolute).split(sep).join('/');
    if (!mapping[target]) return whole;
    const rewritten = address.startsWith('file:') ? pathToFileURL(join(vault, mapping[target])).href : relative(join(vault, dirname(note)), join(vault, mapping[target])).split(sep).map(encodeURIComponent).join('/');
    return `${open}${angle ? '<' : ''}${rewritten}${anchor}${angle ? '>' : ''}${close}`;
  });
}

// The private journal contains an immutable plan with every affected Markdown file,
// before/after hashes and bytes. No generated or handwritten file is mutated before
// all entries have been checked. Resume accepts only those exact known states.
export function migrateNameNotes({ vault, journalDir, previous, notes, mapping, afterWrite = () => {} }) {
  vault = realpathSync(vault);
  mkdirSync(journalDir, { recursive: true }); journalDir = realpathSync(journalDir);
  const journalPath = safe(journalDir, 'journal.json');
  const desiredHash = hash(JSON.stringify(notes));
  let plan;
  if (existsSync(journalPath)) {
    plan = JSON.parse(read(journalPath));
    if (plan.schemaVersion !== 'patternly-atlas-name-migration-v1' || plan.vault !== vault || plan.desiredHash !== desiredHash || JSON.stringify(plan.mapping) !== JSON.stringify(mapping)) throw new Error('atlas/migration-plan-changed; restore or finish the recorded batch first');
  } else {
    const operations = [];
    for (const [path, digest] of Object.entries(previous)) {
      const target = safe(vault, path);
      if (!existsSync(target) || hash(read(target)) !== digest) throw new Error(`atlas/migration-source-edited: ${path}`);
    }
    for (const [path, after] of Object.entries(notes)) {
      const target = safe(vault, path);
      const before = existsSync(target) ? read(target) : null;
      if (before !== null && !Object.hasOwn(previous, path)) throw new Error(`atlas/migration-target-collision: ${path}`);
      operations.push({ path, before, beforeHash: before === null ? null : hash(before), after, afterHash: hash(after) });
    }
    for (const path of markdownFiles(vault)) {
      if (Object.hasOwn(previous, path) || Object.hasOwn(notes, path)) continue;
      const before = read(safe(vault, path));
      const after = rewriteVaultLinks(before, path, mapping, vault);
      if (before !== after) operations.push({ path, before, beforeHash: hash(before), after, afterHash: hash(after) });
    }
    // Delete old generated paths last, after new targets and inbound links exist.
    for (const path of Object.keys(previous)) if (!Object.hasOwn(notes, path)) {
      if (!mapping[path] || !Object.hasOwn(notes, mapping[path])) throw new Error(`atlas/migration-unmapped-source: ${path}`);
      const before = read(safe(vault, path));
      operations.push({ path, before, beforeHash: hash(before), after: null, afterHash: null });
    }
    plan = { schemaVersion: 'patternly-atlas-name-migration-v1', vault, desiredHash, mapping, operations };
    atomic(journalPath, `${JSON.stringify(plan, null, 2)}\n`);
  }
  for (const item of plan.operations) {
    const path = safe(vault, item.path);
    const current = existsSync(path) ? hash(read(path)) : null;
    if (current !== item.beforeHash && current !== item.afterHash) throw new Error(`atlas/migration-state-edited: ${item.path}`);
  }
  for (const item of plan.operations) {
    const path = safe(vault, item.path);
    const current = existsSync(path) ? hash(read(path)) : null;
    if (current !== item.beforeHash && current !== item.afterHash) throw new Error(`atlas/migration-state-edited: ${item.path}`);
    if (current === item.afterHash) continue;
    if (item.after === null) unlinkSync(path); else atomic(path, item.after);
    afterWrite(item.path);
  }
  // Keep the private plan/backups as evidence; main commits the atlas index last.
  return { hashes: Object.fromEntries(Object.entries(notes).map(([path, text]) => [path, hash(text)])), journalPath, renamedNotes: Object.keys(mapping).length, rewrittenManualNotes: plan.operations.filter(item => item.before !== null && item.after !== null && !Object.hasOwn(notes, item.path)).length };
}
