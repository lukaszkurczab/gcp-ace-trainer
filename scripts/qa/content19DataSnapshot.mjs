// Read-only device backing-file evidence. Runtime snapshots stay private, never in the repository.
import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
const [action, rootValue, snapshotValue] = process.argv.slice(2);
const root = resolve(rootValue ?? ""), snapshot = resolve(snapshotValue ?? "");
if (!["before", "compare"].includes(action) || !root.includes("/Library/Developer/CoreSimulator/Devices/7F315654-3175-4F3C-BB24-B0263F59360C/data/Containers/Data/Application/") || !/^\/(?:private\/)?tmp\//u.test(snapshot)) throw Error("content19_snapshot_arguments_rejected");
const current = {};
async function walk(relative) {
  let rows;
  try { rows = await readdir(join(root, relative), { withFileTypes: true }); } catch (error) { if (error.code === "ENOENT") return; throw Error("content19_snapshot_read_unavailable"); }
  for (const row of rows) {
    const name = `${relative}/${row.name}`;
    if (row.isSymbolicLink()) throw Error("content19_snapshot_symlink_rejected");
    if (row.isDirectory()) await walk(name);
    else if (row.isFile()) current[name] = createHash("sha256").update(await readFile(join(root, name))).digest("hex");
  }
}
await walk("Documents"); await walk("Library/Application Support");
if (action === "before") {
  await writeFile(snapshot, JSON.stringify(current, null, 2), { mode: 0o600, flag: "wx" });
  console.log(JSON.stringify({ capturedFiles: Object.keys(current).length }));
} else {
  const previous = JSON.parse(await readFile(snapshot, "utf8"));
  const changed = Object.keys(previous).filter((key) => previous[key] !== current[key]);
  const added = Object.keys(current).filter((key) => !(key in previous));
  const missing = Object.keys(previous).filter((key) => !(key in current));
  // Classification is backed by the installed SDK StorageFactory/Heartbeat/HeartbeatController/FIRHeartbeatLogger source in the evidence report.
  const heartbeat = /^Library\/Application Support\/google-heartbeat-storage\/heartbeats-[A-Za-z0-9_-]+$/u;
  const sdkCacheChanges = changed.filter((key) => heartbeat.test(key) && key in current);
  const unexpected = changed.filter((key) => !sdkCacheChanges.includes(key));
  let fixtureCacheRemoved = false;
  try { await access(join(root, "Library/Caches/patternly-content19-residual-v1")); } catch (error) { if (error.code === "ENOENT") fixtureCacheRemoved = true; }
  const result = { result: unexpected.length === 0 && added.length === 0 && missing.length === 0 && fixtureCacheRemoved ? "PASS" : "FAIL", protectedFiles: Object.keys(previous).length, unchangedFiles: Object.keys(previous).length - changed.length, sdkUsageCacheChanges: sdkCacheChanges.length, unexpectedChanges: unexpected.length, addedFiles: added.length, missingFiles: missing.length, fixtureCacheRemoved, limits: "Documents/Application Support hashes; SDK heartbeat classified from installed source. No keychain export or whole-container equality claim." };
  console.log(JSON.stringify(result));
  if (result.result !== "PASS") process.exitCode = 1;
}
