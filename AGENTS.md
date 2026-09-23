# Agent execution policy

- Model selection follows the global Agent model policy. Every autonomous delegated implementation, QA, research, review or release task uses `gpt-6-luna`: `medium` for standard work and `high` for difficult analysis or independent validation. Sol and Astra require an explicit user decision. Record the exact model and effort in its evidence report.
- Before implementation, obtain independent validation from a `gpt-6-luna` agent with `high` reasoning. Send exactly three sections: **Cel** (objective), **Ustalenia** (confirmed facts, constraints, risks and assumptions), **Podejście** (smallest coherent change).
- The validator assesses only that briefing: no repository or external inspection, searches, reads or execution. Report missing evidence as a briefing limitation.
- Return separate 0–1 scores for consistency, simplicity, risk and maintainability; final score is their minimum. Include decisive reasons, material risks and approval or a concrete redesign.
- A score below 0.8 rejects the approach. The primary agent supplies accurate evidence and resolves recommendations against the repository before proceeding.
