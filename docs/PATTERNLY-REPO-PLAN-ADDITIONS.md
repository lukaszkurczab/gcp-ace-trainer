# Patternly — przegląd czterech repozytoriów i propozycje uzupełnienia planu

**Data:** 24 września 2026<br>
**Status:** raport źródłowy; propozycje scalono 24.09.2026 z [kanonicznym planem](PATTERNLY-WORKING-PLAN.md). Kolejność i status zadań obowiązują wyłącznie tam.<br>
**Punkt odniesienia w chwili przeglądu:** [kanoniczny plan](PATTERNLY-WORKING-PLAN.md), rewizja z 23.09.2026; bieżący plan zawiera już uzgodnione uzupełnienia.<br>
**Wykonany zakres:** statyczny przegląd wybranych źródeł aplikacji, backendu, contentu, web/admin, kontraktów konfiguracji i automatyzacji wydania. Nie jest to audyt każdego pliku lub każdego pytania. Nie uruchamiano testów, aplikacji, CI, providerów ani deployu. Nie sprawdzano nieopublikowanych zmian w lokalnym workspace Codex.

## 1. Przypięty stan źródeł

| Rola | Repozytorium GitHub | Gałąź | Odczytany commit |
| --- | --- | --- | --- |
| Aplikacja, lokalnie `patternly` | `lukaszkurczab/gcp-ace-trainer` | `main` | `80ec9db0316ebae8af29987377d19d5008509acd` |
| Backend | `lukaszkurczab/patternly-backend` | `main` | `e3c3fc6570faa13a802f47a19e17005b0c1eecd1` |
| Content | `lukaszkurczab/patternly-content` | `master` | `618baae428d7d42e59834eaef322e57393d54c7d` |
| Web i lokalny admin | `lukaszkurczab/patternly-web` | `main` | `b389009b38e80a9919337f7f9bd13dc76bdca2b7` |

Plan zawiera również wyniki lokalnych prac. Rozbieżność z powyższymi commitami nie dowodzi regresji ani niewykonania tych prac. PLAN-SYNC powinien przypisać lokalne wyniki do rzeczywistych commitów lub jawnie wskazać nieopublikowany diff; nie przepisywać dat i PASS na inne źródła.

## 2. Wynik

Najistotniejsze uzupełnienia dotyczą egzekwowania planu w kodzie i operacyjnej obsługi produktu. Nie proponuję nowych epików. Pięć poniższych grup zadań mieści się w WP-E01, WP-E05, WP-E07 i WP-E08; każdą grupę rozbić na opisane małe slice’y.

Identyfikatory `ADD-*` były roboczymi nazwami propozycji. W planie przyjęto `CI-CONTRACT`, `RELEASE-CONTRACT`, `OPS-PRODUCTION`, `PUBLISH`; `ADD-IOS-CONFIG` jest częścią `ODK-116-A`. Przed wykonaniem PLAN-SYNC sprawdza dokładne pokrycie istniejących pakietów i usuwa ewentualne duplikaty GATE/ODK.

| Propozycja | Klasyfikacja | Epik | Moment wymagany |
| --- | --- | --- | --- |
| ADD-CI-CONTRACT | Potwierdzona niespójność komend między repo; pominięcie osobnego zestawu testów kandydata w głównym `npm test`. | WP-E01 / WP-E08 | Naprawa kontraktu przed odbiorem przekrojowym; pełny przebieg na właściwym kandydacie. |
| ADD-RELEASE-CONTRACT | Potwierdzona różnica wymagań planu i walidatorów; dodatkowo luka polityki OTA. | WP-E08 | Implementacja i testy kontraktu przed SIM-READY/FREEZE; wymagane dowody fizyczne dopiero przed GO. |
| ADD-IOS-CONFIG | Potwierdzone niewydzielone wymagania Androida w konfiguracji builda iOS. | WP-E07 | Przed przygotowaniem rzeczywistego builda iOS; niezależnie od gotowości Androida. |
| ADD-OPS-PRODUCTION | Potwierdzone ograniczenie istniejącego panelu; brak wykazanego w odczytanych źródłach kanału obsługi produkcyjnych spraw. | WP-E05 / WP-E07 | Kontrakt i testowalna implementacja przed SIM-READY; rzeczywisty dostęp i dowód operacyjny przed GO. |
| ADD-PUBLISH | Luka głównej kolejki: decyzja GO nie jest wykonaniem publikacji i odbiorem wdrożenia. | WP-E08 | Przygotowanie przed GO; wykonanie publikacji dopiero po wymaganej autoryzacji. |

