# CI-CONTRACT/A1 — jawny profil dla clean prebuild w app QA

**Data:** 24.09.2026

**Status:** `done` dla A1 po lokalnej weryfikacji, QA i hosted PASS naprawionego kroku; cały `CI-CONTRACT` pozostaje `partial`.

**Walidacja podejścia:** `gpt-6-luna` high, zgodność 0,96; prostota 0,94; ryzyko 0,90; utrzymywalność 0,93; minimum 0,90. Implementacja: `gpt-6-luna` medium.

## Przyczyna i zmiana

App QA run [35970716778](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/35970716778) zatrzymał clean prebuild na braku `PATTERNLY_RUNTIME_MODE`. `app.config.js` wymaga zgodnej pary trybów, a smoke wymaga jawnego E2E i loopback API/Auth. Krok `.github/workflows/qa.yml` ustawia te pięć wartości wyłącznie na czas testu wygenerowanej konfiguracji native. Zachowano czyste archiwum, `expo prebuild` i wszystkie kontrole iOS/Android. Adresy loopback są testowe; krok nie łączy się z emulatorami ani nie zastępuje realnego App Check.

## Weryfikacja

- YAML workflow parsuje się, a w kroku są wszystkie wymagane zmienne.
- `scripts/buildRuntimeConfiguration.test.ts` PASS 8/8, w tym brak trybu i niezgodny tryb jako FAIL.
- Clean `git archive HEAD` + `expo prebuild --no-install --clean` z jawnym profilem smoke i dotychczasowymi kontrolami native: PASS lokalnie.
- `git diff --check`: PASS.
- Niezależny QA (`gpt-6-luna` high): PASS WITH GAPS — zakres smoke pozostaje w jednym kroku, native assertions i release config bez zmian. Lokalny pełny prebuild wykonano przed korektą portu Auth z `9099` na kanoniczne `19099`; ponowna walidacja konfiguracji z `19099` oraz testy runtime 8/8 przeszły. Hosted CI: w runie [35972213538](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/35972213538) naprawiony krok clean prebuild ma **PASS**. Cały QA run ma **FAIL** z powodu osobnego testu historycznego content SHA/current builder; A1 nie rozstrzyga tego błędu.

## Granice i następny task

Pełny app QA nadal może failować w osobnym jobie: test bieżącego buildera czyta historyczny content SHA z `release.lock` bez `scripts/build.mjs`. Content workflow ma też nieistniejące skrypty. A1 nie zmienia SHA ani innych gate’ów. `CI-CONTRACT/A2` naprawia kontrakt komend contentu; A3 rozstrzyga exact SHA bieżącego buildera. Wyniku lokalnego clean prebuild nie nazywać PASS całego CI.
