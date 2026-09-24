# AUD-08/A1 — kontrakt generacji autoryzacji

**Data:** 24.09.2026

**Status:** kontrakt A1 przyjęty przez niezależne QA (PASS); brak zmian runtime. AUD-08/A2 ustali protokół recovery/reissue, a B wdroży go etapami.

## Inwariant

`users/{userId}.authorizationGeneration` jest osobnym, monotonicznym dodatnim numerem całkowitym. Nie używać `syncMetadata/account.generation`, bo ten numer wybiera generację postępu/adopcji. Nowe konto zaczyna od `1`; brak pola w istniejącym, aktywnym koncie oznacza `1` tylko na czas migracji. Wszelkie późniejsze obroty zapisują pole jawnie. Usunięty użytkownik lub aktywny tombstone nie ma generacji uprawniającej do wejścia.

Firebase ID token dostarczony przez klienta niesie claim `authorizationGeneration`, a backend odczytuje bieżącą wartość z konta. Claim jest podpisanym wejściem do porównania, nigdy źródłem prawdy. Token bez poprawnej dodatniej liczby całkowitej, z niezgodną generacją albo z kontem w stanie rotacji/usuwania nie dostaje dostępu do tras konta. Weryfikator zachowuje claim w projekcji; obecne `verifyIdToken(..., true)` i kontrola issuer/audience/UID pozostają. Reguły Firestore dla klientów nadal odmawiają wszystkiego, więc backend jest właścicielem tego porównania. Każde przyszłe otwarcie reguł wymaga osobnego dowodu zgodności generacji.

## Wejście zwykłej i starej sesji

Firebase Email/Google logowanie i już aktywna sesja mogą nie mieć claimu. Wąska trasa wymiany sesji, chroniona App Check i poprawnym Firebase ID tokenem, nie daje danych konta: w jednym spójnym odczycie odnajduje aktywne konto, sprawdza barierę świeżości po ostatniej rotacji i **przypina konkretną generację** do tej próby. Custom token mintuje wyłącznie z przypiętą wartością; nie odczytuje ponownie „bieżącej” generacji po sprawdzeniu bariery. Gdy obrót nastąpi między odczytem a mint, token ze starą generacją zostanie odrzucony przez zwykły guard. Klient wymienia token przez `signInWithCustomToken` i dopiero potem używa tras konta. Rejestracja pozostaje `verify-only`, ponieważ przed utworzeniem konta nie ma `userId`; po niej klient przechodzi wymianę generacji `1`. Nie dawać trasom konta przejściowego fallbacku dla tokenu bez claimu.

