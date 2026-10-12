import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import test from "node:test";
import ts from "typescript";

// Follow runtime edges, including barrels: a presentation fixture must not load data owners.
function presentationDependencies(roots: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const queue = roots.map((path) => resolve(path));
  while (queue.length > 0) {
    const path = queue.pop()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const name = relative(process.cwd(), path);
    assert.doesNotMatch(name, /^src\/(?:application|storage|infrastructure\/(?:storage|firebase|clients|network))\//, name);
    assert.doesNotMatch(name, /AppPreferencesProvider|RegularApplicationRoot|Persist13ResetFixtureRoot/, name);
    if (path.endsWith(".json") || path.endsWith(".svg")) continue;
    const tree = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    for (const statement of tree.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      if (ts.isImportDeclaration(statement)) {
        const clause = statement.importClause;
        if (clause?.isTypeOnly) continue;
        if (clause && !clause.name && clause.namedBindings && ts.isNamedImports(clause.namedBindings)
          && clause.namedBindings.elements.every((element) => element.isTypeOnly)) continue;
      } else if (statement.isTypeOnly || (statement.exportClause && ts.isNamedExports(statement.exportClause)
        && statement.exportClause.elements.every((element) => element.isTypeOnly))) continue;
      const specifier = statement.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier)) continue;
      const moduleName = specifier.text;
      assert.doesNotMatch(moduleName, /firebase|purchases|expo-file-system/, `${name}: ${moduleName}`);
      if (!moduleName.startsWith(".")) continue;
      const base = resolve(dirname(path), moduleName);
      const target = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find((candidate) => existsSync(candidate) && /\.(?:tsx?|json|svg)$/.test(candidate));
      assert.ok(target, `unresolved presentation dependency: ${name}: ${moduleName}`);
      queue.push(target);
    }
    const inspect = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        assert.ok(!["require", "fetch"].includes(node.expression.text), `${name}: forbidden runtime effect ${node.expression.text}`);
      }
      ts.forEachChild(node, inspect);
    };
    inspect(tree);
  }
  return seen;
}

test("PERF-06 actual presenters and preferences context cannot reach storage or account providers", () => {
  const dependencies = presentationDependencies([
    "src/features/home/ActivityView.tsx",
    "src/features/review/MistakesReviewView.tsx",
    "src/preferences/appPreferencesContext.tsx",
    "src/testing/Perf06ListFixtureRoot.smoke.tsx",
  ]);
  assert.ok(dependencies.has(resolve("src/components/Screen.tsx")));
  assert.ok(dependencies.has(resolve("src/components/ListRow.tsx")));
  assert.ok(dependencies.has(resolve("src/preferences/appPreferencesContext.tsx")));
});
