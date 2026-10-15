import { createRequire } from "node:module";
import { mkdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { iosBackupPolicySwift } = require("../../plugins/withPrivacyBoundary.js");
const device = "7F315654-3175-4F3C-BB24-B0263F59360C";
const bundle = "com.lkurczab.patternly.sec03";
const [privateRoot, mode, ...extra] = process.argv.slice(2);
let stage = "arguments";
function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 60_000, maxBuffer: 4 * 1024 * 1024 });
  if (result.status !== 0) throw new Error("probe_failed");
  return result.stdout.trim();
}

try {
  if (extra.length || !["inspect", "apply"].includes(mode) || !/^\/private\/tmp\/patternly21-[A-Za-z0-9-]+$/.test(privateRoot ?? "")
    || realpathSync(privateRoot) !== privateRoot || statSync(privateRoot).uid !== process.getuid() || (statSync(privateRoot).mode & 0o077) !== 0) throw Error("arguments_rejected");
  stage = "device";
  const devices = JSON.parse(run("xcrun", ["simctl", "list", "devices", "booted", "--json"]));
  const booted = Object.values(devices.devices).flat().filter((item) => item.state === "Booted");
  if (booted.length !== 1 || booted[0].udid !== device || booted[0].name !== "iPhone 17") throw Error("device_rejected");
  stage = "app_must_be_closed";
  const assertClosed = () => {
    const processes = run("xcrun", ["simctl", "spawn", device, "launchctl", "list"]);
    if (processes.split("\n").some((line) => line.includes(`UIKitApplication:${bundle}[`) && line.trim().split(/\s+/)[0] !== "-")) throw Error("app_running");
  };
  assertClosed();
  stage = "container";
  const container = run("xcrun", ["simctl", "get_app_container", device, bundle, "data"]);
  if (realpathSync(container) !== container
    || !container.includes(`/CoreSimulator/Devices/${device}/data/Containers/Data/Application/`)
    || !/^[A-F0-9-]{36}$/.test(container.split("/").at(-1))) throw Error("container_rejected");
  // Compile the exact production helper; no alternate attribute-setting implementation.
  const source = `import Foundation
import CryptoKit
final class PolicyProbe {
${iosBackupPolicySwift()}
  func apply(root: URL, bundle: String) throws {
    try applyPatternlyStorageBackupPolicy(documents: root.appendingPathComponent("Documents"), library: root.appendingPathComponent("Library"), bundleIdentifier: bundle)
  }
}
let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let bundle = CommandLine.arguments[2]
let mode = CommandLine.arguments[3]
let paths = ["Documents/mmkv", "Documents/patternly-content-node-packages-v1", "Library/Preferences", "Library/Application Support/\\(bundle).revenuecat", "Library/Caches/\\(bundle).revenuecat", "Library/Caches/RevenueCat", "Library/Application Support/revenuecat"]
func capture() throws -> (rows: [[String: Any]], digest: String) {
  var rows: [[String: Any]] = []
  var inventory: [String] = []
  for path in paths {
    var directory = root.appendingPathComponent(path, isDirectory: true)
    guard directory.resolvingSymlinksInPath().standardizedFileURL == directory.standardizedFileURL else { throw NSError(domain: "Probe", code: 1) }
    let exists = FileManager.default.fileExists(atPath: directory.path)
    var count = 0, directCount = 0
    directory.removeAllCachedResourceValues()
    let excluded = exists ? try directory.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup == true : false
    if exists {
      var enumerationFailed = false
      guard let files = FileManager.default.enumerator(at: directory, includingPropertiesForKeys: [.isRegularFileKey, .isSymbolicLinkKey, .isExcludedFromBackupKey], options: [], errorHandler: { _, _ in enumerationFailed = true; return false }) else { throw NSError(domain: "Probe", code: 2) }
      for case let file as URL in files {
        let values = try file.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .isExcludedFromBackupKey])
        guard values.isSymbolicLink != true else { throw NSError(domain: "Probe", code: 3) }
        if values.isRegularFile == true {
          count += 1
          if values.isExcludedFromBackup == true { directCount += 1 }
          let digest = SHA256.hash(data: try Data(contentsOf: file)).map { String(format: "%02x", $0) }.joined()
          inventory.append("\\(file.path.dropFirst(root.path.count))/\\(digest)")
        }
      }
      if enumerationFailed { throw NSError(domain: "Probe", code: 5) }
    }
    rows.append(["location": path, "exists": exists, "directoryExcluded": excluded, "fileCount": count, "directlyExcludedFileCount": directCount, "filesContainedByExcludedDirectory": excluded ? count : 0])
  }
  let digest = SHA256.hash(data: Data(inventory.sorted().joined(separator: "\\n").utf8)).map { String(format: "%02x", $0) }.joined()
  return (rows, digest)
}
do {
  let before = try capture()
  if mode == "apply" { try PolicyProbe().apply(root: root, bundle: bundle) }
  let after = try capture()
  guard before.digest == after.digest else { throw NSError(domain: "Probe", code: 4) }
  let receipt: [String: Any] = ["schema": "patternly.ios-backup-policy.v1", "mode": mode, "bundleId": bundle, "targets": after.rows, "contentsPreserved": true, "selectedContentsSha256": after.digest, "limits": "Standalone iOS Foundation process on existing closed app data. Parent containment is distinct from file attributes. No app restart, backup, transfer, StoreKit or entitlement proof."]
  let data = try JSONSerialization.data(withJSONObject: receipt, options: [.sortedKeys])
  print(String(decoding: data, as: UTF8.self))
} catch {
  print("{\\"stage\\":\\"native_policy\\",\\"category\\":\\"attribute_or_preservation_failed\\"}")
  exit(1)
}
`;
  stage = "compile";
  const swiftFile = join(privateRoot, "probe.swift"), executable = join(privateRoot, "probe");
  mkdirSync(join(privateRoot, "module-cache"), { recursive: true, mode: 0o700 });
  writeFileSync(swiftFile, source, { mode: 0o600 });
  const sdk = run("xcrun", ["--sdk", "iphonesimulator", "--show-sdk-path"]);
  run("xcrun", ["swiftc", "-module-cache-path", join(privateRoot, "module-cache"), "-sdk", sdk, "-target", "arm64-apple-ios18.6-simulator", swiftFile, "-o", executable]);
  stage = "app_must_be_closed";
  assertClosed();
  stage = "native_readback";
  const receipt = JSON.parse(run("xcrun", ["simctl", "spawn", device, executable, container, bundle, mode]));
  stage = "app_must_be_closed";
  assertClosed();
  const destination = join(privateRoot, `receipt-${mode}-${Date.now()}.json`);
  writeFileSync(destination, JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  console.log(JSON.stringify({ ...receipt, receipt: destination }));
} catch {
  console.error(JSON.stringify({ stage, category: "backup_policy_probe_unavailable", remediation: "Use a private patternly21-* directory and the existing closed SEC03 app on iPhone 17; inspect this stage, never reset/reinstall or print private input." }));
  process.exitCode = 1;
}
