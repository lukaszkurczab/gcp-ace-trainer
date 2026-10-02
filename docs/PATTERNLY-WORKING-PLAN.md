# Patternly — aktywny plan roboczy

**Status:** kanoniczna kolejka pozostałej pracy

**Rewizja:** 2 października 2026

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
- Operacje: OIDC/JWKS, allowlista, CLI i syntetyczny odbiór OPS-B4 czterech rodzin przyjęte lokalnie; exact backend CI36809141896 SUCCESS. Realny issuer i GO pozostają bramką wydania.
- Web: przygotowanie lokalnego artefaktu i granicy hostingu jest zakończone; publikacja czeka na finalne dane i autoryzację.

### 2.2 Bieżące niespójności

| Obszar | Status | Potwierdzona luka |
| --- | --- | --- |
| Logowanie sandbox Android | `partial` | Email/hasło działa na Redmi Note 11 po korekcie konfiguracji środowiska i promocji backendu sandbox. Bieżąca poprawka prezentacji automatycznego unieważniania sesji pokazuje istniejący stan ładowania, a `signOutPending` dopiero przy błędzie; nie ma jej jeszcze w buildzie/update EAS. Ten wynik nie potwierdza macierzy Apple/Google ani wydania. |
| Recovery/reissue autoryzacji | `partial` | Backendowe fundamenty i polityka e-maila po niejednoznacznym wyniku SMTP są ustalone; pozostają B2 i B4. |

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
| 16 | AUD-08-B2 — recovery/reissue operations | `partial` | PO: zakres SMTP; cloud index/TTL application poza lokalnym odbiorem | Fixed retention30d wdrożone, independent scoped QA PASS WITH ISSUES. Producer28 v12c: full303/0/5dedicatedSKIP, recovery17/0/0, HTTP4/0/0, operator4/0/0, acceptance1/0/0; static/build PASS. Brak odbioru całegoB2/push. |
| 18 | AUD-08-B4 — macierz awarii | `partial` | Końcowy odbiór pozostałej macierzy względem aktualnego źródła; PO: zakres SMTP | Storage/replacement/revoke/deletion/concurrency/log redaction mają lokalne dowody; HTTP/SDK i wybrane native interruption są zweryfikowane w swoich granicach. Pozostaje ocena pełnej macierzy oraz zależnego zakresu SMTP. Nie powtarzać stosowalnych sprawdzeń wyłącznie z powodu nowego HEAD. |
| 19a | [BIZQ-01 — jakość pytań i objaśnień](specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md) | `partial` | Brak zależności implementacyjnej; native/admission zmienionych banków na wolnym środowisku iPhone17 | Pierwszy niezależny slice konsoli: wykrywanie metainstrukcji w constraints + widoczność constraints, full content82/0/0, independent LunaHigh28/0 i PASS WITH ISSUES, parent actual browser PASS; niezależny browser replay blokowany przez macOS. Skan9tracków/943units/16077items:1569 advisory BESD warnings, bez semantic verdict. Naprawy źródeł, przegląd semantyczny, admission i iOS pozostają otwarte. [Dowody](active/BIZQ-01/REPORT.md). |
| 19b | [BIZQ-02 — postęp i integracja planu](specs/business-quality/02-BIZQ-02-POSTEP-I-INTEGRACJA-PLANU.md) | `planned` | Może rozpocząć się niezależnie od redakcji BIZQ-01; wspólny runtime i profile fences AUD-08 bez kolizji | Jedna projekcja Home/proposal/forecast, rzeczywista reguła pakietu, minimum ≠ jakość, stale accept i atomowa para cel+plan. Preflight source potwierdza stałe unknown w obu readerach; pełny zakres nieodtworzony. |
| 20a | [BIZQ-04 — remediation i utrwalanie](specs/business-quality/04-BIZQ-04-REMEDIACJA-I-UTRWALANIE.md) | `planned` | Tożsamość dowodów BIZQ-02; jakość BIZQ-01 do pełnego odbioru | Jedna kolejka, rozdzielenie korekty i due retrieval, nowy due po pierwszym kwalifikowanym sukcesie, jawna polityka maintenance bez bramki progresji. |
| 20b | [BIZQ-05 — diagnoza i transfer](specs/business-quality/05-BIZQ-05-DIAGNOZA-I-TRANSFER.md) | `planned` | BIZQ-01/02/04 | Prawdziwy scope i blueprint diagnozy, kontrola ekspozycji, znacząco zmienione przykłady i rekomendacje na podstawie dowodów; bez claimu readiness/skuteczności. |
| 21a | [BIZQ-03 — plan adaptacyjny](specs/business-quality/03-BIZQ-03-ADAPTACYJNY-PLAN-NAUKI.md) | `planned` | Końcowy odbiór BIZQ-01/02/04/05; kontrakt można przygotować wcześniej | Jawny zakres, minuty, koszt, kalendarz, review i shortfall; propozycja nie nadpisuje planu ani reminders. Parametry liczbowe specyfikacji są propozycjami polityki, nie obecnymi defaults. |
| 21b | [BIZQ-06 — demo i konwersja web](specs/business-quality/06-BIZQ-06-DEMO-I-KONWERSJA-WEB.md) | `planned` | BIZQ-01 dla demo, BIZQ-05 dla claimów, BIZQ-03 wyłącznie dla copy planera; rzeczywisty kanał dystrybucji dla pełnego odbioru | Ograniczony wycinek kanonicznego contentu, jeden przykład naraz, prawdziwe CTA. Niezależna naprawa CTA może ruszyć wcześniej; brak deploy/publikacji w BIZQ. |
| 22 | AUD-06 — przekrojowy odbiór lokalny | `partial` | 01–21 poza jawnymi blockerami właściciela; jakość edukacyjna BIZQ przed deklaracją komercyjnej gotowości | Częściowa inwentaryzacja9tracków/7locale i świeżecontent80/0/0+validate9/webverifyexit0; raportdocs/active/AUD-06/REPORT.md. SIM-READY nieustanowione; B2/B4/policy gaps pozostają. |

