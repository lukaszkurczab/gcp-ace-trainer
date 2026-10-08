import type { TrainingSessionIdentityPort, TrainingSessionIdentityRequest } from "../../application/trainingLifecycle";
import { createIdentityNonce } from "./identityNonce";
import { formatTrainingSessionIdentity } from "./trainingSessionIdentityFormat";

export const trainingSessionIdentity: TrainingSessionIdentityPort = Object.freeze({
  async create(input: TrainingSessionIdentityRequest) {
    try {
      return formatTrainingSessionIdentity({ ...input, uuid: createIdentityNonce() });
    } catch (cause) {
      throw new Error("Training session identity generation failed.", { cause });
    }
  },
});
