# PLAN-SYNC/B2 — kontrakty, evidence i pozostałe ustalenia

**Data:** 24.09.2026
**Status:** `done` dla zakresu dokumentacyjnego B2; całe PLAN-SYNC pozostaje `partial`.
**Model:** implementacja dokumentacji `gpt-6-luna` medium; niezależna walidacja briefingu `gpt-6-luna` high, minimum 0,82 (zgodność 0,92; prostota 0,86; ryzyko 0,82; utrzymywalność 0,90).

## Wynik

B2 wpisał do jedynego kanonicznego planu sprawdzone statusy, jawne unknowns oraz właścicieli dalszych ustaleń. Nie odtworzono brakujących pakietów z domysłów, nie przypisano statusu historycznego PASS i nie zmieniono produktu. Całe PLAN-SYNC nie jest zakończone: AWS-02 musi uzgodnić kandydacki kontrakt approval/readiness, a dowód SIMP-05 nadal nie istnieje w zebranych materiałach.

## Ustalenia i evidence

| Obszar | Evidence z repo | Status / dalszy właściciel |
| --- | --- | --- |
| Runtime i SIMP-05 | `patternly/src/content/canonical/runtimeCatalog.ts:1-17` importuje dziewięć wygenerowanych artefaktów i `content-lock.json`. `patternly-content/README.md:27-31,39-50` opisuje pojedyncze authoring ingress, build-time artifact bytes i SIMP-02/03. `patternly-content/docs/planning/SIMP-03-ACCEPTANCE-PACKET.md:3,27` oraz `SIMP-03-MAPPING-MATRIX.md:24` wiążą usunięcie legacy z SIMP-05; pakietu ani raportu SIMP-05 nie odnaleziono. | `unknown / needs evidence`. Nie dowodzi to ani ukończenia, ani aktywnego legacy w całym runtime. W SIMP-05 follow-up: sprawdzić wszystkie aktywne consumers/adapters oraz znaleźć historyczny raport; jeśli go brak, opisać tylko udowodnioną lukę i ograniczony zakres. Do czasu dowodu SIM-READY zależne od stanu runtime nie jest potwierdzone. |
| Candidate approval / readiness | `patternly-content/scripts/review/candidate-manifest.mjs:108-120` wymaga i wiąże `humanApproval` z `evidence/human-content-approvals/manifest.json`. Oddzielny `content-approval.mjs:17-31` waliduje agent-review record, a `:45-71` waliduje human-owner approval. | Nierozstrzygnięta sprzeczność między delegacją DEC-23-CONTENT a konsumentem readiness. Właściciel AWS-02: ustalić właściwy dowód delegowanej decyzji dla exact manifestu i przeprowadzić zmianę konsumentów dopiero po osobnym QA. Nie fałszować human approval ani nie usuwać walidatora w B2. |
| AUD-02 | `patternly/docs/active/AUD-02/REPORT.md:55-57` wskazuje pozostałe formularze sterownika/RC, przypięcie builda do source SHA oraz oddzielny AWS-02 candidate gate. | `partial`. Kontynuować tylko lokalny driver-form i RC flow na izolowanym fixture; exact candidate/admission należy do AWS-02. Nie wymaga FREEZE ani realnego sklepu. |
| ODK-082–087 | `patternly/docs/active/PLAN-SYNC/A-REPORT.md:34` nie znajduje packetów mapujących każde ID; istniejąca informacja wiąże ODK-085 z ODK-119-PROVIDER. | Pozostałe ID `unknown / needs evidence`. Przed wykonaniem odnaleźć właściwe kontrakty i przypisać wejścia, dowody, zależności i ownera operacyjnego; nie wymyślać provider/operation mapping. ODK-085 zachowuje wspólny evidence z ODK-119-PROVIDER. |
| ODK-116-A / PO values | `patternly/app.config.js:1-16,74-118,161-177` pokazuje istniejące public env names, runtime mode, Firebase file keys oraz walidację pól obu platform; m.in. konfiguracja wywołuje obie ścieżki plików niezależnie od `EAS_BUILD_PLATFORM` (`:106-107`). | ODK-116-A może zinwentaryzować techniczne pola i walidację; prawdziwe PO values nie są dostępne, a brak `ODK-116-INPUTS-PACKET.md` jest odnotowany w A. Nie wpisywać wartości ani sekretów. Techniczne SKU/platform IDs należą do Codex; dane właściciela do PO-116, gdy zostaną dostarczone. |
| PO-ACCESS | `patternly/docs/active/PLAN-SYNC/A-REPORT.md:37` nie stwierdza konkretnego brakującego uprawnienia. | Brak globalnej blokady. Zgłosić do PO-ACCESS wyłącznie konkretną czynność, którą Codex nie może wykonać w ramach dostępnych uprawnień. |
| CI-CONTRACT/A inputs | Raportowane bieżące wejścia: content CI przy HEAD `4e5d59f` kończy się `Missing script: authoring:validate`; app QA przy `9f1be94a` pobiera historyczny producer SHA z `release.lock`; jego tree nie ma `scripts/build.mjs`, choć test oczekuje bieżącego buildera. Checkout path jest poprawna. Recovery prebuild nie ma `PATTERNLY_RUNTIME_MODE`. | `CI-CONTRACT/A` ma READY. Uzgodnić scripts/workflow, źródło dokładnego SHA bieżącego buildera oraz prebuild environment. To failures-to-fix, nie zielony CI evidence; workflow nie zmieniano. |

