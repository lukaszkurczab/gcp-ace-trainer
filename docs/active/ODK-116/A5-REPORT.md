# ODK-116/A5 — lokalne środowisko testowe

**Data:** 24.09.2026

**Status:** done dla technicznego środowiska testowego; wydanie z prawdziwymi danymi pozostaje ODK-116-B.

**QA:** PASS WITH ISSUES.

## Odbiór

- Lokalny profil `test` przechodzi kontrolę zmiennych prawnych. Aplikacyjne testy schemy, konfiguracji, eksportera i readiness przeszły 41/41.
- Backend `/ready` zgłosił bazę, uwierzytelnianie i providerReader jako gotowe; Metro działało. Web przeszedł 4/4 testy kontraktu oraz `verify:local` z tymczasowym artefaktem wygenerowanym przez aplikację. Build publikacyjny odmawia artefaktu `testOnly`.
- Maestro na jedynym istniejącym iPhonie 17 zakończyło flow restartu Gościa kodem 0: `content:ready` przed i po restarcie oraz akcja Home. Zachowano stan urządzenia. [Pakiet zrzutu i manifest](../../../artifacts/maestro-screen-capture/odk-116-a5/2026-09-24-1857/screenshot-manifest.md) jest dowodem tego ograniczonego stanu.
- Produkcyjna walidacja nadal odrzuca nieuzupełniony kanoniczny rekord. To oczekiwane do ODK-116-B/PO-116.

## Granice dowodu

Zainstalowanego buildu symulatora nie powiązano z SHA aktualnego źródła. Maestro nie sprawdzało tożsamości Gościa, ciągłości jego danych, logowania ani sesji nauki; te scenariusze należą do PROFILE i AUD. Na zrzucie widoczny jest komunikat debuggera Metro, więc nie jest to werdykt jakości UI. Nie wykonano deployu, publikacyjnego buildu z danymi PO ani ręcznego Androida.

**Ocena zakresu:** cel i architektura 0,95; prostota 0,90; ryzyko 0,85; utrzymywalność 0,92; minimum **0,85**.
