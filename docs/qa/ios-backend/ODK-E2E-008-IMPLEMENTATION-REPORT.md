# ODK-E2E-008 — automatyczne odświeżanie danych konta

Status: `VERIFIED_CLOSED`. Praca: 2026-09-07–08. Commit i push nastąpią po całej ścieżce 007–012.

## Przyczyna i zakres

Po powrocie z linku potwierdzającego aplikacja nie odświeżała danych. Istniejąca operacja Firebase → backend działała tylko po kliknięciu ręcznego przycisku. Potwierdzono to w Maestro przed zmianą: stary adres po Safari; poprawny adres po manual refresh.

Sprawdzono rejestr, AGENTS.md, App.tsx, AccountSessionProvider, accountCommandGuards, Firebase auth client, PatternlyApiClientAdapter, AccountSecurityScreen, globalny clipboard guard, locale EN/PL i testy account. Kod i bieżące testy były źródłem prawdy.

Zmienione pliki:

- App.tsx: globalny listener powrotu pod providerem.
- AccountForegroundRefreshSidecar.tsx oraz accountForegroundRefresh.ts/test: reakcja na foreground, scalanie powrotów, odrzucanie nieaktualnych sesji i cleanup.
- AccountSessionProvider.tsx oraz accountIdentityComposition.test.ts: Firebase reload/token, backend getMe, kontrola UID/generacji, zachowanie najnowszych accountData i błędu refresh.
- accountCommandGuards.ts/test: oczekiwanie na aktywne operacje, ochrona grantu usunięcia oraz blokada nowych refreshów na czas promptu Google.
- AccountSecurityScreen.tsx: usunięcie ręcznego przycisku, prezentacja błędu refresh i obsługa blokady Google.
- locales/en/settings.json i locales/pl/settings.json: instrukcja automatycznego odświeżenia; usunięte osierocone identityRefreshed i refreshIdentity.

Nie zmieniono backendu ani kontraktu API. Osobny ekran oczekiwania należy do 009, a walidacja pól do 010. Nie dodano nowych zależności.

## Walidacja i QA

Każda delegacja: **gpt-5.6-luna / max**. Walidatorzy oceniali wyłącznie brief, bez narzędzi i repo.

| Brief | Zgodność | Prostota | Ryzyko | Utrzymywalność | Minimum |
| --- | --- | --- | --- | --- | --- |
| Główna implementacja | 0,94 | 0,83 | 0,84 | 0,90 | 0,83 — APPROVE |
| Korekta kolizji Google | 0,95 | 0,86 | 0,84 | 0,90 | 0,84 — APPROVE |

Pierwsze QA wykryło P1: foreground refresh mógł zająć kolejkę przed callbackiem Google. Naprawiono to w istniejącej kolejce. Jawna komenda czeka na trwający refresh, także zakończony błędem. Dwie jawne komendy nadal nie działają równolegle. Google blokuje nowe refreshe przed promptem; callback, anulowanie, błąd i unmount zwalniają blokadę idempotentnie. Sprawdzenie i zajęcie kolejki jest synchroniczne.

Końcowe QA: **PASS**. Początkową lukę testów kompozycji zamknięto dwoma testami przeplotów callback/hold/foreground. Testy potwierdzają sukces submitu i maxActive=1. Nie ma wymogu priorytetu submitu nad już oczekującym refreshem: dopuszczalna kolejność refresh → queued refresh → command pozostaje szeregowa. Po finalnym retescie E2E zmieniono wyłącznie testy, bez zmian produkcyjnych.

## Testy

Node z `/opt/homebrew/opt/node@22/bin`.

- `node --import tsx --test src/application/account/accountCommandGuards.test.ts src/application/account/accountForegroundRefresh.test.ts src/application/account/accountIdentityComposition.test.ts`: **42/42 pass**, także w niezależnym QA.
- `npm run typecheck`: **pass**, wykonawca i niezależne QA na finalnym kodzie produkcyjnym.
- `git diff --check`: **pass**, także po końcowym uzupełnieniu testów.
- Testy obejmują błąd refreshu, konflikt dwóch komend, holdy, callback Google, cleanup, nieaktualne UID/sesję, najnowsze accountData oraz zachowanie grantu usunięcia.

## Finalny retest iOS/Maestro

iPhone 17, iOS 26.4, EN, dark, standardowy tekst. Izolowane Metro 28083, backend 28084, Firebase Auth 29199 i Firestore 38181. Po restarcie własnego Metro potwierdzono świeży bundle (1673 moduły), proces aplikacji 57315. Istniejącego serwera użytkownika na 8081 nie zmieniono.

| Przepływ | Run | Wynik |
| --- | --- | --- |
| 008-google-fix-request.yaml | 2026-09-07_235052 | 13/13 komend, exit 0 |
| 008-google-fix-return.yaml | 2026-09-07_235208 | 3/3 komendy, exit 0 |
| 008-offline.yaml | 2026-09-07_235240 | 3/3 komendy, exit 0 |
| 008-google-fix-recovered.yaml | 2026-09-07_235322 | 3/3 komendy, exit 0 |

Wysłano rzeczywiste żądanie dla konta emulatora. Link VERIFY_AND_CHANGE_EMAIL otwarto w Safari. Po powrocie aplikacja sama pokazała path03-google-fix@example.com; ręczny przycisk był nieobecny. Firebase email, identityMappings.email i users.contactEmail były zgodne; emailVerified=true: **4/4 kontrole, exit 0**. Kontrolowane wstrzymanie backendu pokazało błąd. Po wznowieniu backendu i kolejnym powrocie błąd zniknął, adres pozostał poprawny. Backend został wznowiony.

Kontroler obejrzał pełne screenshoty powrotu, błędu i odzyskania. Dowody: `/private/tmp/patternly-path03`, manifest-008.json. Zachować tylko do zakończenia i pushu ścieżki, potem usunąć nowe dowody.

## Ograniczenia i blokery

Retest używał konta hasłowego. Nazwy plików wskazują wersję poprawki Google, nie rzeczywisty OAuth Google. Przeplot Google pokrywają testy logiki i przegląd kodu; provider OAuth nie został uruchomiony. RN AppState sprawdzono w rzeczywistym przepływie iOS, bez osobnego testu montowania komponentu.

Lokalny emulator wykonuje zmianę adresu, po czym redirect prowadzi do backendu bez strony web (404). To ograniczenie środowiska; zgodność Firebase i backendu sprawdzono odczytem, bez udawania poprawnej strony potwierdzenia.

Brak otwartego błędu w zakresie 008. Decyzje PO: niewymagane, licznik próśb 0. VoiceOver pominięty. Brama całej ścieżki i push pozostają do wykonania.