Zasady PO pozostają: testy mobilne Codex tylko iOS, Android ręcznie i bez osobnej bramki automatycznej; prawdziwe dane prawne nie blokują developmentu; fizyczny iPhone po SIM-READY; banki rozstrzyga Codex; brak terminu publikacji.

## 3. Zadania do dodania lub wydzielenia

### ADD-CI-CONTRACT — zgodność pipeline’u z rzeczywistymi komendami repo

**Dowód:** `.github/workflows/launch-readiness.yml` aplikacji wywołuje w repo content `npm run authoring:validate` oraz `npm run audit:aws-workbook-source`. W odczytanym `patternly-content/package.json` obu komend nie ma. Jednocześnie `test:candidate-draft-v2` istnieje jako osobna komenda, lecz nie jest elementem listy `test:canonical`, do której prowadzi główne `npm test`; nie ma też osobnego jej wywołania w odczytanym workflow.

**Skutek:** zadeklarowana przekrojowa bramka nie ma poprawnego kontraktu wykonania na tym zestawie commitów. Testy nowego formatu mogą przejść ręcznie, a później nie chronić głównego CI. Nie jest to raport z uruchomienia CI: niespójność wynika bezpośrednio ze źródeł.

| Slice | Wynik | Kryteria akceptacji |
| --- | --- | --- |
| A — aktualny kontrakt komend | Powiązać każdą walidację workflow z rzeczywiście istniejącą komendą i jej znaczeniem. | Nieistniejące komendy zastąpione właściwym aktualnym sprawdzeniem, bez przywracania legacy tylko po to, by zaspokoić CI i bez usuwania ochrony. |
| B — pokrycie testów kandydata | Włączyć testy bieżącego formatu kandydata do obowiązującej bramki właścicielskiej. | Celowo uszkodzony manifest/źródłowe powiązanie powoduje FAIL; właściwy zestaw testów rzeczywiście jest uruchamiany. |
| C — integracja czterech repo | Wykonać właściwy etap pipeline’u dla jawnego zestawu czterech SHA. | Raport pokazuje rzeczywiste wyniki, brak kroku pominiętego jako pozorny sukces. Nie wymagać providerów ani fizycznego urządzenia w etapie lokalnym. |

Istniejące `continue-on-error` nie jest samo w sobie błędem: workflow na końcu agreguje wyniki kroków. Zachować zbieranie wielu błędów, ale końcowy FAIL musi być egzekwowany.

**Źródła:** S01, S02.

### ADD-RELEASE-CONTRACT — bramki etapowe i tożsamość przebadanego wydania

**Dowód 1:** `scripts/releaseGate.mjs` umieszcza `physical-device-matrix` w `optionalExternalEvidence`. Brak tego dowodu nie jest dodawany do blockerów. Plan wymaga ODK-088 przed GO.

**Dowód 2:** walidator zewnętrznego evidence wiąże je z `applicationCommit`. Dopuszczony zamknięty zestaw pól nie obejmuje buildu iOS, konfiguracji ani identyfikatora całego release manifestu. Osobna weryfikacja manifestu czterech repo nie zmienia tego ograniczenia powiązania dowodu.

**Dowód 3:** `releaseManifest.mjs` dopuszcza tylko `schemaVersion`, `manifestId`, `candidateId`, `trackIds`, `repositories`, `references`. Cztery kontraktowe referencje nie obejmują rzeczywistego builda iOS ani wersji konfiguracji wdrożeniowej.

