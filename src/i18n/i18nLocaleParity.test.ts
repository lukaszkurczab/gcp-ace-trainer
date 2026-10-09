import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import i18n from "../i18n";

const localesRoot = path.resolve("src/locales");
const locales = ["en", "pl", "de", "fr", "es", "it", "et"] as const;
const namespaces = ["account", "appearance", "common", "data", "legal", "learningPlan", "notifications", "settings"];
type FlatMap = Record<string, string | readonly unknown[]>;

function flatten(value: unknown, prefix = "", out: FlatMap = {}): FlatMap {
  if (typeof value === "string" || Array.isArray(value)) {
    assert.ok(prefix, "namespace root must be an object");
    out[prefix] = value;
    return out;
  }
  assert.ok(value && typeof value === "object", `invalid translation node: ${prefix}`);
  for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  return out;
}

function readLocale(locale: string): Record<string, FlatMap> {
  const directory = path.join(localesRoot, locale);
  const files = readdirSync(directory).filter((file) => file.endsWith(".json")).sort();
  assert.deepEqual(files, namespaces.map((namespace) => `${namespace}.json`).sort(), `${locale} namespace set`);
  return Object.fromEntries(files.map((file) => [file.replace(/\.json$/u, ""), flatten(JSON.parse(readFileSync(path.join(directory, file), "utf8")))]));
}

function tokens(value: string): string[] {
  return [...value.matchAll(/\{\{\s*([^{}]+?)\s*\}\}|<\/?[A-Za-z][^>]*>|%[sd]/gu)].map(([match]) => match).sort();
}

function assertLeafContract(expected: unknown, received: unknown, location: string): void {
  if (typeof expected === "string") {
    assert.ok(typeof received === "string" && received.trim().length > 0, `${location} empty or wrong type`);
    assert.deepEqual(tokens(received), tokens(expected), `${location} tokens`);
    return;
  }
  if (Array.isArray(expected)) {
    assert.ok(Array.isArray(received), `${location} array type`);
    assert.equal(received.length, expected.length, `${location} array length`);
    expected.forEach((item, index) => assertLeafContract(item, received[index], `${location}[${index}]`));
    return;
  }
  assert.ok(expected && typeof expected === "object", `${location} source type`);
  assert.ok(received && typeof received === "object" && !Array.isArray(received), `${location} object type`);
  const expectedObject = expected as Record<string, unknown>;
  const receivedObject = received as Record<string, unknown>;
  assert.deepEqual(Object.keys(receivedObject).sort(), Object.keys(expectedObject).sort(), `${location} object keys`);
  for (const [key, value] of Object.entries(expectedObject)) assertLeafContract(value, receivedObject[key], `${location}.${key}`);
}

test("all seven locales preserve namespace, key, leaf, array and token contracts", () => {
  const source = readLocale("en");
  for (const locale of locales) {
    const actual = readLocale(locale);
    for (const namespace of namespaces) {
      const expectedLeaves = source[namespace] ?? {};
      const actualLeaves = actual[namespace] ?? {};
      assert.deepEqual(Object.keys(actualLeaves).sort(), Object.keys(expectedLeaves).sort(), `${locale}/${namespace} keys`);
      for (const [key, expected] of Object.entries(expectedLeaves)) {
        const received = actualLeaves[key];
        assertLeafContract(expected, received, `${locale}/${namespace}:${key}`);
      }
    }
  }
});

test("plural suffix groups match the English source", () => {
  const source = readLocale("en");
  const pluralKeys = (leaves: FlatMap) => Object.keys(leaves).filter((key) => /_(?:zero|one|two|few|many|other)$/u.test(key)).sort();
  for (const locale of locales) {
    const actual = readLocale(locale);
    for (const namespace of namespaces) assert.deepEqual(pluralKeys(actual[namespace] ?? {}), pluralKeys(source[namespace] ?? {}), `${locale}/${namespace} plurals`);
  }
});


// Same-value exceptions are reviewed names, technical formats, and genuine cognates.
// A new identical EN value requires an explicit review entry here.
const allowedIdenticalValues: Record<string, readonly string[]> = {
  de: ["appearance:system", "common:Integration", "common:Details", "common:Google Cloud ACE", "common:Google Cloud Associate Cloud Engineer", "common:Claude Architect Professional", "common:Claude Certified Architect – Professional", "common:Status", "common:Premium", "legal:supportLink", "legal:legalRequests.emailPlaceholder", "notifications:reminderTimePlaceholder", "settings:languageSystem", "settings:app", "settings:version", "settings:premiumTitle"],
  fr: ["common:Questions", "common:Question", "common:correct", "common:Source", "common:Score", "common:Description", "common:points", "common:Points", "common:Certification", "common:Google Cloud ACE", "common:Google Cloud Associate Cloud Engineer", "common:Claude Architect Professional", "common:Claude Certified Architect – Professional", "common:Mode", "common:Date", "common:Premium", "common:{{count}} min", "learningPlan:{{count}} question_one", "learningPlan:{{count}} question_few", "learningPlan:{{count}} question_many", "learningPlan:{{count}} question_other", "notifications:reminderTimePlaceholder", "settings:version", "settings:premiumTitle"],
  es: ["common:Google Cloud ACE", "common:Google Cloud Associate Cloud Engineer", "common:Claude Architect Professional", "common:Claude Certified Architect – Professional", "common:Premium", "notifications:reminderTimePlaceholder", "settings:premiumTitle"],
  it: ["account:account", "account:email", "account:password", "common:Home", "common:Google Cloud ACE", "common:Google Cloud Associate Cloud Engineer", "common:Claude Architect Professional", "common:Claude Certified Architect – Professional", "common:Premium", "notifications:reminderTimePlaceholder", "settings:account", "settings:app", "settings:password", "settings:premiumTitle"],
  et: ["common:Google Cloud ACE", "common:Google Cloud Associate Cloud Engineer", "common:Claude Architect Professional", "common:Claude Certified Architect – Professional", "common:Premium", "notifications:reminderTimePlaceholder", "settings:premiumTitle"],
};

test("identical English values stay within the reviewed exception list", () => {
  const source = readLocale("en");
  for (const locale of locales.filter((item) => item !== "en" && item !== "pl")) {
    const actual = readLocale(locale);
    const identical: string[] = [];
    for (const namespace of namespaces) {
      for (const [key, value] of Object.entries(source[namespace] ?? {})) {
        if (JSON.stringify(actual[namespace]?.[key]) === JSON.stringify(value)) identical.push(`${namespace}:${key}`);
      }
    }
    assert.deepEqual(identical.sort(), [...(allowedIdenticalValues[locale] ?? [])].sort(), `${locale} identical-value exceptions`);
  }
});

test("i18next has no language or namespace fallback", () => {
  assert.equal(i18n.options.fallbackLng, false);
  assert.equal(i18n.options.fallbackNS, false);
  for (const locale of locales) {
    assert.equal(i18n.t("__odk117_missing_translation__", { lng: locale }), "__odk117_missing_translation__");
    assert.equal(i18n.t("__odk117_missing_translation__", { lng: locale, ns: "legal" }), "__odk117_missing_translation__");
  }
});
