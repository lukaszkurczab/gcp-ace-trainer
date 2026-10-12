import { createElement, type ComponentType } from "react";

type HostComponent = ComponentType<Record<string, unknown>>;

/** Small production leaf that forwards accessible toggle semantics to its platform primitives. */
export function PracticeDimensionValueButton(props: Readonly<{
  PressableComponent: HostComponent;
  TextComponent: HostComponent;
  accessibilityLabel: string;
  checked: boolean;
  editable: boolean;
  onPress: () => void;
  style: unknown;
  text: string;
  textStyle: unknown;
  testID?: string;
}>) {
  return createElement(props.PressableComponent, {
    accessibilityLabel: props.accessibilityLabel,
    accessibilityRole: "checkbox",
    accessibilityState: { checked: props.checked, disabled: !props.editable },
    disabled: !props.editable,
    onPress: props.onPress,
    style: props.style,
    testID: props.testID,
  }, createElement(props.TextComponent, { maxFontSizeMultiplier: 2, style: props.textStyle }, props.text));
}
