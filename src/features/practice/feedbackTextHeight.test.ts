import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

import { createOneTimeTextMinimumHeight, textMeasurementKey } from "../../components/textLayoutHeight";

const practiceFeedbackSource = readFileSync(new URL("./PracticeFeedbackBlock.tsx", import.meta.url), "utf8");

test("feedback text minimum height rounds above the measured physical-pixel boundary", () => {
  const measure = createOneTimeTextMinimumHeight(3);
  assert.equal(measure(219.9998779296875), 220 + 1 / 3);
});

test("feedback height measurement ignores invalid initial layouts and then applies only once", () => {
  const measure = createOneTimeTextMinimumHeight(3);
  assert.equal(measure(0), undefined);
  assert.equal(measure(Number.NaN), undefined);
  assert.equal(measure(219.9998779296875), 220 + 1 / 3);
  assert.equal(measure(300), undefined, "a later onLayout cannot grow the minimum again");
  assert.equal(createOneTimeTextMinimumHeight(0)(220), undefined);
  assert.equal(createOneTimeTextMinimumHeight(Number.NaN)(220), undefined);
});

test("measurement context changes when text or layout geometry changes", () => {
  const base = textMeasurementKey("Authored explanation", 328, 3.571, 3);
  assert.equal(base, textMeasurementKey("Authored explanation", 328, 3.571, 3));
  assert.notEqual(base, textMeasurementKey("Updated explanation", 328, 3.571, 3));
  assert.notEqual(base, textMeasurementKey("Authored explanation", 320, 3.571, 3));
  assert.notEqual(base, textMeasurementKey("Authored explanation", 328, 2, 3));
  assert.notEqual(base, textMeasurementKey("Authored explanation", 328, 3.571, 2));
});

test("actual FeedbackTextLayout applies one measured minimum and its child key resets by context", () => {
  const file = ts.createSourceFile("PracticeFeedbackBlock.tsx", practiceFeedbackSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = new Map<string, ts.FunctionDeclaration>();
  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.name) declarations.set(node.name.text, node);
    ts.forEachChild(node, visit);
  };
  visit(file);

  const layoutFunction = declarations.get("FeedbackTextLayout");
  const wrapperFunction = declarations.get("FeedbackText");
  assert.ok(layoutFunction);
  assert.ok(wrapperFunction);

  const transpile = (declaration: ts.FunctionDeclaration) => ts.transpileModule(declaration.getFullText(file), {
    compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: "jsx", target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const hostJsx = (type: unknown, props: Record<string, unknown>, ...children: unknown[]) => ({
    type,
    props: { ...props, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) },
  });

  let hookIndex = 0;
  const hookValues: unknown[] = [];
  const setterCalls: unknown[] = [];
  const useState = <T,>(initial: T | (() => T)): [T, (value: T) => void] => {
    const index = hookIndex++;
    if (!(index in hookValues)) hookValues[index] = typeof initial === "function" ? (initial as () => T)() : initial;
    return [hookValues[index] as T, (value) => { hookValues[index] = value; setterCalls.push(value); }];
  };
  const layoutFactory = new Function("useState", "createOneTimeTextMinimumHeight", "jsx", "Text", `${transpile(layoutFunction)}; return FeedbackTextLayout;`)(
    useState,
    createOneTimeTextMinimumHeight,
    hostJsx,
    "Text",
  ) as (props: { physicalScale: number; style: unknown; text: string }) => { type: string; props: Record<string, unknown> };

  const renderLayout = () => {
    hookIndex = 0;
    return layoutFactory({ physicalScale: 3, style: "body-style", text: "Authored explanation." });
  };
  const first = renderLayout();
  assert.equal(first.type, "Text");
  assert.equal(first.props.maxFontSizeMultiplier, 2);
  assert.equal(first.props.style, "body-style");
  (first.props.onLayout as (event: unknown) => void)({ nativeEvent: { layout: { height: 219.9998779296875 } } });

  const second = renderLayout();
  assert.deepEqual(second.props.style, ["body-style", { minHeight: 220 + 1 / 3 }]);
  (second.props.onLayout as (event: unknown) => void)({ nativeEvent: { layout: { height: 300 } } });
  assert.deepEqual(setterCalls, [220 + 1 / 3], "the rendered component uses the one-shot measurement policy");

  const wrapperFactory = new Function("jsx", "FeedbackTextLayout", `${transpile(wrapperFunction)}; return FeedbackText;`)(
    hostJsx,
    "FeedbackTextLayout",
  ) as (props: { contextKey: string; physicalScale: number; style: unknown; text: string }) => { type: string; props: Record<string, unknown> };
  const previousContext = wrapperFactory({ contextKey: "text,width,font,scale-a", physicalScale: 3, style: "body-style", text: "Authored explanation." });
  const nextContext = wrapperFactory({ contextKey: "text,width,font,scale-b", physicalScale: 2, style: "body-style", text: "Authored explanation." });
  assert.equal(previousContext.props.key, "text,width,font,scale-a");
  assert.equal(nextContext.props.key, "text,width,font,scale-b");
});

