# UI-26-10 — raport odbioru

**Status przed niezależnym QA:** implementacja i wymagane lokalne dowody gotowe.

## Zmiana

- Usunięto wyłącznie warning `account-remote-revoke-pending` z trybu `Sign in`.
- Usunięto dwa martwe mapowania copy i odpowiadające im klucze ze wszystkich siedmiu locale.
- `pendingRemoteRevokeCount`, trwała kolejka, storage, retry, `signOutPending` i feedback logowania nie zostały zmienione.

## Weryfikacja

- Niezależna walidacja briefingu Luna High: `ACCEPT`, minimum oceny `0.95`.
- `node --import tsx --test src/application/account/accountIdentityComposition.test.ts src/application/account/pendingSessionRevocation.test.ts src/infrastructure/storage/localLogoutControl.test.ts`: `54/54` PASS.
- `npm run typecheck`: PASS.
- `git diff --check`: PASS.
- Maestro na istniejącym iPhonie 17: realny lokalny logout zakończył się standardowym ekranem `Sign in`; `account-sign-in-submit` był widoczny, a `account-remote-revoke-pending` niewidoczny. Dostępne pozostały rejestracja, odzyskanie hasła, providery i wejście bez konta.
- Screenshot: `sign-in-after-logout.png`. Potwierdza prezentację po logout; zachowanie durable queue potwierdzają testy, nie screenshot.

Nie utworzono nowego urządzenia ani drugiej instalacji aplikacji. Backend, Firebase Auth/Firestore i Metro pozostały lokalnie dostępne.
