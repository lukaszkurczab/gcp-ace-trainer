import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const output = process.argv[2];
if (!output) throw new Error("Usage: node scripts/generateInterviewSimulationMaestro.mjs <flow.yaml>");

const source = readFileSync(resolve("src/content/bundled/generatedArtifacts.ts"), "utf8");
const encodedArtifact = source.match(/"artifactBytes":("(?:\\.|[^"\\])*")/)?.[1];
if (!encodedArtifact) throw new Error("The pinned Algorithms artifact bytes are unavailable.");
const artifact = JSON.parse(JSON.parse(encodedArtifact));
const bank = artifact.bank;
const blueprint = bank.practiceBlueprints.find((entry) => entry.modeId === "algorithms-interview-simulation");
if (!blueprint || blueprint.resolvedItemIds.length !== 40) throw new Error("The pinned Simulation blueprint must resolve exactly forty items.");
const items = blueprint.resolvedItemIds.map((itemId) => {
  const item = bank.items.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error(`Pinned Simulation item ${itemId} is missing.`);
  return item;
});
const sessionId = "algorithms:algorithms-interview-simulation:1";
const selector = (surface, element, ...identity) => ["patternly", surface, element, ...identity].join(":");
const lines = [
  "appId: com.lkurczab.gcpacetrainer",
  "name: Patternly S1 — Interview Simulation fixed forty",
  "tags:",
  "  - runtime-auditability",
  "  - interview-simulation",
  "  - s1",
  "---",
  "- extendedWaitUntil:",
  "    visible:",
  "      id: \"patternly:content:ready:1\"",
  "    timeout: 30000",
  "- extendedWaitUntil:",
  "    visible:",
  "      id: \"patternly:home:track-card:algorithms\"",
  "    timeout: 30000",
  "- tapOn:",
  "    id: \"main-tab-bar-practice\"",
  "- extendedWaitUntil:",
  "    visible:",
  "      id: \"patternly:practice:hub:root\"",
  "    timeout: 30000",
  "- scrollUntilVisible:",
  "    element:",
  `      id: \"${selector("practice", "mode-card", "algorithms-interview-simulation")}\"`,
  "    direction: DOWN",
  "    centerElement: true",
  "- tapOn:",
  `    id: \"${selector("practice", "mode-card", "algorithms-interview-simulation")}\"`,
  "- extendedWaitUntil:",
  "    visible:",
  `      id: \"${selector("simulation", "root", sessionId)}\"`,
  "    timeout: 30000",
  "- assertVisible:",
  `    id: \"${selector("simulation", "question", items[0].id)}\"`,
];

function add(command, value) {
  lines.push(`- ${command}:`, `    ${Object.keys(value)[0]}: \"${Object.values(value)[0]}\"`);
}
function tap(id) { add("tapOn", { id }); }
function waitFor(id) { lines.push("- extendedWaitUntil:", "    visible:", `      id: \"${id}\"`, "    timeout: 30000"); }
function screenshot(name) { lines.push(`- takeScreenshot: \"${name}\"`); }

function selectOrdering(item, target) {
  const current = item.interaction.elements.map((entry) => entry.id);
  for (let targetIndex = 0; targetIndex < target.length; targetIndex += 1) {
    const itemId = target[targetIndex];
    let currentIndex = current.indexOf(itemId);
    while (currentIndex > targetIndex) {
      tap(selector("simulation", "action", sessionId, `${itemId}:move:up`));
      [current[currentIndex - 1], current[currentIndex]] = [current[currentIndex], current[currentIndex - 1]];
      currentIndex -= 1;
    }
  }
}

for (const [index, item] of items.entries()) {
  const wantsCorrect = index < 20;
  const interaction = item.interaction;
  if (interaction.type === "choice") {
    const selected = wantsCorrect
      ? interaction.acceptedOptionIds
      : [interaction.options.find((option) => !interaction.acceptedOptionIds.includes(option.id))?.id];
    if (!selected.every(Boolean)) throw new Error(`Pinned Simulation item ${item.id} has no explicit incorrect option.`);
    for (const optionId of selected) tap(selector("simulation", "option", item.id, optionId));
  } else if (interaction.type === "ordering") {
    const target = wantsCorrect ? interaction.canonicalOrder : [...interaction.canonicalOrder].reverse();
    selectOrdering(item, target);
  } else if (interaction.type === "complexity") {
    for (const dimension of interaction.checkedDimensions) {
      const accepted = interaction.acceptedValuesByDimension[dimension];
      const value = wantsCorrect
        ? accepted[0]
        : interaction.availableValuesByDimension[dimension].find((candidate) => !accepted.includes(candidate));
      if (!value) throw new Error(`Pinned Simulation complexity item ${item.id} has no explicit value for ${dimension}.`);
      add("tapOn", { text: `${dimension}: ${value}` });
    }
  } else {
    throw new Error(`Pinned Simulation item ${item.id} has an unsupported interaction type.`);
  }
  tap(selector("simulation", "action", sessionId, "save-response"));
  if (index < items.length - 1) {
    lines.push("- assertNotVisible:", "    text: \"Reason\"");
    screenshot(`s1-${String(index + 1).padStart(2, "0")}-${item.id}`);
    tap(selector("simulation", "navigator", `${sessionId}:occurrence:${index + 1}`));
    waitFor(selector("simulation", "question", items[index + 1].id));
  }
}

waitFor(selector("summary", "root", sessionId));
screenshot("s1-40-summary");
tap(selector("simulation", "action", sessionId, "review-session"));
waitFor(selector("summary", "feedback-item", sessionId, `${sessionId}:occurrence:0`));
for (const item of [items[0], items[1], items[2], items[20], items[21]]) {
  tap(selector("session", "details-toggle", item.id));
  lines.push("- assertVisible:", `    id: \"${selector("session", "details", item.id)}\"`);
}
screenshot("s1-review-details");
mkdirSync(dirname(resolve(output)), { recursive: true });
writeFileSync(resolve(output), `${lines.join("\n")}\n`);
console.log(JSON.stringify({ output: resolve(output), itemCount: items.length, itemIds: items.map((item) => item.id), sessionId }, null, 2));
