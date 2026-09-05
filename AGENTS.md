# Agent execution policy

- Every delegated implementation, QA, research, review or release task uses `gpt-5.6-luna` with `max` reasoning. Record the exact model and effort in its evidence report.
- Before implementation, obtain independent validation from a Luna/max agent. Send exactly three sections: **Cel** (objective), **Ustalenia** (confirmed facts, constraints, risks and assumptions), **Podejście** (smallest coherent change).
- The validator assesses only that briefing: no repository or external inspection, searches, reads or execution. Report missing evidence as a briefing limitation.
- Return separate 0–1 scores for consistency, simplicity, risk and maintainability; final score is their minimum. Include decisive reasons, material risks and approval or a concrete redesign.
- A score below 0.8 rejects the approach. The primary agent supplies accurate evidence and resolves recommendations against the repository before proceeding.
