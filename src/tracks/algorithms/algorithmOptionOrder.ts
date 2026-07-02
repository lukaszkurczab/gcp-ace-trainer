import { shuffleArray } from "../../utils";
import type { AlgorithmStaticMicroCheck } from "./algorithmContentTypes";

export function getShuffledAlgorithmStaticCheckOptions(
  check: AlgorithmStaticMicroCheck,
): NonNullable<AlgorithmStaticMicroCheck["options"]> {
  return check.options ? shuffleArray(check.options) : [];
}
