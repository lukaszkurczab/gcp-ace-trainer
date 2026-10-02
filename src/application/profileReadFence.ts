import { getKeyValueStorage, isProfileTransitionActive } from "../infrastructure/storage/mmkvClient";

/** Existing opaque published lease; no raw data, persistent revision or retry. */
export function captureProfileReadFence(): () => void {
  const readScope = () => {
    if (isProfileTransitionActive()) throw new Error("Profile is transitioning during read.");
    return getKeyValueStorage();
  };
  const expected = readScope();
  return () => {
    if (readScope() !== expected) throw new Error("Profile changed during read.");
  };
}
