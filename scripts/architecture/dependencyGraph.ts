import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { createRequire, isBuiltin } from "node:module";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import ts from "typescript";
import { resolve as metroResolve, type ResolutionContext } from "metro-resolver";

export type Platform = "typescript" | "ios" | "android";
export type Edge = Readonly<{
  from: string; to: string; specifier: string; kind: "type" | "runtime";
  form: "import" | "export" | "load"; line: number; names: readonly string[];
}>;
export type Graph = ReturnType<typeof createDependencyGraph>;
const code = /\.(?:[cm]?[jt]sx?)$/u;
const test = /\.test\.[cm]?[jt]sx?$/u;

/** Uses the project's compiler settings and Metro itself, not a second extension resolver. */
export function createDependencyGraph(input: {
  root: string; platform?: Platform; mode?: "release" | "smoke"; metroRoot?: string;
}) {
  const root = realpathSync(input.root);
  const platform = input.platform ?? "typescript";
  const mode = input.mode ?? "release";
  const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  if (!configPath) throw new Error(`architecture/config: missing tsconfig in ${root}`);
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath));
  const errors = [...(config.error ? [config.error] : []), ...parsed.errors];
  if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCanonicalFileName: (file) => file, getCurrentDirectory: () => root, getNewLine: () => "\n",
  }));
  const require = createRequire(join(input.metroRoot ?? root, "package.json"));
  const metroPath = require.resolve("./metro.config.js");
  const previous = process.env.PATTERNLY_RUNTIME_MODE;
  let metro: ReturnType<typeof require>;
  try {
    process.env.PATTERNLY_RUNTIME_MODE = mode;
    delete require.cache[metroPath];
    metro = require(metroPath).resolver;
  } finally {
    if (previous === undefined) delete process.env.PATTERNLY_RUNTIME_MODE;
    else process.env.PATTERNLY_RUNTIME_MODE = previous;
    delete require.cache[metroPath];
  }
  // Expo's installed path resolver preserves wildcard precedence and extensionless native selection.
  const expoPaths = require(join(dirname(require.resolve("expo/package.json")), "node_modules/@expo/cli/build/src/start/server/metro/createTypescriptResolver.js"));
  const pathConfig = expoPaths._toResolveConfig({ paths: parsed.options.paths, baseUrl: parsed.options.baseUrl,
    pathsBasePath: parsed.options.pathsBasePath ?? dirname(configPath) }, root);
  const configuredAlias = (name: string) => Object.keys(parsed.options.paths ?? {}).some((pattern) => {
    const star = pattern.indexOf("*");
    return star < 0 ? pattern === name : name.startsWith(pattern.slice(0, star)) && name.endsWith(pattern.slice(star + 1));
  });
  const label = (file: string) => file.startsWith("npm:") ? file : relative(root, file).replaceAll("\\", "/");
  const local = (file: string) => isAbsolute(file) && !file.includes("/node_modules/") && !relative(root, file).startsWith("../");
  const cache = ts.createModuleResolutionCache(root, (file) => file, parsed.options);
  const tsResolve = (name: string, from: string) => ts.resolveModuleName(name, from, parsed.options, ts.sys, cache).resolvedModule;
  function resolveModule(name: string, from: string, kind: Edge["kind"]): string {
    const typed = tsResolve(name, from);
    const external = () => {
      if (!isBuiltin(name) && !typed) {
        try { require.resolve(name, { paths: [dirname(from), input.metroRoot ?? root] }); }
        catch (cause) { throw new Error(`architecture/resolve: ${label(from)} -> ${name} (external ${kind})`, { cause }); }
      }
      return `npm:${name}`;
    };
    if (platform === "typescript" || kind === "type") {
      if (typed) return typed.isExternalLibraryImport ? `npm:${name}` : resolve(typed.resolvedFileName);
      if (!name.startsWith(".") && !isAbsolute(name) && !configuredAlias(name)) return external();
      const asset = resolve(dirname(from), name);
      if (existsSync(asset) && !code.test(asset)) return asset;
      throw new Error(`architecture/resolve: ${label(from)} -> ${name} (${kind}, ${platform})`);
    }
    // Package implementation internals are outside app ownership. TS still resolves aliases/config.
    if (typed?.isExternalLibraryImport || (!name.startsWith(".") && !isAbsolute(name) && !typed && !configuredAlias(name) && !parsed.options.baseUrl)) return external();
    const context: ResolutionContext = {
      ...metro, allowHaste: false, assetExts: new Set(metro.assetExts), customResolverOptions: {},
      dev: mode === "smoke", originModulePath: from, preferNativePlatform: true,
      mainFields: metro.resolverMainFields, nodeModulesPaths: metro.nodeModulesPaths ?? [],
      getPackage: (path) => existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null,
      getPackageForModule: (file) => {
        let directory = dirname(file);
        while (true) {
          const path = join(directory, "package.json");
          if (existsSync(path)) return { rootPath: directory, packageJson: JSON.parse(readFileSync(path, "utf8")), packageRelativePath: relative(directory, file) };
          const parent = dirname(directory);
          if (parent === directory || directory.endsWith("/node_modules")) return null;
          directory = parent;
        }
      },
      fileSystemLookup: (path) => {
        try {
          if (metro.blockList?.some((pattern: RegExp) => pattern.test(path))) return { exists: false };
          return { exists: true, type: statSync(path).isDirectory() ? "d" : "f", realPath: realpathSync(path) };
        }
        catch { return { exists: false }; }
      },
      doesFileExist: (path) => ts.sys.fileExists(path), redirectModulePath: (path) => path,
      resolveAsset: (directory, name, extension) => {
        const file = join(directory, `${name}${extension}`);
        return existsSync(file) ? [file] : null;
      },
      resolveHasteModule: () => null, resolveHastePackage: () => null,
      unstable_logWarning: (message) => { throw new Error(`architecture/metro: ${message}`); },
    };
    try {
      const alias = pathConfig && !name.startsWith(".") && !isAbsolute(name)
        ? expoPaths._resolveWithTsConfigPaths(pathConfig, name, (candidate: string) => {
          try { return metroResolve(context, candidate, platform); }
          catch (error) {
            if (error instanceof Error && ["FailedToResolvePathError", "FailedToResolveNameError"].includes(error.constructor.name)) return null;
            throw error;
          }
        }) : null;
      const result = alias ?? metroResolve(context, name, platform);
      if (result.type === "sourceFile") return resolve(result.filePath);
      if (result.type === "assetFiles") return result.filePaths[0] ?? `npm:${name}`;
      throw new Error("empty module");
    } catch (cause) {
      throw new Error(`architecture/resolve: ${label(from)} -> ${name} (${kind}, ${platform}/${mode})`, { cause });
    }
  }
  const analysisOptions = { ...parsed.options, noResolve: true, noLib: true, types: [] };
  const host = ts.createCompilerHost(analysisOptions, true);
  host.resolveModuleNames = (names, from) => names.map((name) => {
    const typed = tsResolve(name, from);
    if (!local(from) || platform === "typescript") return typed;
    const target = resolveModule(name, from, "runtime");
    if (!local(target) || !code.test(target)) return typed;
    return { resolvedFileName: target, isExternalLibraryImport: false };
  });
  const program = ts.createProgram(parsed.fileNames.filter((file) => local(file) && code.test(file) && !test.test(file) && !label(file).startsWith("scripts/")), analysisOptions, host);
  const checker = program.getTypeChecker();
  const edges = new Map<string, Edge[]>();
  const unresolved: { file: string; detail: string }[] = [];
  const addSource = (source: ts.SourceFile) => {
    const from = resolve(source.fileName);
    if (!local(from) || test.test(from) || edges.has(from)) return;
    const outgoing: Edge[] = [];
    edges.set(from, outgoing);
    const add = (expression: ts.Node | undefined, node: ts.Node, kind: Edge["kind"], form: Edge["form"], names: string[]) => {
      if (!expression || !ts.isStringLiteralLike(expression)) {
        unresolved.push({ file: from, detail: `architecture/static-load: ${label(from)}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}` });
        return;
      }
      const to = resolveModule(expression.text, from, kind);
      outgoing.push({ from, to, specifier: expression.text, kind, form, names,
        line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
    };
    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node)) {
        const clause = node.importClause;
        const named = clause?.namedBindings;
        const bindings: ts.Node[] = [...(clause?.name ? [clause.name] : []), ...(named ? ts.isNamedImports(named) ? named.elements : [named] : [])];
        const types = bindings.filter((binding) => clause?.isTypeOnly || (ts.isImportSpecifier(binding) && binding.isTypeOnly));
        const runtime = bindings.filter((binding) => !types.includes(binding));
        const names = (nodes: ts.Node[]) => nodes.map((binding) => ts.isImportSpecifier(binding) ? (binding.propertyName ?? binding.name).text : ts.isNamespaceImport(binding) ? "*" : "default");
        if (types.length || clause?.isTypeOnly) add(node.moduleSpecifier, node, "type", "import", names(types));
        if (runtime.length || (!clause?.isTypeOnly && !bindings.length)) add(node.moduleSpecifier, node, "runtime", "import", names(runtime));
      } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        const named = node.exportClause && ts.isNamedExports(node.exportClause) ? [...node.exportClause.elements] : [];
        const types = named.filter((binding) => node.isTypeOnly || binding.isTypeOnly);
        const runtime = named.filter((binding) => !types.includes(binding));
        const names = (nodes: ts.ExportSpecifier[]) => nodes.map((binding) => (binding.propertyName ?? binding.name).text);
        if (types.length || node.isTypeOnly) add(node.moduleSpecifier, node, "type", "export", names(types));
        if (runtime.length || (!node.isTypeOnly && !named.length)) add(node.moduleSpecifier, node, "runtime", "export", names(runtime));
      } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
        add(node.moduleReference.expression, node, node.isTypeOnly ? "type" : "runtime", "import", []);
      } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
        add(node.argument.literal, node, "type", "import", node.qualifier ? [node.qualifier.getText(source)] : []);
      } else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
        add(node.arguments[0], node, "runtime", "load", []);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  };
  for (const source of program.getSourceFiles()) addSource(source);
  // Assets and JS files selected by Metro may not be part of the TS program.
  for (const outgoing of edges.values()) for (const edge of outgoing) {
    if (local(edge.to) && code.test(edge.to) && !edges.has(edge.to)) {
      addSource(ts.createSourceFile(edge.to, readFileSync(edge.to, "utf8"), ts.ScriptTarget.Latest, true));
    }
  }
  const origins = (edge: Edge): { file: string; symbol: string; kind: Edge["kind"] }[] => {
    const result: { file: string; symbol: string; kind: Edge["kind"] }[] = [];
    const seen = new Set<ts.Symbol>();
    const inspect = (symbol: ts.Symbol | undefined) => {
      if (!symbol) return;
      if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
      if (seen.has(symbol)) return;
      seen.add(symbol);
      for (const declaration of symbol.declarations ?? []) {
        let initializer = ts.isVariableDeclaration(declaration) ? declaration.initializer : undefined;
        while (initializer && (ts.isParenthesizedExpression(initializer) || ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer) || ts.isNonNullExpression(initializer))) initializer = initializer.expression;
        const alias = initializer && (ts.isIdentifier(initializer) || ts.isPropertyAccessExpression(initializer)) ? checker.getSymbolAtLocation(initializer) : undefined;
        if (alias && alias !== symbol) inspect(alias);
        else result.push({ file: resolve(declaration.getSourceFile().fileName), symbol: symbol.name, kind: (symbol.flags & ts.SymbolFlags.Value) ? edge.kind : "type" });
      }
    };
    const source = program.getSourceFile(edge.to);
    const symbol = source && checker.getSymbolAtLocation(source);
    if (symbol) for (const exported of checker.getExportsOfModule(symbol)) {
      if (!edge.names.length || edge.names.includes("*") || edge.names.includes(exported.name)) inspect(exported);
    }
    return result;
  };
  const typeUseCache = new Map<string, readonly string[]>();
  function typeNames(edge: Edge): readonly string[] {
    const key = `${edge.from}:${edge.specifier}`;
    const cached = typeUseCache.get(key);
    if (cached !== undefined) return cached;
    const names = new Set<string>();
    const source = program.getSourceFile(edge.from);
    const visit = (node: ts.Node, withinType = false): void => {
      const typePosition = withinType || ts.isTypeNode(node) || ts.isHeritageClause(node);
      if (typePosition && ts.isIdentifier(node)) {
        const symbol = checker.getSymbolAtLocation(node);
        for (const declaration of symbol?.declarations ?? []) {
          if (!ts.isImportSpecifier(declaration) && !ts.isImportClause(declaration) && !ts.isNamespaceImport(declaration) && !ts.isImportEqualsDeclaration(declaration)) continue;
          let statement: ts.Node | undefined = declaration;
          while (statement && !ts.isImportDeclaration(statement) && !ts.isImportEqualsDeclaration(statement)) statement = statement.parent;
          const specifier = statement && ts.isImportDeclaration(statement) ? statement.moduleSpecifier
            : statement && ts.isImportEqualsDeclaration(statement) && ts.isExternalModuleReference(statement.moduleReference) ? statement.moduleReference.expression : undefined;
          if (!specifier || !ts.isStringLiteralLike(specifier) || specifier.text !== edge.specifier) continue;
          if (ts.isImportSpecifier(declaration)) names.add((declaration.propertyName ?? declaration.name).text);
          else if (ts.isImportClause(declaration)) names.add("default");
          else if (ts.isQualifiedName(node.parent) && node.parent.left === node) names.add(node.parent.right.text);
          else if (ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node) names.add(node.parent.name.text);
          else names.add("*");
        }
      }
      ts.forEachChild(node, child => visit(child, typePosition));
    };
    if (source) visit(source);
    const result = [...names];
    typeUseCache.set(key, result);
    return result;
  }
  function reachable(entries: readonly string[], includeTypes = false): Set<string> {
    const seen = new Set<string>();
    const pending = entries.map((file) => resolve(root, file));
    while (pending.length) {
      const file = pending.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      for (const edge of edges.get(file) ?? []) if (includeTypes || edge.kind === "runtime") pending.push(edge.to);
    }
    return seen;
  }
  return { root, platform, mode, edges, origins, label, local, reachable, unresolved, resolveModule, typeNames };
}
