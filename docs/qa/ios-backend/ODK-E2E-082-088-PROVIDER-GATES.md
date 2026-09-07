# ODK-E2E-082–088 — pozostałe gate’y providerowe

Data przygotowania: 2026-09-07

Dokument rozdziela nierozliczone prace providerowe wykryte w końcowych gate’ach ODK-E2E-061 i ODK-E2E-075. Żadne z poniższych zadań nie może zostać zamknięte wyłącznie dowodem lokalnym.

## ODK-E2E-082 — aktywacja brakujących TTL w GCP

- **Cel:** doprowadzić aktywną konfigurację Firestore TTL do zgodności z repozytoryjnym kontraktem 22 kolekcji.
- **Zakres:** `legalRequests`, `legalRequestRateLimits`, docelowy projekt GCP, kontrola stanu wdrożenia.
- **Poza zakresem:** zmiana okresów retencji i rozszerzanie modelu danych.
- **Wejścia:** `patternly-backend/config/firestore-ttl.json`, skrypty apply/check oraz raport ODK-E2E-075.
- **Kryteria akceptacji:** obie brakujące polityki są `ACTIVE`; pełny odczyt pokazuje dokładnie wymagane `22/22`; retencja 6 lat dla zamkniętych spraw konsumenckich pozostaje zgodna z legal hold.
- **Weryfikacja:** dry-run, autoryzowane wdrożenie, odczyt tylko do odczytu po propagacji oraz test kontraktu repozytorium.
- **Wymagany dowód:** identyfikator projektu, timestamp, lista 22 polityk i wynik checkera bez sekretów.
- **Ryzyka:** TTL usuwa dane nieodwracalnie; wymagane jest potwierdzenie projektu i osobna autoryzacja przed wdrożeniem.
- **Raport:** `ODK-E2E-082-IMPLEMENTATION-REPORT.md`.

## ODK-E2E-083 — finalny artefakt prywatności i App Store Connect

- **Cel:** potwierdzić zgodność finalnego binarnego wydania iOS z manifestem oraz deklaracjami App Store Connect.
- **Zakres:** clean archive, Xcode Privacy Report, `PrivacyInfo.xcprivacy`, wszystkie SDK i ręczny formularz ASC dla tego samego builda.
- **Poza zakresem:** testowanie treści Terms/Privacy, hashe i podpisy dokumentów prawnych.
- **Wejścia:** bieżący manifest, `ODK-E2E-064-APP-STORE-DISCLOSURE.md`, finalny commit i numer builda.
- **Kryteria akceptacji:** raport Xcode i ASC są zgodne z faktycznie użytymi SDK; Purchase History jest linked, bez trackingu, dla App Functionality i Analytics; nie ma niewyjaśnionych kategorii.
- **Weryfikacja:** ręczne porównanie archive → Privacy Report → manifest → ASC, z jawnie zapisanym buildem.
- **Wymagany dowód:** commit SHA, build, eksport raportu Xcode i potwierdzenie formularza ASC.
- **Ryzyka:** zależności mogą dodać deklaracje dopiero w finalnym archiwum; każda zmiana SDK lub RevenueCat unieważnia dowód.
- **Raport:** `ODK-E2E-083-IMPLEMENTATION-REPORT.md`.

## ODK-E2E-084 — App Check na prawdziwym providerze

- **Cel:** wykazać egzekwowanie App Check na publicznych granicach backendu.
- **Zakres:** endpointy content report, legal request i privacy request; poprawny, brakujący i niepoprawny token.
- **Poza zakresem:** omijanie kontroli produkcyjnych i testowanie sekretów w logach.
- **Wejścia:** docelowa konfiguracja Firebase App Check, finalny klient i wdrożony backend.
- **Kryteria akceptacji:** poprawna atestacja przechodzi; brak lub fałszywy token jest odrzucany fail-closed; odpowiedź i log nie ujawniają danych wrażliwych.
- **Weryfikacja:** macierz 3 stanów tokenu na każdym publicznym endpointcie oraz kontrola zanonimizowanych logów.
- **Wymagany dowód:** środowisko, build, endpoint, status HTTP/correlation ID i wynik bez tokenów.
- **Ryzyka:** tryb debug nie może być przedstawiony jako dowód produkcyjnej atestacji.
- **Raport:** `ODK-E2E-084-IMPLEMENTATION-REPORT.md`.

## ODK-E2E-085 — App Store sandbox i RevenueCat lifecycle

- **Cel:** zweryfikować prawdziwy cykl miesięcznej subskrypcji Premium bez triala.
- **Zakres:** zakup, natychmiastowy start, anulowanie, restore, refund, zmiana ceny, webhook, idempotencja i trwałe potwierdzenie.
- **Poza zakresem:** produkcyjna sprzedaż i tworzenie fikcyjnej konfiguracji SKU/ceny.
- **Wejścia:** prawdziwe sandbox SKU, konfiguracja RevenueCat, webhook backendu i konto testowe 18+.
- **Kryteria akceptacji:** entitlement ma jedno źródło prawdy; zdarzenia powtórzone lub poza kolejnością nie psują stanu; użytkownik poniżej 18 lat nie kupuje; brak zgód lub konfiguracji blokuje zakup; potwierdzenie powstaje dopiero po potwierdzonym webhooku.
- **Weryfikacja:** udokumentowana macierz stanów App Store/RevenueCat wraz z odczytem aplikacji i backendu.
- **Wymagany dowód:** build, sandbox transaction IDs zredagowane do bezpiecznej postaci, typy eventów, projekcja entitlementu i delivery status.
- **Ryzyka:** zmiana ceny i refund mogą wymagać czasu lub ręcznej operacji Apple; nie wolno zastąpić ich mockiem.
- **Raport:** `ODK-E2E-085-IMPLEMENTATION-REPORT.md`.

