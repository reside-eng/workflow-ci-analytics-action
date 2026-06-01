# AGENTS.md

This file is read by AI coding agents (Claude Code, Gemini, Cursor, Windsurf, Antigravity, etc.) at the start of every session. It encodes the things you'd otherwise get wrong — conventions not enforced by tooling and operational facts that aren't in any single source file.

This repo is a **GitHub Action** that sends CI job analytics to BigQuery. It is consumed via `uses: reside-eng/workflow-ci-analytics-action@v1` from other workflows.

## Stack

TypeScript GitHub Action. ESM end-to-end (`"type": "module"`). Runtime: `node24`. Bundle: `dist/index.mjs` produced by esbuild.

## Scripts

- `yarn check` — Biome lint + format check (`--error-on-warnings`, so any warning fails).
- `yarn check:fix` — Biome auto-fix lint + format across the repo.
- `yarn types:check` — TypeScript no-emit check.
- `yarn test` — `types:check` + Vitest (`vitest run`).
- `yarn test:cov` — `types:check` + Vitest with coverage (75% threshold).
- `yarn build` — `rimraf dist && node build.mjs && yarn build:docs`. Emits a single ESM bundle at `dist/index.mjs` and regenerates the `Usage` block in `README.md` from `action.yml`.
- `yarn build:docs` — Regenerate the `<!-- start usage -->` block in `README.md` from `action.yml`.

## Repo conventions

- **Commit messages:** Conventional Commits — `<type>(<scope>): <subject>`. Enforced by commitlint on `commit-msg`.
- **Pre-commit:** Lefthook runs `yarn check:fix:staged` (Biome auto-fix on staged files), `yarn types:check`, and `yarn build:docs` + `git add README.md`. Don't bypass it — `README.md` must stay in sync with `action.yml` (`dist/` is built on release, not committed).
- **`dist/` is gitignored and built on release.** The release workflow rebuilds it and force-adds it to the floating major tag (`refs/tags/v1`) so `uses: reside-eng/workflow-ci-analytics-action@v1` resolves a runnable bundle. Full-version tags (`vX.Y.Z`) do **not** carry `dist/`; always consume via `@vN`.
- **Yarn, not npm/npx.** Use `yarn <script>` for package scripts and `yarn dlx <pkg>` for one-off CLIs. `packageManager` is pinned in `package.json`.

## Stale husky hook gotcha

If you cloned this repo before the lefthook migration, `git config core.hooksPath` may still point at `.husky/` (which no longer exists). Lefthook can't override that. Fix:

```sh
git config --unset core.hooksPath
yarn install   # re-runs `lefthook install`
```

## Rules

- **Don't hand-edit `dist/index.mjs`.** It's a generated artifact — change `src/` and rebuild.
- **Don't hand-edit the `Usage` block in `README.md`.** It's regenerated from `action.yml` by `yarn build:docs`.
- **Don't reintroduce `husky`, `lint-staged`, `pinst`, `@vercel/ncc`, or CJS imports.** The migration to lefthook/esbuild/ESM is deliberate.
