# UI-26-11 — odbiór propozycji planu

Status: ACCEPTED — niezależne QA: PASS WITH ISSUES (wyłącznie nieblokująca uwaga typograficzna FR 2×). Data: 2026-09-30.

## Zmiana i przyczyna

Nagłówek stack jest jedynym właścicielem top safe-area we wszystkich sześciu gałęziach propozycji. Ready/shortened używają lokalizowanego `Review your learning plan` bez redundantnego subtitle. Lokalizowany rodzaj celu jest nagłówkiem karty, bez powtórzenia w body. Aktywna propozycja ma secondary Edit schedule i primary Accept plan; Back pozostaje w nagłówku. Osobna semantyka shortfall, błędów i zapisanego planu pozostaje.

Usunięto martwe klucze `Your proposed rhythm` i `Goal context` we wszystkich siedmiu locale. Subtitle dawnej propozycji nadal służy shortfall, więc pozostał. Nie zmieniono globalnych Screen/AppShellHeader, generatora, danych celu, zapisu, przypomnień ani edytora.

## Bezpieczny odbiór runtime

Ten sam ekran otrzymuje domyślnie adapter istniejących koordynatorów. Jawny fixture ma świeży runtime w pamięci, allowlistę dokładnych URL-i i licznik wywołań, bez zapisu profilu i bez zwracania pozornego sukcesu zapisu. Metro wybiera implementację fixture wyłącznie dla smoke; URL działa tylko w DEV + smoke. Inny build otrzymuje jawnie wyłączoną implementację. Fixture ma niezależne drzewo nawigacji i dziedziczy theme. Back przywraca normalny nawigator; powtórny URL otwiera świeży ekran/liczniki. Pierwsze próby ze współdzielonym kontenerem ujawniły utrzymanie fixture route i zostały zastąpione niezależnym drzewem; nie zaliczono ich jako PASS.

Coordinator produktu generuje exact/shortfall. Shortened sprawdzono jako jawny, domenowo wygenerowany fixture; nie jest to dowód wystąpienia tego wariantu w bieżącym produkcie.

## Środowisko i przypięte wejścia

- App base `534c380cb63b3a67a8a61272ff3da74217274af0`, backend `4f714e5146c48815ae03d03d8d47ccc96146c440`, content `0174e42fbe7634a54c1f5d87369063c7e01e8c7e`, web `9585919b7d0c1a8396e6d255e49850e64e129d0e`.
- Node 22.22.3, Maestro 2.10, Java 17, istniejący iPhone 17 `7F315654-3175-4F3C-BB24-B0263F59360C`, iOS 26.4. Jedna istniejąca instalacja.
- Metro localhost:8081, backend smoke :8080, Auth :19099, istniejący Firestore :18081. Auth i `/ready` potwierdziły database/authentication/providerReader oraz zgodność lokalnego App Check. To lokalny transport/fixture, bez dowodu realnych providerów lub deployu. Nie resetowano backend datastore.
- Izolowany Gość po lokalnym czyszczeniu danych istniejącej aplikacji. Realny przepływ odczytał brak planu przed Accept, zapisany plan po Accept i ten sam zapis po restarcie. Nie jest to test chmury/synchronizacji kont.

## Wykonane sprawdzenia

