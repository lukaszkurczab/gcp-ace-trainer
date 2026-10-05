import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

import { createOneTimeTextMinimumHeight, textMeasurementKey } from "./textLayoutHeight";

// Exercises the real local Text child; native evidence remains necessary for glyph fidelity.
test("option text applies the observed iOS boundary correction once without growing on later layout", () => {
  const source = readFileSync(new URL("./AnswerOption.tsx", import.meta.url), "utf8");
  const file = ts.createSourceFile("AnswerOption.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declaration = file.statements.find((node): node is ts.FunctionDeclaration => ts.isFunctionDeclaration(node) && node.name?.text === "OptionTextLayout");
  assert.ok(declaration);
  const compiled = ts.transpileModule(declaration.getFullText(file), {
    compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: "jsx", target: ts.ScriptTarget.ES2020 },
  }).outputText;
  let hookIndex = 0;
  const values: unknown[] = [];
  const updates: unknown[] = [];
  const useState = (initial: unknown) => {
    const index = hookIndex++;
    if (!(index in values)) values[index] = typeof initial === "function" ? initial() : initial;
    return [values[index], (value: unknown) => { values[index] = value; updates.push(value); }];
  };
  const jsx = (type: unknown, props: Record<string, unknown>, child: unknown) => ({ type, props, child });
  const renderChild = new Function("useState", "createOneTimeTextMinimumHeight", "jsx", "Text", `${compiled}; return OptionTextLayout;`)(useState, createOneTimeTextMinimumHeight, jsx, "Text") as (props: unknown) => { type: string; props: Record<string, unknown>; child: string };
  const render = () => { hookIndex = 0; return renderChild({ physicalScale: 3, style: "row-text", text: "Full option ending." }); };
  const first = render();
  assert.equal(first.type, "Text");
  assert.equal(first.props.maxFontSizeMultiplier, 2);
  assert.equal(first.child, "Full option ending.");
  (first.props.onLayout as (event: unknown) => void)({ nativeEvent: { layout: { height: 307.9998779296875 } } });
  const corrected = render();
  assert.deepEqual(corrected.props.style, ["row-text", { minHeight: 308 + 1 / 3 }]);
  (corrected.props.onLayout as (event: unknown) => void)({ nativeEvent: { layout: { height: 308 + 1 / 3 } } });
  assert.deepEqual(updates, [308 + 1 / 3]);
});


test("option text remounts for badge or answer geometry while preserving the accessible control", () => {
  const source = readFileSync(new URL("./AnswerOption.tsx", import.meta.url), "utf8");
  const file = ts.createSourceFile("AnswerOption.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declaration = file.statements.find((node): node is ts.FunctionDeclaration => ts.isFunctionDeclaration(node) && node.name?.text === "AnswerOption");
  assert.ok(declaration);
  const compiled = ts.transpileModule(declaration.getFullText(file), {
    compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: "jsx", target: ts.ScriptTarget.ES2020 },
  }).outputText.replace("export function", "function");
  type Element = { type: unknown; props: Record<string, unknown>; children: Element[] };
  const jsx = (type: unknown, props: Record<string, unknown>, ...children: Element[]): Element => ({ type, props, children });
  const renderOption = new Function("useThemedStyles", "createStyles", "useWindowDimensions", "textMeasurementKey", "stateStyle", "jsx", "Pressable", "View", "Text", "OptionTextLayout", `${compiled}; return AnswerOption;`)(
    () => ({}), () => ({}), () => ({ width: 393, fontScale: 2, scale: 3 }), textMeasurementKey,
    () => null, jsx, "Pressable", "View", "Text", "OptionTextLayout",
  ) as (props: unknown) => Element;
  const props = { accessibilityLabel: "Full option", accessibilityRole: "radio", onPress: () => {}, testID: "answer-a", text: "Full option ending.", letter: "A", state: "default" };
  const original = renderOption(props);
  const repeated = renderOption(props);
  const evaluated = renderOption({ ...props, state: "correct" });
  const differentBadge = renderOption({ ...props, letter: "W" });
  const [originalText, repeatedText, evaluatedText, differentBadgeText] = [original, repeated, evaluated, differentBadge].map(control => control.children[1]);
  assert.ok(originalText && repeatedText && evaluatedText && differentBadgeText);
  assert.equal(originalText.type, "OptionTextLayout");
  assert.equal(originalText.props.key, repeatedText.props.key);
  assert.notEqual(originalText.props.key, evaluatedText.props.key);
  assert.notEqual(originalText.props.key, differentBadgeText.props.key);
  for (const control of [original, evaluated, differentBadge]) {
    assert.equal(control.type, "Pressable");
    assert.equal(control.props.key, undefined);
    assert.equal(control.props.testID, props.testID);
    assert.equal(control.props.accessibilityLabel, props.accessibilityLabel);
    assert.equal(control.props.onPress, props.onPress);
  }
});
