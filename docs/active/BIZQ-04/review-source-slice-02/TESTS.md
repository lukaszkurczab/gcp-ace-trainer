# Review-source selection checks

Run from `patternly/`:

```sh
node --import tsx --test src/application/canonical/CanonicalReviewSource.test.ts
npx tsc --noEmit
```

The regression began RED against the real canonical Coding package: `due_queue` with no due review and one scorer-produced historical miss prepared `alg-complexity-amortized-001`. The original output is preserved in [actual-red.log](./actual-red.log).

After the runtime correction, all nine tests pass. The matrix covers an actual journal-backed lifecycle start with three current due reviews plus a separate historical miss, shortening from ten requested items to the three eligible unique refs, empty due evidence with a persisted miss and no durable write, explicit unsupported `session_misses` with no write, preserved single-source Design and Certification defaults without `reviewSource`, future/stale-version/stale-hash/foreign-track refs with a historical miss present, invalid source/ref combinations including absent source in the multi-source Coding mode, and a simulation request rejected before persistence. Lifecycle failures assert the wrapped application failure category and the underlying reason. The focused TAP output is in [actual-green.log](./actual-green.log).

The tests use the actual package/runtime and in-memory canonical repositories. They do not establish UI/native reachability or provide a verified completed-session-miss evidence source; `session_misses` remains explicitly unavailable.
