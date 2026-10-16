import { capturePremiumPurchaseJournal } from "../../storage/repositories/premiumPurchaseAttemptRepository";
import { createPremiumPurchaseCoordinator } from "./premiumPurchaseCoordinator";

/** Application composition binds the account-scoped journal; UI supplies its actor and store port. */
export function composePremiumPurchaseCoordinator(input: Omit<Parameters<typeof createPremiumPurchaseCoordinator>[0], "journal">) {
  return createPremiumPurchaseCoordinator({
    ...input,
    journal: capturePremiumPurchaseJournal(input.actor.accountId, input.actor.isCurrent),
  });
}
