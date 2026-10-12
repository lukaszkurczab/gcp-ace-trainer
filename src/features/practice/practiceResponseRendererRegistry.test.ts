import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ReactElement } from "react";
import { createPracticeResponseRendererRegistry, PracticeResponseRendererHost, projectPracticeResponseControl, type PracticeResponseRenderer, type PracticeResponseRendererProps } from "./practiceResponseRendererRegistry";

test("an injected sixth interaction reaches its renderer as an opaque exact response model", () => {
  const model = Object.freeze({ acceptedStableIds: Object.freeze(["north", "south"]), authoredPrompt: "Choose both." });
  const renderer: PracticeResponseRenderer = (props) => createElement("test-response-control", { disabled: !props.editable, payload: props.control.model });
  const registry = createPracticeResponseRendererRegistry([["test_multi_toggle_v1", renderer]]);
  const control = Object.freeze({ interactionType: "test_multi_toggle_v1", model });
  const projected = projectPracticeResponseControl({
    control,
    editable: true,
    interactionResponse: undefined,
    onChoicePress: () => assert.fail("The injected binding does not emit the builtin choice callback."),
    onComplexityValuePress: () => assert.fail("The injected binding does not emit the builtin value callback."),
    onOrderingMove: () => assert.fail("The injected binding does not emit the builtin ordering callback."),
  }, registry);

  assert.equal(projected.type, renderer);
  const props = projected.props as PracticeResponseRendererProps;
  assert.strictEqual(props.control.model, model);
  assert.throws(() => projectPracticeResponseControl({ ...props, control: { interactionType: "unknown_v1", model } }, registry), /renderer is unavailable/u);
  assert.throws(() => createPracticeResponseRendererRegistry([["duplicate", renderer], ["duplicate", renderer]]), /invalid/u);
});

test("renderer binding preserves restored opaque response and forwards the exact change callback", () => {
  const model = Object.freeze({ acceptedStableIds: Object.freeze(["north", "south"]), authoredPrompt: "Choose both." });
  const restoredResponse = Object.freeze({ selectedIds: Object.freeze(["north", "south"]) });
  const response = Object.freeze({ selectedIds: Object.freeze(["south", "north"]) });
  let received: unknown;
  const renderer: PracticeResponseRenderer = (props) => {
    props.onInteractionResponseChange?.(response);
    return createElement("test-response-control", { disabled: !props.editable, payload: props.control.model, restoredResponse: props.interactionResponse });
  };
  const bindings = createPracticeResponseRendererRegistry([["test_multi_toggle_v1", renderer]]);
  const input: PracticeResponseRendererProps = {
    control: { interactionType: "test_multi_toggle_v1", model },
    editable: true,
    itemId: "fixture-question",
    interactionResponse: restoredResponse,
    onChoicePress: () => assert.fail("The custom response does not use the builtin choice callback."),
    onComplexityValuePress: () => assert.fail("The custom response does not use the builtin value callback."),
    onOrderingMove: () => assert.fail("The custom response does not use the builtin ordering callback."),
    onInteractionResponseChange: (value) => { received = value; },
  };
  const element = PracticeResponseRendererHost({ ...input, bindings });

  assert.equal(element.type, renderer);
  const rendered = renderer(element.props as PracticeResponseRendererProps);
  assert.ok(rendered && typeof rendered === "object" && "props" in rendered);
  const renderedProps = (rendered as ReactElement<{ disabled: boolean; payload: unknown; restoredResponse: unknown }>).props;
  assert.equal(renderedProps.disabled, false);
  assert.strictEqual(renderedProps.payload, model);
  assert.strictEqual(renderedProps.restoredResponse, restoredResponse, "The control receives the exact response restored from the durable projection.");
  assert.strictEqual(received, response);
  assert.throws(() => projectPracticeResponseControl(input, new Map()), /renderer is unavailable/u);
});