- Pierwszy odtworzony diff: proposal/learning-plan/generator 51/51, locale parity 4/4.
- Końcowe testy presentation, fixture URL/runtime i wyboru Metro: 17/17.
- Regresja mutation runtime, proposal coordinator i generator: 13/13, w tym trwały zapis przy pending reminders.
- `npm run typecheck`, `npm run validate:content-boundary`, `npm run validate:runtime-privacy-boundary`, `git diff --check`: PASS na Node 22.
- Maestro `.maestro/ui-26-11-real-guest.yaml`: PASS, brak planu → Create → Edit → Back → Accept → persisted → restart → ponowny odczyt. Flow wymaga izolowanego Gościa bez zapisanego planu; nie jest idempotentnym resetem.
- Maestro `.maestro/ui-26-11-platform-back.yaml`: PASS, rzeczywista propozycja → gest od lewej krawędzi → cel, bez Accept i bez zmiany zapisanego planu.
- Maestro `.maestro/ui-26-11-large-warnings.yaml`: PASS, EN dark 2×, pełny shortfall 10/2/8 i shortened 4/10 oraz oba właściwe CTA.
- Fixture lifecycle: PASS dla Back do Home i ponownego otwarcia tego samego URL-u z licznikiem Accept=0.
- Warianty `.maestro/ui-26-11-variant.yaml`: PL light 2×/1 dzień, DE light 2×/7 dni/długi cel i FR dark 2×/7 dni, IT light standard oraz ES dark standard: PASS. ET light standard i EN dark standard: PASS. Macierz fixture: PASS dla ready 1/3/7 dni, target absent/present, shortened, shortfall, delayed loading → ready, stale, unavailable, accept storage/validation/stale i edit storage/stale. Podwójne dotknięcie Accept i Edit (50 ms) dało po jednym wywołaniu; powtórne otwarcie ready1 po Back ma Accept=0.

Komendy: `PATH=/opt/homebrew/opt/node@22/bin:$PATH node --import tsx --test` z plikami `learningPlanProposalPresentation.test.ts`, `learningPlanProposalFixtureCommand.test.ts`, `learningPlanProposalFixtureRuntime.test.ts`, `scripts/learningPlanProposalFixtureMetro.test.mjs`; osobno `learningPlanMutationRuntime.test.ts`, `LearningPlanProposalCoordinator.test.ts`, `learningPlanProposalGenerator.test.ts`. Flow Maestro uruchamiane `maestro --udid <powyższy UUID> test <flow> --test-output-dir <lokalny katalog>`. Wariant podaje THEME, LOCALE, CASE, HERO, GOAL_TITLE, TARGET, LAST_DAY, OUTLOOK; przykłady copy odpowiadają kanonicznym locale. Wielkość tekstu: `xcrun simctl ui <UUID> content_size accessibility-extra-large` lub `large` (komponenty limitują mnożnik do 2).

## Niezależna walidacja i ograniczenia

Luna `gpt-6-luna` high zwalidowała briefing: consistency .94, simplicity .84, risk control .91, maintainability .89, minimum .84. Pierwszy briefing poprawiono po wyniku .76 za niedookreśloną macierz. Osobny briefing fixture uzyskał minimum .82; poprawka izolacji nawigacji: .95/.82/.90/.90, minimum .82. Implementacja bounded: Luna medium; niezależne QA: Luna high.

QA niezależnie uruchomiło 17/17 i typecheck/diff-check oraz obejrzało PL/DE/FR 2×. Brak clippingu, target/dni i CTA czytelne. FR hero przy 2× łamie bardzo długie `d’apprentissage` wewnątrz wyrazu, ale cały tekst pozostaje widoczny; drobna uwaga typograficzna. Końcowy niezależny werdykt: PASS WITH ISSUES. Wszystkie kryteria odbioru pokryte; jedyna uwaga to opisane łamanie wyrazu FR 2×, bez clippingu lub utraty działania.

VoiceOver nie testowano zgodnie z decyzją PO; historyczne wymaganie w AUDIT/stashu zostało zastąpione aktualnym planem. Nie wykonywano EAS, deployu ani realnej macierzy providerów. Zachowano wszystkie stashe. Surowe logi urządzenia/kont nie należą do pakietu evidence.

Maszynowe, ograniczone evidence poleceń i statusów 12 zakończonych flow: [VERIFICATION.json](VERIFICATION.json); screenshoty: [screenshots/](screenshots/). EN setup zawiera jedną nieudaną próbę wejścia do Settings, po której jawny retry i sprawdzenie settings-screen przeszły. Surowych logów nie zapisano. Nie jest to pełny iloczyn wszystkich kombinacji locale/theme/state; macierz obejmuje każdy wymagany wymiar oraz warianty wysokiego ryzyka (długie DE/FR i warningi przy 2×).

Usunięto identyczne byte-for-byte kopie screenshotów; [SCREENSHOT-ALIASES.json](SCREENSHOT-ALIASES.json) mapuje nazwy etapów na zachowany identyczny obraz.
