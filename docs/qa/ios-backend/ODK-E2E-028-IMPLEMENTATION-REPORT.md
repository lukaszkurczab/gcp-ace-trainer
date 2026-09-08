# ODK-E2E-028 — raport wdrożenia i weryfikacji

Status: VERIFIED_CLOSED

## Wynik

- Zapisany cel ma kanoniczny snapshot z rewizją i zapis warunkowy CAS.
- Czysty generator tworzy jeden slot o 18:00 dla każdego wybranego dnia.
- Generator stosuje T4, C3 i S12. Nie używa średniej całej historii ani obcego materiału.
- Priorytetem są wymagalne powtórki z dokładnie tego samego tracka, content version i package pin. W przeciwnym razie używany jest główny zakres pakietu.
- Propozycja jest nietrwała. Koordynator przechowuje ją tylko w pamięci i sprawdza pełną tożsamość przed odczytem.
- Routing przekazuje wyłącznie `proposalId` i `trackId`.
- Ekran pokazuje jawne stany: loading, brak celu, wstrzymany cel, błędy pakietu, błąd generatora, stale, shortfall, shortened i ready.
- Stan stale nie regeneruje się automatycznie. Akcja „Update plan” tworzy nową propozycję.
- Ekran nie udaje edycji ani akceptacji. Te operacje należą do ODK-E2E-029.
- Po zapisie celu propozycja otwiera się dopiero po udanym uzgodnieniu przypomnienia urządzenia.

## Walidacja briefu

Każdy slice został oceniony niezależnie przez `gpt-5.6-luna / max` przed implementacją.

| Slice | Cel i architektura | Prostota | Ryzyko | Utrzymywalność | Minimum | Werdykt |
|---|---:|---:|---:|---:|---:|---|
| A — snapshot i CAS | 0,94 | 0,86 | 0,88 | 0,92 | 0,86 | APPROVE |
| B — czysty generator | 0,96 | 0,89 | 0,91 | 0,94 | 0,89 | APPROVE |
| C — koordynator | 0,93 | 0,85 | 0,83 | 0,90 | 0,83 | APPROVE |
| D — UI i routing | 0,94 | 0,82 | 0,81 | 0,87 | 0,81 | APPROVE |

Pierwszy, zbyt szeroki brief został odrzucony przy minimum 0,74. Zakres rozbito na cztery spójne części. Nie implementowano odrzuconego wariantu.

## Testy

`npm run qa:static` przeszedł:

- recovery inventory: PASS;
- TypeScript: PASS;
- testy: 944/944 PASS;
- content boundary: PASS;
- runtime privacy boundary: PASS.

Testy obejmują generator T4/C3/S12, arytmetykę kalendarzową i DST, dokładne filtrowanie powtórek, pełną tożsamość propozycji, CAS z wyścigiem reentrant, routing, stany UI, tłumaczenia EN/PL oraz skalowanie tekstu do 200%. `git diff --check` wykonano przed commitem.

## Niezależne QA

- Część domenowa i aplikacyjna: PASS. Brak znalezisk P0–P2.
- Potwierdzono jeden koordynator, jeden store in-memory, jedno `now()` na generowanie, pełny package pin, głęboką niemutowalność i brak regeneracji w `resolve`.
- Kontrola UI: PASS. Brak znalezisk P0–P2.

## Retest iOS

- iOS 26.4, symulator `Patternly_QA_Guest_20260908`.
- Light theme, EN, standardowy tekst, aktualny lokalny build.
- Maestro przeszedł Progress → istniejący cel → „Create plan” → propozycja ready.
- Potwierdzono harmonogram 3 dni, 18:00, 10 pytań, zakres pakietu, jawny brak reguły C3 oraz otwarty target bez daty.
- Obejrzano dwa pełne zrzuty. Nie stwierdzono ucięć, nakładania treści ani nieprawdziwych akcji.

Pierwszy przebieg został odrzucony, ponieważ nakładka debuggera przechwyciła nawigację. Drugi został odrzucony wyłącznie przez niedozwoloną absolutną ścieżkę `takeScreenshot`. Po poprawie przebieg produktu przeszedł w całości.

## Ryzyka i ograniczenia

- Propozycja celowo znika po restarcie procesu. Ekran pokazuje wtedy stale i wymaga jawnej aktualizacji.
- Trwała edycja i akceptacja planu pozostają zakresem ODK-E2E-029.
- Nie wymuszano wszystkich stanów błędów na urządzeniu. Ich kontrakt sprawdzają testy.
- VoiceOver pominięto zgodnie z decyzją właściciela.
