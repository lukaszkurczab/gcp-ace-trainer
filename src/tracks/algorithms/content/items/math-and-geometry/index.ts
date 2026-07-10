import { recognizeMathAndGeometrySignalQuestions } from "./recognize-math-and-geometry-signal";
import { integerDivisionModuloAndDigitsQuestions } from "./integer-division-modulo-and-digits";
import { gcdLcmAndDivisibilityQuestions } from "./gcd-lcm-and-divisibility";
import { primesFactorsAndSieveQuestions } from "./primes-factors-and-sieve";
import { countingPermutationsAndCombinationsQuestions } from "./counting-permutations-and-combinations";
import { coordinatesVectorsAndDistanceQuestions } from "./coordinates-vectors-and-distance";
import { orientationCrossProductAndCollinearityQuestions } from "./orientation-cross-product-and-collinearity";
import { segmentsBoundariesAndPointMembershipQuestions } from "./segments-boundaries-and-point-membership";
import { rectanglesOverlapAndAreaQuestions } from "./rectangles-overlap-and-area";
import { matrixAndCoordinateTransformationsQuestions } from "./matrix-and-coordinate-transformations";
import { numericPrecisionOverflowAndExactnessQuestions } from "./numeric-precision-overflow-and-exactness";
import { complexityAndMistakeReviewQuestions } from "./complexity-and-mistake-review";

export const mathAndGeometryQuestions = [
  ...recognizeMathAndGeometrySignalQuestions,
  ...integerDivisionModuloAndDigitsQuestions,
  ...gcdLcmAndDivisibilityQuestions,
  ...primesFactorsAndSieveQuestions,
  ...countingPermutationsAndCombinationsQuestions,
  ...coordinatesVectorsAndDistanceQuestions,
  ...orientationCrossProductAndCollinearityQuestions,
  ...segmentsBoundariesAndPointMembershipQuestions,
  ...rectanglesOverlapAndAreaQuestions,
  ...matrixAndCoordinateTransformationsQuestions,
  ...numericPrecisionOverflowAndExactnessQuestions,
  ...complexityAndMistakeReviewQuestions,
];
