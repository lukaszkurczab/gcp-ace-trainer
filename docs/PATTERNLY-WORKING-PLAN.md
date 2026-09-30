# Patternly — aktywny plan roboczy

**Status:** kanoniczna kolejka pozostałej pracy

**Rewizja:** 30 września 2026

**Zakres:** `patternly`, `patternly-backend`, `patternly-content`, `patternly-web`
**Cel:** doprowadzić jeden przypięty kandydat iOS od lokalnego odbioru do autoryzowanej publikacji. Android jest testowany później ręcznie i nie blokuje lokalnego odbioru iOS.

Ten dokument zawiera wyłącznie pracę pozostałą. Zakończone zadania, raporty, screenshoty i flow Maestro są dostępne w historii Git, ale nie należą do aktywnego planu. `docs/active/` służy tylko artefaktom bieżącego zadania; po jego zamknięciu pakiet jest usuwany z aktywnego drzewa.

## 1. Obowiązkowy checkpoint przed każdym zadaniem

1. Patternly nie ma realnych użytkowników ani danych produkcyjnych. Do pierwszego publicznego wydania kompatybilność wsteczna lokalnych buildów nie jest wymaganiem. Nie tworzyć migratorów, adapterów, fallbacków ani równoległych formatów bez wykazanego kontraktu zewnętrznego.
2. Istnieje najwyżej jeden bieżący profil Gościa. Nie implementować selektora ani odzyskiwania wielu historycznych Gości.
3. Do lokalnych testów iOS używać istniejącego iPhone'a 17. Nie tworzyć ani nie instalować duplikatu urządzenia/aplikacji bez konkretnej potrzeby i nowego uzgodnienia. Dane Patternly na tym urządzeniu można wyczyścić, gdy wymaga tego izolowany test.
4. Nie przedstawiać lokalnego emulatora, fixture, smoke transportu ani testowej konfiguracji jako dowodu wdrożenia, realnego providera lub produkcji.
5. Dla niepewnego skutku zewnętrznego nie wykonywać automatycznego retry bez trwałego identyfikatora i jednoznacznego odczytu wyniku.
6. Każdy wykonawca najpierw sprawdza aktualny kod, testy, konfigurację i bieżący diff. Nie wolno przywracać zakończonych zadań tylko dlatego, że ich raport usunięto z `docs/active`.
7. Implementować semantykę dostępności potrzebną dla VoiceOver: poprawne etykiety, role, wartości, hinty, kolejność strukturalną, stany busy/disabled i komunikaty zmian stanu. Decyzją właściciela VoiceOver nie jest jednak testowany w żadnej formie: bez manualnego odsłuchu, sterowania czytnikiem, odbioru focusu/announcement ani zastępowania ich hierarchią Simulatora. Brak evidence VoiceOver jest zaakceptowanym ryzykiem, nie blockerem zadania, `SIM-READY`, `PHYSICAL-IOS`, GO ani publikacji. Testy kodu mogą sprawdzać kontrakty propsów accessibility, ale nie wolno przedstawiać ich jako testu VoiceOver.
8. `Exam`, `Coding Mock Interview` i cała rodzina `Design Interview` są funkcjami Premium. Na Free mogą być widoczne wyłącznie jako zablokowana oferta prowadząca do istniejącego paywalla; nie wolno uruchomić, wznowić ani przygotować ich sesji bez potwierdzonego Premium. Na Premium muszą być dostępne. `Exam` pozostaje osobnym profilem symulacji poza zwykłą macierzą practice modes i nie wolno zastępować go `Focus Practice`. `Coding Mock Interview` nie jest martwą ścieżką do usunięcia. `Design Interview` nie korzysta z darmowego node'a; wszystkie jego tryby i pakiety wymagają Premium. Dostęp, UI i runtime mają jeden jawny kontrakt Premium, a testy i runnery pozostają, chyba że zastępuje je kanoniczny odpowiednik testujący tę samą funkcję end-to-end.

## 2. Stan wejściowy

### 2.1 Potwierdzony baseline — nie planować ponownie

