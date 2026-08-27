import { existsSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const sdkDirectories = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  join(homedir(), "Library", "Android", "sdk"),
  join(homedir(), "Android", "Sdk"),
].filter((directory) => typeof directory === "string" && directory.trim().length > 0);

const sdkDirectory = sdkDirectories.find((directory) => existsSync(directory));

if (!sdkDirectory) {
  throw new Error("Android SDK was not found. Set ANDROID_HOME or ANDROID_SDK_ROOT to a valid SDK directory.");
}

writeFileSync("android/local.properties", `sdk.dir=${sdkDirectory.replaceAll("\\", "\\\\")}\n`);
