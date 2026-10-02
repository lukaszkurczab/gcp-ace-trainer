import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createNativeRecoveryProxy, readConfig } from "./nativeRecoveryProxy.mjs";

const fixture = Object.freeze({ uid: "fixture-firebase-uid", userId: "2f7a3d9e-70d4-4d5e-9c58-0c4268f54d31", generation: 4, code: "AB12-CD34-EF56-GH78" });
const operationId = "f18a8316-868a-4bb5-8bc2-f775d1bc88ae";
const probeCode = "ZZZZ-ZZZZ-ZZZZ-ZZZZ";
const json = (value) => JSON.stringify(value);
const token = (claims) => `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;

async function startPair({ responseFor, holdMs = 2_000 } = {}) {
  const upstreamCalls = [];
  const upstream = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null;
    upstreamCalls.push(Object.freeze({ method: request.method, path: request.url, body, authorization: request.headers.authorization, appCheck: request.headers["x-firebase-appcheck"] }));
    const value = responseFor
      ? responseFor({ request, body, calls: upstreamCalls })
      : request.url === "/v1/public/recovery-codes/consume" && body?.code === probeCode
        ? { operationId: body.operationId, status: "expired_or_invalid" }
        : request.url === "/v1/public/recovery-codes/consume" || request.url === "/v1/public/recovery-codes/consume/status"
          ? { operationId: body.operationId, status: "result_available", firebaseUid: fixture.uid, authorizationGeneration: fixture.generation + 1, customToken: "ephemeral-secret-token" }
          : { operationId: body.operationId, status: "acknowledged", authorizationGeneration: fixture.generation + 1 };
    response.writeHead(200, { "content-type": "application/json" });
    response.end(json(value));
  });
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  const proxy = createNativeRecoveryProxy({ fixture, listenPort: 0, upstreamPort: upstream.address().port, holdMs });
  const address = await proxy.listen();
  return {
    proxy,
    upstreamCalls,
    base: `http://127.0.0.1:${address.port}`,
    async close() {
      await proxy.close();
      await new Promise((resolve) => upstream.close(resolve));
    },
  };
}

async function post(base, route, body, headers = {}) {
  const response = await fetch(`${base}${route}`, {
    method: "POST", headers: { "content-type": "application/json", ...headers }, body: json(body),
  });
  return { status: response.status, body: await response.json() };
}

async function proveAndArm(pair, probeId = randomUUID()) {
  const probe = await post(pair.base, "/v1/public/recovery-codes/consume", { operationId: probeId, code: probeCode }, { "x-firebase-appcheck": "fixture-app-check-token" });
  assert.equal(probe.status, 200);
  assert.deepEqual(probe.body, { operationId: probeId, status: "expired_or_invalid" });
  assert.equal(pair.upstreamCalls[0]?.body.operationId, probeId);
  assert.equal(pair.upstreamCalls[0]?.appCheck, "fixture-app-check-token");
  assert.equal(pair.proxy.snapshot().safeProbeCount, 1);
  assert.equal(pair.proxy.arm(), true);
}

