# N07/23 CI admission input correction

Both content workflows now provide the sibling repository layout expected by the existing admission test. Each checks out `patternly-content` first, reads and validates the full 40-character app commit from the committed `candidate-admission-v3.json`, checks out `lukaszkurczab/gcp-ace-trainer` at that exact commit into sibling path `patternly`, and installs its locked dependencies there. Content job commands retain `patternly-content` as their working directory. The manually triggered workflow's npm cache now points at `patternly-content/package-lock.json`.

The change is limited to:

- `patternly-content/.github/workflows/content-publishing.yml` — SHA-256 `18955c8e440c4c4dc6a7c1b708ced9feca60e4426ad5ae63e3a9627dfff0406b`
- `patternly-content/.github/workflows/real-content-release.yml` — SHA-256 `e3979195d0b824633f43a8338fa8f0d74bf5348742a6dae7376d96d264865d20`

The committed admission pins app commit `50a6811cde15b662e8c45f777fcc9c447a482d3a`. Local hashes for that commit's release lock, bundled content lock, and runtime admission test exactly match the current app checkout. The current app checkout is at `ea4f3d61b39bab6b9f12ace73b34721d0d6e717a`; the three compared files have no local modifications. The focused admission test ran against this sibling checkout and passed both existing tests, including the real runtime test.

Verification:

- `node --test tests/candidate-admission-v3.test.mjs` using Node `v22.22.3`: 2 passed, 0 failed. Output is in [CI-ADMISSION-TEST.log](CI-ADMISSION-TEST.log).
- Parsed both workflow files with the app's existing `js-yaml` dependency. Executed each exact inline commit-reader step under Bash with a temporary `GITHUB_OUTPUT`; both emitted the admitted commit and the parsed workflow structure confirmed the sibling checkout and install. Output is in [CI-ADMISSION-WORKFLOW-CHECK.log](CI-ADMISSION-WORKFLOW-CHECK.log).
- Confirmed the three files consumed from app commit `50a6811…` are byte-identical to the current app checkout: release lock `8dbc9052…`, content lock `0cb1306d…`, runtime test `0a398abb…`.

The first local harness attempt incorrectly passed a shell heredoc to Node's JavaScript evaluator and failed with a syntax error before executing the workflow command. The corrected probe ran the extracted command with Bash, matching the workflow runner, and passed. No CI workflow was dispatched. Hosted automatic CI remains pending the ordinary push and must verify both the previously failing admission test and the later content build/readiness steps.
