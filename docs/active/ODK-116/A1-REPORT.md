# ODK-116/A1 — walidacja konfiguracji platformowej

**Data:** 24.09.2026  
**Status:** done dla walidacji platformy; pełne ODK-116-A pozostaje otwarte.

`app.config.js` wymagał dla każdego buildu nie-testowego identyfikatorów klienta Google, plików Firebase i dostawców App Check obu platform. Jawny build iOS lub Androida zależał przez to od wartości drugiej platformy. Teraz jawny `EAS_BUILD_PLATFORM` wybiera wymagania własnej platformy, a konfiguracja bez wskazanej platformy zachowuje rygor obu zestawów. Wspólne publiczne pola Firebase nadal są wymagane; lokalny tryb smoke i pliki sandbox pozostały na istniejących ścieżkach. Release config nie emituje ścieżki pliku Firebase przeciwnej platformy.

Testy obejmują iOS i Android, sandbox i release, brak pól drugiej platformy, odmowę brakujących własnych pól, wymaganie iOS RevenueCat oraz rygor bez wskazanej platformy. Nie wprowadzono prawdziwych danych operatora, sekretów ani zmian w natywnych projektach. Szablony i pozostałe repozytoria należą do kolejnych części ODK-116-A.

**Ocena przed zmianą:** zgodność 0,94; prostota 0,90; kontrola ryzyka 0,86; utrzymywalność 0,90; minimum **0,86**. Niezależny walidator `gpt-6-luna/high` zaakceptował poprawiony briefing po uwzględnieniu platformowych Google client ID. Wykonawca `gpt-6-luna/medium`.

**Weryfikacja wykonawcy:** test konfiguracji 12/12 PASS, `npm run typecheck` PASS, `git diff --check` PASS. Niezależne QA `gpt-6-luna/high`: **PASS** po doprecyzowaniu asercji błędów dla obu platform, obu trybów i wspólnych pól Firebase.
