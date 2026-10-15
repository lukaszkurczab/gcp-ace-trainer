import assert from "node:assert/strict";
import test from "node:test";
import { createSessionRevocationOperationId } from "./sessionRevocationOperationId";

test("revoke UUIDv7 encodes exact 48-bit time, secure random bits and RFC variant", () => {
  const time = 1_800_000_000_123;
  const first = createSessionRevocationOperationId(time);
  const second = createSessionRevocationOperationId(time);
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
  assert.equal(Number.parseInt(first.replaceAll("-", "").slice(0, 12), 16), time);
  assert.notEqual(first, second);
  assert.equal(Number.parseInt(createSessionRevocationOperationId(0xffffffffffff).replaceAll("-", "").slice(0, 12), 16), 0xffffffffffff);
  for (const invalid of [-1, NaN, Infinity, 0.5, 0x1000000000000]) assert.throws(() => createSessionRevocationOperationId(invalid), /secure_operation_id_unavailable/u);
});
