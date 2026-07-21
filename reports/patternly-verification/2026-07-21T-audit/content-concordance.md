# Content concordance

`STATICALLY_VERIFIED`: app embedded reference and content artifact agree on Algorithms version, taxonomy, checksum, source commit, activation identity and payload length. Runtime validation accepted that artifact and installed Algorithms only.

`OBSERVED`: the first Guided Practice screen presented one complete prompt and four visible options; after selecting the second option the UI marked it incorrect, marked the first option correct, and showed a non-empty authored Reason plus a Details affordance. The exact prompt resolves uniquely to `alg-complexity-amortized-001`; its artifact options, answer key and Reason match the UI. No raw JSON, Markdown or escape sequence appeared in this sample.

The concordance sample is **one item**, not the requested representative minimum. The UI does not expose an item ID, so this match uses exact prompt text rather than an explicit runtime identity; the automated sequence also could not reliably hold the expanded Details state between separate Maestro flows. Therefore this report deliberately does not claim 10-item Practice coverage or all 40 Simulation items.

Normalization rule: cosmetic wrapping, capitalization of `Question 1 of 20`, and accessibility suffixes such as `radio button, checked` are not content mismatches.
