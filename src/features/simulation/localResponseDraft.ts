export type LocalResponseDraft<Response> = Readonly<{
  occurrenceId: string;
  response: Response | null;
}>;

export function resolveLocalResponseDraft<Response>(
  draft: LocalResponseDraft<Response> | null,
  occurrenceId: string | null,
  projectedResponse: Response | null,
): Response | null {
  return draft?.occurrenceId === occurrenceId ? draft.response : projectedResponse;
}

export async function runLocalResponseTransition<Response, Result>(
  draft: LocalResponseDraft<Response>,
  setDraft: (draft: LocalResponseDraft<Response> | null) => void,
  transition: () => Promise<Result>,
): Promise<Result> {
  setDraft(null);
  try {
    return await transition();
  } catch (error) {
    setDraft(draft);
    throw error;
  }
}
