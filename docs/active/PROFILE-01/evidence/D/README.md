# PROFILE-01/D — dowód iOS/Maestro

**Data:** 24.09.2026. **Urządzenie:** istniejący iPhone 17, iOS 26.4, `7F315654-3175-4F3C-BB24-B0263F59360C`. Bez `clearState`, reinstalacji, resetu symulatora i drugiego urządzenia.

1. Lokalny Auth, Firestore, Metro i API `/ready` działały. Utworzono jedno izolowane konto w emulatorze przez UI. Konto osiągnęło Home i Ustawienia. Dane logowania nie są częścią tego pakietu.
2. API `127.0.0.1:8080` zatrzymano; próba `/ready` zwróciła odmowę połączenia. Auth, Firestore i Metro pozostały uruchomione. `settings-sign-out` wylogował lokalnie, a na ekranie logowania pojawiło się `account-remote-revoke-pending`.
3. Maestro wykonał `stopApp` i `launchApp` bez czyszczenia stanu. Ostrzeżenie pozostało widoczne: [pending-after-restart.png](pending-after-restart.png). API uruchomiono ponownie i `/ready` potwierdziło bazę, Auth i odczyt providera.
4. Zachowany Gość był dostępny przed testem: [guest-before.png](guest-before.png). Pierwsze kliknięcie opcji Gościa po wylogowaniu pozostawiło ekran logowania bez widocznego błędu; przyczyna nie została ustalona. Powtórne kliknięcie otworzyło Home, a zwykły restart potwierdził `patternly:content:ready` i `patternly:home:primary-action`: [guest-after.png](guest-after.png).

Przebieg restartu ostrzeżenia zapisano w [pending-restart.yaml](pending-restart.yaml), a restartu Gościa w [guest-restart.yaml](guest-restart.yaml). Próba rejestracji nie pokazała wyboru adopcji, bo podgląd wskazywał zero rekordów nauki. Kontynuacja używa istniejącej ścieżki `discardGuestData()` dla tego przypadku; weryfikacja urządzeniowa dowodzi powrotu do Home i tej samej widocznej ścieżki Coding, ale nie dowodzi identyczności wszystkich bajtów danych Gościa. Pełną izolację i obie decyzje adopcji odbierają `PROFILE-04/06`.
