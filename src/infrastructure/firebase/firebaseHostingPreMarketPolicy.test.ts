import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import test from "node:test";
import ts from "typescript";

type JsonObject = Readonly<Record<string, unknown>>;

type PolicyInput = Readonly<{
  firebaseConfig: JsonObject;
  firebaseRc: JsonObject;
  packageScripts: Readonly<Record<string, string>>;
  repositoryScriptSources: Readonly<Record<string, string>>;
}>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isValidRelativePublicPath = (value: unknown): value is string => {
  if (typeof value !== "string" || value.trim() === "" || value !== value.trim()) return false;
  if (isAbsolute(value) || /^(?:[A-Za-z]:[\\/]|[\\/])/u.test(value)) return false;
  return !value.split(/[\\/]/u).includes("..");
};

const hasUnsafeExpoStart = (source: string): boolean => source.split(/\r?\n/u).some((line) => {
  if (!/\bexpo\s+start\b/u.test(line)) return false;
  return !/(?:^|\s)--localhost(?:\s|$)/u.test(line)
    || /(?:^|\s)--(?:lan|tunnel|host)(?:[=\s]|$)/u.test(line);
});

const hasForbiddenFirebaseHostingPath = (source: string): boolean => {
  if (/firebaseextended\/action-hosting-deploy@/iu.test(source)) return true;

  return source.split(/\r?\n/u).some((line) => {
    if (!/\bfirebase(?:\.cmd)?\b/u.test(line)) return false;
    const authOnlyEmulator = /\bemulators:start\b/u.test(line)
      && /(?:^|\s)--only(?:=|\s+)auth(?:\s|$)/u.test(line)
      && !/(?:^|\s)--only(?:=|\s+)[^\r\n]*,/u.test(line);
    return /(?:^|\s)--host(?:[=\s]|$)/u.test(line)
      || (!authOnlyEmulator && /(?:^|\s)--config(?:[=\s]|$)/u.test(line))
      || /\bdeploy\b/u.test(line)
      || /\bserve\b/u.test(line)
      || /\bhosting:(?:clone|channel:(?:deploy|clone|open))\b/u.test(line);
  });
};

const hasForbiddenPublicWebExposurePath = (source: string, allowHtmlEntities: boolean): boolean => {
  const sourceFile = allowHtmlEntities ? ts.createSourceFile("policy-source.ts", source, ts.ScriptTarget.Latest, true) : undefined;
  if (sourceFile && hasForbiddenShellExecution(sourceFile)) return true;
  const scannedSource = sourceFile ? maskHtmlLiterals(sourceFile) : source;
  if (/\buses\s*:\s*[^\s#]*(?:netlify|vercel|apphosting|localtunnel)[^\s#]*@/iu.test(source)) return true;
  if (/\buses\s*:\s*cloudflare\/(?:pages-action|wrangler-action)@/iu.test(source)) return true;
  if (/\buses\s*:\s*ngrok\/[^\s#]*@/iu.test(source)) return true;

  return scannedSource.split(/\r?\n/u).some((line) => {
    if (/\bfirebase(?:\.cmd)?\b[^\r\n]*\bapphosting:/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)(?:netlify|netlify-cli)(?:\.cmd)?\b[^\r\n]*\bdeploy\b/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)vercel(?:\.cmd)?\b/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)wrangler(?:\.cmd)?\s+pages\s+deploy\b/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)cloudflared(?:\.exe)?\s+tunnel\b/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)ngrok(?:\.exe)?\s+(?:http|tcp|tls|start)\b/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)(?:localtunnel|lt)(?:\.cmd)?(?=[\s;&|]|$)/u.test(line)) return true;
    return /(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)eas(?:\.cmd)?\s+deploy\b/u.test(line);
  });
};

