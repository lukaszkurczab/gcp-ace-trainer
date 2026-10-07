# Patternly — główny plan roboczy

Aktualizacja: 07.10.2026. Zakres: aplikacja, backend, content i web. To jedyna kolejka pozostałej pracy. [Stan wykonania](../.agent/WORKING_STATE.md) zawiera ostatnią weryfikację i następny krok; dokumenty szczegółowe zawierają zakres i kryteria, bez niezależnych statusów.

Cel: pełny lokalny odbiór wymaganych funkcji i jakości, następnie osobno przygotowanie oraz autoryzowane wydanie dokładnego kandydata iOS. Android ma późniejszą ręczną macierz. Nie ma realnych użytkowników ani danych produkcyjnych; zgodność wsteczna lokalnych buildów nie jest wymaganiem.

## Stan i decyzje, których nie planujemy ponownie

- Jeden bieżący Gość; izolacja Guest/A/B, adoption transfer/discard, logout offline, powrót do konta i account deletion mają wdrożone ścieżki. Nie dodawać selektora historycznych Gości.
- Dziewięć tracków ma kanoniczny format, candidate/admission i app lock. OOD24 i Claude `ccarp-2026.10.07` są bieżącą treścią. Obsługa choice_multiple z błędną opcją została poprawiona; nie przywracać FCA-SCORE-01 z historycznego audytu.
- BIZQ-01 pakiety do 33 oraz selektywne usunięcie oryginalnego Gościa 34 są wdrożone. Operacja34 zachowała dziewięć kont; nowy Gość został utworzony. Niedokończony eksperyment Q13 nie ustanowił native acceptance. Katalog został przywrócony do24.
- CH-01–05 są zakończone. Usunięcie ich raportów nie przywraca tych zadań. Dawne audyty CH/PERSIST/PERF/ARCH/SEC i content skonfrontowano z obecnym źródłem; konkretne pozostające zakresy są poniżej.
- Cel i accepted plan stanowią jedną atomową parę per track. Konflikt rozstrzyga użytkownik przy bezpiecznym wejściu, bez przerywania sesji; reminders pozostają lokalne na urządzeniu i dotyczą bieżącego tracka.
- Target date oznacza wydarzenie, termin albo checkpoint zależnie od celu; own pace nie ma daty. CompletionRules należą do wersjonowanego pakietu: liczba prób i próg ruchomego okna, bez obowiązku trafienia każdego unikalnego pytania. Brak reguły oznacza unknown; shortfall musi być jawny.
- Exam, Coding Mock Interview i cała rodzina Design Interview wymagają potwierdzonego Premium. Free może pokazywać zablokowaną ofertę/paywall. Design nie korzysta z darmowego node. Synthetic entitlement dowodzi bramki aplikacji, nie zakupu.
- Dla partial wynik overall pozostaje zero, a summary jawnie wskazuje partly correct (decyzja05.10). Nie zmieniać scoringu przez copy.
- Nawigacja16pt, subtelny pionowy akcent wybranego tracka; osobne godziny reminders włącza checkbox z widocznymi dniami. Your data pokazuje rzeczywisty stan sesji, osobne wiersze RODO/recovery i potwierdzony zakres resetu; eksport to Share or download. Legal information używa lokalnych dokumentów, zewnętrzny link tylko Support.
- Lokalny iOS używa istniejącego iPhone17. Semantyka accessibility jest wymagana; testy VoiceOver są wyłączone decyzją właściciela i nie stanowią bramki. Real provider, physical device, legal i publikacja mają osobne wymagania.

## Aktywna kolejka lokalna

Priorytetem pozostaje pełny odbiór BIZQ-01..06. Utrzymywać jeden główny obszar; zmieniać go tylko dla konkretnej zależności, kolizji, decyzji PO lub polecenia. Push sam nie jest odbiorem. Statusy niżej są jedynymi obowiązującymi statusami zadań.

