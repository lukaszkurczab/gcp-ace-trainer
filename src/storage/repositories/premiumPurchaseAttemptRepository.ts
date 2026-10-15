export type PurchaseConfirmationInput = Readonly<{
  confirmationId: string; termsVersion: string; productIdentifier: string; storefrontPrice: string;
  locale: "en" | "pl"; immediateStartRequested: true;
}>;
export type LocalPurchaseAttempt = Readonly<{
  accountId: string; attemptId: string; phase: "intent" | "dispatch" | "pending" | "unknown" | "candidate" | "cancelled";
  transactionId: string | null; confirmation: PurchaseConfirmationInput | null;
}>;
export type PurchaseAttemptJournal = Readonly<{
  read: () => LocalPurchaseAttempt | null;
  save: (value: LocalPurchaseAttempt) => void;
  clear: () => void;
}>;

import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent } from "./profileStorageRepository";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";

function isMarker(value: unknown): value is LocalPurchaseAttempt {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).length === 5 && typeof v.accountId === "string" && v.accountId.length > 0
    && typeof v.attemptId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(v.attemptId)
    && ["intent", "dispatch", "pending", "unknown", "candidate", "cancelled"].includes(String(v.phase))
    && (v.transactionId === null || (typeof v.transactionId === "string" && v.transactionId.trim().length > 0 && v.transactionId.length <= 256))
    && (v.phase === "candidate" ? v.transactionId !== null : v.transactionId === null)
    && (v.phase === "intent" ? isConfirmation(v.confirmation, v.attemptId) : v.confirmation === null);
}

function isConfirmation(value: unknown, id: string): value is PurchaseConfirmationInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).length === 6 && v.confirmationId === id
    && [v.termsVersion, v.productIdentifier, v.storefrontPrice].every((item) => typeof item === "string" && item.trim().length > 0)
    && (v.locale === "en" || v.locale === "pl") && v.immediateStartRequested === true;
}

/** Account lifecycle metadata, excluded from learning sync/reset; profile deletion owns cleanup. */
export function capturePremiumPurchaseJournal(accountId: string, isCurrent: () => boolean): PurchaseAttemptJournal {
  const lease = captureActiveProfileStorageLease();
  const check = () => {
    if (!isCurrent() || !lease || lease.profile.kind !== "account" || lease.profile.accountId !== accountId || !isActiveProfileStorageLeaseCurrent(lease)) throw Error("purchase_storage_changed");
  };
  return {
    read: () => { check(); const marker = readCanonicalJson(STORAGE_KEYS.PREMIUM_PURCHASE_ATTEMPT, isMarker); if (marker && marker.accountId !== accountId) throw Error("purchase_owner_changed"); return marker; },
    save: (value) => { check(); if (!isMarker(value) || value.accountId !== accountId) throw Error("purchase_marker_invalid"); writeCanonicalJson(STORAGE_KEYS.PREMIUM_PURCHASE_ATTEMPT, value); check(); },
    clear: () => { check(); removeCanonicalValue(STORAGE_KEYS.PREMIUM_PURCHASE_ATTEMPT); },
  };
}
