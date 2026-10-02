import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";

const DEFAULT_DIRECTORY = "/private/tmp/aud08-b3-native-recovery-proxy";
const DEFAULT_CONFIG = `${DEFAULT_DIRECTORY}/config.json`;
const DEFAULT_OUTPUT = `${DEFAULT_DIRECTORY}/result.json`;
const PROBE_CODE = "ZZZZ-ZZZZ-ZZZZ-ZZZZ";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE = /^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}$/;
const READ_PATHS = new Set([
  "/health", "/ready", "/openapi.json", "/v1/me", "/v1/entitlements",
  "/v1/progress", "/v1/tracks", "/v1/content/versions",
]);
const MAX_REQUEST = 8 * 1024;
const MAX_RESPONSE = 128 * 1024;
const UPSTREAM_TIMEOUT_MS = 15_000;

const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value)
  && Object.keys(value).sort().join(",") === [...keys].sort().join(",");

export function readConfig(configPath) {
  const stat = fs.lstatSync(configPath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.uid !== process.getuid() || (stat.mode & 0o077) !== 0) {
    throw new Error("CONFIG_REFUSED");
  }
  const parent = fs.lstatSync(path.dirname(configPath));
  if (!parent.isDirectory() || parent.isSymbolicLink() || parent.uid !== process.getuid() || (parent.mode & 0o077) !== 0) throw new Error("CONFIG_REFUSED");
  const value = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!exactKeys(value, ["uid", "userId", "generation", "code"])) throw new Error("CONFIG_REFUSED");
  if (typeof value.uid !== "string" || !value.uid || value.uid.length > 128
    || typeof value.userId !== "string" || !value.userId || value.userId.length > 128) throw new Error("CONFIG_REFUSED");
  if (!Number.isSafeInteger(value.generation) || value.generation < 1 || !CODE.test(value.code) || value.code === PROBE_CODE) throw new Error("CONFIG_REFUSED");
  return Object.freeze({ uid: value.uid, userId: value.userId, generation: value.generation, code: value.code });
}

