# ODK-E2E-018 — sesje wynikają z wybranych dni

Status: DONE po reteście E2E. Implementacja po zamknięciu 016.

## Fakty i plan

GoalRecord zapisuje niezależne weeklySessionTarget (1–7) i preferredDays (0–7). Domyślnie ma trzy dni i trzy sesje. Jedynymi konsumentami pól są ekran celu i testy. Repozytorium czyta i zapisuje rekord przez canonicalRecordCodec. Stare rekordy mogą mieć sprzeczne wartości albo puste dni. Nie ma jeszcze algorytmu planowania.

Usunąć stepper Weekly cadence. Liczba sesji ma wynikać z liczby dni. Zachować pole trwałego rekordu dla istniejących danych, z jednym normalizerem domenowym. Odczyt najpierw sprawdza kształt legacy, potem wyprowadza liczbę. Nie zapisuje zmiany samoczynnie. Puste stare dni zostają puste, z liczbą 0 i jawnym wymogiem wyboru dnia. Zapis wymaga co najmniej jednego dnia, porządkuje dni i wyprowadza liczbę. Nie wybiera dni za użytkownika. Zachowuje pozostałe pola.

## Niezależna walidacja

Agent gpt-5.6-luna / max, tylko brief, bez narzędzi. Zgodność celu 0,96; architektura 0,92; prostota 0,88; ryzyko 0,84; utrzymywalność 0,91. Minimum 0,84, APPROVE.

Warunek: nie odrzucać legacy2/4 przed normalizacją. Zachować kolejność guard → normalizer. Nie zapisywać podczas odczytu. Odrzucić pusty zapis bez naruszenia starego rekordu. Testować zachowanie pozostałych pól, kolejność dni i stabilny błąd UI/repo.

Sprawdzono goalContracts.ts, goalRepository.ts, canonicalRecordCodec.ts, learningReadModels.ts, GoalCadenceScreen.tsx, goalContracts.test.ts oraz referencje obu pól w aplikacji i backendzie. Brak implementacji i wyników testów. Licznik próśb PO: 0.

## Implementacja i testy

Pracownik gpt-5.6-luna / max zmienił goalContracts.ts, goalRepository.ts, GoalCadenceScreen.tsx, goalContracts.test.ts, goalCadencePresentation.test.ts, common.json EN/PL oraz runtimeSelectors.ts. Usunął stepper i jego nieużywane style, callbacki, selektor oraz copy. Jeden normalizer porządkuje dni i wyprowadza liczbę sesji. Repozytorium nie zapisuje podczas odczytu. Puste dane wymagają jawnego wyboru dni.

Pierwsze wąskie testy 13/13 PASS. Kontroler wykrył zbyt szerokie dopuszczenie target0 z niepustymi dniami oraz brak instrukcji w pustym podsumowaniu. Poprawiono oba warunki zgodnie z zatwierdzonym briefem. Draft aktualizuje pochodny target po zmianie dni. Po korekcie 14/14 PASS, typecheck PASS, diff check PASS. Test repo potwierdza odrzucenie0 z niepustymi dniami bez repair write.

Nie zmieniono nazw ekranu z019 ani planowania. Niezależne QA kodu gpt-5.6-luna / max: PASS.

## Retest iOS

- Maestro2026-09-08_040538:43/43 COMPLETED. Zapis1 i7dni z Settings, odczyt7 z Progress i zapis3dni. Liczba sesji zgadza się z wyborem. Brak steppera.
- Maestro2026-09-08_040652:18/18 COMPLETED. Odznaczenie wszystkich dni, próba zapisu, czytelny czerwony błąd i powrót. Ponowne otwarcie pokazuje niezmieniony wcześniejszy cel z3dniami.
- Obejrzano wszystkie6zrzutów. EN/dark, standardowy tekst, Coding Interview. Stare sprzeczne i puste rekordy zweryfikowano rzeczywistym repozytorium w testach; nie wstrzykiwano ich do danych symulatora.

Zaznaczony dzień ma tę samą wadę kolorów co Active. Rozszerzono istniejące101 o wybrane dni; problem pozostaje jawny w rejestrze. Brak regresji zapisu i powrotów. Dowody pozostają do pushu ścieżki. Licznik PO0.
