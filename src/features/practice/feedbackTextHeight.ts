/**
 * Creates a one-shot layout measurement for a feedback Text child.
 *
 * React Native's first onLayout value is an initial frame measurement, not an
 * intrinsic-content-size API. Callers mount a fresh instance for each text and
 * layout context, then add one physical pixel above the next representable
 * point height to avoid the measured-height rounding boundary observed on iOS.
 */
export function createOneTimeFeedbackTextMinimumHeight(physicalScale: number): (measuredHeight: number) => number | undefined {
  let measured = false;
  if (!Number.isFinite(physicalScale) || physicalScale <= 0) return () => undefined;

  return (measuredHeight) => {
    if (measured || !Number.isFinite(measuredHeight) || measuredHeight <= 0) return undefined;

    const onePhysicalPixel = 1 / physicalScale;
    const roundedFrameHeight = Math.ceil(measuredHeight * physicalScale) / physicalScale;
    const minimumHeight = roundedFrameHeight + onePhysicalPixel;
    if (!Number.isFinite(minimumHeight)) return undefined;

    measured = true;
    return minimumHeight;
  };
}

export function feedbackTextMeasurementKey(text: string, width: number, fontScale: number, physicalScale: number): string {
  return JSON.stringify([text, width, fontScale, physicalScale]);
}
