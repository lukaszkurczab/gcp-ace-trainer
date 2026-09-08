# Ścieżka ODK-E2E-007–012

Data: 2026-09-08. Baza main i origin/main: `05e61bade20e5d128d36c3e224bfbc851b8367f1`, ponownie potwierdzona przez fetch. Początkowo brak zmian użytkownika. Status: ścieżka zweryfikowana, gotowa do pushu. Commit zawierający ten raport obejmuje zadania 007–012.

## Zakres

- 007: usunięty zbędny kontekst konta w Recovery codes.
- 008: automatyczne odświeżenie tożsamości po powrocie do aplikacji. Wspólna kolejka chroni komendy konta, sesję i reautoryzację Google.
- 009: osobny ekran oczekiwania na potwierdzenie nowego adresu. Stary błąd odświeżenia nie przechodzi do nowego żądania.
- 010: błędy nowego adresu i hasła przy właściwym polu Change email.
- 011: audyt formularzy. Potwierdzone rozbieżności mają zadania 089–094.
- 012: tożsamość pozostaje na głównym Settings. Usunięta z podstron. Dodatkowy błąd tłumaczenia Premium ma zadanie 095.

Każde zadanie ma osobny raport wdrożenia i weryfikacji w tym katalogu. Każdy brief zatwierdził niezależny agent gpt-5.6-luna / max. Minimalne oceny: 007 0,95; 008 0,83 i korekta Google 0,84; 009 0,84 i korekta starego błędu 0,87; 010 0,88; 011 0,87; 012 0,94. Korekta testu macierzy tras: 0,96. Niezależne QA nie zostawiło błędu w implementowanej delcie.

## Weryfikacja

Wąskie testy: 007 32/32, 008 42/42, 009 63/63, 010 65/65 (niezależne QA 95/95), 011 7/7, 012 65/65. Szczegóły poleceń i ograniczeń są w raportach zadań.

Końcowe `npm run qa:static`: exit 0. Recovery baseline i typecheck PASS. Testy 875/875 PASS, 0 skipped. Content boundary i runtime privacy boundary PASS. Pierwszy przebieg miał 874/875: brak nowej trasy 009 w macierzy visualShell. Po korekcie sam visualShell przeszedł 15/15, a cała brama 875/875. Nie ukryto awarii ani nie wyłączono testu.

Retesty: iPhone 17 / iOS 26.4. Konto hasłowe EN/dark; osobny pusty symulator gościa EN/light dla audytu 011. Rzeczywisty backend oraz Auth/Firestore emulatory. Potwierdzono powrót z Safari, zmianę adresu, błąd offline i odzyskanie połączenia, walidację pól oraz wygląd ekranów. Kontrole Firebase i backendu po zmianie adresu: 4/4. Częściowe flow i ich nieudane kroki są jawnie opisane w raportach. VoiceOver pominięto.

Końcowy retest 012: 17 obejrzanych screenshotów. Runy 015255 i 020023 miały błędy kroków opisane w raporcie 012; kontynuacja 020223 przeszła 33/33 polecenia, exit 0. Zakres wszystkich wejść z Settings został sprawdzony. Aktywna tabela zaczyna się od 013.

## Ryzyka i granice

Nowe zadania 089–095 pozostają aktywne. Nie zaliczono ich jako naprawionych. Nie testowano prawdziwej poczty, Google OAuth ani zakupu RevenueCat. Provider gate’y 082–088 pozostają osobno. Lokalne przekierowanie po poprawnym działaniu linku Firebase kończy się 404, opisanym w raporcie 008.

Brak zadań pominiętych po pięciu prośbach PO. Licznik próśb PO: 0. Automatyczny przegląd odrzucił próbę wylogowania testowego konta po sesji; audyt gościa wykonano bezpiecznie na nowym pustym symulatorze. Nie ma otwartej prośby o zgodę.

Ścieżek 003–006 nie powtarzano. Historyczne ograniczenie weryfikacji trzech końcowych korekt w 05e61ba pozostaje zgodne z informacją właściciela. Zmieniono jedynie nieaktualne oczekiwanie etykiety System w teście Settings, z osobną walidacją.

Nowe surowe dowody są tymczasowe. Po udanym pushu tej ścieżki zostaną usunięte. Raporty zachowują wyniki i identyfikatory przebiegów.
