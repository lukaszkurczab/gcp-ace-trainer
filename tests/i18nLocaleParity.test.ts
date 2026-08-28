import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

type FlatMap = Record<string, string>;

const localesRoot = path.resolve("src/locales");

function flatten(value: unknown, prefix = "", out: FlatMap = {}): FlatMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;

  for (const [key, nested] of Object.entries(value)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      flatten(nested, pathKey, out);
    } else {
      out[pathKey] = JSON.stringify(nested);
    }
  }
  return out;
}

function readLocale(locale: "en" | "pl"): Record<string, FlatMap> {
  const directory = path.join(localesRoot, locale);
  return Object.fromEntries(
    readdirSync(directory)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => [
        file.replace(/\.json$/u, ""),
        flatten(JSON.parse(readFileSync(path.join(directory, file), "utf8"))),
      ]),
  );
}

test("i18n locale files have matching namespaces and keys", () => {
  const en = readLocale("en");
  const pl = readLocale("pl");

  assert.deepEqual(Object.keys(pl), Object.keys(en));
  for (const namespace of Object.keys(en)) {
    assert.deepEqual(Object.keys(pl[namespace] ?? {}).sort(), Object.keys(en[namespace] ?? {}).sort());
  }
});
