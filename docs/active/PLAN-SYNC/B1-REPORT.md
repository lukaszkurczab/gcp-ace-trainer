# PLAN-SYNC/B1 — trwałe odnośniki do planu

**Data:** 24.09.2026

**Status:** `done` dla B1; całe PLAN-SYNC pozostaje `partial`.

**Model:** implementacja `gpt-6-luna` medium; niezależna ocena briefingu `gpt-6-luna` high: zgodność 0,95; prostota 0,95; ryzyko 0,84; utrzymywalność 0,94; minimum 0,84.

## Zmiana

Cztery aktywne referencje w backendzie, contentcie (2) i webie prowadzą do [bieżącego planu w repo aplikacji](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/main/docs/PATTERNLY-WORKING-PLAN.md). Adres `main` jest ruchomym wejściem do aktualnej kolejki; historyczne raporty i ich SHA pozostają dowodem przypiętym do czasu wykonania. Nie zmieniono kodu produktu ani statusów tych pakietów.

## Weryfikacja

- Publiczny URL planu odpowiedział HTTP 200.
- W czterech dotkniętych plikach nie ma starej aktywnej ścieżki root; każdy zawiera jeden właściwy link.
- `git diff --check` w backendzie, contentcie i webie: PASS; diff ograniczony do czterech linii dokumentacji.
- Niezależny QA (`gpt-6-luna` high): **PASS**; potwierdził cztery zmiany linków, HTTP 200, spójność planu i raportu oraz brak zmian kodu. Testy runtime nie były potrzebne.

## Pozostałe

`PLAN-SYNC/B2` ustala brakujące pakiety, SIMP-05, mapę ODK-082–087, kontrakt delegowanej decyzji contentu, rozdział AUD-02/AWS-02 i pola ODK-116. Żaden z tych kontraktów nie jest zamknięty przez poprawę linków. Następny raport: `patternly/docs/active/PLAN-SYNC/B2-REPORT.md`.
