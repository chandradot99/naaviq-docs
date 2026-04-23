# naaviq-docs — CLAUDE.md

Public docs site for the Naaviq voice provider registry. Built with Fern.

## What this repo is

- **Not** a Python or Node app — it's a Fern docs project
- Source content lives in `fern/pages/*.mdx`
- Site navigation is defined in `fern/docs.yml`
- API reference is auto-generated from `fern/openapi/openapi.yml` (pulled from the `naaviq-voice-providers` FastAPI app)

## Repo relationships

| Repo | Visibility | What it does |
|---|---|---|
| `naaviq-voice-providers` | Public | FastAPI registry — the API this site documents |
| `naaviq-admin` | Private | Admin API for sync/apply |
| `naaviq-admin-ui` | Private | Admin frontend |
| `naaviq-docs` (this repo) | Public | The docs site |

## Project structure

```
naaviq-docs/
├── fern/
│   ├── fern.config.json           — organization + version
│   ├── docs.yml                   — navigation, tabs, theme
│   ├── apis/
│   │   └── registry/
│   │       └── openapi.yml        — synced from naaviq-voice-providers
│   ├── pages/
│   │   ├── introduction.mdx
│   │   ├── quickstart.mdx
│   │   ├── concepts/              — data model docs (9 pages)
│   │   ├── catalog/               — Browse pages (live-data)
│   │   ├── recipes/               — task-oriented how-tos
│   │   ├── contribute/            — how to add a provider
│   │   └── changelog.mdx
│   └── assets/                    — logos, favicons
└── scripts/
    └── fetch-openapi.sh           — pulls spec from running API
```

## Local dev

```bash
nvm use                            # .nvmrc → Node 22 LTS
npm install -g fern-api
./scripts/fetch-openapi.sh local
fern docs dev
```

**Node:** 22 LTS (pinned in `.nvmrc`). Fern CLI requires Node 18+; 22 is the
current LTS and is well-tested with Fern. Newer versions also work — the
vaaniq-web repo uses Node 25 without issue.

## Common tasks

### New provider added upstream
Nothing to do here. The catalog page renders from live API data at
`providers.naaviq.ai/v1/providers`.

### API endpoint or schema changed
```bash
./scripts/fetch-openapi.sh prod    # or `local` during dev
```
Commit the updated `fern/openapi/openapi.yml`.

### Capability vocab term added
Edit `fern/pages/concepts/capabilities.mdx` — keep the canonical list in
sync with `naaviq-voice-providers` CLAUDE.md. This file is the public
reference for that vocabulary.

### New recipe
1. Create `fern/pages/recipes/<slug>.mdx`
2. Add the entry to the Recipes section of `fern/docs.yml`

## What NOT to do

- **Don't hardcode provider lists** in catalog pages — always fetch live
- **Don't edit `openapi.yml` by hand** — re-run the fetch script
- **Don't reference private repos** (naaviq-admin, naaviq-admin-ui) in
  public docs pages
- **Don't commit** until the user explicitly asks

## Useful links

- Fern docs: https://buildwithfern.com/learn
- Live API: https://naaviq-voice-providers-production.up.railway.app
- Source repo: https://github.com/naaviq/naaviq-voice-providers
