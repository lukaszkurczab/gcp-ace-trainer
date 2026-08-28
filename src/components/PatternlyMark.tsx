import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

import BlackMark from "../assets/brand/mark/patternly-mark-black.svg";
import MintMark from "../assets/brand/mark/patternly-mark-mint.svg";
import NavyMark from "../assets/brand/mark/patternly-mark-navy.svg";
import WhiteMark from "../assets/brand/mark/patternly-mark-white.svg";

export type PatternlyMarkTreatment = "navy" | "mint" | "black" | "white";

type PatternlyMarkProps = {
  accessibilityLabel?: string;
  decorative?: boolean;
  size?: number;
  testID?: string;
  treatment?: PatternlyMarkTreatment;
};

const marks: Record<PatternlyMarkTreatment, ComponentType<SvgProps>> = {
  black: BlackMark,
  mint: MintMark,
  navy: NavyMark,
  white: WhiteMark,
};

export function PatternlyMark({
  accessibilityLabel = "Patternly",
  decorative = true,
  size = 24,
  testID,
  treatment = "navy",
}: PatternlyMarkProps) {
  const Mark = marks[treatment];

  return (
    <Mark
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityRole={decorative ? undefined : "image"}
      height={size}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
      testID={testID}
      width={size}
    />
  );
}
