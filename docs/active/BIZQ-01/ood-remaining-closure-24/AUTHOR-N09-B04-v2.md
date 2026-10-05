# N09-B04 v2 correction

Replaced all 72 option-text echoes with case-specific causal feedback. For i008, the prompt now states that candidate input contains both active and withdrawn requests in request-time order, and only active requests may receive the one offer. This makes the existing eligibility distinction explicit and rules out blindly selecting the first raw entry.

- Previous proposal SHA-256: 8a3c2dda63e35560476ba11cae75d400b36a2277efd4a52ecbece54e8293e355
- Current proposal SHA-256: 4d5a76202d6cd470c2de5516b03fa35c3c4ee6aaed3fb2ae52770afa12cfbf8c
- Author notes SHA-256: ac115a6ad4f30541b71ea649a903eb3d71aee48ca76ceffee4e3a857a31920ee
- Question IDs preserved: true
- Validator failures: 0; exact option-text echoes: 0; scoring failures: 0; reversed-order failures: 0.

Full mechanical evidence is in AUTHOR-N09-B04-v2-CHECKS.json. Independent semantic review remains required.