// Mask only complete HTML/entity literals, preserving shell-like text elsewhere in the source.
const maskHtmlLiterals = (file: ts.SourceFile): string => {
  const ranges: { start: number; end: number }[] = [];
  const visit = (node: ts.Node): void => {
    const text = ts.isStringLiteralLike(node) ? node.text
      : ts.isRegularExpressionLiteral(node) ? node.text.replace(/^\/|\/[a-z]*$/gu, "") : undefined;
    if (text !== undefined && /^(?:&lt;|&lt;\/?[A-Za-z][A-Za-z0-9:-]*\s*\/?&gt;)$/u.test(text)) {
      ranges.push({ start: node.getStart(file), end: node.end });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  let source = file.text;
  for (const { start, end } of ranges.reverse()) {
    source = source.slice(0, start) + source.slice(start, end).replace(/&lt;/gu, "    ") + source.slice(end);
  }
  return source;
};

// This static guard recognizes explicit child_process calls and literal commands, not dynamic dataflow.
const hasForbiddenShellExecution = (file: ts.SourceFile): boolean => {
  const apiNames = ["exec", "execSync", "spawn", "spawnSync", "execFile", "execFileSync"];
  const functions = new Map(apiNames.map((name) => [name, name]));
  const namespaces = new Set(["child_process"]);
  const isChildProcess = (node: ts.Node | undefined): boolean =>
    !!node && ts.isStringLiteralLike(node) && /^(?:node:)?child_process$/u.test(node.text);
  const registerBindings = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && isChildProcess(node.moduleSpecifier)) {
      const clause = node.importClause;
      if (clause?.name) namespaces.add(clause.name.text);
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) namespaces.add(bindings.name.text);
      if (bindings && ts.isNamedImports(bindings)) {
        for (const binding of bindings.elements) {
          const api = (binding.propertyName ?? binding.name).text;
          if (apiNames.includes(api)) functions.set(binding.name.text, api);
        }
      }
    }
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)
      && ts.isIdentifier(node.initializer.expression) && node.initializer.expression.text === "require"
      && isChildProcess(node.initializer.arguments[0])) {
      if (ts.isIdentifier(node.name)) namespaces.add(node.name.text);
      if (ts.isObjectBindingPattern(node.name)) {
        for (const binding of node.name.elements) {
          const api = (binding.propertyName ?? binding.name).getText(file);
          if (ts.isIdentifier(binding.name) && apiNames.includes(api)) functions.set(binding.name.text, api);
        }
      }
    }
    ts.forEachChild(node, registerBindings);
  };
  registerBindings(file);

  let forbidden = false;
  const inspect = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const api = ts.isIdentifier(callee) ? functions.get(callee.text)
        : ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)
          && namespaces.has(callee.expression.text) ? callee.name.text : undefined;
      if (api && apiNames.includes(api)) {
        const command = node.arguments[0];
        const argv = node.arguments[1];
        const shellOption = node.arguments.some((argument) => ts.isObjectLiteralExpression(argument)
          && argument.properties.some((property) => ts.isPropertyAssignment(property)
            && (ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name))
            && property.name.text === "shell"
            && (property.initializer.kind === ts.SyntaxKind.TrueKeyword || ts.isStringLiteralLike(property.initializer))));
        const shellExecutable = command && ts.isStringLiteralLike(command)
          && /(?:^|\/)(?:sh|bash|zsh)$/u.test(command.text)
          && argv && ts.isArrayLiteralExpression(argv)
          && argv.elements.some((argument) => ts.isStringLiteralLike(argument) && argument.text === "-c");
        if (api === "exec" || api === "execSync" || shellOption || shellExecutable) {
          const literalArguments = node.arguments.flatMap((argument) => ts.isStringLiteralLike(argument)
            ? [argument.text] : ts.isArrayLiteralExpression(argument)
              ? argument.elements.filter(ts.isStringLiteralLike).map((element) => element.text) : []);
          forbidden ||= literalArguments.some((argument) => hasForbiddenPublicWebExposurePath(argument, false));
        }
      }
    }
    ts.forEachChild(node, inspect);
  };
  inspect(file);
  return forbidden;
};

