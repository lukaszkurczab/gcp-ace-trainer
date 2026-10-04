# Errata — final N06 semantic review evidence binding

The original final-review files were:

- Markdown SHA-256: `b4bc6269953803bcc59fe192221e922cf7c154f27cde24df118c29e5c05afdf1`
- JSON SHA-256: `cb00732590b200366116d7e862229993c2da6cf07f289ac823e78563a03ee910`

Their `N06-CONTRACT.json` binding mistakenly used `fd6ff0821df81f558aa7a5a3fb46ac0b2d72570ff583f7564fd379d37998d8a4`, the canonical content-guidelines document hash. The actual contract file hashes to `c6b5612e21fb66a540eba31514510df49b302f8f1089cf474f2ac5880b4205fb`. The current Markdown and JSON now bind that exact contract hash. No review finding, verdict, proposal binding, or scope changed.