## ODK-E2E-086 — prawdziwy transport SMTP/Google Workspace

- **Cel:** potwierdzić dostarczanie wiadomości dla praw konsumenckich, DSAR i trwałego potwierdzenia zakupu.
- **Zakres:** docelowa skrzynka/nadawca, routing, retry, błędy transportu i treść wiadomości bez sekretów.
- **Poza zakresem:** obietnica automatycznego zawieszania kont lub odzyskania usuniętego postępu.
- **Wejścia:** zatwierdzona konfiguracja SMTP/Google Workspace i środowisko backendu.
- **Kryteria akceptacji:** odbiór, odpowiedź i trwałe potwierdzenie są dostarczane do kontrolowanej skrzynki; błędy są jawne i nie udają sukcesu; reklamacja zachowuje termin odpowiedzi 14 dni.
- **Weryfikacja:** prawdziwe wiadomości dla konta i gościa, przypadek sukcesu, odrzucenia i niepewnego wyniku.
- **Wymagany dowód:** zredagowane Message-ID, timestamp, typ sprawy, delivery status i wpis audytu.
- **Ryzyka:** dane testowe muszą być minimalne; brak prawdziwego transportu utrzymuje status pending.
- **Raport:** `ODK-E2E-086-IMPLEMENTATION-REPORT.md`.

## ODK-E2E-087 — produkcyjne dane prawne i governance poza repozytorium

- **Cel:** zastąpić placeholdery prawdziwymi, zatwierdzonymi informacjami wymaganymi przed publikacją.
- **Zakres:** operator, kontakty, SKU/cena, procesorzy, odbiorcy, regiony, transfery oraz potwierdzenie DPA/TIA/LIA/RoPA w prywatnym magazynie.
- **Poza zakresem:** rejestr governance w kodzie, hashe, podpisy, manifesty, walidatory lub testy dokumentów prawnych.
- **Wejścia:** `src/legal/legalVariables.ts`, aktywna konfiguracja usług i prywatne dokumenty właściciela.
- **Kryteria akceptacji:** publiczny tekst opisuje faktyczny stan bez placeholderów; aktywni dostawcy i transfery są rozliczeni; publikacja pozostaje fail-closed przy brakach.
- **Weryfikacja:** ręczne zatwierdzenie właściciela/prawnika oraz porównanie ze stanem providerów.
- **Wymagany dowód:** checklista zatwierdzenia bez kopiowania prywatnych umów do repozytorium.
- **Ryzyka:** część dowodów jest poza repozytorium i musi mieć wskazanego właściciela.
- **Raport:** `ODK-E2E-087-VERIFICATION-REPORT.md`.

## ODK-E2E-088 — urządzeniowy retest Legal/Privacy

- **Cel:** potwierdzić krytyczne zachowania systemowe, których nie dowodzi emulator ani test jednostkowy.
- **Zakres:** eksport, Delete account, schowek recovery codes, migracja/reinstall Keychain/MMKV, EN/PL, konto/gość i granica wieku.
- **Poza zakresem:** odzyskanie usuniętego postępu; kwalifikujący się zakres danych nieosobowych może być pusty.
- **Wejścia:** finalny build, fizyczne urządzenie i prawdziwe środowisko testowe.
- **Kryteria akceptacji:** eksport i usunięcie działają end-to-end; Delete account jest dostępne w aplikacji; schowek czyści wyłącznie niezmieniony kod, gdy platforma pozwala; młodszy gość może się uczyć, lecz nie tworzy samodzielnie konta ani nie kupuje Premium.
- **Weryfikacja:** macierz EN/PL × gość/konto × poniżej/powyżej 18 lat oraz restart/reinstall/background.
- **Wymagany dowód:** wersja urządzenia i builda, kroki, wyniki oraz minimalne zrzuty bez danych osobowych.
- **Ryzyka:** zachowania schowka i Keychain zależą od systemu i muszą być opisane bez obietnicy gwarantowanego usunięcia.
- **Raport:** `ODK-E2E-088-DEVICE-RETEST-REPORT.md`.

## Status zbiorczy

| Zadanie | Status roboczy | Zależność |
| --- | --- | --- |
| ODK-E2E-082 | planned | autoryzowany dostęp do docelowego GCP |
| ODK-E2E-083 | blocking | finalny commit/build oraz dostęp do App Store Connect |
| ODK-E2E-084 | blocking | prawdziwa konfiguracja App Check i wdrożony backend |
| ODK-E2E-085 | blocking | SKU, App Store sandbox i RevenueCat |
| ODK-E2E-086 | blocking | SMTP/Google Workspace |
| ODK-E2E-087 | blocking | decyzje właściciela i prywatne dokumenty |
| ODK-E2E-088 | blocking | finalny build, urządzenie i skonfigurowane środowisko |
