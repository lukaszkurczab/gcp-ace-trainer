import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/launch-readiness.yml"), "utf8");

const inputs = [
  { name: "application_commit", variable: "APPLICATION_COMMIT", repository: "lukaszkurczab/gcp-ace-trainer", path: "app" },
  { name: "backend_commit", variable: "BACKEND_COMMIT", repository: "lukaszkurczab/patternly-backend", path: "patternly-backend" },
  { name: "content_commit", variable: "CONTENT_COMMIT", repository: "lukaszkurczab/patternly-content", path: "patternly-content" },
  { name: "web_commit", variable: "WEB_COMMIT", repository: "lukaszkurczab/patternly-web", path: "patternly-web" },
];

const installSteps = [
  ["Install application dependencies", "app"],
  ["Install backend dependencies", "patternly-backend"],
  ["Install content dependencies", "patternly-content"],
  ["Install web dependencies", "patternly-web"],
];

const owningSteps = [
  ["Run application owning gate", "application-gate", "app", "npm run qa:static"],
  ["Run backend owning gate", "backend-gate", "patternly-backend", "npm run ci"],
  ["Run content test gate", "content-test-gate", "patternly-content", "npm test"],
  ["Run content authoring gate", "content-authoring-gate", "patternly-content", "npm run authoring:validate"],
  ["Run content AWS source gate", "content-aws-gate", "patternly-content", "npm run audit:aws-workbook-source"],
  ["Run web local verification gate", "web-verify-gate", "patternly-web", "npm run verify:local"],
  ["Run web admin behavior gate", "web-admin-behavior-gate", "patternly-web", "npm run test:admin-behavior"],
  ["Run web admin config gate", "web-admin-config-gate", "patternly-web", "npm run test:admin-config"],
];

const finalOutcomeIds = [
  "validate-inputs",
  "checkout-integrity",
  "setup-java",
  "install-firebase",
  "install-application",
  "install-backend",
  "install-content",
  "install-web",
  "install-web-browser",
  ...owningSteps.map(([, id]) => id),
  "post-gate-integrity",
  "release-manifest-create",
  "release-manifest-json",
  "release-manifest-verify",
  "release-gate",
  "release-report-json",
  "upload-release-manifest",
  "upload-release-report",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stepBlock(source, name) {
  const marker = `      - name: ${name}\n`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing workflow step: ${name}`);
  const bodyStart = start + marker.length;
  const nextStep = source.indexOf("\n      - ", bodyStart);
  return source.slice(start, nextStep === -1 ? source.length : nextStep);
}

function replaceInStep(source, name, from, to) {
  const marker = `      - name: ${name}\n`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing workflow step for mutation: ${name}`);
  const nextStep = source.indexOf("\n      - ", start + marker.length);
  const end = nextStep === -1 ? source.length : nextStep;
  const block = source.slice(start, end);
  assert.notEqual(block.indexOf(from), -1, `missing mutation target in step: ${name}`);
  return `${source.slice(0, start)}${block.replace(from, to)}${source.slice(end)}`;
}

function replaceOnce(source, from, to) {
  const index = source.indexOf(from);
  assert.notEqual(index, -1, `missing mutation target: ${from}`);
  return `${source.slice(0, index)}${to}${source.slice(index + from.length)}`;
}

