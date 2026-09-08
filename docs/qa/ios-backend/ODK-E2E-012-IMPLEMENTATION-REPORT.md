# ODK-E2E-012 — tożsamość tylko na głównym Settings

Data: 2026-09-08. Status: `VERIFIED_CLOSED` — retest iOS zakończony.

## Walidacja briefu

Niezależny agent **gpt-5.6-luna / max**, tylko brief bez narzędzi. Zgodność 0,98, prostota 0,95, ryzyko 0,94, utrzymywalność 0,95. Minimum **0,94 — APPROVE**.

## Zmiana

Usunięto jedną linię `Signed in as` z AccountSecurityScreen. Dotyczy wspólnego ekranu email/password/delete/export/privacy; recovery nie miał jej już po 007. Główne Settings zachowuje własny blok `settings-identity`. `user` pozostaje potrzebny dla uid/providers i autoryzacji. Klucz locale pozostaje używany w Settings. Docelowy email w AccountEmailChangePendingScreen jest potrzebną informacją o trwającej operacji, a nie redundantną tożsamością.

Sprawdzono wszystkie referencje accountSignedInAs, AccountSecurityScreen, AccountEntryScreen, SettingsTab, AccountEmailChangePendingScreen, RootNavigator, settingsPresentation.test.ts i konfigurację testów. Pozostałe podstrony nie renderują tego komunikatu. Nie dodano abstrakcji ani nowego testu kopiującego pojedynczą linię JSX.

## Weryfikacja

`node --import tsx --test src/application/account/accountCommandGuards.test.ts src/application/account/accountIdentityComposition.test.ts src/features/account/accountEmailChangePendingStatus.test.ts src/features/account/accountSecurityFieldErrors.test.ts src/preferences/settingsPresentation.test.ts`: **65/65 PASS**, 0 skipped, exit 0.

Pierwsza brama `npm run qa:static`: recovery check i typecheck PASS; testy **874/875 PASS**. Jedyna awaria: visualShell.test.ts oczekuje 32 tras, podczas gdy 009 dodało poprawnie 33. Korekta macierzy podlega osobnej niezależnej walidacji. Dalsze bramy nie uruchomiły się po błędzie npm test.

Brak wymaganej decyzji PO; licznik próśb 0. Po retescie zadanie usunięto z aktywnej tabeli. Dowody zachować do pushu ścieżki 007–012.

## Wynik niezależnego QA i bramy

QA gpt-5.6-luna / max: PASS, bez błędu w delcie. Główne Settings zachowuje adres, a ekran oczekiwania celowo pokazuje adres docelowy. Usunięte renderowanie nie zostawiło zbędnych importów ani stanu.

Macierz visualShell poprawiono w ramach 009 po niezależnej walidacji (minimum 0,96). Test macierzy 15/15 PASS. Końcowe `npm run qa:static`: exit 0; recovery check, typecheck, 875/875 testów (0 skipped), content boundary i runtime privacy boundary PASS.

Retest pokazał surowy klucz settings w nagłówku Premium. Kod potwierdza błędną przestrzeń tłumaczenia. Dodano ODK-E2E-095 z kryteriami akceptacji. Błędy tłumaczeń Your data są już objęte ODK-E2E-091.

## Retest iOS — wynik końcowy

iPhone 17 / iOS 26.4, EN/dark, konto testowe, aktualny bundle po zmianie 012. Obejrzano 17 pełnych screenshotów: główne Settings, Appearance, Language, Change email, Change password, Recovery codes, Premium, Practice settings, Notifications, Your data, arkusz szczegółów danych, Privacy requests, Legal information, Privacy Policy, Terms of Service, arkusz Data rights i Delete account. Główne Settings pokazuje adres. Podstrony nie pokazują Signed in as ani bieżącego adresu. Nie wysłano formularzy ani nie zmieniono danych konta.

| Run | Wynik poleceń Maestro | Dowód |
| --- | --- | --- |
| 2026-09-08_015255 | 104 COMPLETED, 1 FAILED, exit 1 | 13 screenshotów. Powrót z przewiniętego Legal wymagał przewinięcia w górę. |
| 2026-09-08_020023 | 17 COMPLETED, 1 FAILED, exit 1 | Privacy Policy. Terms otworzył się prawidłowo, lecz asercja widoczności całego długiego Text nie przeszła. Screenshot potwierdził ekran. |
| 2026-09-08_020223 | 33 COMPLETED, 0 FAILED, exit 0 | Terms potwierdzony nagłówkiem; Data rights, Delete account i powrót do Settings PASS. |

Liczby obejmują polecenia przygotowawcze Maestro. Kontynuacje wykonały pozostałe kroki na tym samym koncie. Pierwszych przebiegów nie przedstawia się jako pełnego PASS. Pierwsza próba uruchomienia kontynuacji zatrzymała się przed testem przez ograniczenie dostępu Maestro; wykonano ją ponownie z wymaganym dostępem.

Tryby reautoryzacji export/privacy korzystają z tego samego JSX AccountSecurityScreen; nie deklaruje się ich osobnego E2E. Docelowy adres ekranu oczekiwania po 009 pozostaje celową informacją o żądaniu. Placeholdery prawne i brak oferty Premium należą do istniejących gate’ów providerowych. VoiceOver pominięto. Brak regresji w zakresie 012.
