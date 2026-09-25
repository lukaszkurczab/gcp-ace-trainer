# RELEASE-CONTRACT/B — tożsamość wydania i evidence

**Status:** `done`  
**QA:** `PASS WITH ISSUES`  
**Zakres:** kontrakt lokalny i hosted workflow; bez rzeczywistego builda, FREEZE, GO, publikacji i wdrożenia

## Wynik

Istniejący manifest został rozszerzony do `patternly-release-manifest-v2`.
Jeden `manifestId` obejmuje teraz:

- dokładne commity aplikacji, backendu, contentu i webu;
- hashe app release locka, OpenAPI, candidate manifestu i readiness, wraz z
  istniejącą walidacją owning content locków;
- dokładną tożsamość iOS builda: EAS/build ID, app version, build number i
  bundle identifier;
- SHA-256 kanonicznego, zamkniętego widoku niesekretnej konfiguracji
  produkcyjnej;
- ID oraz SHA-256 koperty `signing-and-builds`.

`signing-and-builds` pozostaje istniejącym rodzajem evidence. Dla tego jednego
rodzaju schema v2 wymaga teraz `releaseBinding`. Wspólny walidator jest używany
zarówno przez manifest, jak i release gate. Nie powstał drugi manifest ani
równoległy format dowodów.

Hosted workflow wymaga jawnego `signing_evidence_json`, zapisuje go poza
checkoutami i przekazuje ten sam katalog do create, verify i release gate.
Brak rzeczywistej koperty powoduje FAIL; kod nie generuje zastępczego build ID.

## Kontrakt konfiguracji

Allowlista obejmuje wyłącznie publiczne właściwości potrzebne do identyfikacji
uruchamianego wariantu: API/auth/web origins, Apple App Check provider, kanał,
środowisko, Firebase project ID, associated domain, runtime mode/version i URL
Expo Updates. Dodatkowe pole, w tym klucz API, jest odrzucane. Profil musi być
`release` / `production` / `production`, a publiczne origins i update URL muszą
używać HTTPS.

## Weryfikacja

- Briefing: zgodność 0,95; prostota 0,84; ryzyko 0,82;
  utrzymywalność 0,87; minimum 0,82 — APPROVE.
- Release gate + manifest + workflow contract: 37/37 PASS.
- Negatywne przypadki: zmiana build ID, konfiguracji, hasha evidence,
  dodatkowe pole sekretu, czterech SHA i kontraktowych referencji — FAIL.
- Typecheck, recovery inventory, schema JSON i `git diff --check` — PASS.
- Pełne `qa:static` z wymaganymi historycznym/current content roots: 1254/1254
  PASS oraz oba boundary checks PASS. Pierwsze uruchomienie bez tych wymaganych
  zmiennych dało 3/1254 FAIL wyłącznie w cross-repo content contract; prawidłowy
  przebieg z przypiętymi `cc3efca…` i `21707b6…` przeszedł w całości.
- Niezależny QA: `PASS WITH ISSUES`; targeted 37/37 i diff check PASS.

## Granice

B ustanawia kontrakt, ale nie twierdzi, że istnieje rzeczywisty podpisany build
iOS. Taka koperta ma powstać dopiero dla kandydata i jest wymagana przed FREEZE.
Samohashowana koperta chroni integralność po związaniu z manifestem, ale samo
tekstowe `verifiedBy` nie poświadcza pochodzenia z EAS ani osoby weryfikującej;
wiarygodność rzeczywistego dowodu musi zostać potwierdzona przed FREEZE.
Polityka OTA i identyfikacja faktycznie uruchomionego update'u pozostają zakresem
RELEASE-CONTRACT/C.