test("real loopback: holds committed consume response until client death, then allows matching status and ACK", async (t) => {
  const pair = await startPair();
  t.after(pair.close);
  await proveAndArm(pair);

  const controller = new AbortController();
  const initial = fetch(`${pair.base}/v1/public/recovery-codes/consume`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: json({ operationId, code: fixture.code }), signal: controller.signal,
  });
  for (let i = 0; i < 100 && !pair.proxy.snapshot().committedResponseHeld; i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(pair.proxy.snapshot().stage, "COMMITTED_RESPONSE_HELD");
  controller.abort();
  await assert.rejects(initial);
  for (let i = 0; i < 100 && !pair.proxy.snapshot().clientClosedBeforeDelivery; i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(pair.proxy.snapshot().clientClosedBeforeDelivery, true);

  const status = await post(pair.base, "/v1/public/recovery-codes/consume/status", { operationId, code: fixture.code });
  assert.equal(status.status, 200);
  assert.equal(status.body.operationId, operationId);
  assert.equal(status.body.status, "result_available");
  assert.equal(status.body.customToken, "ephemeral-secret-token");
  const ack = await post(pair.base, "/v1/account/recovery-codes/consume/ack", { operationId }, {
    authorization: `Bearer ${token({ sub: fixture.uid, authorizationGeneration: fixture.generation + 1 })}`,
  });
  assert.equal(ack.status, 200);
  assert.equal(ack.body.authorizationGeneration, fixture.generation + 1);
  assert.deepEqual(pair.upstreamCalls.map(({ path }) => path), [
    "/v1/public/recovery-codes/consume", "/v1/public/recovery-codes/consume", "/v1/public/recovery-codes/consume/status", "/v1/account/recovery-codes/consume/ack",
  ]);
  assert.equal(pair.proxy.snapshot().ownedConsumeCount, 1);
  assert.equal(pair.proxy.snapshot().statusProofCount, 1);
  assert.equal(pair.proxy.snapshot().acknowledgementCount, 1);
  assert.equal(JSON.stringify(pair.proxy.snapshot()).includes("ephemeral-secret-token"), false);
});

test("real loopback: wrong status proof, UID, generation, or ACK identity never reaches protected upstream route", async (t) => {
  for (const wrong of ["operation", "uid", "generation"]) {
    const pair = await startPair({ responseFor: ({ request, body }) => {
      if (request.url === "/v1/public/recovery-codes/consume" && body.code === probeCode) return { operationId: body.operationId, status: "expired_or_invalid" };
      if (request.url === "/v1/public/recovery-codes/consume") return { operationId, status: "result_available", firebaseUid: fixture.uid, authorizationGeneration: fixture.generation + 1, customToken: "token" };
      if (request.url === "/v1/public/recovery-codes/consume/status") return {
        operationId: wrong === "operation" ? "a18a8316-868a-4bb5-8bc2-f775d1bc88ae" : operationId,
        status: "result_available", firebaseUid: wrong === "uid" ? "different-uid" : fixture.uid,
        authorizationGeneration: wrong === "generation" ? fixture.generation + 2 : fixture.generation + 1, customToken: "token",
      };
      return { operationId, status: "acknowledged", authorizationGeneration: fixture.generation + 1 };
    } });
    t.after(pair.close);
    await proveAndArm(pair);
    const first = new AbortController();
    const pending = fetch(`${pair.base}/v1/public/recovery-codes/consume`, { method: "POST", headers: { "content-type": "application/json" }, body: json({ operationId, code: fixture.code }), signal: first.signal });
    for (let i = 0; i < 100 && !pair.proxy.snapshot().committedResponseHeld; i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
    first.abort();
    await assert.rejects(pending);
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal((await post(pair.base, "/v1/public/recovery-codes/consume/status", { operationId, code: fixture.code })).status, 502);
    const beforeAck = pair.upstreamCalls.length;
    const badAck = await post(pair.base, "/v1/account/recovery-codes/consume/ack", { operationId }, {
      authorization: `Bearer ${token({ sub: fixture.uid, authorizationGeneration: fixture.generation + 1 })}`,
    });
    assert.equal(badAck.status, 403);
    assert.equal(pair.upstreamCalls.length, beforeAck);
  }

  const pair = await startPair();
  t.after(pair.close);
  await proveAndArm(pair);
  const initial = new AbortController();
  const pending = fetch(`${pair.base}/v1/public/recovery-codes/consume`, { method: "POST", headers: { "content-type": "application/json" }, body: json({ operationId, code: fixture.code }), signal: initial.signal });
  for (let i = 0; i < 100 && !pair.proxy.snapshot().committedResponseHeld; i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  initial.abort();
  await assert.rejects(pending);
  await new Promise((resolve) => setTimeout(resolve, 10));
  await post(pair.base, "/v1/public/recovery-codes/consume/status", { operationId, code: fixture.code });
  const beforeAck = pair.upstreamCalls.length;
  const wrongTokenAck = await post(pair.base, "/v1/account/recovery-codes/consume/ack", { operationId }, {
    authorization: `Bearer ${token({ sub: "different-uid", authorizationGeneration: fixture.generation + 1 })}`,
  });
  assert.equal(wrongTokenAck.status, 403);
  assert.equal(pair.upstreamCalls.length, beforeAck);
});

test("real loopback: unsafe second owned consume is blocked before upstream", async (t) => {
  const pair = await startPair();
  t.after(pair.close);
  await proveAndArm(pair);
  const controller = new AbortController();
  const pending = fetch(`${pair.base}/v1/public/recovery-codes/consume`, { method: "POST", headers: { "content-type": "application/json" }, body: json({ operationId, code: fixture.code }), signal: controller.signal });
  for (let i = 0; i < 100 && !pair.proxy.snapshot().committedResponseHeld; i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  controller.abort();
  await assert.rejects(pending);
  for (let i = 0; i < 100 && !pair.proxy.snapshot().clientClosedBeforeDelivery; i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(pair.proxy.snapshot().clientClosedBeforeDelivery, true);
  const count = pair.upstreamCalls.length;
  assert.equal((await post(pair.base, "/v1/public/recovery-codes/consume", { operationId, code: fixture.code })).status, 403);
  assert.equal(pair.upstreamCalls.length, count);
  assert.equal(pair.proxy.snapshot().secondOwnedConsumeBlocked, true);
});

test("real loopback: failed probe never arms; a held response times out with explicit 503", async (t) => {
  const badProbeId = randomUUID();
  const refusing = await startPair({ responseFor: () => ({ operationId: badProbeId, status: "result_available" }) });
  t.after(refusing.close);
  assert.equal((await post(refusing.base, "/v1/public/recovery-codes/consume", { operationId: badProbeId, code: probeCode }, { "x-firebase-appcheck": "fixture-app-check-token" })).status, 503);
  assert.equal(refusing.proxy.snapshot().safeProbePassed, false);
  assert.equal(refusing.proxy.arm(), false);

  const pair = await startPair({ holdMs: 80 });
  t.after(pair.close);
  await proveAndArm(pair);
  const result = await post(pair.base, "/v1/public/recovery-codes/consume", { operationId, code: fixture.code });
  assert.equal(result.status, 503);
  assert.deepEqual(result.body, { error: "response_hold_timeout" });
  assert.equal(pair.proxy.snapshot().holdTimeout, true);
  assert.equal(pair.proxy.snapshot().committedResponseHeld, true);
});

test("real loopback: unverifiable owned consume response keeps count one and commit status unknown; no retry", async (t) => {
  const pair = await startPair({ responseFor: ({ request, body }) => {
    if (request.url === "/v1/public/recovery-codes/consume" && body.code === probeCode) return { operationId: body.operationId, status: "expired_or_invalid" };
    return { operationId, status: "provider_retryable" };
  } });
  t.after(pair.close);
  await proveAndArm(pair);
  const result = await post(pair.base, "/v1/public/recovery-codes/consume", { operationId, code: fixture.code });
  assert.equal(result.status, 502);
  assert.equal(pair.proxy.snapshot().ownedConsumeCount, 1);
  assert.equal(pair.proxy.snapshot().ownedCommitUnknown, true);
  const count = pair.upstreamCalls.length;
  assert.equal((await post(pair.base, "/v1/public/recovery-codes/consume", { operationId, code: fixture.code })).status, 403);
  assert.equal(pair.upstreamCalls.length, count);
  assert.equal(pair.proxy.snapshot().ownedConsumeCount, 1);
  assert.equal(pair.proxy.snapshot().ownedCommitUnknown, true);
});

test("owner-only config rejects symlink, group/world permissions, and malformed fixture", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aud08-proxy-"));
  fs.chmodSync(directory, 0o700);
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const good = path.join(directory, "config.json");
  fs.writeFileSync(good, json({ uid: fixture.uid, userId: fixture.userId, generation: fixture.generation, code: fixture.code }), { mode: 0o600 });
  assert.deepEqual(readConfig(good), { uid: fixture.uid, userId: fixture.userId, generation: fixture.generation, code: fixture.code });
  assert.throws(() => createNativeRecoveryProxy({ fixture: { ...fixture, code: probeCode } }), /CONFIG_REFUSED/);

  const permissive = path.join(directory, "permissive.json");
  fs.writeFileSync(permissive, json({ uid: fixture.uid, userId: fixture.userId, generation: fixture.generation, code: fixture.code }), { mode: 0o644 });
  assert.throws(() => readConfig(permissive), /CONFIG_REFUSED/);
  const link = path.join(directory, "link.json");
  fs.symlinkSync(good, link);
  assert.throws(() => readConfig(link), /CONFIG_REFUSED/);
  const malformed = path.join(directory, "malformed.json");
  fs.writeFileSync(malformed, json({ uid: fixture.uid, userId: "", generation: fixture.generation, code: fixture.code }), { mode: 0o600 });
  assert.throws(() => readConfig(malformed), /CONFIG_REFUSED/);
});
