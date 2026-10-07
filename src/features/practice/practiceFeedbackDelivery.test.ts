import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { buildPracticeResponseControl, practiceOptionCorrectnessValue } from "./practiceSessionPresentation";
import { textMeasurementKey } from "../../components/textLayoutHeight";

const certificationSource = readFileSync(new URL("./CertificationPracticeSessionScreen.tsx", import.meta.url), "utf8");
const codingSource = readFileSync(new URL("./PracticeSessionScreen.tsx", import.meta.url), "utf8");
const designSource = readFileSync(new URL("./DesignInterviewPracticeScreen.tsx", import.meta.url), "utf8");
const feedbackBlockSource = readFileSync(new URL("./PracticeFeedbackBlock.tsx", import.meta.url), "utf8");

function jsxAttributeExpression(source: string, componentName: string, attributeName: string): string {
  const file = ts.createSourceFile("screen.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      if (node.tagName.getText(file) === componentName) {
        const attribute = node.attributes.properties.find((property): property is ts.JsxAttribute => ts.isJsxAttribute(property) && property.name.getText(file) === attributeName);
        if (attribute?.initializer && ts.isJsxExpression(attribute.initializer)) expression = attribute.initializer.expression;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  assert.ok(expression, `${componentName}.${attributeName} JSX expression exists`);
  return expression.getText(file);
}

test("both practice JSX adapters pass authored message arrays through unchanged", () => {
  const messages = Object.freeze([{ kind: "wrong_option", targetId: "wrong", text: "Authored explanation." }]);
  const certExpression = jsxAttributeExpression(certificationSource, "PracticeSessionSurface", "feedback");
  const certificationFeedback = new Function("feedback", `return (${certExpression});`)(
    { details: "details", messages, reason: "reason", result: "incorrect", sources: [] },
  ) as { messages: typeof messages };
  assert.equal(certificationFeedback.messages, messages);

  const codingExpression = jsxAttributeExpression(codingSource, "PracticeSessionSurface", "feedback");
  const codingFeedback = new Function("projection", `return (${codingExpression});`)({
    session: { configurationSnapshot: { feedbackMode: "afterEachAnswer" } },
    feedback: { correctness: "incorrect", details: "details", messages, reason: "reason", sources: [] },
  }) as { messages: typeof messages };
  assert.equal(codingFeedback.messages, messages);
});

test("Design practice JSX adapter forwards optional choice and ordering messages only from existing feedback", () => {
  const choiceMessages = Object.freeze([{ kind: "wrong_option", targetId: "wrong", text: "Authored choice explanation." }]);
  const expression = jsxAttributeExpression(designSource, "PracticeSessionSurface", "feedback");
  const adapter = new Function("projection", `return (${expression});`);
  const choiceDelivered = adapter({ feedback: { details: "details", messages: choiceMessages, reason: "reason", result: "incorrect", sources: [] } }) as { messages: typeof choiceMessages };
  assert.equal(choiceDelivered.messages, choiceMessages);

  const messages = Object.freeze([{ kind: "broken_relation", targetId: "preserve->expose", text: "Authored relation explanation." }]);
  const delivered = adapter({ feedback: { details: "details", messages, reason: "reason", result: "partial", sources: [] } }) as { messages: typeof messages };
  assert.equal(delivered.messages, messages);
  assert.equal(adapter({ feedback: null }), undefined);
});

test("Details JSX gates authored messages on expansion and keeps their text scalable", () => {
  const file = ts.createSourceFile("PracticeFeedbackBlock.tsx", feedbackBlockSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const detailsConditionals: ts.ConditionalExpression[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isConditionalExpression(node) && node.condition.getText(file) === "detailsOpen") detailsConditionals.push(node);
    ts.forEachChild(node, visit);
  };
  visit(file);
  const expandedBranch = detailsConditionals.find((node) => node.whenTrue.getText(file).includes("feedback.messages?.map"));
  assert.ok(expandedBranch, "expanded Details branch renders feedback messages");
  assert.equal(expandedBranch.whenFalse.kind, ts.SyntaxKind.NullKeyword);
  const expression = `(${expandedBranch.getText(file)})`;
  const javascript = ts.transpileModule(`return ${expression};`, {
    compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: "jsx", target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const hostJsx = (type: unknown, props: Record<string, unknown>, ...children: unknown[]) => ({
    type,
    props: { ...props, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) },
  });
  const runtimeSelectors = { session: { details: (id: string) => `details-${id}` } };
  const detailLines = () => [];
  const evaluate = (detailsOpen: boolean) => new Function(
    "detailsOpen", "jsx", "View", "Text", "Pressable", "FeedbackText", "textMeasurementKey", "windowWidth", "fontScale", "windowScale", "styles", "runtimeSelectors", "itemId", "feedback", "detailLines", "sourceError", "t", "openCanonicalSourceLink", "openSource", "showReport", "ContentReportSheet", "item", "reportSurface", "setSourceError",
    javascript,
  )(
    detailsOpen, hostJsx, "View", "Text", "Pressable", "FeedbackText", textMeasurementKey, 328, 3.571, 3, { details: "details-style", sources: "sources-style", sourceLabel: "label-style", sourceUnavailable: "unavailable-style", detailText: "message-style" },
    runtimeSelectors, "item-1", { details: "details", messages: [{ kind: "wrong_option", targetId: "wrong", text: "Authored explanation." }], sources: [] },
    detailLines, false, (value: string) => value, () => "opened", async () => "opened", false, "ContentReportSheet", "item", "report", () => undefined,
  );
  const collapsed = evaluate(false);
  assert.equal(collapsed, null);
  const expanded = evaluate(true) as { type: string; props: { children: unknown } };
  assert.equal(expanded.type, "View");
  const findMessage = (value: unknown): { props: Record<string, unknown> } | undefined => {
    if (Array.isArray(value)) return value.map(findMessage).find(Boolean);
    if (!value || typeof value !== "object") return undefined;
    const element = value as { type?: unknown; props?: { children?: unknown } & Record<string, unknown> };
    if (element.type === "FeedbackText" && element.props?.text === "Authored explanation.") return { props: element.props };
    return findMessage(element.props?.children);
  };
  const messageElement = findMessage(expanded.props.children);
  assert.ok(messageElement);
  assert.equal(messageElement.props.key, "wrong_option:wrong");
  assert.equal(messageElement.props.text, "Authored explanation.");
  assert.equal(typeof messageElement.props.contextKey, "string");
});


test("Design screen response adapter delivers keyed feedback and multiple-selection semantics", () => {
  const file = ts.createSourceFile("screen.tsx", designSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let input: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.getText(file) === "buildPracticeResponseControl") input = node.arguments[0];
    ts.forEachChild(node, visit);
  };
  visit(file);
  assert.ok(input);
  const adapter = new Function("projection", "responseForProjection", "renderer", `return (${input.getText(file)});`);
  const renderer = { kind: "choice" as const, options: [{ id: "omitted", text: "Omitted" }, { id: "wrong", text: "Wrong" }, { id: "right", text: "Right" }].map((option) => ({ ...option, selected: false })) };
  for (const type of ["choice_single", "choice_multiple"]) {
    const feedback = { controls: [{ id: "right", state: "correct" }, { id: "wrong", state: "incorrect" }, { id: "omitted", state: "omitted_correct" }] };
    const control = buildPracticeResponseControl(adapter({ question: { interaction: { type } }, feedback }, null, renderer));
    assert.equal(control.kind, "choice");
    if (control.kind !== "choice") throw new Error("Expected choices");
    assert.equal(control.selectionMode, type === "choice_multiple" ? "multiple" : "single");
    assert.deepEqual(control.options.map(({ id, state }) => ({ id, state })), [{ id: "omitted", state: "omitted_correct" }, { id: "wrong", state: "incorrect" }, { id: "right", state: "correct" }]);
    assert.deepEqual(control.options.map(({ state }) => practiceOptionCorrectnessValue(state)), ["Correct answer, not selected", "Selected, incorrect", "Selected, correct"]);
    const pending = buildPracticeResponseControl(adapter({ question: { interaction: { type } }, feedback: null }, { kind: "choice", selectedOptionIds: ["wrong"] }, renderer));
    assert.equal(pending.kind, "choice");
    if (pending.kind === "choice") assert.deepEqual(pending.options.map(({ state }) => state), ["neutral", "selected", "neutral"]);
  }
});