Po rotacji stary token nie może wymienić się na aktualną generację tylko dlatego, że został później odświeżony: backend wymaga świeżego `auth_time` względem zapisanej bariery rotacji. Bariera ma rozdzielczość sekund Firebase; implementacja musi określić ścisłe porównanie i obsłużyć tę samą sekundę przez ponowne uwierzytelnienie później, zamiast akceptować wynik graniczny. Trasa wymiany odmawia stanu `rotating`/`deleting`. Zwykłe odświeżenie ID tokenu nie jest ponownym uwierzytelnieniem. Samo `setCustomUserClaims` nie jest przyjętym mechanizmem migracji, ponieważ [nowe claims propagują się przy nowym/odświeżonym tokenie](https://firebase.google.com/docs/auth/admin/custom-claims), a opóźniony zapis mógłby nadpisać nowszą generację. Zachowanie claimu po kolejnych odświeżeniach sesji custom-token musi mieć test integracyjny przed włączeniem wymagania dla wszystkich klientów.

## Rotacja, spóźniony worker i delete

Operacja recovery przypisuje oczekiwaną generację w transakcji i zapisuje ją przy operacji. Custom token dla tej operacji otrzymuje właśnie tę utrwaloną wartość, nigdy aktualną generację odczytaną ponownie przy późnym mint. Podniesienie generacji i zmiana stanu konta są jednym krokiem transakcyjnym przed wydaniem końcowego dostępu. Spóźniony worker może zwrócić token starej generacji, lecz backend odmawia jego użycia po kolejnym obrocie. A2 określi dokładne fazy, ACK, ochronę wyniku, provider revoke oraz warunki zwolnienia rezerwacji.

Usuwanie oznacza konto jako `deleting` i podnosi generację w transakcji przed zewnętrznym kasowaniem i odwołaniem sesji. Tombstone tożsamości pozostaje barierą po usunięciu dokumentu użytkownika. Webhook RevenueCat i administrator nie mają claimu sesji użytkownika: ich istniejące uwierzytelnienie pozostaje osobne, ale mutacja celu nie może odtworzyć usuniętego konta i musi sprawdzić jego stan/generację w transakcji.

## Granice tras i magazynów

Kanoniczny katalog metod/ścieżek pozostaje w `src/api/openapi.ts`, a wspólne profile w `src/api/route-contract.ts`; nie dodawać drugiego rejestru tras. `bearer` i `app_check_bearer` wymagają aktualnej generacji po rozwiązaniu UID. `app_check_optional_bearer` bez nagłówka pozostaje ścieżką gościa, a z nagłówkiem wymaga pełnej walidacji (stary/błędny bearer nie staje się gościem). `app_check_verify_only_bearer` służy tylko rejestracji i ściśle ograniczonej wymianie sesji. `app_check_only` nie daje konta; consume recovery, guest privacy session oraz deletion status/proof mają własne ograniczone zdolności. `public` nie rozwiązuje konta i nie otrzymuje generacji. `admin` i webhook pozostają osobno uwierzytelnione, z kontrolą stanu konta będącego celem mutacji.

Guard żądania zwraca `userId` i `expectedAuthorizationGeneration`. Każdy zapis danych konta zależny od sesji sprawdza stan `active` i ten numer **w tej samej transakcji** co zapis; osobny wcześniejszy odczyt nie wystarcza. Obejmuje to profil/legal/purchase, progress/sync, entitlement, wnioski, raporty, recovery/reissue i wieloetapową adopcję. Każdy upload, seal, preview i confirm transferu, który zapisuje staging, również sprawdza aktywny stan i oczekiwaną generację w swojej transakcji; końcowy apply sprawdza je ponownie. Nieaktywność staging nie jest wyjątkiem od kontroli zapisu. Gdy istniejąca ścieżka nie pozwala na wspólną transakcję, B ma zaprojektować równoważną blokadę compare-and-write lub odmówić tej ścieżki do czasu przebudowy. Wrażliwy eksport sprawdza generację ponownie przed wysłaniem odpowiedzi; in-flight odczytu już wysłanego nie można cofnąć retroaktywnie.

## Dowód i wdrożenie

Test wyścigu: worker przypisuje generację `8` i czeka przed mint; drugi obrót ustala `9`; stary worker późno wydaje token `8`. Zarówno guard, jak i zapis w magazynie odmawiają, a żaden account-scoped endpoint nie oddaje danych dla `8`. Osobny test wstrzymuje zapis po guardzie, obraca generację i wymaga odmowy transakcji. Test wymiany wstrzymuje mint po przypięciu generacji i sprawdzeniu bariery; obrót w tym czasie nie może dać starej sesji tokenu nowej generacji. Macierz jest generowana z dokładnych metod/ścieżek `src/api/openapi.ts` i mapuje każdą trasę na odczyty oraz zapisy magazynów, nie tylko profil guardu. Jawnie obejmuje session revoke, guest privacy sessions, deletion proof/status, export audit i rate-limit writes, wszystkie fazy transferu, brak/błędny claim, optional bearer, sesję istniejącą przed migracją, registration/exchange, zwykły login po rotacji, admin/webhook, tombstone i odświeżenie custom-token sesji.

B wdraża w osobnych QA slice: (1) źródło/claim/guard i wymiana sesji z migracją; (2) propagacja oczekiwanej generacji i transakcyjne zabezpieczenie magazynów; (3) A2 recovery/reissue/ACK i spóźniony worker; (4) deletion, admin/webhook oraz pełna macierz. Do potwierdzenia części (2) nie wolno włączać przejmowania niepewnych operacji recovery.

**Ocena przed implementacją po podziale:** cel i architektura 0,85; prostota 0,82; ryzyko 0,82; utrzymywalność 0,84; minimum **0,82**. Cała zmiana jako jeden patch byłaby poniżej 0,8.

**Odbiór A1:** niezależne QA potwierdziło przypięcie generacji przy wymianie sesji, macierz dokładnych metod/ścieżek OpenAPI i transakcyjne sprawdzanie wszystkich zapisów staging transferu. Nie uruchamiano testów runtime, ponieważ A1 jest kontraktem projektowym. Zachowanie claimu po odświeżeniu custom-token sesji pozostaje warunkiem testowym wdrożenia B.
