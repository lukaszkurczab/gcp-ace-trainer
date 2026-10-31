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
  const wrapperLookup = spawnSync("which", ["pod"], { cwd, env, encoding: "utf8" });
  if (wrapperLookup.error || wrapperLookup.status !== 0) throw new Error("CocoaPods preflight cannot resolve its installed command wrapper.");
  const wrapperPath = wrapperLookup.stdout.trim();
  const wrapper = readFileSync(wrapperPath, "utf8");
  const match = wrapper.match(/^GEM_HOME="([^"]+)" exec "([^"]+)"\s+"\$@"\s*$/mu);
  if (!match || !existsSync(match[2])) throw new Error("CocoaPods preflight cannot resolve its installed command wrapper.");
  const podEnvironment = { ...env, GEM_HOME: match[1] };
  const podVersion = spawnSync(rubyPath, [match[2], "--version"], { cwd, env: podEnvironment, encoding: "utf8" });
  if (podVersion.error || podVersion.status !== 0 || podVersion.stdout.trim() !== "1.16.2") {
    throw new Error("CocoaPods preflight requires the verified CocoaPods 1.16.2 runtime.");
  }
  return Object.freeze({ command: rubyPath, args: [match[2]], env: podEnvironment });
}