| Zadanie | Status | Pozostały wynik i zależności |
| --- | --- | --- |
| [BIZQ-01 — jakość i feedback](specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md) | partial — pierwsze | Rzeczywiste Q13: wznowienie sesji na dokładnym pakiecie po zmianie katalogu, jawny mismatch i zachowanie wymaganych danych. Najpierw potwierdzić dostępność obecnego runtime i najmniejszą odtwarzalną metodę; poprzednie próby kończyły się przed sesją. Nie wznawiać starego guarded narzędzia bez jego prywatnego manifestu. Utrzymanie pozostałych banków jest odroczone, nie zamknięte. Brak pomiaru efficacy. |
| [BIZQ-02 — postęp i plan](specs/business-quality/02-BIZQ-02-POSTEP-I-INTEGRACJA-PLANU.md) | partial | Istnieją source→projection→Home/proposal/forecast, rolling-quality, freshness guards i Progress. Domknąć P01–P20: identity/offline/restart, stale acceptance, submit→Home→proposal→restart, konflikt przy active session, reminders i Premium; rozróżnić prawdziwe completionRules od synthetic policy. Brak reguł nie blokuje honest unknown. |
| [BIZQ-04 — remediation i utrwalanie](specs/business-quality/04-BIZQ-04-REMEDIACJA-I-UTRWALANIE.md) | partial | Answer-time qualification, due_queue i fail-closed session_misses istnieją. Po decyzji interwału pierwszego sukcesu domknąć wspólną family/mode policy, qualified-success, revision/idempotency/sync, selector i R01–R21; rzeczywista oś błąd→korekta→due1→too early→due2→maintenance→późniejszy błąd. Kontekst completed session musi być verified; współpraca ARCH-01/02. |
| [BIZQ-05 — diagnoza i transfer](specs/business-quality/05-BIZQ-05-DIAGNOZA-I-TRANSFER.md) | planned | GCP KnowledgeCheck40/N01 jest ograniczoną próbką. Najmniejszy pakiet: verified result→pinned sample breakdown→prawdziwa rekomendowana sesja. Następnie mapping/pool readiness9 tracków, rzeczywisty blueprint/scope, ekspozycja, transfer, D01–D20 i protokół pomiaru bez wymyślonych wyników. Zależności01/02/04 i ARCH-02/05/06. |
| [BIZQ-03 — plan adaptacyjny](specs/business-quality/03-BIZQ-03-ADAPTACYJNY-PLAN-NAUKI.md) | planned | Po decyzji recurring mode i wynikach01/02/04/05: verified terminal evidence→family recommendation, potem jawny scope/minuty/koszt/uncertainty/review/calendar/shortfall, legalne mode lengths, atomic acceptance i A01–A24. Obecna propozycja liczy wolumen; GCP modes[0] powtarza diagnostic40. Nie uznawać proponowanych liczb za defaults. |
| [BIZQ-06 — demo web](specs/business-quality/06-BIZQ-06-DEMO-I-KONWERSJA-WEB.md) | partial | Dwa kanoniczne Free przykłady Coding/AWS, feedback/Details/reset/unavailable istnieją. Po wskazaniu zatwierdzonego destination: rzeczywisty page-specific CTA, W01–W18 i brakujący theme/large-text zakres. Nie dodawać trzeciego Design preview bez właściwego scope ani claimów skuteczności. Publikacja osobno. |
| [AUD-08-B2/B4 — recovery/reissue](specs/engineering/recovery-reissue.md) | partial | Retencja30dni wdrożona lokalnie. Domknąć właściwe operacje recovery/reissue i macierz awarii z trwałą tożsamością próby/generation: before/after effect, lost response, restart, reissue, deletion/revoke, concurrency i log redaction. Niepewny SMTP pozostaje wewnętrznie AMBIGUOUS bez auto-retry; neutralne UI i jawne Wyślij ponownie tworzy nową próbę. Polityka rodziny SMTP wymaga decyzji PO. Cloud index/TTL application osobno. |
| [AUD-06 — przekrojowy odbiór](specs/engineering/local-acceptance.md) | partial | Po wymaganych lokalnych zadaniach: cztery repo, dziewięć tracków, siedem locale, krytyczne flows i bramki. Ustanowić SIM-READY z jawną listą zakresu pozostawionego providerom i fizycznemu urządzeniu; obecnie SIM-READY nieustanowione. |
| Android sandbox login | partial | Email/password odebrane na Redmi Note11. Korekta loading/signOutPending jest w źródle, wymaga bieżącego build/update. Nie ustanawia Apple/Google/provider matrix ani release. |

