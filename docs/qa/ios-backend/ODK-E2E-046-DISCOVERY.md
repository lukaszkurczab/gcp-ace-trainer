# ODK-E2E-046 — audyt opisów

Status: VERIFIED_CLOSED

## Kryterium

Opis usuwamy tylko wtedy, gdy powtarza oczywistą nazwę i nie dodaje instrukcji, stanu, skutku, ograniczenia ani informacji prawnej.

## Wynik

Jedyny potwierdzony redundantny opis to `settingsDescription` pod tytułem Settings. Został usunięty w ODK-E2E-045 z ready, loading oraz tłumaczeń EN i PL.

Nie potwierdzono drugiego przypadku do usunięcia.

## Klasyfikacja

| Obszar | Decyzja | Powód |
| --- | --- | --- |
| Home i puste stany | Zostawić | Wyjaśniają następny krok albo brak danych. |
| Progress i Activity | Zostawić | Podają zakres, stan, datę i znaczenie dowodu. |
| Track selection | Zostawić | Wyjaśnia skutek zmiany tracka. |
| Practice Hub, Setup i Roadmap | Zostawić | Rozróżniają tryby, timing feedbacku, dostępność i zakres sesji. |
| Sesje, review, modale i błędy | Zostawić | Opisują zapis, blokadę, odzyskanie albo skutek decyzji. |
| Settings: Appearance, Language, Goal, Reminders | Zostawić | Doprecyzowują wartość i działanie wiersza. |
| Account i Security | Zostawić | Wyjaśniają wymagania, ryzyko i skutki operacji. |
| Your data i Privacy requests | Zostawić | Opisują zakres danych, prawa, terminy i kanały działania. |
| Legal information | Zostawić | Określa granice prywatności, bezpieczeństwa i użycia wyników. |

## Nowa rozbieżność

Retest wykrył surowe, zagnieżdżone klucze na ekranie Your data. To nie jest redundancja. Zarejestrowano osobne ODK-E2E-104 z kryteriami dla EN/PL, gościa i konta.

## Ograniczenia

Audyt opiera się na pełnym przeglądzie aktywnego kodu oraz reprezentatywnym dowodzie urządzeniowym. Nie wymuszano wszystkich błędów sieciowych i stanów sesji. Ich opisy oceniono z kodu i kontraktów testów.
