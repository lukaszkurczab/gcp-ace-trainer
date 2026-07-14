import { spawnSync } from "node:child_process";

const commands = [
  ["npm", ["run", "qa:static"]],
];

const results = commands.map(([command, args]) => {
  const result = spawnSync(command, args, { cwd: process.cwd(), stdio: "inherit" });
  return {
    command: [command, ...args].join(" "),
    exitCode: result.status ?? 1,
    signal: result.signal ?? null,
  };
});

console.log("RECOVERY_BASELINE_REPORT=" + JSON.stringify({ commands: results }));
process.exitCode = results.some((result) => result.exitCode !== 0) ? 1 : 0;