function assertInputContract(source) {
  const inputMatch = source.match(/workflow_dispatch:\n\s+inputs:\n([\s\S]*?)(?=\npermissions:)/u);
  assert.ok(inputMatch, "workflow_dispatch inputs block is required");
  const inputBlock = inputMatch[1];
  const declaredNames = [...inputBlock.matchAll(/^      ([a-z_]+):$/gmu)].map((match) => match[1]);
  assert.deepEqual(declaredNames, inputs.map(({ name }) => name), "the workflow must declare exactly four commit inputs");
  for (const { name } of inputs) {
    assert.match(
      inputBlock,
      new RegExp(`^      ${escapeRegExp(name)}:\\n        description: [^\\n]+\\n        required: true\\n        type: string$`, "mu"),
      `${name} must be a required string input`,
    );
  }

  const validate = stepBlock(source, "Validate exact commit inputs");
  for (const { name, variable } of inputs) {
    assert.match(validate, new RegExp(`^          ${variable}: \\$\\{\\{ inputs\\.${name} \\}\\}$`, "mu"));
    assert.match(validate, new RegExp(`^          \\[\\[ "\\$${variable}" =~ \\^\\[0-9a-f\\]\\{40\\}\\$ \\]\\]$`, "mu"));
  }
}

function assertCheckoutContract(source) {
  assert.equal((source.match(/^        uses: actions\/checkout@v4$/gmu) ?? []).length, 4, "exactly four checkout actions are required");
  for (const { name, variable, repository, path } of inputs) {
    const checkout = stepBlock(source, `Checkout ${name.replace("_commit", "")}`);
    assert.match(checkout, /uses: actions\/checkout@v4\n\s+with:\n/u);
    assert.match(checkout, new RegExp(`^          repository: ${escapeRegExp(repository)}$`, "mu"));
    assert.match(checkout, new RegExp(`^          ref: \\$\\{\\{ inputs\\.${name} \\}\\}$`, "mu"));
    assert.match(checkout, new RegExp(`^          path: ${escapeRegExp(path)}$`, "mu"));
    assert.match(checkout, /^          fetch-depth: 0$/mu);
  }
  assert.doesNotMatch(source, /(?:ref:\s*(?:main|master)|github\.sha|github\.ref|refs\/heads\/)/u, "candidate refs must never be moving refs");
}

function assertIntegrityContract(source) {
  for (const stepName of ["Verify exact checkout SHAs and clean worktrees", "Verify exact HEADs and clean worktrees after owning gates"]) {
    const integrity = stepBlock(source, stepName);
    for (const { variable, path } of inputs) {
      assert.ok(integrity.includes(`test "$(git -C ${path} rev-parse HEAD)" = "$${variable}"`));
      assert.ok(integrity.includes(`test -z "$(git -C ${path} status --porcelain --untracked-files=all)"`));
    }
  }
}

function assertToolingContract(source) {
  assert.match(source, /node-version: 22\.13\.1/u);
  for (const { path } of inputs) assert.match(source, new RegExp(`^            ${escapeRegExp(path)}\/package-lock\\.json$`, "mu"));
  const java = stepBlock(source, "Set up Java 21 for backend emulator gate");
  assert.match(java, /uses: actions\/setup-java@v4/u);
  assert.match(java, /^          distribution: temurin$/mu);
  assert.match(java, /^          java-version: "21"$/mu);
  const firebase = stepBlock(source, "Install Firebase CLI for backend emulator gate");
  assert.match(firebase, /npm install --global firebase-tools@15\.19\.0/u);
  assert.match(firebase, /firebase --version/u);
  for (const [name, path] of installSteps) {
    const install = stepBlock(source, name);
    assert.match(install, new RegExp(`^        working-directory: ${escapeRegExp(path)}$`, "mu"));
    assert.match(install, /^        run: npm ci$/mu);
  }
  const browser = stepBlock(source, "Install pinned Playwright Chromium for web gates");
  assert.match(browser, /^        id: install-web-browser$/mu);
  assert.match(browser, /^        working-directory: patternly-web$/mu);
  assert.match(browser, /^        run: npx playwright install --with-deps chromium$/mu);
}

