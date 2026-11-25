import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import ts from "typescript";

// A visible <Text> above a field is not announced with it, and a placeholder
// disappears once the field has a value, so every text field needs its own label.
const sourceRoot = join(process.cwd(), "src");

function listTsxSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listTsxSources(path);
    return entry.name.endsWith(".tsx") && !/\.test\./.test(entry.name) ? [path] : [];
  });
}

function unlabeledTextInputs(path: string): string[] {
  const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findings: string[] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(source) === "TextInput") {
      const labelled = node.attributes.properties.some((property) =>
        ts.isJsxSpreadAttribute(property) || property.name.getText(source) === "accessibilityLabel");
      if (!labelled) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
        findings.push(`${relative(process.cwd(), path)}:${line + 1}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return findings;
}

test("every TextInput carries an accessibility label", () => {
  const findings = listTsxSources(sourceRoot).flatMap(unlabeledTextInputs);
  assert.deepEqual(findings, []);
});
