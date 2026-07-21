# Maestro matrix

| Flow | Result | Checkpoints / evidence | Notes |
| --- | --- | --- | --- |
| F01 cold/relaunch Home | PASS | `f01-home.png`, `runtime-home.png` | Algorithms Home observed after canonical iOS build. |
| F03 Practice Hub | PASS | `f03-practice-hub.png`, `f03-practice-hierarchy.csv` | Real runtime navigation, stable main tab ID. |
| F04 question | PASS | `f04-practice-question.png`, hierarchy | First real Guided Practice item and four options. |
| F05 incorrect feedback | PASS | `f05-incorrect-feedback.png`, hierarchy | Correct/incorrect marking, Reason, collapsed Details control. |
| F05 Details | BLOCKED | `f05-details-screenshots/...png` | Isolated next flow reached leave dialog, not an unambiguous Details transition. |
| F07 leave/relaunch | PASS | `f07-after-leave`, `f07-after-relaunch`, hierarchy | Active session survives relaunch. |
| F07 resume | PASS with selector finding | `f07-resumed-session`, hierarchy | Exact composite accessibility label required. |
| F08 Simulation 40 | BLOCKED_SCOPE | static inventory only | No 40-item device pass was completed. |
| F09 Certification | BLOCKED | runtime validation and content validation | No valid source/artifact exists. |
| F10 repeated navigation/restart | PARTIAL | F01/F07 | No stress sequence or Android run. |

Maestro 2.6.1 supports `HTML-DETAILED`, debug output and test-output directories; each executed flow has those outputs under `maestro/`. The pre-existing `algorithmic-path.yaml` was not used because it opens a fixed LAN Metro URL and would change the evaluated runtime target.