const evaluatePreMarketHostingPolicy = ({
  firebaseConfig,
  firebaseRc,
  packageScripts,
  repositoryScriptSources,
}: PolicyInput): readonly string[] => {
  const errors: string[] = [];
  const hosting = firebaseConfig.hosting;
  const hostingEntry = isObject(hosting) ? hosting : undefined;
  const hasValidHostingShape = hosting === undefined || hostingEntry !== undefined;

  if (!hasValidHostingShape) {
    errors.push("Pre-market Firebase Hosting must be absent or exactly one object; arrays and multiple artifacts are prohibited.");
  }

  if (hostingEntry) {
    if (!isValidRelativePublicPath(hostingEntry.public)) {
      errors.push("Pre-market Firebase Hosting requires one non-empty relative public path without an absolute or parent traversal segment.");
    }

    const emulators = isObject(firebaseConfig.emulators) ? firebaseConfig.emulators : undefined;
    const hostingEmulator = emulators && isObject(emulators.hosting) ? emulators.hosting : undefined;
    if (hostingEmulator?.host !== "127.0.0.1") {
      errors.push("Pre-market Firebase Hosting must bind its emulator exactly to 127.0.0.1.");
    }

    if ("site" in hostingEntry || "target" in hostingEntry) {
      errors.push("Pre-market Firebase Hosting must not select a public site or deploy target.");
    }
  }

  const targets = isObject(firebaseRc.targets) ? firebaseRc.targets : undefined;
  if (targets && Object.values(targets).some((projectTargets) =>
    isObject(projectTargets) && "hosting" in projectTargets
  )) {
    errors.push("Pre-market Firebase configuration must not map a Hosting deploy target.");
  }

  const profileLauncher = "node scripts/runLocalProfile.mjs";
  if (packageScripts.start !== profileLauncher) {
    errors.push("Canonical npm start must require the explicit local-profile launcher.");
  }
  if (packageScripts.web !== profileLauncher) {
    errors.push("Canonical npm run web must require the explicit local-profile launcher.");
  }
  const launcherSource = repositoryScriptSources["scripts/runLocalProfile.mjs"];
  if (typeof launcherSource !== "string" || !/start:\s*\["start",\s*"--localhost"\]/u.test(launcherSource) || !/web:\s*\["start",\s*"--web",\s*"--localhost"\]/u.test(launcherSource)) {
    errors.push("Local-profile launcher must bind both start and web Expo actions to --localhost.");
  }

  const policySources = [
    ...Object.entries(packageScripts).map(([name, source]) => [name, source, false] as const),
    ...Object.entries(repositoryScriptSources).map(([name, source]) => [name, source, !name.startsWith(".github/workflows/") && /\.[cm]?[jt]sx?$/u.test(name)] as const),
  ];
  for (const [name, source, allowHtmlEntities] of policySources) {
    if (hasUnsafeExpoStart(source)) {
      errors.push(`Pre-market executable must bind every Expo start command only with --localhost: ${name}.`);
    }
    if (hasForbiddenFirebaseHostingPath(source)) {
      errors.push(`Pre-market repository must not expose a Firebase Hosting deploy, preview, clone, legacy serve, config/host override or deploy action: ${name}.`);
    }
    if (hasForbiddenPublicWebExposurePath(source, allowHtmlEntities)) {
      errors.push(`Pre-market repository must not expose an alternative public web host or tunnel: ${name}.`);
    }
  }

  return errors;
};

const collectFiles = (root: string): readonly string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) files.push(...collectFiles(path));
    else files.push(path);
  }
  return files;
};

const loadCurrentPolicyInput = (): PolicyInput => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as JsonObject;
  const scripts = isObject(packageJson.scripts)
    ? Object.fromEntries(Object.entries(packageJson.scripts).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
    : {};
  const policyRoots = ["scripts", ".github/workflows"].filter(existsSync);
  const repositoryScriptSources = Object.fromEntries(policyRoots.flatMap((root) =>
    collectFiles(root).map((path) => [relative(".", path), readFileSync(path, "utf8")]),
  ));

  return {
    firebaseConfig: JSON.parse(readFileSync("firebase.json", "utf8")) as JsonObject,
    firebaseRc: JSON.parse(readFileSync(".firebaserc", "utf8")) as JsonObject,
    packageScripts: scripts,
    repositoryScriptSources,
  };
};

