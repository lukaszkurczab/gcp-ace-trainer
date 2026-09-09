# ODK-E2E-035 — manifest dowodów

Środowisko: iOS 26.4, `Maestro_IOS_iPhone-17_26`, `en_US`, CEST, light, commit `8337514`.

| Kadr | SHA-256 | Dowód |
| --- | --- | --- |
| `plan-flow__proposal__010__ready__light__en-ios-regular.png` | `bd6a3bbd23eb9fe976e3aa755ce60d7955ae93a2815cf6fa9c0488fe48b704ae` | Jawna propozycja, track, target i trzy sloty. |
| `plan-flow__accept__020__persisted__light__en-ios-regular.png` | `d43a0676f084fe89fa7b7500653c6f57e9df5ad8a8964f2e9aa4858a740b8046` | Zaakceptowany trwały plan. |
| `plan-flow__edit__030__saved-four-sessions__light__en-ios-regular.png` | `03b2ab4124bc0ec1e863e6e7c3fa74d6b139b4255bc530161008de56dbaf2945` | Cztery dni i środa 20:00. |
| `plan-flow__reminders__040__granted-plan-schedule__light__en-ios-regular.png` | `3518d59e260299c9130225deafceefbe852d4550110c3ad9e4dda05f76421` | Granted i cztery reminder slots. |
| `plan-flow__home__050__accepted-schedule__light__en-ios-regular.png` | `ebcaa57529ee216957cb28f1e93c5b2b53fc1a95de34205be0592e0295b81598` | Home po zapisie planu. |
| `plan-flow__home__070__completed-today__light__en-ios-regular.png` | `0311b17821fbb3b6398b53d24442283eec1f5845c6049648631146972ca10717` | Home po ukończeniu sesji. |
| `plan-flow__progress__080__completed-day__light__en-ios-regular.png` | `68b5495e5c744512ec9a601e2bf8a63e6932675ecd3bf7f4e7f84d2e2f2d713e` | Progress pokazuje completed day. |
| `plan-flow__session__090__abandoned-summary__light__en-ios-regular.png` | `e79e8f799dbde587d654b68fbf36c3bb32057901173070245cb52ab2f8ecf43e` | Druga sesja jawnie zakończona 0/10. |
| `plan-flow__durability__100__home-after-relaunch__light__en-ios-regular.png` | `ed07583d66321e3ad27d7fdbf04a8be92a066749c46246d83de546271ed6b746` | Home zachowuje stan po restarcie. |
| `plan-flow__durability__110__progress-after-relaunch__light__en-ios-regular.png` | `5bdb6f1c757a4d5de588391b937e22f6f14a1d9744a7132948e2d6add2f51c65` | Progress zachowuje stan po restarcie. |
| `plan-flow__durability__120__reminders-after-relaunch__light__en-ios-regular.png` | `c11c06df2f75056c7c471f022e6c54ade01ffb15e86e31db0edd9fe307851d12` | Reminders zachowują zgodę i sloty po restarcie. |
| `plan-flow__activity__130__completed-only__light__en-ios-regular.png` | `bfb3e761556243f5c049cd3eefc54bf70346527641c75d9ae2f757b4fba3ea05` | Activity liczy ukończoną, nie porzuconą sesję. |
| `plan-flow__session__140__completed-summary-durable__light__en-ios-regular.png` | `3ced41d36d8f0f7a1f419e02332e3795a31cc09e8a71fe04c8b7f55eb35cae67` | Trwałe podsumowanie ukończonej sesji. |

Pełne pliki znajdowały się w `/tmp/patternly-odk035-evidence/maestro`. Zgodnie z wymaganiem właściciela zostały przeznaczone do usunięcia dopiero po udanym pushu raportu i manifestu.

Coverage: `complete` dla jednego iPhone, iOS, EN i motywu jasnego. VoiceOver pominięto. Inne locale, motywy i urządzenia nie należą do zakresu tego retestu.