## Decyzje właściciela wymagane do konkretnych zadań

| Decyzja | Konsekwencja |
| --- | --- |
| CompletionRules prawdziwych pakietów | Potrzebne dla twierdzenia o ukończeniu; integracja może zachować unknown bez domyślnego20/10/.8. |
| BIZQ-03 recurring mode | Wybrać diagnostic raz→practice lub practice od początku. Nie utrwalać powtarzanej diagnozy jako planu. |
| BIZQ-04 pierwszy sukces | Potwierdzić dodatni interwał. 7dni pozostaje propozycją, nie zatwierdzonym defaultem. |
| BIZQ-06 CTA | Wskazać istniejące zatwierdzone miejsce uzyskania dostępu po demo. Brak destination daje unavailable, nie fikcyjny sukces. |
| AUD-08 SMTP | Określić zakres consume/reissue dla maila; niepewnego zewnętrznego skutku nie powtarzać automatycznie. |
| PERSIST-11 timer | Ustalić dopuszczalną utratę czasu po kill; obecny checkpoint nie dowodzi granicy1sekundy. |
| SEC-07 retention | Zatwierdzić okres terminal revocation metadata, zgodny z retry/idempotency. Nie kopiować30dni bez decyzji. |

## Pozostałe zakresy techniczne i content

Zachowane zadania sześciu audytów: ARCH-01–09; PERSIST-01–14; FCA-AUDIT-COMPLETE i konkretne FCA-EDIT; SEC-01–10/09A/09B oraz SEC-11→PERSIST-03; PERF-01–06; CH-06–08 (CH-01–05 odebrane). Konsolidacja nie uznaje audytu za implementację ani usuniętych raportów za zamknięcie zadania.

Te pozycje nie zastępują aktywnego priorytetu BIZQ. Ustalenia audytu02.10 porównano z aktualnym kodem i exact question objects07.10. Dokumenty podają konkretne braki, pliki i AC; nie trzeba powtarzać audytu przed pracą. Nie tworzyć nowej ogólnej bramki z historycznego severity.

| Zakres | Status | Dokument szczegółowy |
| --- | --- | --- |
| CH-06..08 | planned | [Reminders legacy, profile namespaces, account finalization](specs/engineering/code-health.md) |
| PERSIST-01..14 | planned;11 — decyzja PO | [Recovery, indeksy, reset, journal/draft/timer/package integrity;10 zaczyna się od deferred-race testu,13 od bounded native hook probe](specs/engineering/persistence.md) |
| PERF-01..06 | planned — pomiar w określonym etapie | [Content load, projekcje, historia, journal, backend paging, listy](specs/engineering/performance.md) |
| ARCH-01..09 | planned | [Owners, family/runtime, descriptors, UI evidence, fingerprints](specs/engineering/architecture.md); uzgodnić obecne granice GCP ARCH-03/F18 i BESD ARCH-02. |
| SEC-01..10,09A/09B | planned;07 — decyzja PO | [Auth, namespace, App Check, sync DTO, review console, retention/logging/backup](specs/engineering/security-privacy.md). SEC-11 ma właściciela PERSIST-03. |
| FCA — utrzymanie banków | deferred | [158 skonfrontowanych zakresów](specs/engineering/content-maintenance.md). Stare OOD i scoring nie wracają. Pełny indywidualny audit banków nie został ukończony. |
| [FCA-AUDIT-COMPLETE — każdy item](specs/engineering/content-audit.md) | in_progress; kontynuacja odroczona pod BIZQ | Zachowane individual records i PENDING inventory. Stary baseline4236/16077; current16622, exact prior source matches2752; nie oznacza current pełnej coverage. Najpierw rebind późniejszych odbiorów, potem brakujące indywidualne oceny13wymiarów i wszystkie non-PASS→konkretne zadania. |
| EPIC-09 — model evaluation | deferred | [Kontrakt projektowanego narzędzia](../../patternly-content/docs/planning/EPIC-09-MODEL-BASED-EVALUATION-DRAFT.md). Nie jest dowodem jakości ani substytutem review treści. |

