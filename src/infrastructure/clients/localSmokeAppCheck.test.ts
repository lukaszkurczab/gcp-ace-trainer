import assert from "node:assert/strict";
import test from "node:test";
import { localSmokeAppCheckToken } from "./localSmokeAppCheck";

const local = { development: true, mode: "smoke", enabled: "true", projectId: "patternly-app-sandbox",
  apiOrigin: "http://127.0.0.1:8080", authOrigin: "http://127.0.0.1:19099", token: "a".repeat(64) };
test("explicit local fixture works only inside the development smoke boundary", () => {
  assert.equal(localSmokeAppCheckToken(local), local.token);
  for (const change of [
    { development: false }, { mode: "release" }, { mode: "sandbox" }, { enabled: "false" },
    { projectId: "production-project" }, { token: "" }, { token: "invalid" },
    { apiOrigin: "https://api.example.com" }, { authOrigin: "https://auth.example.com" },
    { apiOrigin: "http://127.0.0.1:8080/path" }, { authOrigin: "http://user@127.0.0.1:19099" },
  ]) assert.equal(localSmokeAppCheckToken({ ...local, ...change }), null);
});
