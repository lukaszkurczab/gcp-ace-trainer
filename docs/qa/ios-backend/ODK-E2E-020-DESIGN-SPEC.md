# ODK-E2E-020 — projekt do decyzji PO

Status: ACCEPTED_PENDING_IMPLEMENTATION. PO wybrał wariant 3 po audycie zbiorczym. Nie wdrożono 021.

## Decyzja PO po audycie zbiorczym

PO zatwierdził `020=3`: nazwa tracka ma subtelny pionowy akcent. Licznik wcześniejszych prób pozostaje 5/5.

## Wspólny zakres

Zmiana dotyczy nagłówka i boksu tracka. Formularz, zapis i nawigacja pozostają wspólne. Tytuł trasy pozostaje Goal/Cel. W treści głównym nagłówkiem jest Set learning rhythm for this track / Ustaw rytm nauki dla tej ścieżki. Pod nim jest boks nazwy z t(track.shortTitle), np. Coding Interview / Rozmowa techniczna.

Kontekst powrotu pozostaje Settings/Ustawienia albo Progress/Postęp. Boks jest informacją, bez onPress i chevrona. Nagłówek występuje w edycji i podsumowaniu. Status celu pozostaje pod boksem w podsumowaniu; znana wada kolorów jest w101.

## Warianty

1. Boks z samą nazwą. Najmniej elementów i najwięcej miejsca na długą nazwę.
2. Boks z istniejącą ikoną flagi. Silniejszy znak wizualny; nazwa ma mniej miejsca.
3. Boks z pionowym akcentem. Wyróżnia kontekst kolorem bez dodatkowej ikony.

Obrazy tymczasowe: /private/tmp/patternly-path05/design020/option-1.png, option-2.png, option-3.png. Kolejność odpowiada kolejności wyników ImageGen pokazanych użytkownikowi. Każdy powstał osobnym wywołaniem wbudowanego narzędzia, z rzeczywistym zrzutem019-en-edit jako wejściem. Nie są dowodami E2E.

## Specyfikacja wdrożenia po wyborze

- Layout płynny, pełna dostępna szerokość ekranu. Standardowy padding ekranu pozostaje.
- Nagłówek: systemowy font, 28/34, semibold, textPrimary; bez limitu liczby linii, maxFontSizeMultiplier2.
- Odstęp nagłówka od boksu12, boksu od formularza24. Boks: padding16, radius16, border1, surface i border z aktualnego motywu. Bez stałej wysokości.
- Nazwa tracka:20/28, semibold, textPrimary, flexShrink1, bez obcinania i numberOfLines. Długie nazwy zawijają się. Przykład kontrolny Claude Architect Professional oraz polskie lokalizacje nazw.
- Wariant2: istniejąca Icon flag24, tło primarySoft; odstęp od nazwy12. Przy największym tekście można ułożyć ikonę nad nazwą, jeżeli szerokość tekstu tego wymaga.
- Wariant3: pionowy akcent3, primary, zachowany padding treści.
- Dark: background#081328, surface#0E1B31, text#F1F5F9. Light: background#F0F2F5, surface#FFFFFF, text#132033. Stosować tokeny motywu, nie dodatkowe palety.
- Polski nagłówek i nazwa mogą zajmować więcej linii. Cały ekran przewija się, sticky Save pozostaje dostępny. Nie ściskać formularza, by zmieścić go w jednej klatce.
- Loading zachowuje dynamiczny kontekst; placeholder odzwierciedla układ nagłówka i boksu.

Obrazy są kierunkiem wizualnym. Dokładne tokeny i zachowanie określa specyfikacja. Wariant3 w obrazie pominął etykietę sekcji Goal; wdrożenie zachowa istniejącą etykietę, zgodnie z zakresem ograniczonym do nagłówka. Nie przenosić tej różnicy do kodu.

## Weryfikacja po wdrożeniu

Oba wejścia, EN/PL, light/dark, standardowy i największy tekst, Coding Interview i długie nazwy. Sprawdzić edycję, zapis, podsumowanie, powroty i loading. Brak obcięcia oraz kolizji z Save. VoiceOver pominięty na życzenie użytkownika. Weryfikacji projektu nie przedstawiać jako retestu aplikacji.

## Kontrola kolorów specyfikacji

Obliczono stosunek luminancji tekstu i tła dla rzeczywistych tokenów: nazwa na boksie dark15,71:1, light16,38:1; nagłówek na tle dark16,90:1, light14,60:1. To obliczenie specyfikacji, nie pomiar wygenerowanych pikseli ani retest aplikacji.