function assertOwningGateContract(source) {
  for (const [name, id, path, command] of owningSteps) {
    const gate = stepBlock(source, name);
    assert.match(gate, new RegExp(`^        id: ${escapeRegExp(id)}$`, "mu"));
    assert.match(gate, /^        continue-on-error: true$/mu);
    assert.match(gate, new RegExp(`^        working-directory: ${escapeRegExp(path)}$`, "mu"));
    if (id === "web-verify-gate") {
      assert.match(gate, /^        run: \|$/mu);
      assert.match(gate, /local_url="http:\/\/127\.0\.0\.1:4173"/u);
      assert.match(gate, /server_log="\$\(mktemp\)"/u);
      assert.match(gate, /server_pid=""/u);
      assert.match(gate, /cleanup\(\) \{/u);
      assert.match(gate, /kill "\$server_pid"/u);
      assert.match(gate, /wait "\$server_pid"/u);
      assert.match(gate, /trap cleanup EXIT/u);
      assert.match(gate, /npm run dev -- --host 127\.0\.0\.1 --port 4173 --strictPort >"\$server_log" 2>&1 &/u);
      assert.match(gate, /server_pid=\$!/u);
      assert.match(gate, /for attempt in \{1\.\.60\}; do/u);
      assert.match(gate, /curl --fail --silent --show-error "\$local_url\/" >\/dev\/null/u);
      assert.match(gate, /kill -0 "\$server_pid"/u);
      assert.match(gate, /sleep 1/u);
      assert.match(gate, /export PATTERNLY_LOCAL_URL="\$local_url"/u);
      assert.match(gate, new RegExp(`^          npm run ${escapeRegExp(command.replace("npm run ", ""))}$`, "mu"));
    } else {
      assert.match(gate, new RegExp(`^        run: ${escapeRegExp(command)}$`, "mu"));
    }
  }
  const backend = stepBlock(source, "Run backend owning gate");
  assert.match(backend, /^          PATTERNLY_FRONTEND_ROOT: \$\{\{ github\.workspace \}\}\/app$/mu);
  assert.match(backend, /^          PATTERNLY_WEB_ROOT: \$\{\{ github\.workspace \}\}\/patternly-web$/mu);
}

function assertManifestAndReleaseContract(source) {
  const postIntegrity = stepBlock(source, "Verify exact HEADs and clean worktrees after owning gates");
  assert.match(postIntegrity, /^        if: always\(\)$/mu);
  assert.match(postIntegrity, /^        continue-on-error: true$/mu);

  const create = stepBlock(source, "Create candidate release manifest");
  assert.match(create, /^        if: always\(\)$/mu);
  assert.match(create, /^        continue-on-error: true$/mu);
  assert.match(create, /^          RELEASE_MANIFEST_PATH: \$\{\{ runner\.temp \}\}\/launch-readiness-manifest\.json$/mu);
  assert.match(create, /node scripts\/releaseManifest\.mjs create/u);
  for (const option of ["application", "backend", "content", "web"]) assert.ok(create.includes(`--${option}-root "$${option.toUpperCase()}_ROOT"`));
  assert.match(create, /--output "\$RELEASE_MANIFEST_PATH"/u);

  const manifestJson = stepBlock(source, "Validate candidate release manifest JSON");
  assert.match(manifestJson, /^        if: always\(\)$/mu);
  assert.match(manifestJson, /^        continue-on-error: true$/mu);
  assert.match(manifestJson, /JSON\.parse\(fs\.readFileSync\(process\.env\.RELEASE_MANIFEST_PATH, "utf8"\)\)/u);

  const verify = stepBlock(source, "Verify candidate release manifest");
  assert.match(verify, /^        if: always\(\)$/mu);
  assert.match(verify, /^        continue-on-error: true$/mu);
  assert.match(verify, /node scripts\/releaseManifest\.mjs verify/u);
  for (const option of ["application", "backend", "content", "web"]) assert.ok(verify.includes(`--${option}-root "$${option.toUpperCase()}_ROOT"`));
  assert.match(verify, /--manifest "\$RELEASE_MANIFEST_PATH"/u);

  const release = stepBlock(source, "Run enforced release gate with verified manifest");
  assert.match(release, /^        if: always\(\)$/mu);
  assert.match(release, /^        continue-on-error: true$/mu);
  assert.match(release, /node scripts\/releaseGate\.mjs/u);
  assert.match(release, /--enforce/u);
  assert.match(release, /--manifest "\$RELEASE_MANIFEST_PATH"/u);
  for (const option of ["application", "backend", "content", "web"]) assert.ok(release.includes(`--${option}-root "$${option.toUpperCase()}_ROOT"`));
  assert.match(release, /--output "\$RELEASE_REPORT_PATH"/u);
  assert.match(release, /release_status=\$\?/u);
  assert.match(release, /test -s "\$RELEASE_REPORT_PATH"/u);
  assert.match(release, /JSON\.parse\(fs\.readFileSync\(process\.env\.RELEASE_REPORT_PATH, "utf8"\)\)/u);
  assert.match(release, /exit "\$release_status"/u);

  const reportJson = stepBlock(source, "Validate launch readiness report JSON");
  assert.match(reportJson, /^        if: always\(\)$/mu);
  assert.match(reportJson, /^        continue-on-error: true$/mu);
  assert.match(reportJson, /JSON\.parse\(fs\.readFileSync\(process\.env\.RELEASE_REPORT_PATH, "utf8"\)\)/u);

  const createStart = source.indexOf("      - name: Create candidate release manifest");
  const gateEnd = source.indexOf("      - name: Run web admin config gate");
  assert.ok(createStart > gateEnd, "manifest creation must follow every owning gate");
  assert.ok((source.match(/runner\.temp/g) ?? []).length >= 8, "manifest and report paths must stay in runner.temp");
}

function assertArtifactAndResultContract(source) {
  for (const [name, id, artifact, file] of [
    ["Upload candidate release manifest", "upload-release-manifest", "manifest", "launch-readiness-manifest.json"],
    ["Upload launch readiness report", "upload-release-report", "report", "launch-readiness-report.json"],
  ]) {
    const upload = stepBlock(source, name);
    assert.match(upload, new RegExp(`^        id: ${escapeRegExp(id)}$`, "mu"));
    assert.match(upload, /^        if: always\(\)$/mu);
    assert.match(upload, /uses: actions\/upload-artifact@v4/u);
    assert.match(upload, new RegExp(`^          path: \\$\\{\\{ runner\.temp \\}\\}/${escapeRegExp(file)}$`, "mu"));
    assert.match(upload, /^          if-no-files-found: error$/mu);
    for (const { name: input } of inputs) assert.match(upload, new RegExp(`\\$\\{\\{ inputs\\.${input} \\}\\}`, "u"));
    assert.match(upload, new RegExp(`name: launch-readiness-${artifact}-`, "u"));
  }

  const final = stepBlock(source, "Enforce complete launch readiness result");
  assert.match(final, /^        if: always\(\)$/mu);
  for (const id of finalOutcomeIds) assert.match(final, new RegExp(`\\$\\{\\{ steps\\.${escapeRegExp(id)}\\.outcome \\}\\}`, "u"));
  assert.match(final, /failed=0/u);
  assert.match(final, /\[\[ "\$outcome" != "success" \]\]/u);
  assert.match(final, /failed=1/u);
  assert.match(final, /exit "\$failed"/u);
}

function assertWorkflowContract(source) {
  assert.match(source, /^name: Launch readiness$/mu);
  assert.match(source, /^permissions:\n  contents: read$/mu);
  assert.doesNotMatch(source, /(?:contents|actions|id-token):\s*write/u);
  assert.doesNotMatch(source, /secrets\./u);
  assertInputContract(source);
  assertCheckoutContract(source);
  assertIntegrityContract(source);
  assertToolingContract(source);
  assertOwningGateContract(source);
  assertManifestAndReleaseContract(source);
  assertArtifactAndResultContract(source);
}

test("launch readiness CI is the complete exact-four-SHA owning gate", () => {
  assert.doesNotThrow(() => assertWorkflowContract(workflow));
});

test("mutations of any required SHA input fail closed", () => {
  for (const { name } of inputs) {
    const missing = workflow.replace(new RegExp(`^      ${escapeRegExp(name)}:[\\s\\S]*?(?=^      [a-z_]+:|\\n\\npermissions:)`, "mu"), "");
    assert.notEqual(missing, workflow);
    assert.throws(() => assertWorkflowContract(missing));

    const optional = workflow.replace(new RegExp(`(      ${escapeRegExp(name)}:[\\s\\S]*?\\n        required: )true`, "u"), "$1false");
    assert.notEqual(optional, workflow);
    assert.throws(() => assertWorkflowContract(optional));

    const uppercase = workflow.replace(new RegExp(`(\\[\\[ "\\$${name.toUpperCase()}" =~ \\^\\[)0-9a-f`, "u"), "$1A-Fa-f");
    assert.notEqual(uppercase, workflow);
    assert.throws(() => assertWorkflowContract(uppercase));
  }
});

test("mutations of each fixed repository slug, ref, path and fetch depth fail closed", () => {
  for (const { name, repository, path } of inputs) {
    const checkoutName = `Checkout ${name.replace("_commit", "")}`;
    const wrongRepository = replaceInStep(workflow, checkoutName, `repository: ${repository}`, "repository: attacker/other");
    assert.throws(() => assertWorkflowContract(wrongRepository));
    const wrongRef = replaceInStep(workflow, checkoutName, `ref: \${{ inputs.${name} }}`, "ref: main");
    assert.throws(() => assertWorkflowContract(wrongRef));
    const wrongPath = replaceInStep(workflow, checkoutName, `path: ${path}`, "path: candidate");
    assert.throws(() => assertWorkflowContract(wrongPath));
    const wrongDepth = replaceInStep(workflow, checkoutName, "fetch-depth: 0", "fetch-depth: 1");
    assert.throws(() => assertWorkflowContract(wrongDepth));
  }
});

test("mutations of every exact-head or clean-worktree assertion fail closed", () => {
  for (const { variable, path } of inputs) {
    const wrongHead = replaceInStep(
      workflow,
      "Verify exact checkout SHAs and clean worktrees",
      `git -C ${path} rev-parse HEAD)\" = \"$${variable}`,
      `git -C other rev-parse HEAD)\" = \"$${variable}`,
    );
    assert.throws(() => assertWorkflowContract(wrongHead));
    const wrongClean = replaceInStep(
      workflow,
      "Verify exact checkout SHAs and clean worktrees",
      `git -C ${path} status --porcelain --untracked-files=all`,
      "git -C other status --porcelain --untracked-files=all",
    );
    assert.throws(() => assertWorkflowContract(wrongClean));
  }
});

test("mutations of toolchain and every npm ci owning gate fail closed", () => {
  assert.throws(() => assertWorkflowContract(replaceOnce(workflow, "node-version: 22.13.1", "node-version: 20")));
  assert.throws(() => assertWorkflowContract(replaceOnce(workflow, "distribution: temurin", "distribution: zulu")));
  assert.throws(() => assertWorkflowContract(replaceOnce(workflow, "java-version: \"21\"", "java-version: \"17\"")));
  assert.throws(() => assertWorkflowContract(replaceOnce(workflow, "npm install --global firebase-tools", "npm install --global other-cli")));
  assert.throws(() => assertWorkflowContract(replaceOnce(workflow, "firebase-tools@15.19.0", "firebase-tools@latest")));
  assert.throws(() => assertWorkflowContract(replaceOnce(workflow, "firebase --version", "node --version")));
  for (const [name] of installSteps) {
    assert.throws(() => assertWorkflowContract(replaceInStep(workflow, name, "run: npm ci", "run: npm install")));
    assert.throws(() => assertWorkflowContract(replaceInStep(workflow, name, "working-directory:", "working-directory: other #")));
  }
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Install pinned Playwright Chromium for web gates", "npx playwright install --with-deps chromium", "npx playwright install chromium")));
  for (const [name] of owningSteps) {
    assert.throws(() => assertWorkflowContract(replaceInStep(workflow, name, "continue-on-error: true", "continue-on-error: false")));
    if (name === "Run web local verification gate") {
      assert.throws(() => assertWorkflowContract(replaceInStep(workflow, name, "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort", "npm run wrong-server")));
    } else {
      assert.throws(() => assertWorkflowContract(replaceInStep(workflow, name, "run: ", "run: npm run wrong # ")));
    }
  }
});

test("mutations of the web server wait, base URL and cleanup fail closed", () => {
  const webGate = "Run web local verification gate";
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, webGate, "curl --fail --silent --show-error \"$local_url/\" >/dev/null", "curl --silent \"$local_url/\" >/dev/null")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, webGate, "for attempt in {1..60}; do", "while false; do")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, webGate, "export PATTERNLY_LOCAL_URL=\"$local_url\"", "export PATTERNLY_LOCAL_URL=\"http://localhost:5173\"")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, webGate, "trap cleanup EXIT", "trap - EXIT")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, webGate, "kill \"$server_pid\"", "kill \"$other_pid\"")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, webGate, "wait \"$server_pid\"", "wait \"$other_pid\"")));
});