- Profile: jeden Gość, izolacja Guest/A/B, trwała adopcja transfer/discard, logout offline, wznowienie tego samego konta, usunięcie konta i częściowy odczyt poprawnych danych są zaimplementowane i odebrane lokalnie.
- Content: dziewięć tracków ma jeden kanoniczny format, lokalny candidate/admission i app lock; brak aktywnego legacy publishera.
- Premium: discovery/preparation, exact package identity oraz jedna bramka nowych sesji i pobrań działają lokalnie i fail-closed dla contentu poza darmowym node'em. Bramka wymaga rozszerzenia o jawne reguły produktowe: `Exam`, `Coding Mock Interview` i cała rodzina `Design Interview` zawsze wymagają Premium, niezależnie od pytań wybranych do sesji.
- CI/release: istnieją kontrakty exact-SHA, manifest kandydata, `embedded-only`, rozdzielenie LOCAL/FREEZE/GO i bramka GO.
- Legal/config: techniczny kontrakt zmiennych i szablonów istnieje; brakuje prawdziwych wartości wydaniowych.
- Operacje: istnieje backendowa tożsamość operatora OIDC/JWKS i allowlista akcji; nie ma jeszcze pełnych endpointów i CLI.
- Web: przygotowanie lokalnego artefaktu i granicy hostingu jest zakończone; publikacja czeka na finalne dane i autoryzację.

Baseline SHA podczas porządków:

| Repozytorium | SHA |
| --- | --- |
| `patternly` | `d4015885` |
| `patternly-backend` | `42b66c5` |
| `patternly-content` | `e97c338` |
| `patternly-web` | `12c9557` |

SHA są punktem orientacyjnym porządków, nie kandydatem release. Przed każdym zadaniem trzeba odczytać aktualny HEAD.

### 2.2 Bieżące niespójności

| Obszar | Status | Potwierdzona luka |
| --- | --- | --- |
| Logowanie sandbox Android | `partial` | Email/hasło działa na Redmi Note 11 po korekcie konfiguracji środowiska i promocji backendu sandbox. Bieżąca poprawka prezentacji automatycznego unieważniania sesji pokazuje istniejący stan ładowania, a `signOutPending` dopiero przy błędzie; nie ma jej jeszcze w buildzie/update EAS. Ten wynik nie potwierdza macierzy Apple/Google ani wydania. |
| Stare audyty UI/session | `accepted` | AUD-15 zamknięte lokalnie: pięć stanów Practice/Review, standard i 2×, independent QA. AUD-02 nie wraca do kolejki decyzją PO. |
| Recovery/reissue autoryzacji | `partial` | Backendowe fundamenty i polityka e-maila po niejednoznacznym wyniku SMTP są ustalone; pozostają operacje B2–B4. |
| Kanał operatorski | `partial` | B1 jest wykonane; brakuje endpointów, CLI i syntetycznego odbioru end-to-end. |

### 2.3 Decyzje właściciela zachowane jako kontrakty

- Nawigacja używa 16 pt; etykieta wybranego tracka ma subtelny akcent pionowy.
- Reminders dotyczą bieżącego tracka. Edytor harmonogramu włącza osobne godziny jawnym checkboxem i pokazuje wybrane dni.
- Target date zależy od celu: wydarzenie dla rozmowy/egzaminu, termin dla foundations, checkpoint dla refresh; own pace nie ma daty. Reguła ukończenia należy do wersjonowanego pakietu: definiuje minimalną liczbę prób i próg z ruchomego okna wyników; pytania mogą się powtarzać, ukończenie nie wymaga trafienia każdego unikalnego pytania, a brak reguły oznacza stan nieznany. Shortfall jest jawny; plan wolno skrócić tylko według sensownej ścieżki dopuszczonej przez pakiet.
- Cel i zaakceptowany plan synchronizują się per track jako jedna atomowa para. Konflikt nie przerywa sesji: przy najbliższym bezpiecznym wejściu użytkownik wybiera zachowaną lokalną albo chmurową parę, po czym wybór synchronizuje się z urządzeniami. Ustawienia powiadomień pozostają lokalne dla urządzenia.
- `Your data` pokazuje jawny stan sesji; guest copy i kanał są tylko dla rzeczywistego gościa. Lokalny reset ma potwierdzenie i opisany zakres. Eksport nazywa się `Share or download` i odpowiada rzeczywistemu arkuszowi systemowemu.
- W `Your data` wnioski RODO i odzyskiwanie danych nieosobowych są osobnymi, bezpośrednimi wierszami. `Legal information` jest krótkim hubem z lokalnymi dokumentami kanonicznymi; zewnętrzny link prowadzi tylko do Support. Pokazywać prawnie określone terminy bez wymyślania SLA.
- Nie powtarzać zamkniętych ODK-E2E-036–037 bez dowodu regresji; ODK-E2E-082–088 i 099 pozostają osobnymi zadaniami. VoiceOver jest wyłączony z testów decyzją właściciela.

