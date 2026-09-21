# ODK-097 capture run

1. `maestro test --udid E2C70813-7747-473F-BAD1-26F0BDD692E3 .maestro/screenshot-capture/odk097/10-backend-tradeoff.yaml` — PASS after clean simulator install. Backend Tradeoff 10/20/40 asserted; 40 selected; session mode visible. Simulator screenshot saved at 1/40.
2. Same command for `20-ood-tradeoff.yaml` — PASS after clean temporary simulator install; OOD 10/20/40 and session 1/40.
3. Same command for `30-frontend-tradeoff.yaml` — PASS after clean temporary simulator install; Frontend 10/20/40 and session 1/40.
4. Same command for `40-frontend-empty-review.yaml` — PASS after clean temporary simulator install; tapping unavailable Review left the hub visible; Learn setup showed 1 and 10, while 20 was absent. Setup screenshot saved.
5. `50-review-hub.yaml` — first attempt using `back` failed because iOS remained on setup; corrected to tap the visible back control. Rerun PASS. Hub screenshot saved showing `Unavailable` and `There are no questions to review right now.`

Initial Backend attempt reached track selection but a dev-client warning overlay covered the continue button. A subsequent `clearState` attempt failed at encrypted storage because it removed local data without restoring the key. The temporary simulator was erased and reinstalled; the successful runs above use fresh guest state. No user's simulator data was changed.

Screenshots were captured with `xcrun simctl io ... screenshot` after each checkpoint and verified as 1206 × 2622 PNGs. `manifest.json` records hashes and flow mapping. The Maestro run did not yield usable files for its relative `takeScreenshot` steps; they were removed from the saved flows.
