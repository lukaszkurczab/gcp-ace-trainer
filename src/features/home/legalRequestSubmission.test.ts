import assert from "node:assert/strict";
import test from "node:test";

import { submitLegalRequest } from "./legalRequestSubmission";

function commands() {
  const calls = { validated: 0, authenticated: 0, guest: 0, authenticatedInput: undefined as unknown, guestInput: undefined as unknown };
  return {
    calls,
    onValidated: () => { calls.validated += 1; },
    createLegalRequest: async (input: unknown) => { calls.authenticated += 1; calls.authenticatedInput = input; return "auth"; },
    createPublicLegalRequest: async (input: unknown) => { calls.guest += 1; calls.guestInput = input; return "guest"; },
  };
}

test("authenticated required narrative validation returns inline error before either create command", async () => {
  const fixture = commands();
  const result = await submitLegalRequest({ authenticated: true, email: "", kind: "complaint", narrative: "  ", transactionId: "", ...fixture });
  assert.deepEqual(result, { kind: "validation_failure", errors: { narrative: "narrativeRequired", email: null } });
  assert.deepEqual(fixture.calls, { validated: 0, authenticated: 0, guest: 0, authenticatedInput: undefined, guestInput: undefined });
});

test("guest invalid email validation returns field error before either create command", async () => {
  const fixture = commands();
  const result = await submitLegalRequest({ authenticated: false, email: "invalid", kind: "complaint", narrative: "Details", transactionId: "", ...fixture });
  assert.deepEqual(result, { kind: "validation_failure", errors: { narrative: null, email: "emailRequired" } });
  assert.deepEqual(fixture.calls, { validated: 0, authenticated: 0, guest: 0, authenticatedInput: undefined, guestInput: undefined });
});

test("valid submissions route exactly once and trim optional values", async () => {
  const authenticated = commands();
  assert.deepEqual(await submitLegalRequest({ authenticated: true, email: "ignored", kind: "complaint", narrative: "  Details  ", transactionId: "  tx-1  ", ...authenticated }), { kind: "submitted", result: "auth" });
  assert.deepEqual(authenticated.calls, { validated: 1, authenticated: 1, guest: 0, authenticatedInput: { kind: "complaint", narrative: "Details", transactionId: "tx-1" }, guestInput: undefined });

  const guest = commands();
  assert.deepEqual(await submitLegalRequest({ authenticated: false, email: " guest@example.com ", kind: "withdrawal", narrative: "  ", transactionId: " ", ...guest }), { kind: "submitted", result: "guest" });
  assert.deepEqual(guest.calls, { validated: 1, authenticated: 0, guest: 1, authenticatedInput: undefined, guestInput: { kind: "withdrawal", email: "guest@example.com" } });
});