## 3. Kolejność wykonania lokalnego

Statusy w planie: `partial`, `blocking`, `deferred`, `planned`, `unknown / needs evidence`. Zakończone pozycje nie pozostają w tej tabeli.

| Kolejność | Zadanie | Status | Zależność | Wynik |
| --- | --- | --- | --- | --- |
| 12 | AUD-15 — odpowiedzi i review | `accepted` | brak | Canonical in-memory fixture, source1498/1498 PASS, standard/light222/222 i dark2×222/222 PASS; magazyn niezmieniony, independent QA PASS WITH ISSUES (nieblokujący licznik fixture). Dowody `docs/active/AUD-15/REPORT.md`. VoiceOver poza odbiorem. |
| 16 | AUD-08-B2 — recovery/reissue operations | `planned` | zatwierdzona polityka e-mailowa AUD-08-DEC | Trwałe operacje, status i reconciliation bez automatycznego powtarzania niepewnego skutku. |
| 17 | AUD-08-B3 — mobile ACK i resume | `planned` | AUD-08-B2 | Restart i utracona odpowiedź nie zużywają operacji bez możliwości wznowienia. |
| 18 | AUD-08-B4 — macierz awarii | `planned` | AUD-08-B3 | Failure injection i Maestro na jednym iPhonie 17. |
| 19 | OPS-B2 — endpointy operatorskie | `planned` | brak | Allowlistowane list/detail/action nad istniejącymi store'ami. |
| 20 | OPS-B3 — lokalne CLI | `planned` | OPS-B2 | Bezpieczny klient bez sekretów i automatycznego retry. |
| 21 | OPS-B4 — syntetyczny odbiór | `planned` | OPS-B3 | Intake → akcja → wynik → audyt dla czterech rodzin. |
| 22 | AUD-06 — przekrojowy odbiór lokalny | `planned` | 01–21 poza jawnymi blockerami właściciela | Wynik `SIM-READY` albo dokładna lista braków. |

## 4. Kontrakty zadań

### UI-REVIEW-26

Każdy slice ma osobny raport i QA; nie łączyć ich w jeden refactor.

| ID | Cel i zakres | Akceptacja | Raport |
| --- | --- | --- | --- |
| UI-26-02B | Wdrożyć 02A; Apple/Google tylko na Sign in, nie na Create account. | Provider existing/new, odmowa obu dokumentów, restart, retry, wersje zgód i izolacja danych mają testy oraz runtime evidence. | `docs/active/UI-26-02B/REPORT.md` |
| UI-26-01 | Miętowy zatwierdzony znak, lekko większy; „Practice. Progress. Be ready.” i „Focused practice for technical interviews and certifications.” | Motywy, duży tekst, siedem locale; bez zmiany logiki wejścia. | `docs/active/UI-26-01/REPORT.md` |
| UI-26-03 | Usunąć dolne `Selected` i nazwę tracku; zostawić `Start track`. | Zaznaczenie listy i semantyka pozostają; przycisk uruchamia właściwy track. | `docs/active/UI-26-03/REPORT.md` |
| UI-26-04 | Wyrównać ikonę głównej karty Home do lewego górnego rogu treści. | Krótkie/długie tytuły i duży tekst bez regresji działania. | `docs/active/UI-26-04/REPORT.md` |
| UI-26-05 | Zastąpić ręczne `YYYY-MM-DD` lokalizowanym kalendarzem. | Wybór, zmiana, wyczyszczenie i pusta wartość; bez zmiany formatu storage bez wykazanej potrzeby. | `docs/active/UI-26-05/REPORT.md` |
| UI-26-06 | Reminders jako szkic dni podczas celu; harmonogram dopiero po przyjęciu planu z godzinami i zgodzie systemowej. | Restart/retry, odmowa planu/uprawnienia i błąd schedulera nie pokazują pozornej aktywacji; działające powiadomienie ma runtime evidence. | `docs/active/UI-26-06/REPORT.md` |
| UI-26-10 | Usunąć ze `Sign in` prezentację `Server session revocation pending`. Oczekujące unieważnienie sesji jest wewnętrznym stanem technicznym: użytkownik jest już lokalnie wylogowany, proces przebiega poprawnie i nie oferuje mu żadnej akcji. | Przy `state.kind === "signedOut"` ekran logowania wygląda standardowo niezależnie od `pendingRemoteRevokeCount`: bez karty, bannera, zastępczego tekstu, ikony lub dodatkowego odstępu. Trwała kolejka i wznowienie unieważnienia pozostają funkcjonalne. Niepotrzebne copy i test widoczności zostają usunięte lub zastąpione regresją potwierdzającą brak UI oraz zachowanie mechanizmu. | `docs/active/UI-26-10/REPORT.md` |