## Planowa zmiana

`PATTERNLY-WORKING-PLAN.md` pozostaje jedynym źródłem kolejki. B2 zamknięto jako dokumentację, bo każdy nieustalony kontrakt ma teraz jawny stan, konkretny follow-up i granicę zakresu. Globalny PLAN-SYNC pozostał `partial`, gdyż wymagane decyzje AWS-02/SIMP-05 nadal nie mają dowodu. Najbliższą kolejką są `CI-CONTRACT/A`, potem `AUD-FIXTURE/A`; po nich wrócić do AWS-02 i SIMP-05 zgodnie z zależnościami.

## Kryteria akceptacji i non-goals

- Każdy badany kontrakt ma evidence albo jawny `unknown / needs evidence`, następnego ownera i wąskie zadanie weryfikacyjne.
- ODK-082–087 nie otrzymały spekulatywnych przypisań. ODK-085/ODK-119-PROVIDER zachowują wspólny dowód.
- Znana rozbieżność delegowanej decyzji i human approval została udokumentowana i skierowana do AWS-02; historyczne approval pozostają nienaruszone.
- Brakujące dokumenty historyczne nie zostały odtworzone jako fałszywe dowody.
- Non-goals: zmiany kodu lub workflow, edycja kontraktu approval, migracja contentu, uzupełnianie danych PO, uruchamianie providerów, zmiana bramek release.

## Weryfikacja i ryzyko

Weryfikacja: link checker sprawdził 29 lokalnych celów Markdown w obu plikach, `missing=0`; `git diff --check` w repo aplikacji: PASS. Niezależny QA (`gpt-6-luna` high): PASS WITH GAPS — zakres dokumentacyjny spełniony, AWS-02/SIMP-05 pozostają otwarte. Nie uruchamiano testów ani CI, ponieważ zmieniono wyłącznie dokumentację, a opisane CI failures są wejściami do CI-CONTRACT/A.

Ryzyko: pozostają aktywne, międzyrepozytoryjne rozjazdy kontraktów. Status B2 nie stanowi zgody na implementację konsumenta candidate/readiness ani dowodu ukończenia SIMP-05. Nie oznacza też, że ODK-116-A jest już wykonane.

## Następne kroki

1. `CI-CONTRACT/A`: uzgodnić brakujące komendy content CI, historyczny vs bieżący producer SHA w app QA i wymagany recovery prebuild environment.
2. `AUD-FIXTURE/A`: zapewnić izolację fixture dla pozostałego lokalnego AUD-02 i pełnych flow.
3. AWS-02: ustalić dowód i kontrakt readiness dla decyzji Codex na exact content candidate, a następnie wykonać osobny QA.
4. SIMP-05: odszukać raport lub zbadać pełny aktualny consumer graph; zapisać dowód albo ograniczony brakujący zakres przed SIM-READY.
5. ODK-082–087: przed provider execution przypisać każde ID do istniejącego pakietu albo oznaczyć konkretny brak kontraktu; nie tworzyć równoległych bramek.