function writeSafeOutput(outputPath, state) {
  const parent = path.dirname(outputPath);
  const directory = fs.lstatSync(parent);
  if (!directory.isDirectory() || directory.isSymbolicLink() || directory.uid !== process.getuid() || (directory.mode & 0o077) !== 0) throw new Error("OUTPUT_REFUSED");
  try {
    const current = fs.lstatSync(outputPath);
    if (!current.isFile() || current.isSymbolicLink() || current.nlink !== 1 || current.uid !== process.getuid()) throw new Error("OUTPUT_REFUSED");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temporary = `${outputPath}.${process.pid}.tmp`;
  const fd = fs.openSync(temporary, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL, 0o600);
  try {
    fs.writeFileSync(fd, `${JSON.stringify(state, null, 2)}\n`);
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  fs.renameSync(temporary, outputPath);
  fs.chmodSync(outputPath, 0o600);
}

function decodeJwtClaims(request) {
  const header = request.headers.authorization;
  if (typeof header !== "string" || !/^Bearer [A-Za-z0-9._~-]+$/.test(header)) return null;
  const pieces = header.slice(7).split(".");
  if (pieces.length !== 3) return null;
  try {
    // This identity fence is local routing evidence only; the backend verifies the token signature.
    const claims = JSON.parse(Buffer.from(pieces[1], "base64url").toString("utf8"));
    return claims && typeof claims === "object" ? claims : null;
  } catch { return null; }
}

function responseJson(response, status, value) {
  const body = Buffer.from(JSON.stringify(value));
  response.writeHead(status, { "content-type": "application/json", "content-length": body.length, "cache-control": "no-store" });
  response.end(body);
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_REQUEST) throw new Error("BODY_TOO_LARGE");
    chunks.push(chunk);
  }
  if (!size) return null;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function requestUpstream({ host, port, method, pathname, headers, body }) {
  return new Promise((resolve, reject) => {
    const request = http.request({ host, port, method, path: pathname, headers: { ...headers, host: `${host}:${port}`, connection: "close" }, timeout: UPSTREAM_TIMEOUT_MS }, (response) => {
      const chunks = [];
      let size = 0;
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > MAX_RESPONSE) request.destroy(new Error("RESPONSE_TOO_LARGE"));
        else chunks.push(chunk);
      });
      response.on("end", () => resolve({ status: response.statusCode ?? 502, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    request.on("timeout", () => request.destroy(new Error("UPSTREAM_TIMEOUT")));
    request.on("error", () => reject(new Error("UPSTREAM_UNAVAILABLE")));
    if (body?.length) request.write(body);
    request.end();
  });
}

export function createNativeRecoveryProxy({
  fixture,
  outputPath,
  listenHost = "127.0.0.1",
  listenPort = 18080,
  upstreamHost = "127.0.0.1",
  upstreamPort = 8080,
  holdMs = 120_000,
  onEvent = () => {},
}) {
  if (!fixture || typeof fixture.uid !== "string" || !fixture.uid || typeof fixture.userId !== "string" || !fixture.userId
    || !Number.isSafeInteger(fixture.generation) || !CODE.test(fixture.code) || fixture.code === PROBE_CODE) throw new Error("CONFIG_REFUSED");
  if (listenHost !== "127.0.0.1" || upstreamHost !== "127.0.0.1" || !Number.isInteger(listenPort) || !Number.isInteger(upstreamPort)
    || listenPort < 0 || listenPort > 65535 || upstreamPort < 1 || upstreamPort > 65535 || !Number.isInteger(holdMs) || holdMs < 1 || holdMs > 120_000) throw new Error("BIND_REFUSED");

  const state = {
    schema: "aud08-native-recovery-proxy-v1", status: "READY", safeProbePassed: false, armed: false,
    committedResponseHeld: false, clientClosedBeforeDelivery: false, holdTimeout: false,
    safeProbeCount: 0, ownedConsumeCount: 0, ownedCommitUnknown: false, statusProofCount: 0, acknowledgementCount: 0,
    sameOperationIdObserved: false, uidGenerationVerified: false, secondOwnedConsumeBlocked: false,
  };
  let ownedOperationId = null;
  let committed = false;
  let statusProven = false;
  let acknowledged = false;
  let safeProbeInFlight = false;

  const publish = (stage, patch = {}) => {
    Object.assign(state, patch);
    state.stage = stage;
    if (outputPath) writeSafeOutput(outputPath, state);
    onEvent(Object.freeze({ stage, ...Object.fromEntries(Object.entries(patch).filter(([key]) => key.endsWith("Count") || key.endsWith("Passed") || key.endsWith("Verified") || key.endsWith("Blocked"))) }));
  };

  const server = http.createServer(async (request, response) => {
    let url;
    let body;
    try {
      url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.host !== "127.0.0.1") return responseJson(response, 400, { error: "request_refused" });
      body = await readBody(request);
      const pathname = url.pathname;
      const isConsume = request.method === "POST" && pathname === "/v1/public/recovery-codes/consume";
      const isStatus = request.method === "POST" && pathname === "/v1/public/recovery-codes/consume/status";
      const isAck = request.method === "POST" && pathname === "/v1/account/recovery-codes/consume/ack";
      if (isConsume) {
        if (!exactKeys(body, ["operationId", "code"]) || !UUID.test(body.operationId ?? "") || typeof body.code !== "string") return responseJson(response, 403, { error: "request_refused" });
        if (!state.armed && !state.safeProbePassed && body.code === PROBE_CODE && !safeProbeInFlight) {
          safeProbeInFlight = true;
          const probeBody = Buffer.from(JSON.stringify(body));
          publish("SAFE_PROBE_SENT", { safeProbeCount: 1 });
          const probe = await requestUpstream({ host: upstreamHost, port: upstreamPort, method: "POST", pathname, headers: { ...request.headers, "content-length": probeBody.length }, body: probeBody });
          let result;
          try { result = JSON.parse(probe.body.toString("utf8")); } catch { result = null; }
          if (probe.status !== 200 || !result || result.operationId !== body.operationId || result.status !== "expired_or_invalid") {
            publish("SAFE_PROBE_REFUSED");
            return responseJson(response, 503, { error: "safe_probe_refused" });
          }
          publish("SAFE_PROBE_PASSED", { safeProbePassed: true });
          return responseJson(response, 200, { operationId: body.operationId, status: "expired_or_invalid" });
        }
        if (!state.armed || !state.safeProbePassed || body.code !== fixture.code || (ownedOperationId !== null && body.operationId !== ownedOperationId)) {
          if (body.code === fixture.code) publish("SECOND_OWNED_CONSUME_BLOCKED", { secondOwnedConsumeBlocked: true });
          return responseJson(response, 403, { error: "request_refused" });
        }
        if (ownedOperationId !== null) {
          publish("SECOND_OWNED_CONSUME_BLOCKED", { secondOwnedConsumeBlocked: true });
          return responseJson(response, 403, { error: "request_refused" });
        }
        if (ownedOperationId === null) {
          ownedOperationId = body.operationId;
          state.ownedConsumeCount = 1;
          state.ownedCommitUnknown = true;
          publish("OWNED_CONSUME_SENT", { ownedConsumeCount: 1, ownedCommitUnknown: true, sameOperationIdObserved: true });
          const raw = Buffer.from(JSON.stringify(body));
          const upstream = await requestUpstream({ host: upstreamHost, port: upstreamPort, method: "POST", pathname, headers: { ...request.headers, "content-length": raw.length }, body: raw });
          let result;
          try { result = JSON.parse(upstream.body.toString("utf8")); } catch { result = null; }
          if (upstream.status !== 200 || result?.operationId !== ownedOperationId || result?.status !== "result_available"
            || result?.firebaseUid !== fixture.uid || result?.authorizationGeneration !== fixture.generation + 1 || typeof result?.customToken !== "string") {
            publish("OWNED_CONSUME_RESPONSE_UNVERIFIED", { ownedConsumeCount: 1, ownedCommitUnknown: true });
            return responseJson(response, 502, { error: "upstream_result_refused" });
          }
          committed = true;
          state.committedResponseHeld = true;
          publish("COMMITTED_RESPONSE_HELD", { ownedConsumeCount: 1, ownedCommitUnknown: false, committedResponseHeld: true, sameOperationIdObserved: true });
          await new Promise((resolve) => {
            let settled = false;
            const finish = (timedOut) => { if (settled) return; settled = true; clearTimeout(timer); request.off("aborted", onAbort); response.off("close", onClose); resolve(timedOut); };
            const onAbort = () => finish(false);
            const onClose = () => { if (!response.writableEnded) finish(false); };
            const timer = setTimeout(() => finish(true), holdMs);
            request.once("aborted", onAbort);
            response.once("close", onClose);
          }).then((timedOut) => {
            if (timedOut) {
              publish("HOLD_TIMEOUT", { holdTimeout: true });
              if (!response.destroyed) responseJson(response, 503, { error: "response_hold_timeout" });
            } else if (request.aborted || response.destroyed) {
              publish("CLIENT_CLOSED_BEFORE_DELIVERY", { clientClosedBeforeDelivery: true });
            }
          });
          return;
        }
      } else if (isStatus) {
        if (!committed || !exactKeys(body, ["operationId", "code"]) || body.operationId !== ownedOperationId || body.code !== fixture.code) return responseJson(response, 403, { error: "request_refused" });
      } else if (isAck) {
        const claims = decodeJwtClaims(request);
        if (!committed || !statusProven || acknowledged || !exactKeys(body, ["operationId"]) || body.operationId !== ownedOperationId
          || claims?.sub !== fixture.uid || claims?.authorizationGeneration !== fixture.generation + 1) return responseJson(response, 403, { error: "request_refused" });
      } else if (request.method === "GET" && READ_PATHS.has(pathname) && url.search === "") {
        // Bounded read-only account and readiness paths.
      } else {
        return responseJson(response, 403, { error: "route_refused" });
      }

      const raw = body === null ? Buffer.alloc(0) : Buffer.from(JSON.stringify(body));
      const upstream = await requestUpstream({ host: upstreamHost, port: upstreamPort, method: request.method, pathname: `${pathname}${url.search}`, headers: { ...request.headers, "content-length": raw.length }, body: raw });
      let result;
      try { result = JSON.parse(upstream.body.toString("utf8")); } catch { result = null; }
      if (isStatus) {
        if (upstream.status !== 200 || result?.operationId !== ownedOperationId || result?.status !== "result_available"
          || result?.firebaseUid !== fixture.uid || result?.authorizationGeneration !== fixture.generation + 1 || typeof result?.customToken !== "string") return responseJson(response, 502, { error: "status_proof_refused" });
        statusProven = true;
        publish("STATUS_PROOF_VERIFIED", { statusProofCount: state.statusProofCount + 1, uidGenerationVerified: true, sameOperationIdObserved: true });
      }
      if (isAck) {
        if (upstream.status !== 200 || result?.operationId !== ownedOperationId || result?.status !== "acknowledged" || result?.authorizationGeneration !== fixture.generation + 1) return responseJson(response, 502, { error: "acknowledgement_refused" });
        acknowledged = true;
        publish("ACKNOWLEDGEMENT_VERIFIED", { acknowledgementCount: 1, uidGenerationVerified: true, sameOperationIdObserved: true });
      }
      response.writeHead(upstream.status, { "content-type": upstream.headers["content-type"] ?? "application/json", "content-length": upstream.body.length, "cache-control": "no-store" });
      response.end(upstream.body);
    } catch (error) {
      const category = error?.message === "BODY_TOO_LARGE" ? "request_too_large" : "proxy_unavailable";
      if (!response.headersSent && !response.destroyed) responseJson(response, category === "request_too_large" ? 413 : 502, { error: category });
      publish(category === "request_too_large" ? "REQUEST_REFUSED" : "UPSTREAM_UNAVAILABLE");
    }
  });
  server.on("clientError", (_error, socket) => socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n"));
  return Object.freeze({
    server,
    arm() {
      if (!state.safeProbePassed || state.armed) return false;
      publish("ARMED", { armed: true });
      return true;
    },
    listen: () => new Promise((resolve, reject) => {
      server.once("error", () => reject(new Error("BIND_REFUSED")));
      server.listen(listenPort, listenHost, () => resolve(server.address()));
    }),
    close: () => new Promise((resolve) => server.close(() => resolve())),
    snapshot: () => Object.freeze({ ...state }),
  });
}

function main() {
  const args = process.argv.slice(2);
  let configPath = DEFAULT_CONFIG;
  let outputPath = DEFAULT_OUTPUT;
  let configDefault = true;
  let outputDefault = true;
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!value || (flag !== "--config" && flag !== "--output")) throw new Error("CONFIG_REFUSED");
    if (flag === "--config" && configDefault) { configPath = value; configDefault = false; }
    else if (flag === "--output" && outputDefault) { outputPath = value; outputDefault = false; }
    else throw new Error("CONFIG_REFUSED");
  }
  if (configDefault || outputDefault) {
    fs.mkdirSync(DEFAULT_DIRECTORY, { recursive: true, mode: 0o700 });
    const directory = fs.statSync(DEFAULT_DIRECTORY);
    if (!directory.isDirectory() || directory.uid !== process.getuid() || (directory.mode & 0o077) !== 0) throw new Error("CONFIG_REFUSED");
  }
  const fixture = readConfig(configPath);
  const proxy = createNativeRecoveryProxy({ fixture, outputPath, onEvent: (event) => console.log(`AUD08_PROXY_STAGE:${JSON.stringify(event)}`) });
  process.on("SIGUSR2", () => {
    if (!proxy.arm()) console.error("AUD08_PROXY_REFUSED:ARM_BEFORE_SAFE_PROBE");
  });
  proxy.listen().then(() => {
    console.log("AUD08_PROXY_STAGE:READY");
    publishInitial();
  }).catch(() => {
    console.error("AUD08_PROXY_REFUSED:BIND");
    process.exitCode = 1;
  });
  function publishInitial() { writeSafeOutput(outputPath, { schema: "aud08-native-recovery-proxy-v1", status: "READY", safeProbePassed: false, armed: false, committedResponseHeld: false, clientClosedBeforeDelivery: false, holdTimeout: false, safeProbeCount: 0, ownedConsumeCount: 0, ownedCommitUnknown: false, statusProofCount: 0, acknowledgementCount: 0, sameOperationIdObserved: false, uidGenerationVerified: false, secondOwnedConsumeBlocked: false, stage: "READY" }); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try { main(); } catch (error) {
    console.error(`AUD08_PROXY_REFUSED:${error?.message === "OUTPUT_REFUSED" ? "OUTPUT" : "CONFIG"}`);
    process.exitCode = 1;
  }
}