Wspólne non-goals: przebudowa design systemu, drugi ekran przypomnień, zmiana progresji lub przypadkowe modyfikacje sąsiednich ekranów.

### AUD-15

| ID | Cel i zakres | Akceptacja i weryfikacja | Ryzyko / report |
| --- | --- | --- | --- |
| AUD-15 | Single/multi, correct/incorrect/partial, Review, standard/duży tekst. | Hierarchia, karty, semantyka i screenshoty wszystkich stanów. VoiceOver poza odbiorem. | `ACCEPTED`: source1498/1498, dwie pełne macierze222/222, storage identical, independent source/native QA; nieblokujący licznik fixture. `docs/active/AUD-15/REPORT.md`. |

Każdy wykonawca ma ponownie sprawdzić aktualne wejścia i usunąć z własnego scope elementy już działające. Weryfikacja jest wąska dla poprawki, ale runtime matrix musi pokrywać całe kryterium danego audytu.

### AUD-08 — recovery/reissue

- **Cel:** utrata odpowiedzi, restart lub błąd providera nie mogą bezpowrotnie zużyć kodu ani niepostrzeżenie powtórzyć skutku.
- **Istniejące wejścia:** generation claim/fence, trwałe operation slots, kontrakt recovery/reissue i lokalna wymiana sesji. Nie implementować ich ponownie.
- **AUD-08-DEC — decyzja zatwierdzona:** po `SMTP accepted` i awarii przed trwałym zapisem backend zachowuje wewnętrzny wynik `AMBIGUOUS` i nie wykonuje automatycznego retry. Interfejs nie ujawnia technicznej niepewności ani nie deklaruje, że pierwsza wiadomość nie została dostarczona. Pokazuje neutralne `Nie widzisz wiadomości?` oraz przycisk `Wyślij ponownie`; pozostałe locale zachowują to samo znaczenie. Jawne ponowienie jest nową, identyfikowalną próbą, podlega istniejącemu limitowi/cooldownowi i nie nadpisuje historii poprzedniej próby. Dla kodu jednorazowego nowa generacja unieważnia starszy kod. Po zaakceptowaniu nowej próby UI pokazuje `Wysłaliśmy nową wiadomość.` bez twierdzenia, co stało się z poprzednią.
- **B2 zakres:** status/recovery/reissue nad istniejącymi slotami; provider effect wewnątrz trwałej operacji; brak raw tokenów w logach/evidence.
- **B3 zakres:** mobilny `operationId`, trwały ACK, resume po restarcie i jawny stan niepewny.
- **B4 zakres:** failure injection przed/po każdym skutku, utracona odpowiedź, restart, reissue, deletion/revoke i Maestro na jednym iPhonie 17.
- **Akceptacja:** ta sama operacja ma jeden rozstrzygalny wynik albo trwały wewnętrzny stan `AMBIGUOUS`; niepewny skutek nie jest automatycznie powtarzany. Jawne `Wyślij ponownie` tworzy nową próbę, nowa generacja odcina starą, nieuprawnione konto nie może wznowić cudzej operacji, a UI nie pokazuje fałszywego sukcesu ani technicznego komunikatu o niepewności SMTP.
- **Weryfikacja:** backend unit/emulator, mobile persistence, restart, concurrency, log redaction, exact state before/after i QA.
- **Evidence/report:** `docs/active/AUD-08/B2-REPORT.md`, `B3-REPORT.md`, `B4-REPORT.md`.
- **Prompt wykonawczy:** „Przed pracą zinwentaryzuj bieżące sloty i generation fence. Wygeneruj tylko brakujące zadania B2–B4; nie przywracaj zakończonych raportów B1 ani kompatybilności starych instalacji. Dla niepewnego SMTP zachowaj wewnętrzny `AMBIGUOUS` bez automatycznego retry. Użytkownik widzi wyłącznie neutralne `Nie widzisz wiadomości?` i jawne `Wyślij ponownie`; nowa próba ma nową tożsamość, zachowuje historię i dla kodu unieważnia poprzednią generację.”

