import assert from "node:assert/strict";
import test from "node:test";
import { parseJsonExact } from "./exactJson";

const codes = (value: string) => Array.from(value, (char) => char.codePointAt(0));

test("one-character escaped keys decode exactly, whatever the engine parsed before (V8 13.x key cache)", () => {
  JSON.parse('{"\\\\":1}');
  for (const [source, expected] of [['{"\\u0000":1}', [0]], ['{"\\n":1}', [10]], ['{"\\"":1}', [34]], ['{"\\\\":1}', [92]], ['{"\\ud800":1}', [0xd800]]] as const) {
    parseJsonExact('{"\\\\":1}');
    assert.deepEqual(codes(Object.keys(parseJsonExact(source) as object)[0]!), expected, source);
  }
  assert.deepEqual(Object.keys(parseJsonExact('{"text":"\\u0000","\\u0000":1}') as object).sort().map(codes), [[0], codes("text")]);
});

test("decodes like a correct JSON.parse: order, duplicates, __proto__, numbers, nesting", () => {
  const value = parseJsonExact(' { "b" : [1, -0, 1e21, 0.5, true, false, null, "x\\u00e9"], "10": {}, "2": [], "__proto__": 1, "b": {"z": "ł"} } ') as Record<string, unknown>;
  assert.equal(Object.getPrototypeOf(value), Object.prototype);
  assert.deepEqual(Object.keys(value), ["2", "10", "b", "__proto__"]);
  assert.equal(Object.getOwnPropertyDescriptor(value, "__proto__")?.value, 1);
  assert.deepEqual(value.b, { z: "ł" });
  assert.equal(JSON.stringify(parseJsonExact("[1,-0,1e21,0.5,\"\\/\"]")), JSON.stringify([1, -0, 1e21, 0.5, "/"]));
  assert.ok(Object.is((parseJsonExact("[-0]") as number[])[0], -0));
  assert.equal(parseJsonExact('"a"'), "a");
});

test("rejects malformed input", () => {
  for (const text of ["", "{", '{"a"}', '{"a":1,}', "[1,]", "[1 2]", '"x', "{} x", "tru"]) assert.throws(() => parseJsonExact(text), SyntaxError, text);
});