**Dowód 4:** `app.config.js` konfiguruje `expo-updates` URL i `runtimeVersion` oparty na `appVersion`, a `eas.json` przypisuje release do kanału `production`. Nie sprawdzano opublikowanych OTA. Luka polega na braku jednoznacznego uwzględnienia wykonywanego JS/update w polityce freeze, a nie na potwierdzonym nieautoryzowanym wdrożeniu.

| Slice | Wynik | Kryteria akceptacji |
| --- | --- | --- |
| A — kontrakt etapów | Jednoznacznie rozdzielić sprawdzenia lokalne, FREEZE i końcowe GO, wykorzystując istniejące skrypty. | Brak danych PO nie obala lokalnego etapu; brak provider/device evidence nie obala FREEZE; brak wymaganego fizycznego testu obala GO; Android manual pending nie obala wspólnej bramki. |
| B — tożsamość wydania i evidence | Rozszerzyć istniejący manifest zamiast tworzyć konkurencyjny format. | Powiązane cztery SHA, content/app lock, build iOS i fingerprint niesekretnej konfiguracji. Zmiana badanego backendu/config/buildu nie może bez analizy wpływu zachować ważności starego dowodu. Referencje do dowodów mają sprawdzalną integralność. |
| C — OTA i rzeczywiście uruchomiony artefakt | Ustalić i wdrożyć jedną politykę OTA dla zamrożonego kandydata. | Albo kandydat nie przyjmuje nieobjętego walidacją zdalnego update’u, albo manifest i evidence wiążą właściwy update, runtime i kanał. Odbiór rejestruje faktycznie uruchomiony artefakt. Zmiana jest nową rewizją z retestem wpływu. |

Nie narzucać pełnego retestu po każdej zmianie dokumentacyjnej. Kontrakt ma opisać ponowne wykorzystanie nadal aktualnych dowodów wraz z uzasadnieniem, bez przepisywania ich historii.

**Źródła:** S03, S04, S05, S06; plan §7.2–7.3.

### ADD-IOS-CONFIG — walidacja konfiguracji dla budowanej platformy

**Dowód:** `assertRuntimeEnvironment` w `app.config.js` sprawdza obydwa pliki Firebase; w release `nativeFirebaseFile` wymaga zarówno `GOOGLE_SERVICES_JSON`, jak i `GOOGLE_SERVICE_INFO_PLIST`. Lista wymaganych publicznych pól obejmuje `EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID`. Dla trybów innych niż smoke wymagany jest także Android provider `playIntegrity`. Te sprawdzenia nie są ograniczone do builda Androida, choć pole RevenueCat iOS ma już warunek platformowy.

**Skutek:** decyzja o referencyjnym iOS została wpisana do planu, ale nie jest w pełni odwzorowana w konfiguracji builda. Nie twierdzę, że aktualny iOS build już z tego powodu nie przeszedł; konfiguracja może dziś zawierać oba komplety wartości. Potwierdzona jest zbędna zależność.

**Zakres:** wydzielić konfigurację wspólną, iOS i Android oraz jednoznacznie rozpoznać platformę. Nie podstawiać fikcyjnych identyfikatorów Androida i nie wyłączać zabezpieczeń App Check/Firebase na iOS.

**AC:** produkcyjna konfiguracja iOS przechodzi na kompletnych danych iOS bez androidowych pól; braki danych iOS powodują FAIL; jawny build Androida nadal sprawdza własne wymagania. Testy walidatora są niezależne od posiadania fizycznego urządzenia i prawdziwych danych prawnych.

**Włączenie:** jako konkretny slice ODK-116-A, jeżeli nie ma potrzeby osobnego ID. Nie powielać dwóch implementacji konfiguracji.

**Źródło:** S05; plan DEC-23-IOS i ODK-116-A.

### ADD-OPS-PRODUCTION — droga od zgłoszenia użytkownika do działania operatora

