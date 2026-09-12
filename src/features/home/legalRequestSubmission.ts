import type { LegalRequestKindDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";

export type LegalRequestFieldErrors = Readonly<{
  email: "emailRequired" | null;
  narrative: "narrativeRequired" | null;
}>;

type LegalRequestInput = Readonly<{
  kind: LegalRequestKindDto;
  narrative?: string;
  transactionId?: string;
}>;

type PublicLegalRequestInput = LegalRequestInput & Readonly<{ email: string }>;

type SubmitLegalRequestInput<Result> = Readonly<{
  authenticated: boolean;
  email: string;
  kind: LegalRequestKindDto;
  narrative: string;
  transactionId: string;
  onValidated: () => void;
  createLegalRequest: (input: LegalRequestInput) => Promise<Result>;
  createPublicLegalRequest: (input: PublicLegalRequestInput) => Promise<Result>;
}>;

export type SubmitLegalRequestResult<Result> =
  | Readonly<{ kind: "validation_failure"; errors: LegalRequestFieldErrors }>
  | Readonly<{ kind: "submitted"; result: Result }>;

const LEGAL_REQUEST_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export async function submitLegalRequest<Result>(input: SubmitLegalRequestInput<Result>): Promise<SubmitLegalRequestResult<Result>> {
  const narrative = input.narrative.trim();
  const email = input.email.trim();
  const errors: LegalRequestFieldErrors = {
    narrative: input.kind !== "withdrawal" && !narrative ? "narrativeRequired" : null,
    email: !input.authenticated && !LEGAL_REQUEST_EMAIL_PATTERN.test(email) ? "emailRequired" : null,
  };
  if (errors.narrative !== null || errors.email !== null) return { kind: "validation_failure", errors };

  input.onValidated();
  const request: LegalRequestInput = {
    kind: input.kind,
    ...(narrative ? { narrative } : {}),
    ...(input.transactionId.trim() ? { transactionId: input.transactionId.trim() } : {}),
  };
  const result = input.authenticated
    ? await input.createLegalRequest(request)
    : await input.createPublicLegalRequest({ ...request, email });
  return { kind: "submitted", result };
}
