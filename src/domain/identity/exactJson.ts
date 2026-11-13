/**
 * Engine-independent JSON decoding for identity parity inputs (Plan T0.10).
 *
 * V8 13.x (Node 24.x) `JSON.parse` returns a wrong key for one-character object
 * keys spelled with an escape: after `{"\\":1}` has been parsed, `{"\u0000":1}`
 * yields the key "\\" (the engine's key cache answers with the earlier key). The
 * same happens with a reviver. String values and longer keys are decoded
 * correctly, and Hermes and Node 22 are not affected.
 *
 * Identity inputs from the parity vectors contain exactly such keys, so the TS
 * oracle (tests and the vector generator) decodes them here: the structure is
 * walked in TS and only scalar tokens go through `JSON.parse`. The result is
 * what a correct `JSON.parse` returns: own data properties in source order
 * (engine key ordering applies as usual), last duplicate wins, `__proto__` as
 * an ordinary own key.
 */
export function parseJsonExact(text: string): unknown {
  let index = 0;
  const fail = (): never => { throw new SyntaxError(`parseJsonExact: invalid JSON at ${index}`); };
  const skip = () => { while (index < text.length && (text[index] === " " || text[index] === "\t" || text[index] === "\n" || text[index] === "\r")) index++; };
  const stringToken = (): string => {
    if (text[index] !== "\"") fail();
    const start = index++;
    while (index < text.length && text[index] !== "\"") index += text[index] === "\\" ? 2 : 1;
    if (index >= text.length) fail();
    index++;
    return JSON.parse(text.slice(start, index)) as string;
  };
  const value = (): unknown => {
    skip();
    const char = text[index];
    if (char === "{") {
      index++;
      const object: Record<string, unknown> = {};
      skip();
      if (text[index] === "}") { index++; return object; }
      for (;;) {
        skip();
        const key = stringToken();
        skip();
        if (text[index++] !== ":") fail();
        Object.defineProperty(object, key, { value: value(), enumerable: true, writable: true, configurable: true });
        skip();
        const next = text[index++];
        if (next === "}") return object;
        if (next !== ",") fail();
      }
    }
    if (char === "[") {
      index++;
      const array: unknown[] = [];
      skip();
      if (text[index] === "]") { index++; return array; }
      for (;;) {
        array.push(value());
        skip();
        const next = text[index++];
        if (next === "]") return array;
        if (next !== ",") fail();
      }
    }
    if (char === "\"") return stringToken();
    const start = index;
    while (index < text.length && !",]} \t\n\r".includes(text[index]!)) index++;
    if (start === index) fail();
    return JSON.parse(text.slice(start, index)) as unknown;
  };
  const result = value();
  skip();
  if (index !== text.length) fail();
  return result;
}
