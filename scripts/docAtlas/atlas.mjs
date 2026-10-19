import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { markdownFiles, migrateNameNotes } from './atlasMigration.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const defaultWorkspace = resolve(here, '../../..');
export const repositories = ['patternly', 'patternly-backend', 'patternly-content', 'patternly-web'];
const generatedHeader = '<!-- patternly-atlas:generated-v1 -->';
const hash = value => createHash('sha256').update(value).digest('hex');
const scannedSnapshots = new WeakSet();
const reviewedCaptures = new WeakSet();
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
const read = path => readFileSync(path, 'utf8');
const code = /\.[cm]?[jt]sx?$/u;
const test = /(?:\.test\.|\.browser\.test\.|(?:^|\/)tests\/|(?:^|\/)__fixtures__\/|(?:^|\/)fixtures\/)/u;
const privatePath = /(?:^|\/)(?:\.git|\.agent|\.codex|\.agents|node_modules|\.expo|\.gradle|Pods|build|dist|coverage|private)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|\.(?:pem|key|p12|keystore|jks|mobileprovision)$/u;
const privateDirectories = new Set(['.git', '.agent', '.codex', '.agents', 'node_modules', '.expo', '.gradle', 'Pods', 'build', 'dist', 'coverage', 'private']);
function privateBoundary(path) {
  const parts = path.split('/');
  const index = parts.findIndex(part => privateDirectories.has(part));
  return index < 0 ? '[lokalne pliki środowiska lub kluczy — nazwy ukryte]' : parts.slice(0, index + 1).join('/');
}
const toolArtifact = 'scripts/docAtlas/atlas-index.json';
const pendingArtifact = 'scripts/docAtlas/atlas-pending.json';
const normalize = path => path.split(sep).join('/');
const git = (root, args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const escape = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ').replaceAll('`', '');
const repoLabels = { patternly: 'aplikacja', 'patternly-backend': 'backend', 'patternly-content': 'treści', 'patternly-web': 'witryna' };
const noteSegment = value => value.replace(/^\.|[~%#^|\[\]:\\/?*\x00-\x1f]/gu, char => `~${char.codePointAt(0).toString(16).toUpperCase().padStart(2, '0')}~`);
const context = path => path === '.' ? '' : ` · ${path.split('/').map(noteSegment).join(' › ')}`;
const noteDir = path => path === '.' ? '' : `${path.split('/').map(noteSegment).join('/')}/`;
export const folderNote = (repo, path) => `Atlas/Struktura/${repo}/${noteDir(path)}${path === '.' ? `${repoLabels[repo]} — repozytorium` : `${noteSegment(basename(path))} — folder ${repoLabels[repo]}${context(dirname(path))}`}.md`;
export const fileNote = (repo, path) => `Atlas/Struktura/${repo}/${noteDir(dirname(path))}_Pliki/${noteSegment(basename(path))} — ${repoLabels[repo]}${context(dirname(path))}.md`;
const wiki = (path, title) => `[[${path.replace(/\.md$/u, '')}|${escape(title).replaceAll('[', '&#91;').replaceAll(']', '&#93;')}]]`;
const sourceLink = (workspace, repo, path, label = path) => `[${escape(label)}](<${pathToFileURL(join(workspace, repo, path)).href}>)`;

function assertInside(root, path) {
  const rel = relative(root, resolve(path));
  if (rel === '..' || rel.startsWith(`..${sep}`) || rel.startsWith(sep)) throw new Error('atlas/path-outside-root');
}

export function safePath(root, path) {
  const target = resolve(root, path);
  assertInside(root, target);
  let parent = target;
  while (true) {
    if (existsSync(parent) && lstatSync(parent).isSymbolicLink()) throw new Error('atlas/symlink-not-followed');
    if (parent === root) break;
    const next = dirname(parent);
    if (next === parent) throw new Error('atlas/path-outside-root');
    parent = next;
  }
  return target;
}

function inspectSource(root, repo, path, bytes, options, inventory) {
  const result = { symbols: [], imports: [], jsonKeys: [], testNames: [], lines: 0 };
  if (bytes.includes(0) || bytes.length > 2 * 1024 * 1024) return result;
  const text = bytes.toString('utf8');
  result.lines = text.split(/\r?\n/u).length;
  if (extname(path) === '.json') {
    try {
      const value = JSON.parse(text);
      result.jsonKeys = Array.isArray(value) ? [`tablica: ${value.length} elementów`] : value && typeof value === 'object' ? Object.keys(value).filter(key => /^[a-zA-Z_$][\w$-]{0,64}$/u.test(key)).slice(0, 16) : [];
    } catch { result.parseIssue = 'invalid-json'; }
  }
  if (!code.test(path)) return result;
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  if (source.parseDiagnostics.length) result.parseIssue = 'parse-diagnostics';
  const moduleCache = ts.createModuleResolutionCache(root, name => name, options);
  const addImport = (specifier, node, kind) => {
    if (!specifier || !ts.isStringLiteralLike(specifier)) { result.dynamicLoads = (result.dynamicLoads ?? 0) + 1; return; }
    const name = specifier.text;
    if ((!name.startsWith('.') && !/^[\w@./?+:-]+$/u.test(name)) || /[\x00-\x1f]/u.test(name) || name.startsWith('/')) {
      result.imports.push({ specifier: '[niestandardowy specyfikator — odczytaj kod]', kind, resolution: 'unsupported', line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
      return;
    }
    const candidate = name.startsWith('.') ? resolve(dirname(join(root, path)), name.replace(/\?raw$/u, '')) : null;
    if (candidate && privatePath.test(normalize(relative(root, candidate)))) {
      result.imports.push({ specifier: '[wyłączona granica prywatna — nazwa ukryta]', kind, resolution: 'excluded-private', line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
      return;
    }
    const resolved = ts.resolveModuleName(name.replace(/\?raw$/u, ''), join(root, path), options, ts.sys, moduleCache).resolvedModule;
    let target = resolved && inventory.get(resolve(resolved.resolvedFileName));
    // Bundler resources (CSS, SVG?raw, JSON) may have no TypeScript module result.
    if (!target && candidate) target = inventory.get(candidate);
    const local = name.startsWith('.') || name.startsWith('@/');
    result.imports.push({ specifier: name, kind, ...(target ? { target: target.path, ...(target.repo === repo ? {} : { targetRepo: target.repo }) } : { resolution: local ? 'unresolved-local' : 'external' }), line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
  };
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) addImport(statement.moduleSpecifier, statement, statement.importClause?.isTypeOnly ? 'type' : 'static');
    if (ts.isImportEqualsDeclaration(statement) && ts.isExternalModuleReference(statement.moduleReference)) addImport(statement.moduleReference.expression, statement, 'require');
    if (ts.isExportDeclaration(statement)) {
      if (statement.moduleSpecifier) addImport(statement.moduleSpecifier, statement, statement.isTypeOnly ? 'type' : 'reexport');
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) result.symbols.push(...statement.exportClause.elements.map(element => element.name.text));
    }
    if (statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      if (statement.name?.text) result.symbols.push(statement.name.text);
      if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) result.symbols.push(declaration.name.text);
      if (statement.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)) result.symbols.push('default');
    }
  }
  const visit = node => {
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === 'require')) addImport(node.arguments[0], node, node.expression.kind === ts.SyntaxKind.ImportKeyword ? 'dynamic' : 'require');
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) addImport(node.argument.literal, node, 'type');
    if (test.test(path) && ts.isCallExpression(node) && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
      const callee = node.expression.getText(source);
      if (/^(?:test|it|describe)(?:\.(?:skip|todo|only))?$/u.test(callee)) {
        const title = node.arguments[0].text.replace(/https?:\/\/\S+/gu, '[URL]').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/gu, '[adres]').replace(/\b[0-9a-f]{32,}\b/giu, '[identyfikator]').replace(/[\r\n]/gu, ' ').slice(0, 200);
        if (!result.testNames.includes(title)) result.testNames.push(title);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  result.symbols = [...new Set(result.symbols)];
  return result;
}

export function scan(workspace = defaultWorkspace) {
  workspace = realpathSync(workspace);
  const result = { schemaVersion: 'patternly-atlas-v1', workspace, repositories: {} };
  const inventories = new Map();
  const inventory = new Map();
  for (const repo of repositories) {
    const root = safePath(workspace, repo);
    const candidates = [...new Set(git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean))].sort();
    const excluded = [];
    const paths = [];
    for (const path of candidates) {
      if (path === toolArtifact || path === pendingArtifact) continue; // Avoid self-referential artifact hashes.
      if (privatePath.test(path)) {
        const boundary = privateBoundary(path);
        if (!excluded.some(item => item.path === boundary)) excluded.push({ path: boundary, reason: 'private-or-dependency-output' });
        continue;
      }
      try {
        const absolute = safePath(root, path);
        if (!existsSync(absolute)) { excluded.push({ path, reason: 'deleted-in-worktree' }); continue; }
        if (!lstatSync(absolute).isFile()) { excluded.push({ path, reason: 'not-regular-file' }); continue; }
        paths.push(path);
      } catch { excluded.push({ path, reason: 'symlink-or-unsafe-path' }); }
    }
    // Describe ignored/dependency/private tree boundaries without descending into them.
    const boundaries = [];
    const includedDirs = new Set(['.']);
    for (const path of paths) {
      let dir = dirname(path);
      while (dir !== '.') { includedDirs.add(dir); dir = dirname(dir); }
    }
    for (const dir of includedDirs) {
      const absolute = safePath(root, dir);
      for (const entry of readdirSync(absolute, { withFileTypes: true })) {
        const child = normalize(join(dir, entry.name));
        if (privatePath.test(child)) {
          const boundary = privateBoundary(child);
          if (!boundaries.some(item => item.path === boundary)) boundaries.push({ path: boundary, reason: 'private-or-dependency-boundary-not-read' });
          continue;
        }
        if (entry.isSymbolicLink()) { boundaries.push({ path: child, reason: 'symlink-not-followed' }); continue; }
        if (entry.isDirectory() && !includedDirs.has(child)) boundaries.push({ path: child, reason: 'outside-git-inventory-tree' });
        if (entry.isFile() && !paths.includes(child) && child !== toolArtifact && child !== pendingArtifact && !excluded.some(item => item.path === child)) boundaries.push({ path: child, reason: 'ignored-or-outside-git-inventory' });
      }
    }
    const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
    const config = configPath ? ts.readConfigFile(configPath, ts.sys.readFile) : { config: {} };
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const options = { ...parsed.options, allowJs: true };
    inventories.set(repo, { root, paths, options });
    for (const path of paths) inventory.set(resolve(root, path), { repo, path });
    result.repositories[repo] = { head: git(root, ['rev-parse', 'HEAD']).trim(), files: [], folders: [...includedDirs].sort(), excluded, boundaries: boundaries.sort((a, b) => a.path.localeCompare(b.path)) };
  }
  // Resolve against the complete, privacy-filtered inventory, including sibling repositories.
  for (const [repo, { root, paths, options }] of inventories) {
    const entries = paths.map(path => {
      const bytes = readFileSync(safePath(root, path));
      return { path, sha256: hash(bytes), bytes: bytes.length, ...inspectSource(root, repo, path, bytes, options, inventory) };
    });
    result.repositories[repo].files = entries;
  }
  scannedSnapshots.add(result);
  return freeze(result);
}

export function captureAtlas(snapshot, catalogText = read(join(snapshot.workspace, 'patternly/scripts/docAtlas/catalog.json'))) {
  if (!scannedSnapshots.has(snapshot)) throw new Error('atlas/capture-requires-scan-result');
  const catalog = JSON.parse(catalogText);
  const path = 'scripts/docAtlas/catalog.json';
  const bytes = Buffer.from(catalogText);
  // Catalog review changes its digests after scan. Bind that exact text once,
  // including its inventory entry, instead of mixing catalog versions at commit.
  const entry = { path, sha256: hash(bytes), bytes: bytes.length, ...inspectSource(join(snapshot.workspace, 'patternly'), 'patternly', path, bytes, {}, new Map()) };
  const app = snapshot.repositories.patternly;
  const files = app.files.filter(file => file.path !== path).concat(entry).sort((a, b) => a.path.localeCompare(b.path));
  const bound = freeze({ ...snapshot, repositories: { ...snapshot.repositories, patternly: { ...app, files } } });
  const capture = freeze({ snapshot: bound, catalog, catalogHash: hash(catalogText) });
  reviewedCaptures.add(capture);
  return capture;
}

export function roleFor(repo, path, catalog, entry = null) {
  const key = `${repo}/${path}`;
  if (catalog.files[key]) return { description: catalog.files[key].description, level: 'opis indywidualny', flow: catalog.files[key].flow };
  if (entry?.testNames?.length) return { description: `Deklarowane przypadki: ${entry.testNames.slice(0, 3).join('; ')}${entry.testNames.length > 3 ? `; łącznie ${entry.testNames.length} nazwanych przypadków` : ''}.`, level: 'zakres zapisany w źródle testu, nie wynik wykonania' };
  if (entry?.jsonKeys?.length) {
    const name = path.split('/').at(-1).replace(/\.json$/u, '');
    let purpose = `Dokument JSON ${name}`;
    if (repo === 'patternly-content' && path.startsWith('content/') && !path.startsWith('content/migration-evidence/')) purpose = `Źródło jednostki treści ${name}; ścieżka i węzeł wynikają z folderów nadrzędnych`;
    else if (path.includes('/locales/')) purpose = `Słownik interfejsu ${name}, język ${path.split('/').at(-2)}`;
    else if (path.startsWith('evidence/') || path.startsWith('reports/')) purpose = `Wersjonowany zapis dowodu/raportu ${name}; nie jest bieżącym wynikiem runtime`;
    else if (path.startsWith('config/')) purpose = `Konfiguracja ${name}; zakres określają poniższe pola i kontekst folderu`;
    else if (path.startsWith('schemas/')) purpose = `Schemat struktury ${name}; walidacja nie potwierdza jakości semantycznej danych`;
    else if (path.includes('/generated/') || path.startsWith('artifacts/')) purpose = `Wygenerowany lub przypięty artefakt ${name}; aktualizuj przez właściciela procesu produkcji`;
    return { description: `${purpose}. Pola/kształt: ${entry.jsonKeys.join(', ')}.`, level: 'indywidualny opis struktury danych' };
  }
  const rule = catalog.areas.filter(item => key === item.prefix || key.startsWith(`${item.prefix}/`)).sort((a, b) => b.prefix.length - a.prefix.length)[0];
  const area = rule?.description ?? 'Plik pomocniczy repozytorium; szczegółowa odpowiedzialność wymaga odczytu źródła.';
  if (test.test(path)) return { description: `Test/fixture. Kontekst obszaru, nie indywidualny zakres testu: ${area}`, level: 'kontekst folderu i struktura' };
  if (path.endsWith('/index.ts') || path.endsWith('/index.js')) return { description: `Wejście eksportów. Kontekst obszaru: ${area}`, level: 'kontekst folderu i struktura' };
  return { description: area, level: 'kontekst folderu, nie indywidualny opis pliku' };
}

function metadata(entry) {
  if (entry.symbols.length) return `Eksporty: ${entry.symbols.map(name => `\`${escape(name)}\``).join(', ')}.`;
  if (entry.jsonKeys.length) return `Struktura JSON: ${entry.jsonKeys.map(escape).join(', ')}.`;
  if (/\.(?:png|svg|jpg|gzip|gz)$/u.test(entry.path)) return `Zasób/artefakt binarny lub grafika; ${entry.bytes} B.`;
  return entry.lines ? `${entry.lines} linii; brak nazwanych eksportów wykrytych statycznie.` : `${entry.bytes} B; bez analizy tekstu.`;
}

export function graphModel(snapshot, catalog) {
  const files = new Map();
  for (const [repo, data] of Object.entries(snapshot.repositories)) for (const entry of data.files) files.set(`${repo}/${entry.path}`, { repo, entry });
  const detail = new Set([...files].filter(([key, { entry }]) => code.test(entry.path) || catalog.files[key]).map(([key]) => key));
  const incoming = new Map();
  const edges = [];
  const unresolved = [];
  let dynamicLoads = 0;
  for (const [from, { repo, entry }] of files) {
    dynamicLoads += entry.dynamicLoads ?? 0;
    for (const item of entry.imports) {
      if (!item.target) { if (item.resolution === 'unresolved-local') unresolved.push({ source: from, specifier: item.specifier, line: item.line }); continue; }
      const to = `${item.targetRepo ?? repo}/${item.target}`;
      if (!files.has(to)) throw new Error(`atlas/import-outside-inventory: ${from}`);
      detail.add(from); detail.add(to);
      edges.push({ from, to, ...item });
      if (!incoming.has(to)) incoming.set(to, new Set());
      incoming.get(to).add(from);
    }
  }
  return { files, detail, incoming, edges, unresolved, dynamicLoads };
}

export function render(snapshot, catalog) {
  const notes = {};
  const graph = graphModel(snapshot, catalog);
  const fileLink = key => { const { repo, entry } = graph.files.get(key); return wiki(fileNote(repo, entry.path), `${repo}/${entry.path}`); };
  const frontmatter = (repo, path, kind) => `---\natlas_kind: ${kind}\nrepo: ${repo}\nsource_path: ${JSON.stringify(path)}\nupdated: ${catalog.date}\ntags:\n  - patternly/atlas\n---\n${generatedHeader}\n`;
  for (const [repo, data] of Object.entries(snapshot.repositories)) {
    for (const dir of data.folders) {
      const children = data.folders.filter(path => path !== dir && dirname(path) === dir);
      const own = data.files.filter(file => dirname(file.path) === dir);
      const all = data.files.filter(file => dir === '.' || file.path.startsWith(`${dir}/`));
      const area = roleFor(repo, dir, catalog);
      const related = catalog.flows.filter(flow => flow.prefixes.some(prefix => `${repo}/${dir}`.startsWith(prefix) || prefix.startsWith(`${repo}/${dir === '.' ? '' : `${dir}/`}`)));
      let text = `${frontmatter(repo, dir, 'folder')}\n# ${basename(folderNote(repo, dir), '.md')}\n\n${dir === '.' ? wiki('Atlas/Atlas aplikacji.md', 'Atlas aplikacji') : `Folder nadrzędny: ${wiki(folderNote(repo, dirname(dir)), dirname(dir))}.`} ${sourceLink(snapshot.workspace, repo, dir, 'Otwórz folder kodu')}.\n\n## Rola i granice\n\n${area.description}\n\nSpis obejmuje ${all.length} plików w poddrzewie, w tym ${own.length} bezpośrednio tutaj. Źródło: bieżące pliki Git i nieignorowane pliki robocze. Klasyfikacja, eksporty i importy służą nawigacji; nie stanowią dowodu działania.\n\n## Podfoldery\n\n${children.length ? children.map(path => `- ${wiki(folderNote(repo, path), basename(path))}`).join('\n') : 'Brak podfolderów objętych spisem.'}\n\n## Pliki\n\n| Plik | Rola indywidualna lub kontekst folderu | Ślad w konkretnym pliku |\n| --- | --- | --- |\n`;
      for (const entry of own) {
        const role = roleFor(repo, entry.path, catalog, entry);
        text += `| ${graph.detail.has(`${repo}/${entry.path}`) ? fileLink(`${repo}/${entry.path}`).replaceAll('|', '\\|') : sourceLink(snapshot.workspace, repo, entry.path, basename(entry.path))} | ${escape(role.description)} (${role.level}) | ${escape(metadata(entry))} |\n`;
      }
      if (!own.length) text += '| — | Folder grupuje podfoldery. | — |\n';
      text += `\n## Powiązania\n\n${related.length ? related.map(flow => `- ${wiki(`Atlas/Przepływy/${flow.name}.md`, flow.name)}`).join('\n') : 'Brak przypisanego przepływu; użyj spisu nadrzędnego.'}\n\nImporty są mapowane bezpośrednio między notatkami plików. Połączenia folderów służą nawigacji po drzewie; nie zastępują krawędzi importu.\n`;
      if (dir === '.') {
        text += '\n## Granice i wyłączenia\n\nNie mapujemy wnętrza zależności, katalogów buildów, prywatnego runtime ani lokalnych sekretów. Poniżej tylko ścieżki graniczne — bez odczytu ich zawartości. Pliki z atlas-index.json są wyłączone z własnego haszowania.\n\n| Ścieżka graniczna | Powód |\n| --- | --- |\n';
        for (const item of [...data.excluded, ...data.boundaries]) text += `| \`${escape(item.path)}\` | ${escape(item.reason)} |\n`;
      }
      notes[folderNote(repo, dir)] = text;
    }
    for (const entry of data.files.filter(entry => graph.detail.has(`${repo}/${entry.path}`))) {
      const key = `${repo}/${entry.path}`;
      const role = roleFor(repo, entry.path, catalog, entry);
      const curated = catalog.files[key];
      const dependencies = entry.imports.filter(item => item.target);
      const consumers = [...(graph.incoming.get(key) ?? [])].sort();
      const sourceOf = key => { const item = graph.files.get(key); return sourceLink(snapshot.workspace, item.repo, item.entry.path, key); };
      const otherImports = entry.imports.filter(item => !item.target);
      let text = `${frontmatter(repo, entry.path, 'file')}\n# ${basename(fileNote(repo, entry.path), '.md')}\n\n${wiki(folderNote(repo, dirname(entry.path)), 'Folder źródłowy')} · ${sourceLink(snapshot.workspace, repo, entry.path, 'Otwórz kod')}\n\n## Odpowiedzialność\n\n${role.description}\n\nPoziom opisu: ${role.level}.${curated?.notes ? ` ${curated.notes}` : ''}\n\n## Ślad w kodzie\n\n${metadata(entry)}\n\nSHA-256 źródła w chwili zbudowania mapy: \`${entry.sha256}\`. Hash dotyczy odczytanej zawartości, nie potwierdzenia semantyki opisu.\n\n## Importy plików\n\n${dependencies.length ? dependencies.map(item => `- ${fileLink(`${item.targetRepo ?? repo}/${item.target}`)} — ${item.kind}, linia ${item.line}, specyfikator \`${escape(item.specifier)}\`.`).join('\n') : 'Brak rozpoznanych lokalnych importów.'}\n\n## Importy zewnętrzne i nierozwiązane\n\n${otherImports.length ? otherImports.map(item => `- \`${escape(item.specifier)}\` — ${({ 'unresolved-local': 'NIEROZWIĄZANY LOKALNY IMPORT', 'excluded-private': 'wyłączona granica prywatna — bez węzła w atlasie', unsupported: 'NIEROZPOZNANY SPECYFIKATOR — sprawdź źródło', external: 'moduł zewnętrzny spoza spisu projektu' }[item.resolution] ?? 'NIEROZPOZNANA KATEGORIA IMPORTU')}, ${item.kind}, linia ${item.line}.`).join('\n') : 'Brak.'}\n\nŁadowania z nieobliczalnym statycznie argumentem: ${entry.dynamicLoads ?? 0}. Nie przypisano im zgadywanego celu.\n\n## Bezpośredni konsumenci\n\n${consumers.length ? consumers.map(key => `- ${sourceOf(key)}`).join('\n') : 'Nie wykryto; sprawdź wejścia runtime i odwołania spoza importów przed oceną użycia.'}\n\nKonsumenci mają linki do kodu; kierunek importu w grafie pochodzi z notatki importującej. Obsidian wyświetla także połączenia nawigacyjne folderów i przepływów. Resolver obejmuje statyczne importy JS/TS, reexporty, importy typów oraz literalne import()/require(), również między repozytoriami. Nie dowodzi wywołań sieciowych, natywnych ani wykonania testów.\n`;
      if (role.flow) text += `\nPrzepływ: ${wiki(`Atlas/Przepływy/${role.flow}.md`, role.flow)}.\n`;
      notes[fileNote(repo, entry.path)] = text;
    }
  }
  return notes;
}

