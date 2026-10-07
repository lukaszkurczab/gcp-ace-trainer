# AUD-08-B2/B4 — pozostały odbiór recovery i reissue

Status i kolejność: [plan główny](../../PATTERNLY-WORKING-PLAN.md). Kontrakt zachowany ze starego planu §4; nie oznacza nowego odbioru ani powtórnej implementacji istniejących slotów/generation fences.

## B2 — operacje i decyzja SMTP

Cel: utrata odpowiedzi, restart lub awaria providera nie mogą bezpowrotnie zużyć kodu ani niepostrzeżenie powtórzyć skutku. Backend posiada trwałe operation slots, status/recovery/reissue, generation claim/fence i provider effect wewnątrz operacji. Mobile posiada trwały intent/result/ACK oraz lokalną wymianę sesji. Sprawdzić tylko brakujący zakres względem bieżących właścicieli; nie budować drugiego protokołu.

Retencja recovery/reissue 30 dni od trwałego ACK/supersession jest zatwierdzona i wdrożona lokalnie. Powtórny ACK nie wydłuża retencji; aktywne niezakończone operacje nie mają TTL. Krótki termin szyfrogramu jest osobną granicą. Cloud index/TTL application pozostaje osobnym zadaniem providerowym. SEC-07 dotyczy innej kolekcji terminal revocation metadata.

**Decyzja właściciela z 07.10.2026 — zakres SMTP:** polityka zużycia i ponownego wydania obejmuje kod potwierdzający adres Gościa przy zgłoszeniu dotyczącym jego danych w aplikacji (`guest privacy verification`). Jawne „Wyślij ponownie” tworzy nową identyfikowalną próbę i nowy kod; nowa generacja unieważnia poprzedni kod. Niepewny wynik wysyłki nie powoduje automatycznego ponowienia. Potwierdzenia zakupów oraz wiadomości prawne i administracyjne zachowują osobne procesy. Ich istniejące obowiązki i odbiór ODK-E2E-086 pozostają w zakresie planu. Decyzja określa granicę tego zadania, a nie potwierdza implementacji lub odbioru SMTP/UI/B4.

**Zatwierdzona semantyka po SMTP accepted i awarii przed utrwaleniem:**

- Backend zachowuje trwały wewnętrzny `AMBIGUOUS`, bez automatycznego retry zewnętrznego skutku.
- UI pokazuje neutralne `Nie widzisz wiadomości?` oraz jawne `Wyślij ponownie`. Nie ujawnia technicznej niepewności i nie twierdzi, że pierwsza wiadomość została albo nie została dostarczona.
- Resend tworzy nową identyfikowalną próbę, przestrzega istniejącego limitu/cooldownu i zachowuje historię poprzedniej. Dla kodu jednorazowego nowa generacja unieważnia starszy kod.
- Po zaakceptowaniu nowej próby UI pokazuje `Wysłaliśmy nową wiadomość.`. Wszystkie siedem locale zachowuje to samo znaczenie.
- Nieuprawnione konto nie może wznowić cudzej operacji. Raw tokeny, kody, proof IDs i dane kont nie trafiają do logów ani publicznego evidence.

## B4 — macierz awarii

Zidentyfikować każdą granicę przed/po zewnętrznym skutku, durable intent/result, wymianie sesji i ACK. Dla ISSUE/consume/replacement/reissue/status/ACK oraz revoke/deletion sprawdzić: utratę odpowiedzi, restart, odczyt tej samej tożsamości, concurrency, generation mismatch, redaction i zachowanie niezwiązanych danych Gościa/kont. Nie utożsamiać rekonstrukcji koordynatora nad memory vault z native cold restart.

Odebrane historyczne lokalne HTTP/SDK slices: ISSUE/consume response loss, storage rejection, replacement, revoke, deletion, same-ID concurrency i canonical log redaction. Ich usunięte raporty są w Git `74d8439c9801448c6b536d2f72eb4bd18811482d:docs/active/AUD-08/`. Ponownie wykonać przypadek tylko dla zmienionego źródła/zależności lub konkretnego niepokrytego ryzyka. Nie przywracać historycznych blockerów retencji po wdrożeniu 30 dni.

Pozostały natywny odbiór zużycia kodu, trwałości i restartu, pełna macierz oraz implementacja i odbiór zatwierdzonego zakresu SMTP nie są zakończone. Historyczne fixture cleanup/password rotation, restoration Auth i exceptional timeout/hang teardown były niepotwierdzone; zweryfikować ich aktualny stan przed użyciem istniejącego testowego konta, zamiast wykonywać dawny retry lub reset. Brak dawnego runtime nie dowodzi uszkodzenia danych. Politykę generation mismatch skonfrontować z aktualnym kontraktem; bez guessed ACK, retain/forget lub replay.

Pliki rozpoczęcia: app `src/application/account/AccountSessionProvider.tsx`, account recovery coordinators i `scripts/aud02dMatrix.mjs`; backend `src/modules/users/` recovery/reissue store/service, `src/api/app.ts`, `config/firestore-{indexes,ttl}.json`, required recovery/emulator runners. Faktyczne ścieżki i wymagane flagi ustalić z obecnych package scripts przed uruchomieniem.

**AC:** ta sama operacja ma jeden rozstrzygalny wynik albo trwały `AMBIGUOUS`; retry/status zachowują ID i generation; jawny resend ma nową próbę z opisaną semantyką; brak powtórnego niepewnego efektu, fałszywego sukcesu, dostępu do cudzej operacji i utraty niezwiązanych danych. Każdy wymagany fault point ma before/after state assertions, nie wyłącznie screenshot.

**Weryfikacja:** backend unit/isolated emulator, rzeczywisty HTTP/Admin/Firebase SDK, mobile persistence/restart/concurrency, negative access/generation/expiry/corruption oraz sanitized log assertions; potrzebne native przypadki na jednym istniejącym iPhone17. Publiczne UI i trwałe dane mają osobne dowody. Brak App Check/provider proof jest przypisany do wydania, nie zastępowany fixture.

Poza zakresem: deploy, cloud TTL/index apply, rozszerzenie polityki SMTP na inne rodziny wiadomości bez decyzji, zakupy, odtwarzanie starych kont bez autoryzacji, reset danych i ponowna implementacja zaakceptowanego protokołu.
