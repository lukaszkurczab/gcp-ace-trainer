import type { AccountDataExportDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";

export const ACCOUNT_DATA_EXPORT_FILE_PREFIX = "patternly-account-data-";

type ExportFile = Readonly<{
  delete: () => void;
  exists: () => boolean;
  name: string;
  uri: string;
  write: (contents: string) => void;
}>;

export type AccountDataExportFileDependencies = Readonly<{
  createCacheFile: (name: string) => ExportFile;
  listCacheFiles: () => readonly ExportFile[];
  isSharingAvailable: () => Promise<boolean>;
  share: (uri: string) => Promise<void>;
}>;

export type ShareAccountDataExportResult = Readonly<
  | { kind: "shared" }
  | { kind: "failure"; failure: "invalidResponse" | "sharingUnavailable" | "fileFailure" | "sharingFailed" | "cleanupFailed" | "sessionChanged" }
>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isRecordArray = (value: unknown): value is readonly Record<string, unknown>[] => Array.isArray(value) && value.every(isRecord);

export function isValidAccountDataExport(value: unknown): value is AccountDataExportDto {
  if (!isRecord(value) || value.schemaVersion !== "account-data-export-v1") return false;
  if (typeof value.exportId !== "string" || !/^[A-Za-z0-9_-]{8,128}$/u.test(value.exportId)) return false;
  if (typeof value.exportedAt !== "string" || !Number.isFinite(Date.parse(value.exportedAt))) return false;
  if (!isRecord(value.scope) || value.scope.portable !== "user_data_and_activity" || value.scope.accountContext !== "user_visible_account_context") return false;
  if (!isRecord(value.portable) || !isRecord(value.portable.profile) || !isString(value.portable.profile.createdAt) || !Number.isFinite(Date.parse(value.portable.profile.createdAt)) || !isRecord(value.portable.profile.identity)) return false;
  const identity = value.portable.profile.identity;
  if (!isString(identity.provider) || (identity.email !== null && !isString(identity.email)) || typeof identity.emailVerified !== "boolean") return false;
  if (!isRecordArray(value.portable.progress) || !isRecordArray(value.portable.linkedContentReports)) return false;
  if (!isRecord(value.accountContext) || !isRecordArray(value.accountContext.trackAccess) || !isRecordArray(value.accountContext.entitlements) || !isRecordArray(value.accountContext.devices) || !isRecord(value.accountContext.syncMetadata) || !isRecordArray(value.accountContext.exportHistory)) return false;
  if (!isRecord(value.manifest) || !Array.isArray(value.manifest.included) || !value.manifest.included.every(isString) || !isRecordArray(value.manifest.omitted)) return false;
  return value.manifest.omitted.every((entry) => isString(entry.category) && isString(entry.reason));
}

function runtimeDependencies(): AccountDataExportFileDependencies {
  const { Directory, File, Paths } = require("expo-file-system") as typeof import("expo-file-system");
  const Sharing = require("expo-sharing") as typeof import("expo-sharing");
  const wrap = (file: InstanceType<typeof File>): ExportFile => ({
    delete: () => file.delete(),
    exists: () => file.exists,
    name: file.name,
    uri: file.uri,
    write: (contents) => file.write(contents),
  });
  return {
    createCacheFile: (name) => wrap(new File(Paths.cache, name)),
    listCacheFiles: () => new Directory(Paths.cache).list().flatMap((entry) => entry instanceof File ? [wrap(entry)] : []),
    isSharingAvailable: Sharing.isAvailableAsync,
    share: (uri) => Sharing.shareAsync(uri, { dialogTitle: "Patternly account data", mimeType: "application/json", UTI: "public.json" }),
  };
}

export async function shareAccountDataExport(
  data: unknown,
  dependencies: AccountDataExportFileDependencies = runtimeDependencies(),
  isCurrent: () => boolean = () => true,
): Promise<ShareAccountDataExportResult> {
  if (!isValidAccountDataExport(data)) return { kind: "failure", failure: "invalidResponse" };
  if (!isCurrent()) return { kind: "failure", failure: "sessionChanged" };
  let available: boolean;
  try {
    available = await dependencies.isSharingAvailable();
  } catch {
    return { kind: "failure", failure: "sharingUnavailable" };
  }
  if (!available) return { kind: "failure", failure: "sharingUnavailable" };

  let file: ExportFile | null = null;
  try {
    file = dependencies.createCacheFile(`${ACCOUNT_DATA_EXPORT_FILE_PREFIX}${data.exportId}.json`);
    file.write(JSON.stringify(data, null, 2));
  } catch {
    try { if (file?.exists()) file.delete(); } catch { /* bootstrap retries orphan cleanup */ }
    return { kind: "failure", failure: "fileFailure" };
  }
  if (!file) return { kind: "failure", failure: "fileFailure" };
  let result: ShareAccountDataExportResult;
  try {
    if (!isCurrent()) result = { kind: "failure", failure: "sessionChanged" };
    else { await dependencies.share(file.uri); result = { kind: "shared" }; }
  } catch {
    result = { kind: "failure", failure: "sharingFailed" };
  }
  try { if (file.exists()) file.delete(); } catch { return { kind: "failure", failure: "cleanupFailed" }; }
  return result;
}

export function cleanupOrphanedAccountDataExports(
  dependencies: Pick<AccountDataExportFileDependencies, "listCacheFiles"> = runtimeDependencies(),
): void {
  for (const file of dependencies.listCacheFiles()) {
    if (!file.name.startsWith(ACCOUNT_DATA_EXPORT_FILE_PREFIX)) continue;
    try { if (file.exists()) file.delete(); } catch { /* retry on the next bootstrap */ }
  }
}
