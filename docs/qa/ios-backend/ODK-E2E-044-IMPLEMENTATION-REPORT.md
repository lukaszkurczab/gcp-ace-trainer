# ODK-E2E-044 — raport inwentaryzacji nagłówków

Status: VERIFIED_CLOSED

Repozytorium: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly`.

Baza: `f0c4867`.

Model i effort: `gpt-5.6-luna / max`.

## Cel i wynik

Przygotowano kompletną, odczytową mapę górnej nawigacji: komponenty, wszystkie użycia z liniami, `Stack.Screen`, właścicieli nagłówków, typografię, skalowanie, loading, modale i lokalne wyjątki. Pełny inwentarz znajduje się w [ODK-E2E-044-INVENTORY.md](./ODK-E2E-044-INVENTORY.md).

Nie zmieniono kodu aplikacji, konfiguracji ani rejestru. Nie zmieniono standardu tekstu po retestach. Nie wykonano zmian dla 042/043.

## Brief i walidacja

Cel briefu: wskazać wspólne i lokalne właścicielstwo nagłówków oraz miejsca wymagające decyzji projektowej przed wdrożeniem większej typografii.

Walidacja briefu Luna/max: zgodność `0,97`, prostota `0,90`, ryzyko `0,92`, utrzymywalność `0,95`, minimum `0,90`, werdykt `APPROVE`.

## Dowody i weryfikacja

- iOS standardowy tekst: `2026-09-08_051857`, 20/20 `COMPLETED`; ścieżka obejmowała Track, Activity i Practice Setup.
- iOS największy tekst: `2026-09-08_052106`, 24/24 `COMPLETED`; te same trzy ekrany.
- Kontroler obejrzał wszystkie 6 zrzutów.
- Ustawienia: EN, dark mode, Coding.
- Nie potwierdzono nakładania nagłówków w obejrzanych zrzutach.
- Standardowy rozmiar tekstu został przywrócony.

Nie podjęto twierdzeń wizualnych dla innych locale, loading/error branches ani aktywnych sesji. Te obszary pozostają `unknown / needs evidence`.

## Potwierdzone fakty z kodu

- Wspólnymi punktami są `ScreenHeader`, `AppShellHeader`, `SessionShell`, `ReviewShell` oraz osobne loading/modal surfaces.
- `RootNavigator` renderuje `AppShellHeader` jako globalny stack header tylko dla routów bez `headerShown: false`.
- Część routów ma lokalne warianty zależne od stanu: Goal, Account, Practice Setup, Practice Session i review.
- Większość nagłówkowych tekstów ma `maxFontSizeMultiplier={2}`; Account i skeletony mają dodatkowe progi układu dla dużego tekstu.
- `AppShellHeader placement="back"` ma osobny kontrakt: etykieta 14/18/500, `minHeight:36`, chevron 36×36 i `hitSlop={4}`.
- `ReviewShell` ma tytuł 15/18/600 (`src/components/ReviewShell.tsx:113-114`) i kontekst 13/18/500 (`:101-102`), więc należy do zakresu 042/043 razem z pozostałymi top barami.
- Ryzyka długich nazw wynikają ze stylów bez jawnego `flexShrink`, `minWidth` lub `numberOfLines` w wybranych lokalnych nagłówkach. Są to hipotezy do retestu, nie potwierdzone błędy.

## Zakres 042/043

`ODK-E2E-042` jest decyzją projektową: ma określić docelowe rozmiary, line height, weight, odstępy, zawijanie, długie nazwy, font scale i hitboxy dla grup wskazanych w inwentarzu.

`ODK-E2E-043` jest późniejszym wdrożeniem zaakceptowanego projektu 042. Powinno zachować lokalne wyjątki oraz najpierw uzupełnić dowody dla niezweryfikowanych routów i stanów. 044 nie wprowadza globalnej zmiany fontów.

## Niezależne QA

Luna/max: `PASS z lukami`. Potwierdzono kompletność 33 routów i uczciwy zakres dowodów. Poprawiono trzy luki: pełny zapis 14/17/500 dla Practice Setup, wagę 500 dla Goal oraz typografię wszystkich wymienionych modalnych surfaces. `git diff --check` przeszedł. Następne zadanie to projekt 042.

## Ograniczenia

- Nie ma dowodu urządzeniowego dla wszystkich języków.
- Nie ma dowodu urządzeniowego dla loading, error i aktywnych sesji.
- Nie wykonano VoiceOver ani osobnego pomiaru hitboxów.
- Brak twierdzeń o braku problemów poza sześcioma obejrzanymi zrzutami.
