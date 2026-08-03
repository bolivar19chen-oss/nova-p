## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Output rules (token-efficient, coding profile)

- Short sentences. No preamble, no recap, no closing pleasantries.
- Tool first. Result first. Explain only if asked or non-obvious.
- Return code first. Prose after, only when the code is not self-evident.
- No em dashes, smart quotes, or decorative Unicode. Plain hyphens and straight quotes.
- Accented letters and other natural-language characters are fine.
- Code output must be copy-paste safe.

## Code rules

- Simplest working solution. No over-engineering.
- No abstractions for single-use operations. Three similar lines beat a premature abstraction.
- No speculative features. No "you might also want".
- Read the file before modifying it. Never edit blind.
- No error handling for scenarios that cannot happen.
- No docstrings or type annotations on code not being changed.

## Review and debugging

- State the bug. Show the fix. Stop. No suggestions beyond scope.
- Never speculate about a bug without reading the relevant code first.
- If the cause is unclear, say so. Do not guess.
- Do not guess APIs, versions, flags, or package names. Verify by reading code or docs.