## Wydanie — odrębne bramki

| Kolejność | Zadanie | Status i wynik |
| --- | --- | --- |
| R01 | [LEGAL-VALUES](specs/engineering/release-readiness.md) | blocking — zatwierdzone dane operatora/controller, kontakty, rzeczywiste processing facts, public URLs i Premium SKU/prices; jedna konfiguracja i spójne siedem locale. Nie blokuje lokalnej pracy. |
| R02 | [WEB-PUBLISH](specs/engineering/web-release.md) | planned — finalny marketing/legal i osobno autoryzowany deploy, negatywne /admin i /privacy-request, rollback. |
| R03 | FREEZE | planned — cztery czyste SHA, content version/app lock, manifest/config fingerprint, signing/build envelope, disposition zależności i delta-retest. |
| R04 | PROVIDER-MATRIX | planned — realne App Check, store/RevenueCat, mail/cloud content/recovery/revoke dla tego samego kandydata. |
| R05 | PHYSICAL-IOS | planned — finalny frozen build na fizycznym iPhonie, bez testów VoiceOver. |
| R06 | ANDROID-MANUAL | deferred — ręczna macierz; nie blokuje wcześniejszego iOS SIM-READY. |
| R07 | GO/NO-GO | blocking — właściciel ocenia dokładny artefakt, wyniki i jawne ryzyka, następnie zatwierdza. |
| R08 | PUBLISH | planned — autoryzowane wysłanie zatwierdzonego artefaktu, ID/status i kontrolowany odbiór. |

ODK-E2E-082–088 pozostają **planned/needs provider evidence**, osobno przypisane do R01/R03/R04/R05; ODK-E2E-099 **partial** (suite/candidate proof istnieje; exact owner-approval disposition wymaga uzgodnienia). [Odtworzone zakresy i AC](specs/engineering/provider-device-acceptance.md) zachowują TTL, privacy archive/ASC, App Check, Premium lifecycle, SMTP, governance i physical matrix. Generic R04 nie zastępuje żadnego z tych odbiorów. AUD-06-CHECK pozostaje **planned**: naprawa rzeczywistego web-consumer scanner proof gap, bez atrap operations.

## Zasady kontynuacji i dokumentacji

Wymagania produktu pozostają w normatywnych dokumentach workspace `docs/00–17` i specyfikacjach BIZQ. Rozbieżność rozstrzygaj względem decyzji PO i rzeczywistego kodu; opis stanu w specyfikacji nie jest świeżym dowodem. Root plan, root specs i root working state są linkami do kanonicznych plików aplikacji.

Przed zmianą sprawdź źródła, testy, config i diff; zachowaj cudze zmiany. Preflight→kontrakt/AC→review wymaganej materialnej decyzji→najmniejsza implementacja→odpowiednie rzeczywiste checks→niezależny odbiór. Ponawiaj dowody dla zmienionego zachowania i konkretnego ryzyka, nie samego nowego SHA. Nie deployować ani publikować z autoryzacji do lokalnej pracy.

Repo przechowuje kod odtwarzalnych narzędzi, aktualne release/admission/migration wejścia, konsumowane fixtures oraz trwałe individual inputs nadal niewykonanego FCA audytu. Historyczne raporty, screeny, nieużywane Maestro flows, build outputs i katalogi tymczasowe usuwa się po wyciągnięciu nadal potrzebnych ustaleń. Krótkotrwały pakiet aktywnego testu nie jest drugim planem; po odbiorze aktualizuj tylko ten plan i jeden working state. Nie dodawaj sekretów ani raw kont/logów użytkownika do repo.

Zakres obecnych porządków: jeden plan/state, precyzyjne task specs, odłączenie testów od historycznych raportów, usunięcie niekonsumowanych artefaktów i temp, spójne katalogi i Git registrations. Po korekcie utraty unfinished audit state i szczegółów oceniono revised zakres: fit .96, prostota .88, kontrola ryzyka .85, utrzymywalność .90; minimum .85. Niezależny odbiór zachowania pełnych tasków/records: PASS. Weryfikacja i następny krok w jednym working state. Zachowanie aplikacji i kontrakty wydań pozostają kryteriami weryfikacji porządków.
