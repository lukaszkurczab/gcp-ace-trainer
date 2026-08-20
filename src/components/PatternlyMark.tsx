import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

import BlackMark from "../assets/brand/mark/patternly-mark-black.svg";
import BlackMicroMark from "../assets/brand/mark/patternly-mark-black-micro.svg";
import MintMark from "../assets/brand/mark/patternly-mark-mint.svg";
import MintMicroMark from "../assets/brand/mark/patternly-mark-mint-micro.svg";
import NavyMark from "../assets/brand/mark/patternly-mark-navy.svg";
import NavyMicroMark from "../assets/brand/mark/patternly-mark-navy-micro.svg";
import WhiteMark from "../assets/brand/mark/patternly-mark-white.svg";
import WhiteMicroMark from "../assets/brand/mark/patternly-mark-white-micro.svg";

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

const microMarks: Record<PatternlyMarkTreatment, ComponentType<SvgProps>> = {
  black: BlackMicroMark,
  mint: MintMicroMark,
  navy: NavyMicroMark,
  white: WhiteMicroMark,
};

export function PatternlyMark({
  accessibilityLabel = "Patternly",
  decorative = true,
  size = 24,
  testID,
  treatment = "navy",
}: PatternlyMarkProps) {
  const Mark = (size <= 24 ? microMarks : marks)[treatment];

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
