# Contributing

Thanks for taking a look. Issues and pull requests are welcome.

1. Fork the repository and create a branch from `main` (`feat/...`, `fix/...`).
2. Follow the [quick start](README.md#quick-start) to run the API locally.
3. Keep changes focused, and add or adjust tests:
   - `npm test` for unit tests (pure domain logic, next to the code as `*.test.ts`)
   - `npm run test:e2e` for HTTP tests against Postgres and Redis (`test/*.e2e-spec.ts`)
4. Before pushing, run `npm run lint && npm run typecheck && npm test`.
5. Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:` ...).

Architecture rules live in [`.cursorrules`](.cursorrules): DDD layers, repository
interfaces in the domain, thin controllers. Please don't commit secrets, real customer
data or real photos. Use the fictional samples in `uploads/examples/`.
