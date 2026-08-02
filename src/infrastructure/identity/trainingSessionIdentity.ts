import { randomUUID } from "node:crypto";

import type { TrainingSessionIdentityPort, TrainingSessionIdentityRequest } from "../../application/trainingLifecycle";
import { formatTrainingSessionIdentity } from "./trainingSessionIdentityFormat";

export const trainingSessionIdentity: TrainingSessionIdentityPort = Object.freeze({
  async create(input: TrainingSessionIdentityRequest) {
    try {
      return formatTrainingSessionIdentity({ ...input, uuid: randomUUID() });
    } catch (cause) {
      throw new Error("Training session identity generation failed.", { cause });
    }
  },
});
