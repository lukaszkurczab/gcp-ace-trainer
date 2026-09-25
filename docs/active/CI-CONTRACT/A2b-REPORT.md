# CI-CONTRACT/A2b — aktualne bramki candidate i manual release

**Status:** `done`  
**Content commit:** [`21707b6`](https://github.com/lukaszkurczab/patternly-content/commit/21707b6)  
**Zakres:** lokalne CI; bez admission, publikacji i wdrożenia

## Wynik

- Push/PR odtwarza exact candidate draft oraz readiness v2 i wymaga braku
  różnic wobec wersjonowanych evidence.
- Delegowana decyzja Codex jest bieżącym review evidence; historyczne review
  packets, approval i admission nie są ponownie używane.
- Dziewięć skonfigurowanych Free-node packages przechodzi rzeczywistą kontrolę
  schema, limitów, kompresji, exact package SHA i zgodności każdego elementu z
  zaakceptowanym release artifactem.
- Manualny workflow odtwarza te same dowody i kończy się jawnym
  `RELEASE_BLOCKED` dla exact candidate, ponieważ publishing/runtime admission
  pozostają `not_granted`. Nie ma kroku deploy.
- App release lock pozostaje nietknięty; przyszła ścieżka `RELEASE_READY`
  należy do `AWS-02/ADMISSION`.

## QA i weryfikacja

- Briefing: 0,94 / 0,86 / 0,91 / 0,85; minimum 0,85 — APPROVE.
- Pierwsze QA: FAIL — samoopisane hashe pozwalały zmienić payload, a
  dekompresja nie miała limitu.
- Drugie QA: FAIL — deklarowany cross-repo `sourceLock` nie był weryfikowany.
- Naprawa: ścisły acceptance v2 `delegated_codex`, exact package/source
  bindings, porównanie itemów z release artifactem oraz limity 2 MiB / 1 MiB /
  4 MiB z `maxOutputLength`; bez fałszywego app-lock pinning.
- Finalne niezależne QA: **PASS**.
- Testy: pełny content 67/67; release-gate 4/4; Free-node 9/9; migration
  9 tracków / 117 nodes / 943 mental units / 16 077 pytań; build/scoring 9/9;
  oba workflow parsują się jako YAML; diff check PASS.
- Manual gate: oczekiwany kod 1 i `RELEASE_BLOCKED` dla candidate `11d56baa…`.

