// Run from the app repository: node --import tsx docs/qa/odk104-verify-data-translations.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const i18n = require(path.resolve("src/i18n.ts")).default;

let checked = 0;
for (const lng of ["en", "pl"]) {
  const source = JSON.parse(fs.readFileSync(`src/locales/${lng}/data.json`, "utf8"));
  function visit(value, prefix = "") {
    for (const [name, text] of Object.entries(value)) {
      const key = prefix ? `${prefix}.${name}` : name;
      if (typeof text === "object") {
        visit(text, key);
        continue;
      }
      const resolved = i18n.t(key, { lng, ns: "data", date: "2026-09-12", reason: "fixture", seconds: 17 });
      const expected = text.replaceAll("{{date}}", "2026-09-12").replaceAll("{{reason}}", "fixture").replaceAll("{{seconds}}", "17");
      assert.equal(resolved, expected, `${lng}:${key}`);
      assert.notEqual(resolved, key, `${lng}:${key} returned a raw key`);
      assert.ok(!resolved.includes("{{"), `${lng}:${key} did not interpolate`);
      checked++;
    }
  }
  visit(source);
}
console.log(`PASS: ${checked} data locale values resolve exactly without raw keys or unresolved interpolation`);
