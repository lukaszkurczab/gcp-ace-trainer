import { NodePackageError } from "../runtime/nodeContentPackage";

export type PremiumNodeOfferFailurePresentation = Readonly<{ message: string; retry: boolean; freeAlternative: boolean }>;

export function describePremiumNodeOfferFailure(error: unknown): PremiumNodeOfferFailurePresentation {
  if (!(error instanceof NodePackageError)) return Object.freeze({ message: "We couldn't prepare this Premium topic. Try again later.", retry: true, freeAlternative: false });
  switch (error.code) {
    case "entitlement_required": return Object.freeze({ message: "Premium access is required for this topic. Choose a free topic or check your subscription.", retry: false, freeAlternative: true });
    case "entitlement_unavailable": return Object.freeze({ message: "We couldn't verify Premium access. Check your connection and try again.", retry: true, freeAlternative: false });
    case "not_found": return Object.freeze({ message: "This Premium topic isn't available yet. Choose a free topic to continue.", retry: false, freeAlternative: true });
    case "authentication_required": return Object.freeze({ message: "Sign in again to prepare Premium content.", retry: false, freeAlternative: false });
    case "reauthentication_required": return Object.freeze({ message: "Sign in again to verify your session before preparing Premium content.", retry: false, freeAlternative: false });
    case "app_check_unavailable": return Object.freeze({ message: "We couldn't verify this app connection. Check your connection and try again.", retry: true, freeAlternative: false });
    case "package_unavailable": return Object.freeze({ message: "This learning package is temporarily unavailable. Try again when connected.", retry: true, freeAlternative: true });
    case "package_storage_failed": return Object.freeze({ message: "We couldn't save this package on your device. Check available storage and try again.", retry: true, freeAlternative: false });
    case "minimum_app_version": return Object.freeze({ message: "Update Patternly to prepare this Premium topic.", retry: false, freeAlternative: false });
    case "package_corrupt": return Object.freeze({ message: "We couldn't verify this package. Download it again to retry.", retry: true, freeAlternative: false });
    case "package_identity_mismatch": return Object.freeze({ message: "This package doesn't match the offered topic. Choose a free topic or try again later.", retry: true, freeAlternative: true });
    case "invalid_response": return Object.freeze({ message: "This package couldn't be verified. Choose a free topic or try again later.", retry: false, freeAlternative: true });
  }
}
