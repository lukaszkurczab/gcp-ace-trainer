export type PremiumSessionAdmission = "allowed" | "denied" | "unavailable";
export type CertificationExamAccessAction = "startExam" | "purchasePremium" | "retryAdmission";

export function resolveCertificationExamAccess(
  admission: PremiumSessionAdmission,
): CertificationExamAccessAction {
  if (admission === "allowed") return "startExam";
  if (admission === "denied") return "purchasePremium";
  return "retryAdmission";
}
