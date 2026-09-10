# Patternly — kanoniczny prompt implementacyjny 2026-09-10

Status: `planned`. To jest jedyny entrypoint następnej pętli; nie jest dowodem wdrożenia. Ocena: objective/architecture fit `0.95`, simplicity `0.90`, risk `0.82`, maintainability `0.92`; wynik `0.82`.

```text
Jesteś kontrolerem implementacji całego workspace Patternly. Rozpocznij od ACC-01 i przechodź dalej wyłącznie po spełnieniu gate’u bieżącego taska. Nie implementuj wielu tasków naraz. Przed każdą zmianą przeczytaj AGENTS.md właściwego repozytorium, sprawdź branch/upstream/status/diff, ustal właściciela istniejących zmian i zachowaj cudzą pracę. Nie force-pushuj, nie fałszuj akceptacji ani provider evidence, nie zapisuj w repo prywatnego adresu, telefonu, e-maila, sekretów lub danych sklepowych wymagających ochrony.

Kanoniczne dokumenty:
- patternly-content/docs/planning/CONTENT-ACCEPTANCE-DECISION-PACKET.md — decyzja PO i ACC-01/ACC-02;
- patternly-content/docs/planning/PATTERNLY-CONTENT-SIMPLIFICATION-PLAN.md — SIMP-01–05;
- patternly-content/docs/planning/EPIC-09-MODEL-BASED-EVALUATION-DRAFT.md — 09-A–H, dopiero po SIMP-05;
- patternly/docs/qa/ios-backend/E2E-OBSERVACJE-ROBOCZE.md — ODK-E2E-082–129, w tym pełne pakiety 114 i 120–129;
- docs/APP-CHECK-DECISION-AND-DELIVERY-PLAN.md oraz patternly-backend/docs/decision-register.md — App Check i granica public web/local admin;
- docs/launch-completion-plan.md oraz PO-DECISIONS-HANDOFF.md — decyzje release i zależności. Jeśli dokument bazowy przeczy bieżącemu kodowi, traktuj kod jako stan aktualny, a decyzję/plan jako target; nie oznaczaj targetu done bez evidence.

Pierwszy task — ACC-01 w patternly-content:
Cel: zbudować deterministyczny baseline akceptacji dokładnie dziewięciu banków przed naprawą ODK-E2E-099. Powiąż decyzję Product Ownera z 10 września 2026 z exact sourceManifestSha256 i itemManifestSha256, nie z przypadkowym całym commitem narzędziowym i nie z agentem jako approverem.
Zakres: osiem historycznie zaakceptowanych banków plus Claude (300 itemów); reprodukcja hashy, countów i provenance; mały wersjonowany manifest wejściowy ACC-02; potwierdzenie, że item IDs i treść wcześniejszych ośmiu banków nie zmieniły się względem zaakceptowanego baseline’u.
Poza zakresem: edycja pytań, readiness/admission, publikacja release, SIMP-01, schema migration, model evaluation, masowy review i automatyczne przepisanie akceptacji na nowszy commit.
AC: dokładnie 9 unikalnych trackId; reprodukowalne source/item hashes i provenance; drugi run daje identyczne bajty; zero nieudokumentowanych zmian identity/content; rekord rozdziela decyzję PO od technicznego authoring status. Każda rozbieżność jest blocking i zatrzymuje task.
Verification/evidence: najwęższe testy manifestów/approval potrzebne do baseline’u, dwukrotne deterministyczne wyliczenie oraz tabela track→source hash→item hash→item count→source commit. Nie naprawiaj jeszcze czerwonych testów ODK-E2E-099. Raport zapisz w istniejącym kanonicznym katalogu reports/planning.

Kolejność po ACC-01:
1. ACC-02 / ODK-E2E-099 — jeden spójny kandydat dziewięciu banków w readiness, review packets, human approval evidence, runtime/publishing admission i immutable artifacts; napraw znane czerwone testy bez osłabiania asercji.
2. SIMP-01 → 02 → 03 → 04 → 05 — jeden schema i mentalUnitId, wspólny builder z izolacją tracka, mechaniczna migracja 9 banków z exact IDs/content/counts, prosty konsument aplikacji, migracja zapisanych identity i usunięcie zastąpionych family schemas/aliasów/adapterów. Jednorazowy konwerter nie zostaje runtime dependency.
3. Dopiero po SIMP-05: EPIC-09 09-A → B → C → D → E → F → G → H. Evaluator czyta tylko kanoniczny schema, nie zatwierdza i nie publikuje treści.
4. App audit ODK-E2E-120 → 121 → 122 → 123 → 124 → 125 → 126 → 127 → 128 → 129, pojedynczymi zmianami według pełnych pakietów. Najpierw odtwórz brakujące screenshot evidence 121/124. ODK-120 zachowuje guest flow; 123 zmienia capability/config/runtime, nie tylko UI; 127 nie tworzy URL fallbacku; 129 najpierw rozstrzyga invariant abandoned records.
5. ODK-E2E-114 recovery: jeden zaakceptowany ekran z Patternly, dokument+lock, Try again, HoldToConfirm 3 s, spinner, success/error na tej samej powierzchni; bez modala, bottom sheetu i nowej trasy.
6. APPCHK-01 → 02 → 03 → 04, następnie provider evidence ODK-E2E-084 dopiero po freeze. Chronione mobile requests fail-closed; Firebase auth i recent re-auth osobno; public web marketing-only bez mobile App Check; local loopback admin wymaga auth/admin authorization, nie App Check.
7. ODK-E2E-118 → 119, następnie 116 → 117 → 082 → 083 → 084 → 085 → 086 → 087 → 088 → 099 zgodnie z release planem i rzeczywistymi zależnościami; nie powtarzaj już zamkniętego zakresu ACC-02 w 099, tylko wykorzystaj jego evidence przy finalnym gate.

Stałe decyzje produktu/release:
- osoba fizyczna bez działalności na start; Polska + EOG;
- pytania/wyjaśnienia po angielsku; produkt, sprzedaż i legal w pl/en/de/fr/es/it/et;
- jedna auto-renew subskrypcja 29,99 PLN/miesiąc, bez triala i fixed 30/90; ceny lokalne wyznaczają App Store/Google Play z ręcznym review tylko outlierów;
- support email best effort bez SLA, ~5 dni wyłącznie orientacyjnie; 18+;
- konsultacja prawna/księgowa jest deferred, nie release gate;
- profesjonalna domena i prawdziwe publiczne e-maile blokują release, nie development; provider poczty deferred; trader/compliance/banking/tax store requirements nadal blokują release;
- RevenueCat jest source of truth. Store grace 3 dni konfiguruje każdy sklep, ale aplikacja nie dodaje dni. Offline działa tylko do ostatniej expiry date potwierdzonej przez RevenueCat; grace obowiązuje offline tylko po wcześniejszym potwierdzeniu; reconnect wygrywa; clock rollback wymaga online; ryzyko refund/revocation podczas pełnego offline pozostaje jawnie zaakceptowane.

Dla każdego taska przed kodem zapisz Cel, Ustalenia i Podejście, oceń objective/architecture fit, simplicity, risk i maintainability 0–1; minimum poniżej 0.8 wymaga redesignu. Każdy task musi mieć goal, scope, non-goals, inputs, AC, verification, required evidence, risks, report target i stop conditions. Zgodnie z AGENTS.md uzyskaj przed implementacją niezależną walidację Luna/max briefu zawierającego dokładnie sekcje Cel/Ustalenia/Podejście; po implementacji użyj niezależnego QA, które sprawdzi kod i powtórzy krytyczne asercje. Raportuj dokładny model/effort wymagany przez repo.

Zatrzymaj się bez zgadywania, gdy: exact hash/identity/URL nie zgadza się z evidence; potrzebna jest nowa decyzja PO; implementacja wymaga prywatnych danych/sekretów; provider/device evidence jest niedostępne do zamknięcia; upstream zmienił się i integracja wymaga konfliktowego merge/rebase; proponowana kompatybilność utrwala legacy; albo test ujawnia szerszy kontrakt poza zakresem. Po każdym zamkniętym tasku usuń go z aktywnej kolejki tylko przy kompletnym raporcie, zacommituj wyłącznie zweryfikowany zakres we właściwym repo, push bez force i ponownie sprawdź status/upstream przed przejściem dalej.
```
