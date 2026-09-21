# ODK-097 screenshot manifest

Full-screen, unedited 1206 × 2622 captures from the isolated iPhone iOS 26.4 simulator. SHA-256, source flow, build and service details are in [manifest.json](manifest.json).

| File | Track | State |
| --- | --- | --- |
| [backend-tradeoff-first-of-forty.png](backend-tradeoff-first-of-forty.png) | Backend | Tradeoff, 1 of 40 |
| [ood-tradeoff-first-of-forty.png](ood-tradeoff-first-of-forty.png) | OOD | Tradeoff, 1 of 40 |
| [frontend-tradeoff-first-of-forty.png](frontend-tradeoff-first-of-forty.png) | Frontend | Tradeoff, 1 of 40 |
| [frontend-learn-lengths.png](frontend-learn-lengths.png) | Frontend | Learn, 1 and 10, default 10 |
| [frontend-review-unavailable.png](frontend-review-unavailable.png) | Frontend | Review unavailable on fresh guest without due evidence |

Screenshots were saved with `xcrun simctl io <temporary-UDID> screenshot <absolute-path>` after each successful Maestro checkpoint. Maestro's own relative `takeScreenshot` calls reported completion but produced no located artifact; those commands were removed from the saved flows. Only the five files indexed above are evidence.