**Dowód:** `patternly-web/src/adminConfig.js` wymaga developmentu, loopback, projektu `demo-patternly-admin`, lokalnego API i Auth emulatora. Backend `createAdminGuard` zwraca `404 admin_unavailable` przy `NODE_ENV=production`. Runbook Cloud Run potwierdza, że administrator korzysta tylko z lokalnego backendu i emulatorów. README web opisuje ten panel jako narzędzie obsługujące również privacy/legal requests, content reports i incydenty.

**Wniosek ograniczony do źródeł:** istniejący panel nie jest wykazanym kanałem obsługi danych rzeczywistych użytkowników. Nie dowodzi to, że PO nie ma żadnego innego narzędzia poza repozytoriami. Takiego kanału nie wykazano jednak w odczytanych materiałach ani nie przypisano jawnie do głównej kolejki.

| Slice | Wynik | Kryteria akceptacji |
| --- | --- | --- |
| A — kontrakt operacyjny | Wskazać istniejący bezpieczny kanał albo zdefiniować brakujący. | Dla każdego potrzebnego działania wiadomo, kto je wykonuje, z jaką autoryzacją, na jakim środowisku i z jakim zapisem audytowym. Nie utożsamiać demo na emulatorze z obsługą produkcji. |
| B — ograniczona implementacja | Domknąć brakujące operacje, zachowując brak publicznego/hostowanego panelu. | Synthetic request → autoryzowana kolejka operatora → właściwa akcja/odpowiedź → stan widoczny w aplikacji i audyt. Odmowa nieuprawnionego dostępu i odporność na retry. |
| C — odbiór przed GO | Potwierdzić działanie wybranego kanału w docelowym środowisku, na kontrolowanych danych i w granicach uprawnień. | Przenośny dowód operacyjny, bez sekretów i bez przypadkowej ingerencji w cudze dane. |

Nie naprawiać tego przez hostowanie admina, otwieranie publicznych tras ani oznaczenie produkcji jako development. Nie rozszerzać wyjątku dla mobilnego App Check na pozbawienie kanału operatora własnych zabezpieczeń. Jeżeli wystarczy istniejące narzędzie operacyjne, zadanie kończy się jego weryfikacją i przypięciem dowodu, a nie budową kolejnego panelu.

**Źródła:** S07, S08, S09, S10; plan §2.3 i WP-E05/WP-E07.

### ADD-PUBLISH — wykonanie zatwierdzonego wydania i odbiór po publikacji

**Podstawa:** jest to wniosek z organizacji planu, nie potwierdzony defekt kodu. Główna kolejka wydawnicza kończy się na GO/NO-GO. WEB-03C ma publikację marketingu i rollback, ale ten zakres nie zastępuje wydania aplikacji i odebrania jej działania w docelowej konfiguracji.

**Zakres:** powiązać z istniejącymi pakietami podpisywania/store-readiness/providerów przygotowanie operacji publikacji, rzeczywiste wykonanie i odbiór po wydaniu. Zachować jeden właścicielski GO i oddzielić go od dowodu wykonania.

**AC:** wiadomo, jaki dokładnie zatwierdzony artefakt został wysłany, jaki ma status w sklepie, jaki backend/content/config obsługuje wydanie i jakie kontrolowane sprawdzenia po publikacji wykonano. Wskazane są sygnały zatrzymania dystrybucji oraz dostępne środki reakcji: backend, konfiguracja, content, OTA zgodnie z ustaloną polityką. Nie obiecywać automatycznego cofnięcia już zainstalowanej aplikacji.

Przygotowanie wykonuje Codex przed GO. Wysłanie/publikacja to późniejszy krok w granicach właściwych uprawnień i autoryzacji; ten raport niczego nie publikuje. Android manual i jego odrębne czynności sklepowe pozostają poza blokowaniem referencyjnego iOS.

## 4. Rozszerzenia istniejących zadań — nie nowe implementacje z założenia

