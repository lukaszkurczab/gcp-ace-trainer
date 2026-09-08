# ODK-E2E-025 — godziny przypomnień

Status: IMPLEMENTED. PO wybrał wariant 2 po audycie zbiorczym. Wdrożenie i retest zakończono w ODK-E2E-025-IMPLEMENTATION-REPORT.md.

## Decyzja PO po audycie zbiorczym

PO zatwierdził `025=2`. Checkbox włącza osobne godziny i pokazuje listę wybranych dni. Bez zaznaczenia obowiązuje jedna wspólna godzina.

## Cel i granice

Użytkownik ustawia jedną godzinę dla dni celu albo inną godzinę dla każdego dnia. Dni pochodzą z Goal. Ten edytor nie zmienia dni. Pokazuje nazwę wskazanej ścieżki.

Projekt dotyczy godzin jednego celu. Decyzja024 ogranicza przypomnienia do aktualnej ścieżki. Zapis i aktualizacja natywnych powiadomień działają dla dni aktywnego celu.

## Źródła

Obejrzano aktualny edytor na iOS: Maestro2026-09-08_045809, 11/11 poleceń COMPLETED (według commands.json), bez zapisu i zmiany zgody. Zrzut025-existing-editor. Sprawdzono NotificationSettingsScreen, SettingsBottomSheet, ScreenHeader, goalContracts i tokeny.

Obrazy powstały osobno w ImageGen, z dołączonym rzeczywistym zrzutem. Kolejność wyświetlenia jest wiążąca:

| Numer | Kierunek | Źródło |
| --- | --- | --- |
| 1 | Segmenty trybu i lista dni | exec-51fd6556-a6dd-4e2f-b84c-300ea3e18e64.png |
| 2 | Checkbox wspólnej godziny i lista dni | exec-a6de2edf-99dd-4a22-8976-b2fdc9a6902b.png |
| 3 | Radia trybu, wybór dnia i jedno pole | exec-2a40d27f-e78a-4844-9fa3-f8734f70296a.png |

Oryginały są w /Users/lukaszkurczab/.codex/generated_images/01a07d8f-16a0-7a60-b82c-8f796d361fe9/. Kopie robocze: /private/tmp/patternly-path06/design025/option-1.png do option-3.png. Docelowy format promptów1206×2622. Rzeczywiste rozmiary wyników:1=850×1851,2=859×1831,3=850×1850. Wynik jest obrazem kierunkowym, nie pomiarem pikselowym ani dowodem E2E.

## Wspólny kontrakt

- Nagłówek: Reminder times / Godziny przypomnień. Pod nim lokalizowana nazwa ścieżki.
- Dni: skróty zgodne z językiem; identyfikatory mon–sun bez zmian. Długa nazwa zawija się.
- Wspólna godzina: jedno pole HH:MM. Wartość obowiązuje we wszystkich dniach celu.
- Osobne godziny: każdy dzień ma własną wartość. Lista jest w kolejności mon–sun. Nie wolno zapisać dnia bez poprawnej godziny.
- Przejście do osobnych godzin kopiuje wspólną wartość do dni bez wartości w szkicu. Przełączanie trybu w otwartym edytorze nie usuwa jego szkicu.
- Zapis utrwala tylko wybrany tryb. Szkic drugiego trybu znika po wyjściu. Close nie zapisuje zmian.
- Nowy dzień w trybie osobnym dziedziczy godzinę pierwszego istniejącego dnia w kolejności mon–sun. Jeśli brak wartości, używa20:00. Wartość jest widoczna i edytowalna. Obraz3 pokazuje przykład środy dodanej z godziną poniedziałku.
- Usunięty dzień znika z listy. Moment zastosowania zmiany w natywnym harmonogramie musi określić024/034. Sam obraz nie zatwierdza tego zachowania.
- Save reminders / Zapisz przypomnienia zapisuje cały wybrany tryb. Błąd pozostawia wartości i daje ponowienie. Nie pokazuje sukcesu po częściowym błędzie.

## Warianty

1. Segmenty Same time / By day, w PL Wspólna / Osobno. Poniżej jedno pole albo lista dni z godziną i chevronem. Przy dużym tekście segmenty mogą ułożyć się pionowo.
2. Checkbox Use the same time for all days / Ta sama godzina we wszystkie dni. Zaznaczony: jedno pole. Niezaznaczony: lista godzin. Cały wiersz jest akcją, etykieta może zawijać się.
3. Dwa radia Same time every day / Different times by day. W PL Wspólna godzina / Osobne godziny. W drugim trybie wybór dnia i jedno pole. Podsumowanie godzin wszystkich dni pozostaje widoczne. Przy braku szerokości przyciski dni oraz podsumowanie zawijają się.

## Wygląd i dostępność

