/**
 * T2.2: runs the practice command after the frame that shows optimistic
 * feedback. Two frames: the first is the one React's commit is painted in;
 * the command (which can block JS for ~0.2 s on a long history) starts only
 * after it. Called from an effect, so the SLA `feedback_visible` marker's own
 * frames (registered in a layout effect) run first.
 */
export function afterFeedbackFrame(run: () => void, schedule: (callback: () => void) => unknown = requestAnimationFrame): void {
  schedule(() => { schedule(run); });
}