export function checkGraph(snapshot, catalog, notes) {
  const graph = graphModel(snapshot, catalog);
  const issues = [];
  const names = new Set();
  for (const path of Object.keys(notes)) {
    const name = basename(path).normalize('NFC').toLocaleLowerCase('pl');
    if (names.has(name)) issues.push(`ambiguous-note-name: ${path}`);
    names.add(name);
    if (basename(path) === '_Mapa.md' || path.split('/').some(part => part.startsWith('.')) || Buffer.byteLength(basename(path)) > 255) issues.push(`invalid-graph-name: ${path}`);
  }
  for (const key of graph.detail) {
    const { repo, entry } = graph.files.get(key);
    const path = fileNote(repo, entry.path);
    if (!notes[path]) { issues.push(`missing-file-node: ${key}`); continue; }
    const section = notes[path].split('## Importy plików\n')[1]?.split('\n## ')[0] ?? '';
    const actual = new Set([...section.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/gu)].map(match => `${match[1]}.md`));
    const expected = new Set(entry.imports.filter(item => item.target).map(item => fileNote(item.targetRepo ?? repo, item.target)));
    for (const target of expected) if (!actual.has(target)) issues.push(`missing-import-edge: ${key} -> ${target}`);
    for (const target of actual) if (!expected.has(target)) issues.push(`unexpected-import-edge: ${key} -> ${target}`);
  }
  issues.push(...graph.unresolved.map(item => `unresolved-local-import: ${item.source}:${item.line}`));
  return { fileNodes: graph.detail.size, importOccurrences: graph.edges.length, importEdges: new Set(graph.edges.map(edge => `${edge.from}\0${edge.to}`)).size, crossRepositoryEdges: new Set(graph.edges.filter(edge => edge.from.split('/')[0] !== edge.to.split('/')[0]).map(edge => `${edge.from}\0${edge.to}`)).size, unresolvedLocalImports: graph.unresolved.length, excludedPrivateImports: [...graph.files.values()].reduce((n, { entry }) => n + entry.imports.filter(item => item.resolution === 'excluded-private').length, 0), unsupportedImports: [...graph.files.values()].reduce((n, { entry }) => n + entry.imports.filter(item => item.resolution === 'unsupported').length, 0), dynamicLoads: graph.dynamicLoads, issues };
}

