export type ExamActionLaneResult<Value> =
  | Readonly<{ kind: "busy" }>
  | Readonly<{ kind: "completed"; value: Value }>;

/** Keeps draft writes and session navigation in one revision-safe lane. */
export function createExamActionLane() {
  let busy = false;

  return Object.freeze({
    isBusy: () => busy,
    run: async <Value,>(action: () => Promise<Value>): Promise<ExamActionLaneResult<Value>> => {
      if (busy) return Object.freeze({ kind: "busy" });
      busy = true;
      try {
        return Object.freeze({ kind: "completed", value: await action() });
      } finally {
        busy = false;
      }
    },
  });
}

export type ExamActionLane = ReturnType<typeof createExamActionLane>;
