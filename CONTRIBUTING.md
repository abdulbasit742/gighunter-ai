# Contributing

PRs welcome. Keep it simple:

1. One feature per PR.
2. Follow the existing module layout: `lib/<thing>.js`, `routes/<thing>Routes.js`, `scripts/<thing>.js`.
3. Add a smoke test in `tests/` for new logic.
4. Run `npm test` before pushing (CI runs in dry-run mode, no AI keys needed).

## Ideas to pick up
- SQLite/Postgres store adapter
- Daily digest to email / Slack / ClickUp
- Embeddings-based semantic matching
- A small React dashboard over the API
