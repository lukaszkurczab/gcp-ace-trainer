import assert from "node:assert/strict";
import test from "node:test";

import { createRouteLifetime } from "./routeLifetime";

test("route removal defers disposal until active async actions settle", () => {
  const lifetime = createRouteLifetime();
  let disposed = 0;
  const finishAccept = lifetime.beginAction();

  lifetime.remove(() => { disposed += 1; });
  assert.equal(lifetime.isCurrent(), false);
  assert.equal(disposed, 0, "the proposal remains available to the commit guard until acceptance settles");

  finishAccept();
  assert.equal(disposed, 1);
  finishAccept();
  lifetime.remove(() => { disposed += 1; });
  assert.equal(disposed, 1, "release and route cleanup are idempotent");
});

test("a route with no pending action disposes immediately on actual removal", () => {
  const lifetime = createRouteLifetime();
  let disposed = false;

  lifetime.remove(() => { disposed = true; });

  assert.equal(lifetime.isCurrent(), false);
  assert.equal(disposed, true);

  let lateCallback = false;
  lifetime.remove(() => { lateCallback = true; });
  assert.equal(lateCallback, false, "callbacks registered after disposal are ignored rather than retained");
});
