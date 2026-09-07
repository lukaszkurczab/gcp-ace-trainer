# ODK-E2E-064 — App Store Connect privacy disclosure

Artefakt: bieżący kod aplikacji iOS Patternly po ODK063/ODK059. Odpowiedzi
poniżej wpisuje się ręcznie w App Store Connect dopiero po porównaniu z
finalnym archive i Xcode Privacy Report dla tego samego commita/builda.

| Data type | Collected? | Linked to user? | Used for tracking? | Purpose |
| --- | --- | --- | --- | --- |
| Name | Yes | Yes | No | App Functionality |
| Email Address | Yes | Yes | No | App Functionality |
| User ID | Yes | Yes | No | App Functionality |
| Device ID | Yes | Yes | No | App Functionality |
| Other User Content | Yes | Yes | No | App Functionality |
| Customer Support | Yes | Yes | No | App Functionality |
| Product Interaction | Yes | Yes | No | App Functionality |
| Other Diagnostic Data | Yes | Yes | No | App Functionality |
| Purchase History | Yes | Yes | No | App Functionality, Analytics |

Każdy typ niewymieniony w tabeli pozostaje `No` i nie zaznacza się go w
App Store Connect. Nie ma trackingu ani tracking domains; wszystkie powyższe
typy mają konserwatywne `Linked = Yes` i `Tracking = No`. Osiem kategorii
niezakupowych ma wyłącznie cel `App Functionality`; `Purchase History` ma cele
`App Functionality` i `Analytics` wymagane dla bieżącego użycia RevenueCat.

`Purchase History` jest `Yes`, ponieważ aplikacja identyfikuje użytkownika
kontem Patternly w RevenueCat, a SDK obsługuje zakup, restore, historię klienta
i entitlement. Oficjalny kontrakt RevenueCat wskazuje `App Functionality` dla
walidacji receipt/entitlement oraz `Analytics` dla historii i wykresów. Kod nie
konfiguruje reklam, IDFA ani integracji śledzących między aplikacjami, dlatego
`Tracking` pozostaje `No`. Finalny archive i konfiguracja dashboardu RevenueCat
muszą zostać ponownie sprawdzone przed ręcznym zatwierdzeniem odpowiedzi.

Precedencja release review: fakty aktywnego providera i SDK, następnie
wygenerowany manifest, a na końcu spójne Privacy i ręczny wpis App Store
Connect. Właściciel wydania powtarza wspólny review po każdej zmianie SDK,
RevenueCat albo manifestu. Ręczna macierz nie zastępuje weryfikacji finalnego
binarnego archive.
