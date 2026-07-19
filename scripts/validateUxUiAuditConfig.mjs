import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const EXPECTED_IOS_STATE_IDS = Object.freeze([
  ...Array.from({ length: 15 }, (_, index) => `P-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 29 }, (_, index) => `S-${String(index + 1).padStart(2, "0")}`),
]);

export function expectedIosFlowId(stateId) {
  return `algorithms-ios-${stateId.toLowerCase()}`;
}

export function expectedIosFlowPath(stateId) {
  return `.audit/ux-ui/maestro/flows/algorithms-stage3-ios-states/${stateId.toLowerCase()}.yaml`;
}

export function readAuditConfig(root) {
  const configPath = path.join(root, ".audit/ux-ui/audit.config.json");
  try {
    return JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read JSON ${configPath}: ${error.message}`);
  }
}

export function collectUxUiAuditConfigErrors(root, config) {
  const errors = [];
  const requireString = (name, value) => {
    if (typeof value !== "string" || value.trim().length === 0) errors.push(`${name} must be a non-empty string`);
  };
  const requireEqual = (name, value, expected) => {
    if (value !== expected) errors.push(`${name} must be ${expected}`);
  };
  const requireNonEmptyArray = (name, value) => {
    if (!Array.isArray(value) || value.length === 0) errors.push(`${name} must be a non-empty array`);
  };
  const assertFile = (relativePath, label) => {
    const absolutePath = path.join(root, relativePath);
    try {
      if (!statSync(absolutePath).isFile()) errors.push(`${label} is not a file: ${relativePath}`);
    } catch {
      errors.push(`${label} does not exist: ${relativePath}`);
    }
  };
  const assertDirectory = (relativePath, label) => {
    const absolutePath = path.join(root, relativePath);
    try {
      if (!statSync(absolutePath).isDirectory()) errors.push(`${label} is not a directory: ${relativePath}`);
    } catch {
      errors.push(`${label} does not exist: ${relativePath}`);
    }
  };

  requireString("auditId", config.auditId);
  requireString("projectName", config.projectName);
  requireEqual("executor", config.executor, "maestro");
  requireEqual("app.type", config.app?.type, "mobile");
  requireString("app.appId", config.app?.appId);
  requireNonEmptyArray("platforms", config.platforms);
  requireNonEmptyArray("themes", config.themes);
  requireNonEmptyArray("devices", config.devices);
  requireString("outputDir", config.outputDir);
  requireString("flowsDir", config.flowsDir);
  requireString("iosBootstrapFlow", config.iosBootstrapFlow);
  requireNonEmptyArray("checklists", config.checklists);
  requireNonEmptyArray("forbiddenTerms.terms", config.forbiddenTerms?.terms);
  requireNonEmptyArray("flows", config.flows);
  requireNonEmptyArray("screens", config.screens);
  requireString("coveragePacket", config.coveragePacket);

  if (JSON.stringify(config.platforms) !== JSON.stringify(["ios"])) errors.push("shared audit config must be owned only by platform ios");
  if (JSON.stringify(config.devices) !== JSON.stringify(["ios-regular"])) errors.push("shared audit config must contain only ios-regular");

  if (config.outputDir !== `docs/audits/ux-ui/${config.auditId}`) errors.push(`outputDir must resolve to docs/audits/ux-ui/<auditId>; got ${config.outputDir}`);
  assertDirectory(config.flowsDir, "flowsDir");
  assertFile(config.iosBootstrapFlow, "iosBootstrapFlow");
  if (config.helpersDir) assertDirectory(config.helpersDir, "helpersDir");
  for (const checklistPath of config.checklists ?? []) assertFile(checklistPath, "checklist");
  assertFile(config.coveragePacket, "coveragePacket");

  const flowIds = new Set();
  const flowsById = new Map();
  for (const flow of config.flows ?? []) {
    requireString("flows[].id", flow.id);
    requireString(`flows[${flow.id}].path`, flow.path);
    if (flowIds.has(flow.id)) errors.push(`duplicate flow id ${flow.id}`);
    flowIds.add(flow.id);
    flowsById.set(flow.id, flow);
    assertFile(flow.path, `flow ${flow.id}`);
  }

  for (const screen of config.screens ?? []) {
    requireString("screens[].id", screen.id);
    requireNonEmptyArray(`screens[${screen.id}].states`, screen.states);
    for (const state of screen.states ?? []) {
      requireString(`screens[${screen.id}].states[].id`, state.id);
      if (state.capturedBy && !flowIds.has(state.capturedBy)) errors.push(`screens[${screen.id}].states[${state.id}] references unknown flow ${state.capturedBy}`);
      if (!state.capturedBy) errors.push(`screens[${screen.id}].states[${state.id}] needs capturedBy`);
      if (Object.hasOwn(state, "manualCapture")) errors.push(`screens[${screen.id}].states[${state.id}] must not use manualCapture`);
    }
    const stateIds = new Set((screen.states ?? []).map((state) => state.id));
    if (screen.scrollCapture?.enabled) {
      for (const stateId of screen.scrollCapture.states ?? []) if (!stateIds.has(stateId)) errors.push(`screens[${screen.id}].scrollCapture references missing state ${stateId}`);
    }
  }

  const configuredStates = (config.screens ?? []).flatMap((screen) => screen.states ?? []);
  const configuredStateIds = configuredStates.map((state) => state.id);
  if (configuredStateIds.length !== EXPECTED_IOS_STATE_IDS.length || new Set(configuredStateIds).size !== EXPECTED_IOS_STATE_IDS.length || EXPECTED_IOS_STATE_IDS.some((id) => !configuredStateIds.includes(id))) {
    errors.push("coverage packet must enumerate exactly P-01…P-15 and S-01…S-29");
  }

  const screenshotNames = new Set();
  const referencedIosFlowIds = new Set();
  for (const stateId of EXPECTED_IOS_STATE_IDS) {
    const state = configuredStates.find((entry) => entry.id === stateId);
    const flowId = expectedIosFlowId(stateId);
    const flowPath = expectedIosFlowPath(stateId);
    if (!state) continue;
    if (state.capturedBy !== flowId) errors.push(`state ${stateId} must map to exact flow ${flowId}; got ${state.capturedBy}`);
    const flow = flowsById.get(flowId);
    if (!flow) {
      errors.push(`state ${stateId} exact flow ${flowId} is missing`);
      continue;
    }
    referencedIosFlowIds.add(flowId);
    if (flow.platform !== "ios") errors.push(`flow ${flowId} must use platform ios`);
    if (flow.path !== flowPath) errors.push(`flow ${flowId} must use exact path ${flowPath}; got ${flow.path}`);
    let source;
    try {
      source = readFileSync(path.join(root, flow.path), "utf8");
    } catch {
      continue;
    }
    const deepLink = `com.lkurczab.gcpacetrainer://audit?auditState=${stateId}`;
    const selector = `visible: { id: "algorithms-audit-current-${stateId}" }`;
    const deepLinkIndex = source.indexOf(deepLink);
    const selectorIndex = source.indexOf(selector, deepLinkIndex + deepLink.length);
    if (deepLinkIndex < 0) errors.push(`flow ${flowId} must deep-link exact auditState ${stateId}`);
    if (selectorIndex < 0) errors.push(`flow ${flowId} must assert exact selector for ${stateId} after its deep link`);
    const screenshotMatches = [...source.matchAll(/^- takeScreenshot: "([^"]+)"$/gm)];
    if (screenshotMatches.length !== 1) {
      errors.push(`flow ${flowId} must take exactly one screenshot`);
    } else {
      const screenshotName = screenshotMatches[0][1];
      if (!screenshotName.startsWith(`algorithms-stage3__${stateId.toLowerCase()}__`) || !screenshotName.endsWith("__ios-regular")) errors.push(`flow ${flowId} screenshot name does not encode ${stateId} and ios-regular`);
      if (screenshotNames.has(screenshotName)) errors.push(`duplicate screenshot name ${screenshotName}`);
      screenshotNames.add(screenshotName);
      const body = source.split(/^---$/m)[1]?.trim();
      const expectedBody = [
        `- openLink: "com.lkurczab.gcpacetrainer://audit?auditState=${stateId}"`,
        "- extendedWaitUntil:",
        `    visible: { id: "algorithms-audit-current-${stateId}" }`,
        "    timeout: 20000",
        `- takeScreenshot: "${screenshotName}"`,
      ].join("\n");
      if (body !== expectedBody) errors.push(`flow ${flowId} must contain only exact state deep-link, selector wait, and screenshot commands`);
    }
  }

  const configuredIosFlows = (config.flows ?? []).filter((flow) => flow.platform === "ios");
  if (configuredIosFlows.length !== EXPECTED_IOS_STATE_IDS.length) errors.push(`config must contain exactly 44 iOS flows; got ${configuredIosFlows.length}`);
  for (const flow of configuredIosFlows) if (!referencedIosFlowIds.has(flow.id)) errors.push(`unreferenced or alternate iOS flow ${flow.id}`);
  for (const flow of config.flows ?? []) if (flow.platform !== "ios") errors.push(`shared iOS config must not own non-iOS flow ${flow.id}`);
  if (existsSync(path.join(root, ".audit/ux-ui/maestro/flows/algorithms-stage3-harness.ios.yaml"))) errors.push("obsolete alternate iOS harness still exists");
  const expectedBootstrapPath = ".audit/ux-ui/maestro/flows/algorithms-stage3-ios-bootstrap.yaml";
  if (config.iosBootstrapFlow !== expectedBootstrapPath) errors.push(`iosBootstrapFlow must be ${expectedBootstrapPath}`);
  try {
    const bootstrapSource = readFileSync(path.join(root, config.iosBootstrapFlow), "utf8");
    const bootstrapBody = bootstrapSource.split(/^---$/m)[1]?.trim();
    const expectedBootstrapBody = [
      "- openLink: \"com.lkurczab.gcpacetrainer://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8082\"",
      "- extendedWaitUntil:",
      "    visible: { id: \"algorithms-audit-current-P-01\" }",
      "    timeout: 30000",
    ].join("\n");
    if (bootstrapBody !== expectedBootstrapBody) errors.push("iosBootstrapFlow must only launch the audit host and wait for exact P-01 readiness");
  } catch {
    // assertFile already reports the missing bootstrap path.
  }

  for (const flow of config.flows ?? []) {
    let source;
    try {
      source = readFileSync(path.join(root, flow.path), "utf8");
    } catch {
      continue;
    }
    for (const term of config.forbiddenTerms?.terms ?? []) if (source.includes(term)) errors.push(`active flow ${flow.id} contains retired selector ${term}`);
  }

  try {
    const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    if (packageJson.scripts?.["audit:ux-ui"] !== "node scripts/runAlgorithmsStage3IosAudit.mjs") errors.push("audit:ux-ui must invoke only the canonical explicit-UDID iOS runner");
    if (packageJson.scripts?.["audit:ux-ui:android"] !== "node scripts/runAlgorithmsStage3AndroidAudit.mjs") errors.push("audit:ux-ui:android must invoke only the canonical explicit-serial Android runner");
  } catch (error) {
    errors.push(`could not validate package.json audit:ux-ui runner: ${error.message}`);
  }

  return errors;
}

export function canonicalIosCaptureEntries(root, config) {
  const errors = collectUxUiAuditConfigErrors(root, config);
  if (errors.length > 0) throw new Error(`Invalid UX/UI audit config:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  const flowsById = new Map(config.flows.map((flow) => [flow.id, flow]));
  return EXPECTED_IOS_STATE_IDS.map((stateId) => {
    const flow = flowsById.get(expectedIosFlowId(stateId));
    const source = readFileSync(path.join(root, flow.path), "utf8");
    const screenshotName = [...source.matchAll(/^- takeScreenshot: "([^"]+)"$/gm)][0][1];
    return Object.freeze({ stateId, flowId: flow.id, flowPath: flow.path, screenshotName });
  });
}

export function main(root = process.cwd()) {
  let config;
  try {
    config = readAuditConfig(root);
  } catch (error) {
    console.error(error.message);
    return 1;
  }
  const errors = collectUxUiAuditConfigErrors(root, config);
  if (errors.length > 0) {
    console.error("UX/UI audit config validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    return 1;
  }
  mkdirSync(path.join(root, config.outputDir), { recursive: true });
  console.log(`UX/UI audit config OK: ${config.auditId}`);
  console.log(`Output directory: ${path.join(root, config.outputDir)}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