test("keeps pre-market Firebase Hosting unpublished and loopback-only", () => {
  assert.deepEqual(evaluatePreMarketHostingPolicy(loadCurrentPolicyInput()), []);

  const localArtifact: PolicyInput = {
    firebaseConfig: {
      hosting: { public: "public" },
      emulators: { hosting: { host: "127.0.0.1", port: 5000 } },
    },
    firebaseRc: { projects: { sandbox: "patternly-app-sandbox", production: "patternly-app-production" } },
    packageScripts: {
      start: "node scripts/runLocalProfile.mjs",
      web: "node scripts/runLocalProfile.mjs",
      "hosting:local": "firebase emulators:start --only hosting",
    },
    repositoryScriptSources: {
      "scripts/runLocalProfile.mjs": "const ACTIONS = { start: [\"start\", \"--localhost\"], web: [\"start\", \"--web\", \"--localhost\"] };",
    },
  };
  assert.deepEqual(evaluatePreMarketHostingPolicy(localArtifact), []);

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    packageScripts: {
      ...localArtifact.packageScripts,
      "auth:local": "firebase emulators:start --only auth --project demo-patternly --config scripts/firebaseAuthGeneration.firebase.json",
    },
  }), []);

  for (const host of [undefined, "localhost", "0.0.0.0", "192.168.1.10", "::1"]) {
    assert.deepEqual(evaluatePreMarketHostingPolicy({
      ...localArtifact,
      firebaseConfig: {
        hosting: { public: "public" },
        emulators: { hosting: { ...(host === undefined ? {} : { host }), port: 5000 } },
      },
    }), ["Pre-market Firebase Hosting must bind its emulator exactly to 127.0.0.1."], String(host));
  }

  for (const [name, command] of [
    ["live", "firebase deploy --only hosting"],
    ["broad-live", "firebase deploy"],
    ["option-before-live", "firebase --project sandbox deploy --only hosting"],
    ["preview", "firebase hosting:channel:deploy premarket"],
    ["hosting-clone", "firebase hosting:clone source-site:live target-site:live"],
    ["preview-clone", "firebase hosting:channel:clone source:preview target:preview"],
    ["legacy-serve", "firebase serve --host 0.0.0.0 --only hosting"],
    ["alternative-config-before", "firebase --config firebase.public.json emulators:start --only hosting"],
    ["alternative-config-after", "firebase emulators:start --only hosting --config=firebase.public.json"],
    ["host-override", "firebase emulators:start --only hosting --host 0.0.0.0"],
  ] as const) {
    assert.deepEqual(evaluatePreMarketHostingPolicy({
      ...localArtifact,
      packageScripts: { ...localArtifact.packageScripts, [name]: command },
    }), [
      `Pre-market repository must not expose a Firebase Hosting deploy, preview, clone, legacy serve, config/host override or deploy action: ${name}.`,
    ]);
  }

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    repositoryScriptSources: {
      ...localArtifact.repositoryScriptSources,
      ".github/workflows/hosting.yml": "uses: FirebaseExtended/action-hosting-deploy@v0",
    },
  }), [
    "Pre-market repository must not expose a Firebase Hosting deploy, preview, clone, legacy serve, config/host override or deploy action: .github/workflows/hosting.yml.",
  ]);

  for (const [name, command] of [
    ["firebase-app-hosting", "firebase apphosting:rollouts:create patternly-api"],
    ["netlify", "netlify deploy --prod"],
    ["vercel", "vercel --prod"],
    ["vercel-preview", "vercel"],
    ["cloudflare-pages", "wrangler pages deploy public"],
    ["cloudflare-tunnel", "cloudflared tunnel --url http://127.0.0.1:5000"],
    ["ngrok", "ngrok http 5000"],
    ["ngrok-start", "ngrok start --all"],
    ["localtunnel", "localtunnel --port 5000"],
    ["localtunnel-short", "lt --port 5000"],
    ["localtunnel-npx", "npx localtunnel --port 5000"],
    ["localtunnel-npm-exec", "npm exec lt --port 5000"],
    ["localtunnel-pnpm", "pnpm dlx localtunnel --port 5000"],
    ["localtunnel-yarn", "yarn dlx lt --port 5000"],
    ["localtunnel-bare", "lt"],
    ["localtunnel-separator", "lt; echo done"],
    ["localtunnel-background", "echo ready &lt --port 5000"],
    ["localtunnel-background-bare", "echo ready &lt; echo done"],
    ["localtunnel-windows", "lt.cmd --port 5000"],
    ["eas-hosting", "eas deploy"],
  ] as const) {
    assert.deepEqual(evaluatePreMarketHostingPolicy({
      ...localArtifact,
      packageScripts: { ...localArtifact.packageScripts, [name]: command },
    }), [
      `Pre-market repository must not expose an alternative public web host or tunnel: ${name}.`,
    ]);
  }

  for (const source of [
    'const escaped = "&lt;script&gt;";',
    'assert.match(html, /&lt;script&gt;/u);',
  ]) {
    assert.deepEqual(evaluatePreMarketHostingPolicy({
      ...localArtifact,
      repositoryScriptSources: { ...localArtifact.repositoryScriptSources, "scripts/legal-review.mjs": source },
    }), []);
  }

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    repositoryScriptSources: {
      ...localArtifact.repositoryScriptSources,
      ".github/workflows/localtunnel-command.yml": "steps:\n  - run: npx localtunnel --port 5000",
    },
  }), [
    "Pre-market repository must not expose an alternative public web host or tunnel: .github/workflows/localtunnel-command.yml.",
  ]);

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    repositoryScriptSources: {
      ...localArtifact.repositoryScriptSources,
      ".github/workflows/localtunnel-background.yml": "steps:\n  - run: echo ready &lt; echo done",
    },
  }), [
    "Pre-market repository must not expose an alternative public web host or tunnel: .github/workflows/localtunnel-background.yml.",
  ]);

  for (const source of [
    "execSync('echo ready &lt; echo done');",
    "const command = 'echo ready &lt; echo done'; execSync(command);",
    "import { execSync } from 'node:child_process'; execSync('&lt;');",
    "import { exec } from 'node:child_process'; exec('echo ready &lt; echo done');",
    "import { execSync as run } from 'child_process'; run('echo ready &lt; echo done');",
    "import * as cp from 'node:child_process'; cp.execSync('echo ready &lt; echo done');",
    "const { exec: run } = require('node:child_process'); run('echo ready &lt; echo done');",
    "const cp = require('child_process'); cp.exec('echo ready &lt; echo done');",
    "import { spawn } from 'node:child_process'; spawn('echo ready &lt; echo done', { shell: true });",
    "import { spawnSync as run } from 'node:child_process'; run('sh', ['-c', 'echo ready &lt; echo done']);",
    "import * as cp from 'child_process'; cp.spawn('/bin/sh', ['-c', 'echo ready &lt; echo done']);",
  ]) {
    assert.deepEqual(evaluatePreMarketHostingPolicy({
      ...localArtifact,
      repositoryScriptSources: { ...localArtifact.repositoryScriptSources, "scripts/probe.mjs": source },
    }), [
      "Pre-market repository must not expose an alternative public web host or tunnel: scripts/probe.mjs.",
    ]);
  }

  for (const [name, action] of [
    ["firebase-app-hosting-action", "uses: FirebaseExtended/action-apphosting-deploy@v1"],
    ["netlify-action", "uses: nwtgck/actions-netlify@v3"],
    ["vercel-action", "uses: amondnet/vercel-action@v25"],
    ["cloudflare-pages-action", "uses: cloudflare/pages-action@v1"],
    ["cloudflare-wrangler-action", "uses: cloudflare/wrangler-action@v3"],
    ["ngrok-action", "uses: ngrok/ngrok-action@v1"],
    ["localtunnel-action", "uses: example/action-localtunnel@v1"],
  ] as const) {
    const path = `.github/workflows/${name}.yml`;
    assert.deepEqual(evaluatePreMarketHostingPolicy({
      ...localArtifact,
      repositoryScriptSources: { ...localArtifact.repositoryScriptSources, [path]: action },
    }), [
      `Pre-market repository must not expose an alternative public web host or tunnel: ${path}.`,
    ]);
  }

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    repositoryScriptSources: {
      ...localArtifact.repositoryScriptSources,
      ".github/workflows/netlify-command.yml": "steps:\n  - run: netlify deploy --prod",
    },
  }), [
    "Pre-market repository must not expose an alternative public web host or tunnel: .github/workflows/netlify-command.yml.",
  ]);

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    packageScripts: {
      ...localArtifact.packageScripts,
      "deploy:api": "gcloud run deploy patternly-api",
    },
  }), []);

  for (const [scriptName, command] of [
    ["start", "expo start"],
    ["start", "expo start --lan"],
    ["start", "expo start --tunnel"],
    ["start", "expo start --localhost --lan"],
    ["web", "expo start --web"],
    ["web", "expo start --web --tunnel"],
  ] as const) {
    const canonicalError = scriptName === "start"
      ? "Canonical npm start must require the explicit local-profile launcher."
      : "Canonical npm run web must require the explicit local-profile launcher.";
    assert.deepEqual(evaluatePreMarketHostingPolicy({
      ...localArtifact,
      packageScripts: { ...localArtifact.packageScripts, [scriptName]: command },
    }), [
      canonicalError,
      `Pre-market executable must bind every Expo start command only with --localhost: ${scriptName}.`,
    ], `${scriptName}: ${command}`);
  }

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    repositoryScriptSources: { ...localArtifact.repositoryScriptSources, "scripts/unsafe-web.mjs": "expo start --lan" },
  }), [
    "Pre-market executable must bind every Expo start command only with --localhost: scripts/unsafe-web.mjs.",
  ]);

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    firebaseConfig: {
      hosting: { public: "public", site: "patternly-app-sandbox" },
      emulators: { hosting: { host: "127.0.0.1", port: 5000 } },
    },
  }), ["Pre-market Firebase Hosting must not select a public site or deploy target."]);

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    firebaseRc: {
      projects: { sandbox: "patternly-app-sandbox", production: "patternly-app-production" },
      targets: { sandbox: { hosting: { public: ["patternly-app-sandbox"] } } },
    },
  }), ["Pre-market Firebase configuration must not map a Hosting deploy target."]);

  for (const [name, publicPath] of [
    ["missing", undefined],
    ["blank", "   "],
    ["absolute", "/tmp/patternly-public"],
    ["parent-traversal", "public/../outside"],
  ] as const) {
    assert.deepEqual(evaluatePreMarketHostingPolicy({
      ...localArtifact,
      firebaseConfig: {
        hosting: { ...(publicPath === undefined ? {} : { public: publicPath }) },
        emulators: { hosting: { host: "127.0.0.1", port: 5000 } },
      },
    }), [
      "Pre-market Firebase Hosting requires one non-empty relative public path without an absolute or parent traversal segment.",
    ], name);
  }

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    firebaseConfig: {
      hosting: [{ public: "public" }],
      emulators: { hosting: { host: "127.0.0.1", port: 5000 } },
    },
  }), ["Pre-market Firebase Hosting must be absent or exactly one object; arrays and multiple artifacts are prohibited."]);

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    firebaseConfig: {
      hosting: [{ public: "first" }, { public: "second" }],
      emulators: { hosting: { host: "127.0.0.1", port: 5000 } },
    },
  }), ["Pre-market Firebase Hosting must be absent or exactly one object; arrays and multiple artifacts are prohibited."]);
});