export function checkNameCollisions(notes, existingPaths, previousPaths = []) {
  const names = new Map(Object.keys(notes).map(path => [basename(path).normalize('NFC').toLocaleLowerCase('pl'), path]));
  const excluded = new Set([...Object.keys(notes), ...previousPaths]);
  return existingPaths.filter(path => !excluded.has(path) && names.has(basename(path).normalize('NFC').toLocaleLowerCase('pl'))).map(path => `graph-name-collision-with-manual-note: ${path}`);
}

function atomicWrite(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}`;
  writeFileSync(temp, content, { flag: 'wx' });
  renameSync(temp, path);
}

export function writeAtlas(vault, notes, previous = {}, onReady = () => {}) {
  vault = realpathSync(vault);
  // Preflight every target before any mutation. Never overwrite an edited generated note.
  for (const [path, content] of Object.entries(notes)) {
    const target = safePath(vault, path);
    if (!existsSync(target)) continue;
    const current = read(target);
    if (current === content) continue;
    const accepted = Array.isArray(previous[path]) ? previous[path] : [previous[path]];
    if (!current.includes(generatedHeader) || !accepted.includes(hash(current))) throw new Error(`atlas/note-collision-or-edited: ${path}`);
  }
  const orphaned = Object.keys(previous).filter(path => !Object.hasOwn(notes, path));
  if (orphaned.length) throw new Error(`atlas/orphaned-notes-review-required: ${orphaned.join(', ')}`);
  onReady(); // Persist the known batch hashes only after every target passes preflight.
  for (const [path, content] of Object.entries(notes)) {
    const target = safePath(vault, path);
    if (!existsSync(target) || read(target) !== content) atomicWrite(target, content);
  }
  return Object.fromEntries(Object.entries(notes).map(([path, content]) => [path, hash(content)]));
}

export function compare(previous, current) {
  const changes = [];
  for (const repo of repositories) {
    const old = new Map(previous.repositories[repo].files.map(file => [file.path, file.sha256]));
    const next = new Map(current.repositories[repo].files.map(file => [file.path, file.sha256]));
    for (const [path, digest] of next) if (!old.has(path) || old.get(path) !== digest) changes.push({ repo, path, kind: old.has(path) ? 'changed-needs-review' : 'new-unmapped' });
    for (const path of old.keys()) if (!next.has(path)) changes.push({ repo, path, kind: 'removed-needs-link-review' });
    for (const dir of current.repositories[repo].folders) if (!previous.repositories[repo].folders.includes(dir)) changes.push({ repo, path: dir, kind: 'new-folder' });
    if (JSON.stringify(previous.repositories[repo].boundaries) !== JSON.stringify(current.repositories[repo].boundaries)) changes.push({ repo, path: '.', kind: 'exclusion-boundaries-changed' });
  }
  return changes;
}

export function affectedFlows(changes, catalog) {
  return catalog.flows.filter(flow => changes.some(change => {
    const key = `${change.repo}/${change.path}`;
    return flow.prefixes.some(prefix => key === prefix || key.startsWith(`${prefix}/`))
      || catalog.files[key]?.flow === flow.name;
  })).map(flow => flow.name);
}

export function flowDigest(snapshot, catalog, flow) {
  const paths = [];
  for (const [repo, data] of Object.entries(snapshot.repositories)) for (const entry of data.files) {
    const key = `${repo}/${entry.path}`;
    if (flow.prefixes.some(prefix => key === prefix || key.startsWith(`${prefix}/`)) || catalog.files[key]?.flow === flow.name) paths.push(`${key}:${entry.sha256}`);
  }
  return hash(paths.sort().join('\n'));
}

export function checkNotes(vault, manifest) {
  const issues = [];
  const all = Object.keys(manifest.notes);
  for (const path of all) {
    let target;
    try { target = safePath(realpathSync(vault), path); } catch { issues.push(`unsafe-note: ${path}`); continue; }
    if (!existsSync(target)) { issues.push(`missing-note: ${path}`); continue; }
    const source = read(target);
    if (hash(source) !== manifest.notes[path]) issues.push(`edited-generated-note: ${path}`);
    for (const match of source.matchAll(/\[\[([^\]]+)\]\]/gu)) {
      const [address] = match[1].replaceAll('\\|', '|').split('|');
      const [file, anchor] = address.split('#');
      const linked = safePath(realpathSync(vault), file.endsWith('.md') ? file : `${file}.md`);
      if (!existsSync(linked)) issues.push(`missing-wikilink: ${path} -> ${file}`);
      else if (anchor && !read(linked).split('\n').some(line => /^#{1,6} /u.test(line) && line.replace(/^#{1,6} /u, '') === anchor)) issues.push(`missing-anchor: ${path} -> ${address}`);
    }
  }
  return issues;
}

export async function runAtlas(command, { workspace = defaultWorkspace, vault, capture: preparedCapture } = {}) {
  if (!['preview', 'build', 'check', 'migrate-names'].includes(command)) throw new Error('atlas/invalid-command');
  workspace = realpathSync(workspace);
  if (existsSync(safePath(workspace, 'patternly/.agent/private/docAtlas-retirement/journal.json'))) {
    throw new Error('atlas/retirement-pending; resume retireOrphanNotes.mjs before rendering');
  }
  if (preparedCapture && !reviewedCaptures.has(preparedCapture)) throw new Error('atlas/unknown-capture');
  if (preparedCapture && preparedCapture.snapshot.workspace !== workspace) throw new Error('atlas/snapshot-workspace-mismatch');
  if (command === 'check' && preparedCapture) throw new Error('atlas/check-requires-live-scan');
  vault = resolve(vault ?? process.env.PATTERNLY_VAULT_ROOT ?? join(workspace, '../../Vaults/Patternly'));
  const toolRoot = safePath(workspace, 'patternly/scripts/docAtlas');
  const catalogPath = join(toolRoot, 'catalog.json');
  const capture = preparedCapture ?? captureAtlas(scan(workspace), read(catalogPath));
  const { catalog, catalogHash, snapshot } = capture;
  const indexPath = join(toolRoot, 'atlas-index.json');
  const previous = existsSync(indexPath) ? JSON.parse(read(indexPath)) : null;
  const pendingPath = join(toolRoot, 'atlas-pending.json');
  const pending = existsSync(pendingPath) ? JSON.parse(read(pendingPath)) : null;
  const notes = render(snapshot, catalog);
  const graph = checkGraph(snapshot, catalog, notes);
  graph.issues.push(...checkNameCollisions(notes, markdownFiles(realpathSync(vault)), Object.keys(previous?.notes ?? {})));
  if (graph.issues.length) throw new Error(`atlas/graph-contract: ${graph.issues.slice(0, 10).join(', ')}`);
  const mapping = {};
  if (previous) for (const path of Object.keys(previous.notes)) {
    const text = read(safePath(realpathSync(vault), path));
    const kind = text.match(/^atlas_kind: (folder|file)$/mu)?.[1];
    const repo = text.match(/^repo: ([\w-]+)$/mu)?.[1];
    const source = text.match(/^source_path: (.+)$/mu)?.[1];
    if (!text.includes(generatedHeader) || !kind || !repositories.includes(repo) || !source) throw new Error(`atlas/migration-identity-missing: ${path}`);
    let sourcePath;
    try { sourcePath = JSON.parse(source); } catch { throw new Error(`atlas/migration-identity-invalid: ${path}`); }
    const target = kind === 'folder' ? folderNote(repo, sourcePath) : fileNote(repo, sourcePath);
    if (path !== target) mapping[path] = target;
  }
  const summary = Object.fromEntries(Object.entries(snapshot.repositories).map(([repo, data]) => [repo, { files: data.files.length, folders: data.folders.length, fileNotes: data.files.filter(file => Object.hasOwn(notes, fileNote(repo, file.path))).length, individualDescriptions: data.files.filter(file => catalog.files[`${repo}/${file.path}`]).length, sourceSpecificDescriptions: data.files.filter(file => catalog.files[`${repo}/${file.path}`] || file.jsonKeys.length || file.testNames.length).length, boundaries: data.boundaries.length, excluded: data.excluded.length }]));
  if (command === 'preview') { console.log(JSON.stringify({ summary, generatedNotes: Object.keys(notes).length, graph, legacyNamesToMigrate: Object.keys(mapping).length, interruptedBatch: Boolean(pending), flowReviews: catalog.flows.map(flow => ({ name: flow.name, currentDigest: flowDigest(snapshot, catalog, flow), reviewedDigest: flow.reviewedDigest ?? null })), changes: previous ? compare(previous, snapshot) : 'initial' }, null, 2)); return; }
  if (command === 'check') {
    if (!previous) throw new Error('atlas/missing-baseline');
    const changes = compare(previous, snapshot);
    const issues = checkNotes(vault, previous);
    const actualNotes = Object.fromEntries(Object.keys(notes).filter(path => existsSync(safePath(realpathSync(vault), path))).map(path => [path, read(safePath(realpathSync(vault), path))]));
    const actualGraph = checkGraph(snapshot, catalog, actualNotes);
    issues.push(...actualGraph.issues);
    if (pending) issues.push('interrupted-batch; rerun build after source and narrative review');
    const expected = Object.keys(notes);
    for (const path of expected) if (!Object.hasOwn(previous.notes, path)) issues.push(`unmapped-note: ${path}`);
    for (const path of Object.keys(previous.notes)) if (!Object.hasOwn(notes, path)) issues.push(`orphaned-note: ${path}`);
    if (previous.catalogHash !== catalogHash) issues.push('catalog-changed-needs-render-review');
    console.log(JSON.stringify({ summary, graph: actualGraph, changes, affectedFlows: affectedFlows(changes, catalog), issues, semanticReview: 'Source hashes, static import edges and structure only; no runtime or semantic PASS.' }, null, 2));
    if (changes.length || issues.length) process.exitCode = 1;
    return;
  }
  if (previous) {
    const changes = compare(previous, snapshot);
    const changed = changes.filter(item => item.kind === 'changed-needs-review' && catalog.files[`${item.repo}/${item.path}`]);
    const unreviewed = changed.filter(item => catalog.files[`${item.repo}/${item.path}`].reviewedHash !== snapshot.repositories[item.repo].files.find(file => file.path === item.path)?.sha256);
    if (unreviewed.length) throw new Error(`atlas/curated-source-review-required: ${unreviewed.map(item => `${item.repo}/${item.path}`).join(', ')}`);
    const staleFlows = affectedFlows(changes, catalog).filter(name => {
      const flow = catalog.flows.find(item => item.name === name);
      return flow.reviewedDigest !== flowDigest(snapshot, catalog, flow);
    });
    if (staleFlows.length) throw new Error(`atlas/flow-review-required: ${staleFlows.join(', ')}`);
  }
  const accepted = { ...previous?.notes };
  for (const [path, digest] of Object.entries(pending?.notes ?? {})) accepted[path] = [accepted[path], digest].flat().filter(Boolean);
  const plannedHashes = Object.fromEntries(Object.entries(notes).map(([path, text]) => [path, hash(text)]));
  let hashes;
  let migration;
  if (hash(read(catalogPath)) !== catalogHash) throw new Error('atlas/catalog-changed-during-capture; review a new capture before writing');
  if (command === 'migrate-names' && Object.keys(mapping).length) {
    if (!previous || !Object.keys(mapping).length || pending) throw new Error('atlas/migration-requires-legacy-baseline-without-pending-build');
    const journalDir = safePath(workspace, `patternly/.agent/private/docAtlas-names-${hash(read(indexPath)).slice(0, 12)}`);
    mkdirSync(journalDir, { recursive: true });
    const backup = safePath(journalDir, 'atlas-index-before.json');
    const before = read(indexPath);
    if (existsSync(backup) && read(backup) !== before) throw new Error('atlas/migration-baseline-changed');
    if (!existsSync(backup)) atomicWrite(backup, before);
    migration = migrateNameNotes({ vault, journalDir, previous: previous.notes, notes, mapping });
    hashes = migration.hashes;
  } else {
    hashes = writeAtlas(vault, notes, accepted, () => atomicWrite(pendingPath, `${JSON.stringify({ schemaVersion: 'patternly-atlas-pending-v1', notes: plannedHashes }, null, 2)}\n`));
  }
  const { workspace: localWorkspace, ...portableSnapshot } = snapshot;
  atomicWrite(indexPath, `${JSON.stringify({ ...portableSnapshot, noteLayoutVersion: 2, catalogHash, notes: hashes }, null, 2)}\n`);
  if (existsSync(pendingPath)) unlinkSync(pendingPath);
  if (migration) atomicWrite(join(dirname(migration.journalPath), 'committed.json'), `${JSON.stringify({ indexHash: hash(read(indexPath)), renamedNotes: migration.renamedNotes, rewrittenManualNotes: migration.rewrittenManualNotes }, null, 2)}\n`);
  console.log(JSON.stringify({ summary, graph, generatedNotes: Object.keys(notes).length, migration: migration ? { renamedNotes: migration.renamedNotes, rewrittenManualNotes: migration.rewrittenManualNotes } : null, status: 'STRUCTURE_MAPPED_NOT_RUNTIME_VERIFIED' }, null, 2));
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (args.some(arg => !arg.startsWith('--vault=') && !arg.startsWith('--workspace='))) throw new Error('atlas/usage: preview|build|check|migrate-names [--vault=path] [--workspace=path]');
  const workspace = resolve(args.find(arg => arg.startsWith('--workspace='))?.slice(12) ?? defaultWorkspace);
  const vault = args.find(arg => arg.startsWith('--vault='))?.slice(8);
  await runAtlas(command, { workspace, vault });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {
  // Report only stage and relative path; do not dump SDK errors, source text or credentials.
  console.error(error instanceof Error && error.message.startsWith('atlas/') ? error.message : 'atlas/operation-failed; inspect paths, permissions and installed TypeScript');
  process.exitCode = 1;
});
