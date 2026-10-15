import assert from "node:assert/strict";
import test from "node:test";
import { createPatternlyApiClient } from "./PatternlyApiClientAdapter";

const id = "00000000-0000-4000-8000-000000000018";
test("Premium transport drops all five old-actor operations after token or App Check awaits", async () => {
  for (const switchAt of ["token", "appCheck"] as const) {
    let generation = 1, fetches = 0;
    const capturedGeneration = generation;
    const current = () => generation === capturedGeneration;
    const client = createPatternlyApiClient({ apiOrigin: "https://api.patternly.invalid",
      getIdToken: async () => { if (switchAt === "token") generation++; return "B-token"; },
      getAppCheckToken: async () => { if (switchAt === "appCheck") generation++; return "app-check"; },
      fetchImplementation: async () => { fetches++; throw Error("must_not_dispatch"); },
    });
    const actions = [
      () => client.recordPurchaseConfirmation({ confirmationId: id, termsVersion: "v1", productIdentifier: "monthly", storefrontPrice: "€9.99", locale: "en", immediateStartRequested: true }, current),
      () => client.getPurchaseAttempt(id, current),
      () => client.commandPurchaseAttempt(id, { action: "claim" }, current),
      () => client.getPurchaseCases(current),
      () => client.getEntitlements(current),
    ];
    for (const action of actions) { generation = 1; await assert.rejects(action()); }
    assert.equal(fetches, 0);
  }
});
