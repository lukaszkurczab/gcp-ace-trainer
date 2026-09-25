export type StorageRecoveryAuditPresentation = "base" | "retry-limit";

const AUDIT_SCHEME = "com.lkurczab.patternly:";
const AUDIT_PATH = "//audit/show-encrypted-storage-recovery";

export function parseStorageRecoveryAuditCommand(
  url: string | null,
  environment: Readonly<{ development: boolean; smoke: boolean }>,
): StorageRecoveryAuditPresentation | undefined {
  if (!environment.development || !environment.smoke || url === null) return undefined;

  try {
    const parsed = new URL(url);
    if (`${parsed.protocol}` !== AUDIT_SCHEME || `//${parsed.host}${parsed.pathname}` !== AUDIT_PATH) return undefined;
    if ([...parsed.searchParams.keys()].some((key) => key !== "presentation")) return undefined;
    const presentation = parsed.searchParams.get("presentation") ?? "base";
    return presentation === "base" || presentation === "retry-limit" ? presentation : undefined;
  } catch {
    return undefined;
  }
}
