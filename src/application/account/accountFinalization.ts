/**
 * The small set of policies that can vary when an authenticated identity is
 * finalized. Keeping these named prevents call sites from silently changing
 * more than one independent decision through positional flags.
 */
export type AccountFinalizationOptions<Token, Barrier> = Readonly<{
  generation: Readonly<{ kind: "begin" | "restart" }> | Readonly<{ kind: "captured"; token: Token }>;
  profile: "select-account" | "preserve-current";
  guestAdoption: "allow" | "discard";
  identityProof: Readonly<{ kind: "capture" }> | Readonly<{ kind: "provided"; barrier: Barrier | null }>;
}>;

export const accountFinalizationPolicies = Object.freeze({
  preparedProfile: <Token, Barrier>(token: Token, guestAdoption: "allow" | "discard"): AccountFinalizationOptions<Token, Barrier> => Object.freeze({
    generation: Object.freeze({ kind: "captured" as const, token }), profile: "preserve-current", guestAdoption, identityProof: Object.freeze({ kind: "capture" as const }),
  }),
  registrationCreated: <Token, Barrier>(token: Token): AccountFinalizationOptions<Token, Barrier> => Object.freeze({
    generation: Object.freeze({ kind: "captured" as const, token }), profile: "preserve-current", guestAdoption: "allow", identityProof: Object.freeze({ kind: "capture" as const }),
  }),
  verification: <Token, Barrier>(): AccountFinalizationOptions<Token, Barrier> => Object.freeze({
    generation: Object.freeze({ kind: "restart" as const }), profile: "select-account", guestAdoption: "discard", identityProof: Object.freeze({ kind: "capture" as const }),
  }),
  resendVerification: <Token, Barrier>(): AccountFinalizationOptions<Token, Barrier> => Object.freeze({
    generation: Object.freeze({ kind: "restart" as const }), profile: "select-account", guestAdoption: "discard", identityProof: Object.freeze({ kind: "capture" as const }),
  }),
  passwordRefresh: <Token, Barrier>(token: Token | null, barrier: Barrier | null | undefined): AccountFinalizationOptions<Token, Barrier> => Object.freeze({
    generation: token === null ? Object.freeze({ kind: "begin" as const }) : Object.freeze({ kind: "captured" as const, token }),
    profile: "select-account", guestAdoption: "discard",
    identityProof: barrier === undefined ? Object.freeze({ kind: "capture" as const }) : Object.freeze({ kind: "provided" as const, barrier }),
  }),
  localOfflineRefresh: <Token, Barrier>(token: Token, barrier: Barrier | null): AccountFinalizationOptions<Token, Barrier> => Object.freeze({
    generation: Object.freeze({ kind: "captured" as const, token }), profile: "select-account", guestAdoption: "discard", identityProof: Object.freeze({ kind: "provided" as const, barrier }),
  }),
  deletionReauthentication: <Token, Barrier>(token: Token): AccountFinalizationOptions<Token, Barrier> => Object.freeze({
    generation: Object.freeze({ kind: "captured" as const, token }), profile: "select-account", guestAdoption: "discard", identityProof: Object.freeze({ kind: "capture" as const }),
  }),
});

export function resolveAccountFinalizationBarrier<Barrier>(
  options: Pick<AccountFinalizationOptions<unknown, Barrier>, "identityProof">,
  capture: () => Promise<Barrier | null>,
): Promise<Barrier | null> {
  return options.identityProof.kind === "provided" ? Promise.resolve(options.identityProof.barrier) : capture();
}

export type FinalizationStage<T, Outcome> = Readonly<{ kind: "continue"; value: T }>
  | Readonly<{ kind: "return"; outcome: Outcome }>;

/** Executes only the ordered finalization phases; their existing owners remain injected ports. */
export async function executeAccountFinalization<Token, Barrier, Proof, Verified, AccountData, Outcome>(input: Readonly<{
  options: AccountFinalizationOptions<Token, Barrier>;
  barrier: Barrier | null;
  canContinue: () => boolean;
  staleResult: () => Outcome;
  proveIdentity: (barrier: Barrier | null) => Promise<FinalizationStage<Proof, Outcome>>;
  selectAccountProfile: (proof: Proof) => Promise<FinalizationStage<void, Outcome>>;
  verifyAccountIdentity: (proof: Proof) => Promise<FinalizationStage<Verified, Outcome>>;
  loadAccountData: (verified: Verified, guestAdoption: "allow" | "discard") => Promise<FinalizationStage<AccountData, Outcome>>;
  shouldReconcileReminders: (accountData: AccountData) => boolean;
  reconcileReminders: () => Promise<void>;
  finish: (proof: Proof, verified: Verified, accountData: AccountData) => Outcome;
}>): Promise<Outcome> {
  const stale = (): Outcome => input.staleResult();

  if (!input.canContinue()) return stale();
  const proofStage = await input.proveIdentity(input.barrier);
  if (!input.canContinue()) return stale();
  if (proofStage.kind === "return") return proofStage.outcome;
  const proof = proofStage.value;

  if (input.options.profile === "select-account") {
    const profileStage = await input.selectAccountProfile(proof);
    if (!input.canContinue()) return stale();
    if (profileStage.kind === "return") return profileStage.outcome;
  }

  const identityStage = await input.verifyAccountIdentity(proof);
  if (!input.canContinue()) return stale();
  if (identityStage.kind === "return") return identityStage.outcome;
  const verified = identityStage.value;

  const accountDataStage = await input.loadAccountData(verified, input.options.guestAdoption);
  if (!input.canContinue()) return stale();
  if (accountDataStage.kind === "return") return accountDataStage.outcome;
  const accountData = accountDataStage.value;

  if (input.shouldReconcileReminders(accountData)) {
    try { await input.reconcileReminders(); } catch { /* Reminder reconciliation is deliberately non-blocking. */ }
    if (!input.canContinue()) return stale();
  }

  return input.finish(proof, verified, accountData);
}
