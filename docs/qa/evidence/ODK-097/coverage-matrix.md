# ODK-097 coverage matrix

| Cluster | Path | Required states | Captured | Coverage | Note |
| --- | --- | --- | --- | --- | --- |
| Tradeoff | Backend/OOD/Frontend Free node | 10/20/40 options, selected 40, first question | Three 1/40 screenshots; Maestro assertions for all options | Partial visual, complete interaction | Setup options were asserted, but no saved setup screenshot for each track. |
| Learn | Frontend Free node | 1/10, default 10 | Setup screenshot and assertions | Complete for one representative track | Config/runtime tests cover the other two tracks. |
| Review | Fresh Frontend guest | Unavailable without due evidence | Hub screenshot; disabled row tap left hub unchanged | Complete for empty state | Due and shortening scenarios are covered by deterministic runtime tests, not simulator fixtures. |
| Themes/locales | iPhone regular | Light/en | Five screenshots | Partial | Dark, other locales and device classes are outside this focused retest. |