## 4. Kontrakty zadań

### BIZQ — jakość edukacyjna i biznesowa

[Dokument wspólny i sześć specyfikacji](specs/business-quality/00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md) określają szczegóły zakresu, AC, testów i non-goals; statusy pozostają wyłącznie w tabeli powyżej. Wymagania normatywne są wpisywane do wspólnych kontraktów `docs/01`, `04`, `07`, `17` przed implementacją. Specyfikacje nie zmieniają brandu, sprzedaży, Premium, admission, jednego runtime ani uprawnień publikacji. Cel+zaakceptowany plan pozostają atomowe, reminders lokalne; completion nie wymaga każdego itemu ani time-spread gate. Pełne odbiory biegną 01→02→04→05→03→06; pierwsze niezależne slice’y mogą wykonać ograniczoną część wcześniej i muszą podać granicę dowodu.

### AUD-08 — recovery/reissue

- **Cel:** utrata odpowiedzi, restart lub błąd providera nie mogą bezpowrotnie zużyć kodu ani niepostrzeżenie powtórzyć skutku.
- **Istniejące wejścia:** generation claim/fence, trwałe operation slots, kontrakt recovery/reissue i lokalna wymiana sesji. Nie implementować ich ponownie.
- **AUD-08-DEC — decyzja zatwierdzona:** po `SMTP accepted` i awarii przed trwałym zapisem backend zachowuje wewnętrzny wynik `AMBIGUOUS` i nie wykonuje automatycznego retry. Interfejs nie ujawnia technicznej niepewności ani nie deklaruje, że pierwsza wiadomość nie została dostarczona. Pokazuje neutralne `Nie widzisz wiadomości?` oraz przycisk `Wyślij ponownie`; pozostałe locale zachowują to samo znaczenie. Jawne ponowienie jest nową, identyfikowalną próbą, podlega istniejącemu limitowi/cooldownowi i nie nadpisuje historii poprzedniej próby. Dla kodu jednorazowego nowa generacja unieważnia starszy kod. Po zaakceptowaniu nowej próby UI pokazuje `Wysłaliśmy nową wiadomość.` bez twierdzenia, co stało się z poprzednią.
- **B2 zakres:** status/recovery/reissue nad istniejącymi slotami; provider effect wewnątrz trwałej operacji; brak raw tokenów w logach/evidence.
- **B2 SMTP — decyzja PO wymagana (2026-10-01):** plan nie wskazuje rodziny e-maila. Kod pokazuje guest privacy verification (kod + resend, najlepsze dopasowanie), purchase receipt (bez kodu, automatyczny reclaim lease) i legal/admin mail. Rekomendacja: guest privacy verification. Pytanie PO wysłane; brak odpowiedzi nie oznacza zgody. Blokuje SMTP slice B2 oraz odpowiadające UI/B4, nie A2 recovery/reissue. Przykład: SMTP dostarczył kod gościowi, backend padł przed utrwaleniem wyniku; jawny resend ma zachować historię i unieważnić stary kod.
- **B2 terminal retention — zatwierdzone przez PO w rozmowie głosowej 2026-10-01:** 30 dni od ACK/supersession dla minimalnej historii zakończonych recovery/reissue. Aktywne niezakończone operacje bez TTL; krótki TTL szyfrogramu pozostaje osobną granicą. Zapis decyzji nie oznacza wdrożenia konfiguracji ani odbioru B2.
- **B4 zakres:** failure injection przed/po każdym skutku, utracona odpowiedź, restart, reissue, deletion/revoke i Maestro na jednym iPhonie 17.
- **Akceptacja:** ta sama operacja ma jeden rozstrzygalny wynik albo trwały wewnętrzny stan `AMBIGUOUS`; niepewny skutek nie jest automatycznie powtarzany. Jawne `Wyślij ponownie` tworzy nową próbę, nowa generacja odcina starą, nieuprawnione konto nie może wznowić cudzej operacji, a UI nie pokazuje fałszywego sukcesu ani technicznego komunikatu o niepewności SMTP.
- **Weryfikacja:** backend unit/emulator, mobile persistence, restart, concurrency, log redaction, exact state before/after i QA.
- **Evidence/report:** `docs/active/AUD-08/B2-REPORT.md`, `B4-REPORT.md`.
- **Prompt wykonawczy:** „Przed pracą zinwentaryzuj bieżące sloty i generation fence. Wygeneruj tylko brakujące zadania B2 i B4; nie przywracaj zakończonych raportów B1 ani kompatybilności starych instalacji. Dla niepewnego SMTP zachowaj wewnętrzny `AMBIGUOUS` bez automatycznego retry. Użytkownik widzi wyłącznie neutralne `Nie widzisz wiadomości?` i jawne `Wyślij ponownie`; nowa próba ma nową tożsamość, zachowuje historię i dla kodu unieważnia poprzednią generację.”

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

AUD-08-B2 wymaga rozstrzygnięcia rodziny SMTP przez właściciela; retencja 30 dni jest już wdrożona lokalnie. AUD-08-B4 wymaga końcowej oceny pozostałej macierzy awarii względem aktualnych źródeł, z ponownym użyciem stosowalnych dowodów. Nie powtarzać odebranych zachowań bez konkretnej regresji. Zadania BIZQ mogą postępować zgodnie z zależnościami z §3; lokalne środowisko iPhone17 jest wolne. Wdrożenie i publikacja mają osobne bramki i autoryzację.