### OPS-PRODUCTION B2–B4

- **Cel:** lokalny, bezpieczny kanał operatora korzystający z istniejących state machines backendu; bez hosted admina i bez bezpośredniego Firestore.
- **B2 zakres:** allowlistowane list/detail/action dla content reports, privacy, legal i security; role per action; `expectedStatus`/`expectedRevision`; ograniczone projekcje; pseudonimizowany audyt. Akcje bez jednoznacznego postcondition pozostają wyłączone.
- **B3 zakres:** lokalne CLI z jawnym HTTPS allowlist, krótkim tokenem bez utrwalania, potwierdzeniem skutków oraz read-after-uncertain. Wynik nierozstrzygalny to `AMBIGUOUS / RECONCILIATION REQUIRED`.
- **B4 zakres:** syntetyczny intake → list/detail/action → wynik → audyt; odmowa roli, konflikt i utracona odpowiedź dla każdej rodziny.
- **Poza zakresem:** publiczny panel, nowe workflow prawne, automatyczne decyzje, dane produkcyjne przed GO.
- **Akceptacja:** OpenAPI i testy per action; brak tokenów/payloadów w logach; CLI nie wykonuje automatycznego retry mutacji; aplikacja pokazuje wyłącznie istniejący kontrakt statusu/odpowiedzi.
- **Weryfikacja:** backend unit/emulator, CLI contract tests, syntetyczne E2E i niezależne QA.
- **Evidence/report:** `docs/active/OPS-PRODUCTION/B2-REPORT.md`, `B3-REPORT.md`, `B4-REPORT.md`.
- **Prompt wykonawczy:** „Sprawdź aktualne store'y i B1. Użyj jednego zestawu state machines; rozbij wyłącznie B2–B4, z postcondition i testem niepewnej odpowiedzi dla każdej akcji.”

## 5. SIM-READY i praca wydaniowa

`SIM-READY` jest wynikiem AUD-06, nie osobnym wdrożeniem. AUD-06 sprawdza cztery aktualne repozytoria, dziewięć tracków, siedem locale, krytyczne flow i kompletność lokalnych bramek. Wynik zawiera dokładną listę dowodów pozostawionych na realnych providerów i urządzenie fizyczne.

Po SIM-READY praca idzie w tej kolejności:

| Kolejność | Zadanie | Status | Warunek zakończenia |
| --- | --- | --- | --- |
| R01 | LEGAL-VALUES — prawdziwe dane operatora, administratora, kontakty, oświadczenia i techniczne ID/SKU | `blocking` | PO dostarcza wartości; walidacja siedmiu locale i wszystkich konsumentów. |
| R02 | WEB-PUBLISH | `planned` | Zatwierdzony marketing/legal, autoryzowany deploy, negatywne `/admin*` i `/privacy-request*`, rollback. |
| R03 | FREEZE | `planned` | Cztery czyste SHA, content version/app lock, manifest, config fingerprint, signing/build envelope i delta-retest. |
| R04 | PROVIDER-MATRIX | `planned` | Realne App Check, RevenueCat/store, e-mail, cloud content, recovery/revoke i wszystkie wymagane dowody dla tego samego kandydata. |
| R05 | PHYSICAL-IOS | `planned` | Końcowa macierz na fizycznym iPhonie dla dokładnego frozen builda, bez testów VoiceOver. |
| R06 | ANDROID-MANUAL | `deferred` | Ręczna macierz na działającym kandydacie; nie blokuje wcześniejszego iOS SIM-READY. |
| R07 | GO/NO-GO | `blocking` | PO otrzymuje manifest, wyniki, ryzyka i jawnie zatwierdza dokładny artefakt. |
| R08 | PUBLISH | `planned` | Autoryzowane wysłanie dokładnego artefaktu, zapis ID/statusu i kontrolowany odbiór po publikacji. |

