# ODK-E2E-020 — projekt nagłówka i kontekstu tracka

Status: DONE — PO wybrał wariant 3. Projekt wdrożono i zweryfikowano w ODK-E2E-021.

## Zakres projektu

Wspólny Goal zachowa kontekst powrotu Settings/Progress. Główny nagłówek: Set learning rhythm for this track. Pod nim nazwa tracka w boksie. Formularz, dni, data, przypomnienia i sticky Save pozostają bez zmian. Projekt nie wdraża 021.

Źródła: obejrzane zrzuty iOS016, GoalCadenceScreen, theme/tokens.ts i trackRegistry.ts. Kontekst Product Design nie ma zapisanych dodatkowych źródeł; używamy aktualnego repo i aplikacji.

Trzy planowane warianty różnią boks tracka: zwarta karta tekstowa, karta z istniejącą ikoną flagi, karta z subtelnym pionowym akcentem. Wspólna hierarchia i aktualne kolory Patternly. Każdy obraz dostanie rzeczywisty zrzut wejściowy. Obrazy będą projektem, nie dowodem E2E.

Specyfikacja obejmie EN/PL, oba motywy, oba konteksty, długie nazwy, font scale 2, elastyczną wysokość i brak obcinania. Nazwy tracków pochodzą z t(track.shortTitle), zgodnie z aktualnym ekranem. Polski nagłówek do przedstawienia wraz z projektem: Ustaw rytm nauki dla tej ścieżki. VoiceOver pominięto na życzenie użytkownika.

## Walidacja briefu

Niezależny gpt-5.6-luna / max, bez narzędzi. Zgodność celu i architektury 0,95; prostota 0,90; ryzyko 0,84; utrzymywalność 0,92. Minimum 0,84, APPROVE. Warunki: jawne tłumaczenie i źródło nazwy, porównywalne warianty, rzeczywisty obraz wejściowy, decyzja PO przed 021.

Licznik próśb PO: 5/5, bez odpowiedzi. Nie ma pominięcia ani zgody domyślnej.

## Projekt przedstawiony

Wbudowany ImageGen wygenerował trzy osobne obrazy, pokazane w kolejności1/2/3. Każdy otrzymał rzeczywisty zrzut019-en-edit (obejrzany przed wywołaniem), kolory aktualnego motywu, dokładny nagłówek i ograniczenie zmiany do nagłówka/boksu. Obrazy obejrzano. Specyfikacja ODK-E2E-020-DESIGN-SPEC.md opisuje tokeny, oba motywy, EN/PL, długie nazwy i skalowanie. Wariant3 pominął etykietę sekcji Goal; specyfikacja jawnie zachowuje tę etykietę, bez przeniesienia odstępstwa do kodu.

Próba PO1/5: pytanie asynchroniczne z trzema pokazanymi wariantami, ich wpływem i polskim nagłówkiem. Odpowiedź pozwala rozpocząć021. Brak odpowiedzi nie oznacza wyboru. Nie wdrożono021. Bezpieczna praca w oczekiwaniu: brama regresji dotychczasowego zakresu i dopracowanie specyfikacji.

Próba PO2/5: nowy stan — końcowa brama dotychczasowych zmian884/884 PASS. Poproszono o sam numer1/2/3. Brak odpowiedzi na próbę1;021 nadal niewdrożone.

Próba PO3/5: uproszczono decyzję do akceptacji rekomendowanego wariantu1. Uzasadnienie: najmniej elementów i najwięcej miejsca na długie nazwy. Pozostałe warianty nadal dostępne. Odpowiedzi brak;021 pozostaje niewdrożone.

Próba PO4/5: przekazano nowe ustalenia niezależnego przeglądu i sprawdzenie kontrastu tokenów. Przegląd gpt-5.6-luna / max: PASS warunkowy; brak blokującej niespójności architektury. Obrazy mają około850×1850 i pokazują tylko EN/dark/Coding Interview; pozostałe stany są opisane w specyfikacji i wymagają realnego retestu021. Nie przypisujemy obrazom pełnej macierzy E2E. Nazwy tracków zachowują aktualny kanoniczny t(track.shortTitle); nie dodajemy nowego fallbacku ani niezależnych tłumaczeń nazw własnych.

Próba PO5/5: wskazano gotowy projekt/specyfikację i skutek braku odpowiedzi — blokada020 oraz zależnego021, potem022. Pozostawiono wszystkie trzy warianty. Ostatnia prośba jest nadal otwarta; nie uznano milczenia za zgodę.

## Historyczna blokada

Po pięciu prośbach i wykonaniu bezpiecznych przygotowań nie otrzymano wyboru. W tamtym stanie zadania020 i021 pozostawały aktywne jako BLOCKED. Późniejsza zbiorcza decyzja PO zakończyła tę blokadę.

## Decyzja PO po audycie zbiorczym

PO zatwierdził `020=3`. Bloker projektu został rozwiązany. Wcześniejszy licznik pozostaje 5/5. Wdrożenie i pełny retest opisuje ODK-E2E-021-IMPLEMENTATION-REPORT.md. Zadanie usunięto z aktywnego rejestru.