| Istniejący zakres | Co dopisać / sprawdzić w pakiecie | Dlaczego i granica wniosku |
| --- | --- | --- |
| PLAN-SYNC | Rozdzielić reguły obowiązujące w dokumentach, skryptach, schematach i CI. Uzgodnić lokalne wyniki z opublikowanymi commitami oraz miejsce wersjonowania root planu. | Samo usunięcie sprzecznego zdania nie zmienia walidatora. Nie jest to wezwanie do ponownego audytu całości. |
| AWS-02 + SIMP-05 | Domknąć obsługę delegowanej decyzji we wszystkich faktycznych konsumentach, w tym readiness i release gate, bez fałszowania podpisu PO. Uzgodnić runtime package lifecycle z README contentu. | `candidate-manifest.mjs` nadal odwołuje się do `humanApproval` i historycznych ścieżek. README mówi o build-time ingress bez runtime content HTTP. To konkretne punkty uzgodnienia istniejącego taska, nie dowód, że należy skasować cały mechanizm. |
| AUD-04 + ODK-119-GATE | Przypisać testy przerwanego downloadu, niezgodnego artefaktu, awarii aktywacji, zachowania sesji i historii po zmianie package, wygaśnięcia podczas pracy oraz ponownego dostępu. | Plan już obejmuje integralność, atomowość, odmowy i retencję. Najpierw sprawdzić istniejące AC; dopisać tylko brakujące przypadki. Nie zgłoszono tu nowej potwierdzonej awarii implementacji. |
| AUD-06, plan nauki i reminders | Jawne case IDs dla aktywnego tracka, pauzy/ukończenia planu, zmiany strefy, odmowy uprawnień, retry/restartu i konfliktu tożsamości goal/plan/package. | Odczytane `notificationPreferences.ts` ma te stany i rozbudowaną tożsamość; nie zaczynać od nowego schedulera. Sprawdzić pokrycie istniejącymi testami, odrębnie dowód faktycznego dostarczenia na urządzeniu. |
| WP-E06 / ODK-117 / AUD-06 | Jeden ograniczony przegląd reprezentatywnych pełnych ekranów i stanów pod kątem brandu, hierarchii, redundancji, technicznego języka i pustych/błędnych/offline/Premium stanów. | Tłumaczenia wszystkich kluczy i naprawa trzech wskazanych ekranów nie są tym samym co spełnienie celu epika. Nie przywracać zgodności z przestarzałą Figmą i nie wykonywać nieskończonego audytu po każdej zmianie. |
| ODK-082–087 | Przypisać istniejącym ID konkretne kontrakty, wejścia, dowody i zależności; uzupełnić realną obsługę operatorską. | W głównym planie mapowanie jest celowo odłożone. Bez niego nie wiadomo, które zadania operacyjne są już pokryte. Nie tworzyć nowych dublujących bramek. |

### Co już ma konkretną ochronę

- Web verifier skanuje publiczny `dist` pod kątem admin/privacy/Firebase Auth i sprawdza odpowiedzi dla niedozwolonych tras w produkcyjnym preview. Nie ma podstaw, aby z samej obecności `admin.html` w repo wnioskować, że panel jest publicznie publikowany. Zdalny dowód nadal należy do WEB-03C.
- Aplikacja ma istniejący koordynator przypomnień z tożsamością planu, tracka, package i strefy oraz obsługą stanów błędów. Potrzebny jest dowód właściwej integracji, nie automatycznie nowy moduł.
- Content ma kanoniczny builder oraz oddzielne testy v2 kandydata. Problem wskazany w raporcie dotyczy włączenia właściwych kontraktów do procesu, nie rzekomego braku jakichkolwiek testów.

## 5. Włączenie do kolejki bez zatrzymania produktu na porządkowaniu dokumentów