Istniejący SettingsBottomSheet. Treść przewijana. Żadnej stałej wysokości, która obcina formularz przy dużym tekście. Tytuł22/28 semibold, body14–16, padding20, odstępy16–24. Pola i akcje mają minimum44pt. Close i Save pozostają osiągalne z klawiaturą. Powiększenie tekstu do2×, EN/PL, oba motywy.

Dark: background081328, sheet0F172A, border1E293B, textF1F5F9, secondaryAAB6C8, primary20C997, onPrimary081328. Light: backgroundF0F2F5, ogólny surfaceFFFFFF, bottomSheet.surfaceF7FAF9, text132033, primary0F766E. Token komponentu bottomSheet ma pierwszeństwo dla panelu. Użyć aktualnych tokenów komponentów, bez nowych stałych kolorów.

Obrazy nie są dokładną specyfikacją kolorów. Nie przenosić gradientów przycisku. W obrazie3 wybrany dzień ma białe litery na jasnej mięcie; wdrożenie ma użyć onPrimary albo jasnego tekstu na primarySoft. Tło obrazu2 dodaje blok Goal: to nie jest rozszerzenie zakresu i nie należy go wdrażać. Kontekst pod przyciemnieniem nadal zależy od źródła023.

## Stany do wdrożenia i retestu

Brak celu: komunikat „Ustaw cel, aby wybrać dni przypomnień” i wejście do Goal. Cel wstrzymany: jawny status, bez obietnicy aktywnych przypomnień. Brak dni w starym celu: akcja poprawienia celu. Zgoda systemowa pozostaje osobnym stanem; brak zgody nie może dawać fałszywego sukcesu. Błąd czasu pokazuje prosty komunikat pod polem. Błąd zapisu zachowuje szkic. Utrata dnia przy aktualizacji celu jest widoczna w podsumowaniu.

Retest przyszłego wdrożenia: oba tryby, przełączanie bez utraty szkicu, zapis/ponowne otwarcie, anulowanie,1/3/7dni, nowy/usunięty dzień, brak celu, paused, odmowa zgody, błąd zapisu, EN/PL, dark/light, duży tekst i klawiatura. VoiceOver pominięto na polecenie właściciela.

## Walidacja i decyzja

Niezależny gpt-5.6-luna / max, tylko brief. Pierwsza ocena min0,87. Po doprecyzowaniu szkicu i nowego dnia: zgodność0,97; prostota0,92; ryzyko0,91; utrzymywalność0,94. Minimum0,91, APPROVE. Brak wyboru PO.

## Uzupełnienia po niezależnym QA

Wejście z Goal wskazuje trackId. Wejście z Settings wstępnie wskazuje aktywny track. Zakres innych celów i sposób ich wyboru pozostają decyzją024. Edytor025 zawsze pracuje na jednym wskazanym celu. Brak wybranego tracka daje akcję wyboru ścieżki, nie wymyśloną nazwę.

| EN | PL |
| --- | --- |
| Reminder times | Godziny przypomnień |
| Close | Zamknij |
| Save reminders | Zapisz przypomnienia |
| Same time | Wspólna |
| By day | Osobno |
| Use the same time for all days | Ta sama godzina we wszystkie dni |
| Set each day below. | Ustaw godzinę dla każdego dnia. |
| Same time every day | Wspólna godzina |
| Different times by day | Osobne godziny |
| Use your goal days: {{days}}. | Dni z celu: {{days}}. |
| New day · Time copied from {{day}} | Nowy dzień · Godzina z dnia {{day}} |
| Set a goal to choose reminder days. | Ustaw cel, aby wybrać dni przypomnień. |
| Set goal | Ustaw cel |
| Goal paused | Cel wstrzymany |
| Choose a track | Wybierz ścieżkę |
| Use a valid time, for example20:00. | Podaj poprawną godzinę, np.20:00. |
| Reminders could not be saved. Try again. | Nie udało się zapisać przypomnień. Spróbuj ponownie. |

Skróty EN: Mon, Tue, Wed, Thu, Fri, Sat, Sun. PL: pon., wt., śr., czw., pt., sob., niedz. Pełne nazwy dni mają istniejące tłumaczenia common. Podsumowanie jest składane z lokalizowanych skrótów i godzin, nie z angielskiego stałego ciągu. Wdrożenie nie może kopiować obecnych zahardkodowanych skrótów z Goal; istniejąca wada jest osobnym102. Brak tych nowych kluczy w kodzie jest oczekiwany przed wdrożeniem projektu.

Obecny panel ma maxHeight86%, a Save jest w przewijanej treści. Macierz przyszłego retestu musi sprawdzić7dni, skalę2× i otwartą klawiaturę. Nie twierdzimy, że obrazy dowodzą tego stanu.