test("both feedback text paths preserve outer sibling identity and use the shared measurement wrapper", () => {
  const file = ts.createSourceFile("PracticeFeedbackBlock.tsx", practiceFeedbackSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const feedbackNodes: ts.JsxSelfClosingElement[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(file) === "FeedbackText") feedbackNodes.push(node);
    ts.forEachChild(node, visit);
  };
  visit(file);
  assert.equal(feedbackNodes.filter((node) => node.getText(file).includes("key=")).length, 2);
  const source = feedbackNodes.map((node) => node.getText(file)).join("\n");
  assert.match(source, /key=\{`\$\{message\.kind\}:\$\{message\.targetId\}`\}/);
  assert.match(source, /key=\{`detail:\$\{index\}`\}/);
  assert.equal((source.match(/textMeasurementKey\(/g) ?? []).length, 5);
  assert.doesNotMatch(practiceFeedbackSource, /native28-layout-probe|gcp-ace-gcpace-n01-b03-001|minHeight:\s*221/);
});


test("Source text adapters reset measured layout by geometry and retain the actual link semantics", async () => {
  const file = ts.createSourceFile("PracticeFeedbackBlock.tsx", practiceFeedbackSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const texts: ts.JsxSelfClosingElement[] = [];
  let link: ts.JsxOpeningElement | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(file) === "FeedbackText" && node.getText(file).includes("styles.source")) texts.push(node);
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(file) === "Pressable") link = node;
    ts.forEachChild(node, visit);
  };
  visit(file);
  assert.equal(texts.length, 3);
  const expression = (node: ts.JsxSelfClosingElement | ts.JsxOpeningElement, name: string) => {
    const attribute = node.attributes.properties.find((p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText(file) === name);
    assert.ok(attribute?.initializer);
    if (ts.isStringLiteral(attribute.initializer)) return JSON.stringify(attribute.initializer.text);
    assert.ok(ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression);
    return attribute.initializer.expression.getText(file);
  };
  const source = { host: "www.omg.org", url: "https://www.omg.org/spec/UML/2.5.1/PDF" };
  for (const node of texts) {
    const evaluate = (name: string, fontScale: number) => new Function("t", "source", "windowWidth", "fontScale", "windowScale", "textMeasurementKey", `return (${expression(node, name)});`)((s: string) => s, source, 328, fontScale, 3, textMeasurementKey);
    const text = evaluate("text", 1);
    assert.equal(evaluate("contextKey", 1), textMeasurementKey(text, 328, 1, 3));
    assert.notEqual(evaluate("contextKey", 1), evaluate("contextKey", 3.571));
    assert.equal(evaluate("physicalScale", 1), 3);
  }
  assert.ok(link);
  const evaluateLink = (name: string) => new Function("t", "source", "itemId", "index", `return (${expression(link!, name)});`)((s: string) => s, source, "item", 0);
  assert.equal(evaluateLink("accessibilityRole"), "link");
  assert.equal(evaluateLink("accessibilityLabel"), "Open source www.omg.org");
  assert.equal(evaluateLink("testID"), "question-source-link-item-0");
  const changes: boolean[] = [];
  const opened: string[] = [];
  const onPress = new Function("source", "setSourceError", "openCanonicalSourceLink", "openSource", `return (${expression(link, "onPress")});`)(source, (value: boolean) => changes.push(value), async (linkSource: typeof source, open: (url: string) => Promise<void>) => { await open(linkSource.url); return "opened"; }, async (url: string) => { opened.push(url); });
  onPress();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(opened, [source.url]);
  assert.deepEqual(changes, [false, false]);
});
