import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const plugin = require("../plugins/withBundledContent.js");

test("T2.4: the Android assets directory is added once", () => {
  const gradle = "android {\n}\n";
  const once = plugin.addBundledContentAssets(gradle);
  assert.match(once, /android\.sourceSets\.main\.assets\.srcDirs \+= \["\.\.\/\.\.\/src\/content\/generated"\]/u);
  assert.equal(plugin.addBundledContentAssets(once), once);
});

test("T2.4: the iOS phase copies exactly the generated content JSON into patternly-content and is added once", () => {
  assert.match(plugin.IOS_COPY_SCRIPT, /\/src\/content\/generated/u);
  assert.match(plugin.IOS_COPY_SCRIPT, /patternly-content/u);
  assert.match(plugin.IOS_COPY_SCRIPT, /for DIR in canonical-content retained-content/u);
  assert.match(plugin.IOS_COPY_SCRIPT, /--include='\*\.json' --exclude='\*'/u);
  assert.doesNotMatch(plugin.IOS_COPY_SCRIPT, /\n/u, "pbxproj needs escaped newlines");
  const phases = {};
  let added = 0;
  const project = {
    hash: { project: { objects: { PBXShellScriptBuildPhase: phases } } },
    getFirstTarget: () => ({ uuid: "TARGET" }),
    addBuildPhase(files, type, name, target, options) {
      added += 1;
      assert.deepEqual([files, type, target, options.shellPath], [[], "PBXShellScriptBuildPhase", "TARGET", "/bin/sh"]);
      phases[`P${added}`] = { name: `"${name}"`, shellScript: options.shellScript };
    },
  };
  plugin.addBundledContentPhase(project);
  plugin.addBundledContentPhase(project);
  assert.equal(added, 1);
});
