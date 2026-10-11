export type ProfileExportFile = Readonly<{
  delete: () => void;
  exists: () => boolean;
  name: string;
  uri: string;
  write: (contents: string) => void;
}>;

export type ProfileExportFileStore = Readonly<{
  createCacheFile: (name: string) => ProfileExportFile;
  listCacheFiles: () => readonly ProfileExportFile[];
}>;

/** Shared cache-file lifecycle for the account and local Guest JSON exports. */
export function createRuntimeProfileExportFileStore(): ProfileExportFileStore {
  const { Directory, File, Paths } = require("expo-file-system") as typeof import("expo-file-system");
  const wrap = (file: InstanceType<typeof File>): ProfileExportFile => ({
    delete: () => file.delete(),
    exists: () => file.exists,
    name: file.name,
    uri: file.uri,
    write: (contents) => file.write(contents),
  });
  return {
    createCacheFile: (name) => wrap(new File(Paths.cache, name)),
    listCacheFiles: () => new Directory(Paths.cache).list().flatMap((entry) => entry instanceof File ? [wrap(entry)] : []),
  };
}

/** Delete only this profile's files under an explicitly owned export prefix. */
export function cleanupProfileExportFiles(
  store: Pick<ProfileExportFileStore, "listCacheFiles">,
  prefixes: readonly string[],
  profileId: string | null,
): void {
  if (!profileId) return;
  const scopedPrefixes = prefixes.map((prefix) => `${prefix}${profileId}-`);
  for (const file of store.listCacheFiles()) {
    if (!scopedPrefixes.some((prefix) => file.name.startsWith(prefix))) continue;
    try { if (file.exists()) file.delete(); } catch { /* retry on the next bootstrap */ }
  }
}
