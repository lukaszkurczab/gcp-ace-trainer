# Canonical content build inputs

`canonical-content/` is generated from the selected current sibling `patternly-content` checkout. It contains the nine canonical track artifacts, `content-lock.json`, and the current successor ledger; the application release lock binds their exact digests.

Do not edit generated files manually. Local app starts sync the selected source before Expo runs. Before submitting an EAS build, run `npm run prepare:eas-build` or use `npm run eas:build <profile/options>`; this builds and validates the current APP bank before EAS uploads it. The remote EAS pre-install check validates the prepared APP payload and does not have access to the sibling content checkout.

Use `npm run check:content-release` to verify byte-for-byte source parity without changing application files.
