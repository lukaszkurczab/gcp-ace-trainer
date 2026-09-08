type FieldErrorInput = Readonly<{
  failure: string | null;
  mode: string;
  usesPassword: boolean;
}>;

export function getAccountSecurityErrorField(input: FieldErrorInput): "security-new-email" | "security-password" | null {
  if (input.mode === "delete" && input.usesPassword && (input.failure === "reauthenticationRequired" || input.failure === "invalidCredential")) return "security-password";
  if (input.mode !== "email") return null;
  if (input.failure === "invalidEmail") return "security-new-email";
  if (input.usesPassword && (input.failure === "reauthenticationRequired" || input.failure === "invalidCredential")) return "security-password";
  return null;
}

export function getAccountSecurityErrorAfterEdit(input: FieldErrorInput & Readonly<{ editedField: string }>): string | null {
  const errorField = getAccountSecurityErrorField(input);
  return errorField !== null && errorField !== input.editedField ? input.failure : null;
}
