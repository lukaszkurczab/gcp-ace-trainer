# Errata — producer design acceptance boundary wording

The original design review files were:

- Markdown SHA-256: `ade7320a60345eee5d812091b31a8079ae4b0d776cb36e944142b4e9a8dbc579`
- JSON SHA-256: `11f4d20d25441fbe3622ebc81b35b06208d1d0e156603c6d6d9d0076cd456fd3`

The decision-boundary wording could be read as prohibiting canonical source/proof writes until producer QA, although those writes are needed to run the reviewed verification. It now states explicitly that the reviewed source/proof writes may proceed after design PASS, while source acceptance, package delivery, and downstream gates remain pending. The verdict, assessment, scores, scope, design, and input bindings are unchanged.

Updated file hashes:
- Markdown: `a2cf7657939f8481a77e316b3a6fd6afb84f425338877da38f1b9bc5deb12bd3`
- JSON: `536926e5d6d860a8987f358249bd69e167ce22cfe2e06fb27992f84d51b3d86a`