| Moment | Uzupełnienie |
| --- | --- |
| W PLAN-SYNC | Uzgodnić dokładne źródła i zakresy pięciu propozycji; wyeliminować duplikaty z istniejącymi GATE/ODK. |
| Zaraz po PLAN-SYNC | ADD-CI-CONTRACT/A: poprawić rzeczywisty kontrakt komend. Nie czekać z tym do FREEZE. |
| Następnie bez zmiany głównego priorytetu | AUD-FIXTURE → AUD-17 → AUD-13 i istniejące krytyczne przepływy aplikacji. |
| W ODK-116-A | ADD-IOS-CONFIG; walidacja środowisk i zmiennych bez blokowania danymi PO. |
| Przed przekrojowym odbiorem lokalnym | Domknąć implementację bramek i identity; przeprowadzić ograniczony slice operatorski oraz dopisać brakujące case IDs AUD-06. |
| Przed FREEZE | Polityka OTA, aktualny manifest build/config, właściwe komendy CI i działający testowalny kanał operatorski. |
| Po FREEZE, przed GO | Realni providerzy, wymagane dowody operatorskie, fizyczny iPhone, końcowe sprawdzenie tożsamości evidence. |
| Po GO i autoryzacji publikacji | ADD-PUBLISH: wykonanie i odbiór zatwierdzonego wydania. |

Nie wykonywać wszystkich slice’ów jednej propozycji jako jednego rozbudowanego taska. Plan ma kierować do konkretnego wyniku; nie tworzyć kolejnych równoległych manifestów, programów audytu ani warstw akceptacji PO dla contentu.

## 6. Rejestr źródeł

Wszystkie ścieżki odnoszą się do commitów z §1. Poniższy rejestr ułatwia odtworzenie wniosków bez polegania na bieżącej gałęzi.

| ID | Repo | Plik / zakres |
| --- | --- | --- |
| S01 | application | `.github/workflows/launch-readiness.yml` — komendy gate, checkout i agregacja wyników. |
| S02 | content | `package.json` — komplet scripts i jawna lista `test:canonical`. |
| S03 | application | `scripts/releaseGate.mjs` — mandatory/optional evidence, walidator external evidence, agregacja blockerów. |
| S04 | application | `scripts/releaseManifest.mjs` — `validateReleaseManifest`, `RELEASE_MANIFEST_REFERENCES`. |
| S05 | application | `app.config.js` — `assertRuntimeEnvironment`, `nativeFirebaseFile`, konfiguracja updates/runtime. |
| S06 | application | `eas.json` — profile, kanał production i konfiguracja release. |
| S07 | web | `src/adminConfig.js` — `getAdminConfigurationError`. |
| S08 | backend | `src/api/app.ts` — `createAdminGuard` (odczytane m.in. linie 230–430 pliku). |
| S09 | backend | `docs/cloud-run-manual-deploy.md` — granica admina i konfiguracja produkcyjna. |
| S10 | web | `README.md` — zakres panelu i uruchomienie wyłącznie lokalne/emulatorowe. |
| S11 | content | `scripts/review/candidate-manifest.mjs` — readiness, admission i `humanApproval` (odczytane linie 1–120). |
| S12 | content | `README.md` — kanoniczny ingress i scope walidacji. |
| S13 | application | `src/application/notificationPreferences.ts` — stan i tożsamość przypomnień (odczytane linie 1–220). |
| S14 | application | `src/infrastructure/notifications/expoNotificationPlatform.ts` — adapter planowania i odczytu przypomnień. |
| S15 | web | `scripts/verify-local.mjs` — izolacja buildu i preview, katalog dziewięciu tracków. |
| S16 | backend | `docs/decision-register.md` — App Check i granice kanałów. |

## 7. Ograniczenia i stop condition raportu

To wskazania do uzupełnienia planu, a nie nowe PASS/FAIL runtime. Potwierdzone rozbieżności dotyczą konkretnych odczytanych źródeł. Scenariusze awarii package, przypomnień oraz brakujące case IDs są kandydatami do kontroli zakresu; nie należy na tej podstawie otwierać z góry defektów implementacji.

Raport nie zmienia istniejącego planu w pliku ani żadnego repozytorium. Nie wykonuje publikacji, nie zakłada kont i nie zmienia infrastruktury. Po włączeniu zaakceptowanych zadań do kanonicznego planu pozostaje materiałem dowodowym, nie drugą kolejką sterującą.
