# ODK-119 — account-bound Premium cache cleanup (partial)

The Premium cache now clears after successful explicit sign-out, password-reset sign-out, and completed account deletion, including deletion recovered after app restart. A confirmed authenticated account change removes another account's cache before provider refresh. Removal failure blocks that refresh and cannot grant Premium to the new account. Failed sign-out and pending deletion retain the cache.

Automatic recovery catches storage removal errors after Firebase has signed out, preserving a truthful signed-out state. A confirmed signed-out observer retries removal. The old cache record remains account-bound if storage is unavailable. Automatic recovery does not show a separate local cleanup message; another signed-out event or restart is needed to retry, and this path has no remove-failure integration test.

Verification: targeted account identity and Premium tests 31/31, `npm run typecheck`, `git diff --check`. Independent QA approved, minimum score 0.83 (architecture 0.88, simplicity 0.84, risk 0.83, maintainability 0.84). ODK-119 remains partial: reconnect, paid content/session admission, and provider-console evidence are outstanding.
