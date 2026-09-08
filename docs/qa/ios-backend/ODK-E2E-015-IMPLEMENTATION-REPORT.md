# ODK-E2E-015 — odstępy grup Settings

Status: DONE po reteście E2E, 2026-09-08.

## Zmiana i zakres

Pięć lokalnych grup SettingsTab używa titleGap={spacing.md}, czyli 12. Dotyczy to preferencji, nauki, prywatności oraz warunkowych grup stanu pamięci i weryfikacji deweloperskiej. Lokalny skeleton używa tego samego odstępu. Wspólny SettingsGroup, padding wierszy i odstępy między grupami pozostały bez zmian.

Sprawdzono SettingsTab.tsx, SettingsGroup.tsx, theme/tokens.ts, settingsPresentation.test.ts i loadingStateOwnership.test.ts. Zmieniono SettingsTab i dwie istniejące asercje testowe. Nie powstały nowe ścieżki ani martwy kod.

## Walidacja przed zmianą

Niezależny agent gpt-5.6-luna / max oceniał wyłącznie brief, bez narzędzi. Pierwszy brief obejmował trzy grupy. Uzupełniony brief objął wszystkie pięć lokalnych grup. Oba: zgodność 0,99; prostota 0,98; ryzyko 0,97; utrzymywalność 0,99. Minimum 0,97, APPROVE.

## Weryfikacja

- Wąskie testy: 41/41 PASS.
- Końcowe npm run qa:static po wszystkich zmianach 013–015: 878/878 PASS, 0 pominiętych. Typecheck, recovery, content boundary i runtime privacy boundary PASS.
- Maestro 2026-09-08_033411: standardowy tekst, EN i PL, 35/35 poleceń COMPLETED.
- Maestro 2026-09-08_033552: największy systemowy tekst, EN i PL, 35/35 poleceń COMPLETED. Komponenty zachowują limit skalowania 2.
- Obejrzano wszystkie 16 zrzutów. Nagłówki mają czytelny odstęp. Długi tekst zawija się bez obcięcia. Retest obejmuje preferencje, naukę, prywatność i grupę deweloperską. Warunkową grupę stanu pamięci sprawdzono w kodzie; jej stanu nie wymuszano w E2E.
- Po reteście przywrócono język EN i standardowy rozmiar tekstu large.

Brak nowej regresji i blokera PO. Licznik próśb: 0. Dowody tymczasowe zostaną usunięte po pushu ścieżki.