test("mutations of backend sibling roots and content/web gate commands fail closed", () => {
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Run backend owning gate", "PATTERNLY_FRONTEND_ROOT: ${{ github.workspace }}/app", "PATTERNLY_FRONTEND_ROOT: ../patternly")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Run backend owning gate", "PATTERNLY_WEB_ROOT: ${{ github.workspace }}/patternly-web", "PATTERNLY_WEB_ROOT: ../patternly-web")));
  for (const [name, , , command] of owningSteps.slice(2)) {
    assert.throws(() => assertWorkflowContract(replaceInStep(workflow, name, `run: ${command}`, "run: npm run wrong")));
  }
});

test("mutations of manifest creation, verification and enforced release fail closed", () => {
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Create candidate release manifest", "if: always()", "if: success()")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Create candidate release manifest", "runner.temp", "app")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Create candidate release manifest", "--web-root \"$WEB_ROOT\"", "--output \"$RELEASE_MANIFEST_PATH\"")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Verify candidate release manifest", "--manifest \"$RELEASE_MANIFEST_PATH\"", "--manifest \"other.json\"")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Run enforced release gate with verified manifest", "--enforce", "--check")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Run enforced release gate with verified manifest", "--manifest \"$RELEASE_MANIFEST_PATH\"", "--manifest \"other.json\"")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Run enforced release gate with verified manifest", "release_status=$?", "release_status=0")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Run enforced release gate with verified manifest", "exit \"$release_status\"", "exit 0")));
});

test("mutations of JSON validation, unconditional uploads and final outcome enforcement fail closed", () => {
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Validate candidate release manifest JSON", "JSON.parse", "JSON.stringify")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Validate launch readiness report JSON", "if: always()", "if: success()")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Upload candidate release manifest", "if: always()", "if: success()")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Upload launch readiness report", "if-no-files-found: error", "if-no-files-found: ignore")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Enforce complete launch readiness result", "${{ steps.backend-gate.outcome }}", "success")));
  assert.throws(() => assertWorkflowContract(replaceInStep(workflow, "Enforce complete launch readiness result", "exit \"$failed\"", "exit 0")));
});

test("moving candidate refs, write permissions or secrets fail closed", () => {
  assert.throws(() => assertWorkflowContract(workflow.replace("ref: ${{ inputs.application_commit }}", "ref: master")));
  assert.throws(() => assertWorkflowContract(workflow.replace("contents: read", "contents: write")));
  assert.throws(() => assertWorkflowContract(`${workflow}\n          TOKEN: \${{ secrets.TOKEN }}\n`));
});
