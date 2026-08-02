import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import test from "node:test";

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
    return /(?:^|\s)--(?:config|host)(?:[=\s]|$)/u.test(line)
      || /\bdeploy\b/u.test(line)
      || /\bserve\b/u.test(line)
      || /\bhosting:(?:clone|channel:(?:deploy|clone|open))\b/u.test(line);
  });
};

const hasForbiddenPublicWebExposurePath = (source: string): boolean => {
  if (/\buses\s*:\s*[^\s#]*(?:netlify|vercel|apphosting|localtunnel)[^\s#]*@/iu.test(source)) return true;
  if (/\buses\s*:\s*cloudflare\/(?:pages-action|wrangler-action)@/iu.test(source)) return true;
  if (/\buses\s*:\s*ngrok\/[^\s#]*@/iu.test(source)) return true;

  return source.split(/\r?\n/u).some((line) => {
    if (/\bfirebase(?:\.cmd)?\b[^\r\n]*\bapphosting:/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)(?:netlify|netlify-cli)(?:\.cmd)?\b[^\r\n]*\bdeploy\b/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)vercel(?:\.cmd)?\b/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)wrangler(?:\.cmd)?\s+pages\s+deploy\b/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)cloudflared(?:\.exe)?\s+tunnel\b/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)ngrok(?:\.exe)?\s+(?:http|tcp|tls|start)\b/u.test(line)) return true;
    if (/(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)(?:localtunnel|lt)(?:\.cmd)?\b/u.test(line)) return true;
    return /(?:^\s*|\brun:\s*|[;&|]\s*|\b(?:npx|pnpm\s+dlx|yarn\s+dlx)\s+|\bnpm\s+exec\s+)eas(?:\.cmd)?\s+deploy\b/u.test(line);
  });
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

  if (packageScripts.start !== "expo start --localhost") {
    errors.push("Canonical npm start must be exactly expo start --localhost.");
  }
  if (packageScripts.web !== "expo start --web --localhost") {
    errors.push("Canonical npm run web must be exactly expo start --web --localhost.");
  }

  for (const [name, source] of Object.entries({ ...packageScripts, ...repositoryScriptSources })) {
    if (hasUnsafeExpoStart(source)) {
      errors.push(`Pre-market executable must bind every Expo start command only with --localhost: ${name}.`);
    }
    if (hasForbiddenFirebaseHostingPath(source)) {
      errors.push(`Pre-market repository must not expose a Firebase Hosting deploy, preview, clone, legacy serve, config/host override or deploy action: ${name}.`);
    }
    if (hasForbiddenPublicWebExposurePath(source)) {
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
      start: "expo start --localhost",
      web: "expo start --web --localhost",
      "hosting:local": "firebase emulators:start --only hosting",
    },
    repositoryScriptSources: {},
  };
  assert.deepEqual(evaluatePreMarketHostingPolicy(localArtifact), []);

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
    ["eas-hosting", "eas deploy"],
  ] as const) {
    assert.deepEqual(evaluatePreMarketHostingPolicy({
      ...localArtifact,
      packageScripts: { ...localArtifact.packageScripts, [name]: command },
    }), [
      `Pre-market repository must not expose an alternative public web host or tunnel: ${name}.`,
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
      repositoryScriptSources: { [path]: action },
    }), [
      `Pre-market repository must not expose an alternative public web host or tunnel: ${path}.`,
    ]);
  }

  assert.deepEqual(evaluatePreMarketHostingPolicy({
    ...localArtifact,
    repositoryScriptSources: {
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
      ? "Canonical npm start must be exactly expo start --localhost."
      : "Canonical npm run web must be exactly expo start --web --localhost.";
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
    repositoryScriptSources: { "scripts/unsafe-web.mjs": "expo start --lan" },
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
