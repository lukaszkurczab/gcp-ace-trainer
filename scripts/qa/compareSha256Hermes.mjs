import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { parseOrigin, selectTarget, request } from "./readNativeStartupTrace.mjs";

const TIMEOUT_MS = 5000;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function readSource(path) {
  if (!statSync(path).isFile() || statSync(path).size > 16384) throw Error("source_rejected");
  const source = readFileSync(path, "utf8");
  if (!source.includes("export function sha256Utf8(value: string): string")) throw Error("source_rejected");
  return source;
}

/** Trusted local source files only; this composes source, not a sandbox for untrusted code. */
export function buildComparison(baselinePath) {
  const beforeSource = readSource(baselinePath);
  const afterSource = readSource(new URL("../../src/domain/identity/sha256.ts", import.meta.url));
  const closure = (source) => `(function(){${ts.transpileModule(source.replace('export function sha256Utf8', 'function sha256Utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText};return sha256Utf8;})()`;
  const beforeClosure = closure(beforeSource), afterClosure = closure(afterSource);
  // Exactly 18 total calls, including digest checks; no warmup or separate precheck.
  const inner = `(()=>{const before=${beforeClosure};const after=${afterClosure};const inputs=[{bytes:64,value:'a'.repeat(64)},{bytes:512,value:'ż🧠'.repeat(85)+'aa'},{bytes:4096,value:'a'.repeat(4096)}];const started=performance.now();const pairs=[];let calls=0;for(const input of inputs){for(let pair=0;pair<3;pair++){if(performance.now()-started>=1000)return {status:'budget_reached',calls,elapsedMs:performance.now()-started,pairs};const order=pair%2===0?['before','after']:['after','before'];const result={bytes:input.bytes,pair,order};for(const name of order){const at=performance.now();const digest=(name==='before'?before:after)(input.value);const durationMs=performance.now()-at;calls+=1;result[name]={digest,durationMs};}result.digestsEqual=result.before.digest===result.after.digest;pairs.push(result);if(!result.digestsEqual)return {status:'digest_mismatch',calls,elapsedMs:performance.now()-started,pairs};}}return {status:'complete',calls,elapsedMs:performance.now()-started,pairs};})()`;
  // Hermes CDP rejected literal astral characters in the real probe. Escape UTF-16
  // code units on transport while preserving the exact public Unicode input.
  const expression = `JSON.stringify(${inner})`.replace(/[\u007f-\uffff]/g, (unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, "0")}`);
  return { expression, provenance: {
    beforeSourceSha256: sha256(beforeSource), afterSourceSha256: sha256(afterSource),
    beforeClosureSha256: sha256(beforeClosure), afterClosureSha256: sha256(afterClosure),
    expressionSha256: sha256(expression), transpilerVersion: ts.version, target: "ES2020",
    maximumTotalHashCalls: 18, warmupOrPrecheckCalls: 0, maximumInputBytes: 4096, betweenPairBudgetMs: 1000,
  } };
}

async function discoveryBody(response) {
  if (!response.ok || !response.body) throw Error("discovery_failed");
  const reader = response.body.getReader(); const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length; if (size > 65536) throw Error("target_rejected");
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally { await reader.cancel().catch(() => {}); }
}

function validateMeasurement(value) {
  if (!value || !["complete", "budget_reached", "digest_mismatch"].includes(value.status)
    || !Number.isFinite(value.elapsedMs) || value.elapsedMs < 0 || !Array.isArray(value.pairs)
    || value.pairs.length > 9 || value.calls !== value.pairs.length * 2
    || (value.status === "complete" && value.calls !== 18)) throw Error("measurement_rejected");
  for (const [index, pair] of value.pairs.entries()) {
    const expectedOrder = index % 3 % 2 === 0 ? ["before", "after"] : ["after", "before"];
    if (pair.bytes !== [64, 512, 4096][Math.floor(index / 3)] || pair.pair !== index % 3
      || JSON.stringify(pair.order) !== JSON.stringify(expectedOrder)
      || pair.digestsEqual !== (pair.before?.digest === pair.after?.digest)) throw Error("measurement_rejected");
    for (const name of ["before", "after"]) {
      if (!/^[0-9a-f]{64}$/.test(pair[name]?.digest) || !Number.isFinite(pair[name]?.durationMs)
        || pair[name].durationMs < 0) throw Error("measurement_rejected");
    }
    if (value.status !== "digest_mismatch" && !pair.digestsEqual) throw Error("measurement_rejected");
  }
  return value;
}

export async function compareSha256Hermes(baselinePath, ...extra) {
  let stage = "source"; let socket;
  try {
    if (extra.length) throw Error("configuration_rejected");
    const { expression, provenance } = buildComparison(baselinePath);
    stage = "discovery";
    const origin = parseOrigin("http://127.0.0.1:8081");
    const response = await fetch(new URL("/json/list", origin), { signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "error" });
    const endpoint = selectTarget(JSON.parse(await discoveryBody(response)), origin, "com.lkurczab.patternly.local");
    stage = "connection";
    const WebSocket = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url))("ws");
    socket = new WebSocket(endpoint, { origin: origin.origin, handshakeTimeout: TIMEOUT_MS, maxPayload: 65536, followRedirects: false });
    await new Promise((accept, reject) => { socket.once("open", accept); socket.once("error", () => reject(Error("connect_failed"))); });
    stage = "evaluation";
    const result = await request(socket, 1, "Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, silent: true });
    if (result.error || result.result?.exceptionDetails) throw Error("evaluation_failed");
    stage = "measurement";
    const measurement = validateMeasurement(JSON.parse(result.result?.result?.value ?? "null"));
    return { schema: "patternly.sha256-hermes-comparison.v1", provenance, measurement,
      scope: "Isolated compiled source closures on the owner-verified Hermes target; no application latency or native painting claim" };
  } catch (error) {
    const categories = new Set(["configuration_rejected", "source_rejected", "origin_rejected", "target_rejected", "discovery_failed", "connect_failed", "read_timeout", "transport_closed", "evaluation_failed", "measurement_rejected"]);
    throw Object.assign(Error(categories.has(error?.message) ? error.message : `${stage}_failed`), { stage });
  } finally { socket?.terminate(); }
}

/**
 * Offline: node scripts/qa/compareSha256Hermes.mjs --build-only /trusted/sha256.ts.before
 * Native (owner-authorized safe device window only): node scripts/qa/compareSha256Hermes.mjs /trusted/sha256.ts.before
 * Only the existing Android Local target at http://127.0.0.1:8081 is accepted.
 * Baseline and current source are trusted local inputs. No app data, learning action,
 * trace reset, sampling, globals or extra hash calls are used. A timeout is unavailable evidence.
 */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  try {
    if (args[0] === "--build-only" && args.length === 2) console.log(JSON.stringify(buildComparison(args[1])));
    else if (args.length === 1) {
      const result = await compareSha256Hermes(...args); console.log(JSON.stringify(result));
      if (result.measurement.status !== "complete") process.exitCode = 1;
    } else throw Object.assign(Error("arguments_rejected"), { stage: "arguments" });
  } catch (error) {
    console.error(JSON.stringify({ error: error.stage ? error.message : "source_failed", stage: error.stage ?? "source" })); process.exitCode = 1;
  }
}
