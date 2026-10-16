import { checkRepository, formatViolations } from "./architecture/checkBoundaries";
for (const [platform, mode] of [["typescript", "release"], ["ios", "release"], ["ios", "smoke"], ["android", "release"], ["android", "smoke"]] as const) {
  const { graph, violations } = checkRepository(process.cwd(), platform, mode);
  console.log(`ARCHITECTURE ${platform}/${mode}: ${violations.length ? "FAIL" : "PASS"}; modules=${graph.edges.size}; violations=${violations.length}`);
  if (violations.length) { console.error(formatViolations(violations)); process.exitCode = 1; }
}
