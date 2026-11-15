import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

export function resolveCocoaPodsRuntime(cwd) {
  const env = {};
  for (const key of ["PATH", "HOME", "TMPDIR", "LANG", "DEVELOPER_DIR"]) {
    if (typeof process.env[key] === "string") env[key] = process.env[key];
  }
  env.RBENV_VERSION = "3.3.6";
  const rubyPathResult = spawnSync("rbenv", ["which", "ruby"], { cwd, env, encoding: "utf8" });
  if (rubyPathResult.error || rubyPathResult.status !== 0) throw new Error("CocoaPods preflight cannot resolve the verified Ruby runtime.");
  const rubyPath = rubyPathResult.stdout.trim();
  const rubyVersion = spawnSync(rubyPath, ["-e", "print RUBY_VERSION"], { cwd, env, encoding: "utf8" });
  if (!rubyPath || rubyVersion.error || rubyVersion.status !== 0 || rubyVersion.stdout !== "3.3.6") {
    throw new Error("CocoaPods preflight requires the verified Ruby 3.3.6 runtime.");
  }
  // Every `pod` on PATH, in order: an rbenv shim may come first, so pick the
  // first one that is the installed wrapper with its private GEM_HOME.
  const wrapperLookup = spawnSync("which", ["-a", "pod"], { cwd, env, encoding: "utf8" });
  if (wrapperLookup.error || wrapperLookup.status !== 0) throw new Error("CocoaPods preflight cannot resolve its installed command wrapper.");
  let match = null;
  for (const wrapperPath of wrapperLookup.stdout.split("\n").map((line) => line.trim()).filter(Boolean)) {
    const candidate = readFileSync(wrapperPath, "utf8").match(/^GEM_HOME="([^"]+)" exec "([^"]+)"\s+"\$@"\s*$/mu);
    if (candidate && existsSync(candidate[2])) { match = candidate; break; }
  }
  if (!match) throw new Error("CocoaPods preflight cannot resolve its installed command wrapper.");
  const podEnvironment = { ...env, GEM_HOME: match[1] };
  const podVersion = spawnSync(rubyPath, [match[2], "--version"], { cwd, env: podEnvironment, encoding: "utf8" });
  if (podVersion.error || podVersion.status !== 0 || podVersion.stdout.trim() !== "1.16.2") {
    throw new Error("CocoaPods preflight requires the verified CocoaPods 1.16.2 runtime.");
  }
  return Object.freeze({ command: rubyPath, args: [match[2]], env: podEnvironment });
}