**LEGAL-VALUES — oczekiwanie na PO (30.09.2026):** release source nie ma kompletu zatwierdzonych danych publicznych; dokładne pola, przykład użytkownika i zależne bramki w `docs/active/LEGAL-VALUES/PO-INPUT.md`. Wysłano pytanie o uzupełnienie kanonicznego JSON albo przekazanie zatwierdzonych faktów. Brak odpowiedzi nie jest zgodą. Lokalna praca trwa; R01 oraz zależny produkcyjny legal/WWW/config/GO/PUBLISH pozostają blokowane.

Nie prosić o ogólny „dostęp do providerów”. Każda prośba do właściciela ma wskazywać konkretną czynność, konto/uprawnienie, czas użycia i bezpieczny sposób przekazania. Prawdziwe wartości i provider evidence nie blokują pracy lokalnej, ale blokują odpowiednią bramkę wydania.

## 6. Bramka końcowa i zasady evidence

- Raport powstaje tylko dla aktywnego zadania i po zamknięciu jest usuwany z `docs/active` przy następnych porządkach; historia Git jest archiwum.
- Do repo nie trafiają e-maile, hasła, tokeny, UID, surowe logi kont ani prywatne formularze.
- Screenshot jest dowodem prezentacji, nie zachowania backendu. Dla danych/synchronizacji potrzebna jest również asercja stanu przed/po.
- Implementacja zachowuje kontrakty dostępności dla VoiceOver, ale plan nie wymaga i nie dopuszcza deklarowania testu VoiceOver. Brak manualnego odsłuchu, sterowania, focusu i announcement evidence jest jawnym, zaakceptowanym ryzykiem właściciela i nie obniża wyniku bramek.
- Każdy raport podaje wykonane komendy, rzeczywiste wyniki, SHA, urządzenie/runtime, ograniczenia oraz niezależne QA. Nie wolno deklarować niewykonanego testu jako PASS.
- Zakończenie planu wymaga: SIM-READY, finalnych wartości, WEB-PUBLISH, FREEZE, provider matrix, physical iOS, jawnego GO oraz kontrolowanego PUBLISH/odbioru.

## 7. Pierwsze następne zadanie

**AUD-08-B2 — recovery/reissue operations** jest następnym dostępnym zadaniem. AUD-15 odebrane: source1498/1498, standard/light i dark2× po222/222, storage bez zmian, independent QA PASS WITH ISSUES (licznik wyłącznie fixture). Dowody `docs/active/AUD-15/REPORT.md`. B2 wymaga preflight środowisk, aktualnej inwentaryzacji guardów oraz zatwierdzonego A2; B3/B4 zależą od B2.

UI-26-02B odebrane lokalnie 30.09.2026: mapped/provisional obu providerów, osobne dokumenty/zgody, cancel/retry/cold, new201/explicitadoption, legalimmutable/replay200 i naprawiony logout/reentry PASS. Final native appc66419b6969cbc6ab54c45af6db42b68852beaf5/backend29165944d087486075c9ccd23657c5c2fb45a84c; canonical content0174e42/web9585919 niezmienione. Pełna qa:static1492/1492+recovery/typecheck/content/privacy PASS z poprawnymi historicalcc3efca/current0174e42 pins. Independent LunaHigh source76, native i inventory15 PASS. Dowody/chronologia/ograniczenia w archiwum Git app654baa33 (docs/active/UI-26-02B/REPORT.md oraz evidence/VERIFICATION.json); aktywne pliki usunięto przy rozpoczęciu AUD-15. Fixture zastępuje acquisition, dalej działa rzeczywisty SDK/Auth Emulator/HTTP; realny provider matrix pozostaje bramką wydania. Cztery własne konta testowe usunięto indywidualnie; brak globalnego resetu/deploy/EAS. Commit/push PASS: app main654baa33a020e0f093f0fb243c2b2dbb19c40148 i backend main29165944d087486075c9ccd23657c5c2fb45a84c; komplet dowodów w historii app654baa33.

UI-26-12 odebrane 30.09.2026: niezależne Luna High QA PASS, 78 focused + 8 feedback/result regression, typecheck/content/privacy/diff PASS; pełne Result→Review→Result, rzeczywiste Safari/exact URL, kontrolowana awaria, EN light standard i DE dark2× PASS. Dowody zarchiwizowane w app commit058ae2a1103efdf3cbbc549d65069698c57b8a3f (REPORT, VERIFICATION i screenshoty); fixture jawnie in-memory/no saved result, bez dowodu realnych providerów/Premium/VoiceOver. UI-26-11 odebrano i wypchnięto w app ff78a605; jego evidence jest w historii tego commita.
