# naaviq-docs

Public documentation site for the Naaviq voice provider registry.

**Live site:** [docs.naaviq.ai](https://docs.naaviq.ai)
**Built with:** [Fern](https://buildwithfern.com)
**Source data:** Registry API at `https://naaviq-voice-providers-production.up.railway.app` (repo: [naaviq-voice-providers](https://github.com/chandradot99/naaviq-voice-providers))

## What lives here

- `fern/docs.yml` — site configuration: navigation, theme, tabs
- `fern/pages/` — MDX content (Concepts, Recipes, Contribute, Changelog)
- `fern/apis/registry/openapi.yml` — OpenAPI spec synced from `naaviq-voice-providers`; drives the API Reference section
- `fern/assets/` — logos, favicons
- `scripts/fetch-openapi.sh` — pulls the latest spec from the running API

## Local development

```bash
# 1. Use the pinned Node version (.nvmrc → Node 22 LTS)
nvm use

# 2. Install Fern CLI
npm install -g fern-api

# 3. Pull the latest OpenAPI spec from prod
./scripts/fetch-openapi.sh prod

# 4. Preview the docs site
fern docs dev
```

The preview runs at `http://localhost:3000`.

## Updating content

| What changed | What to update |
|---|---|
| Added a new provider to `naaviq-voice-providers` | Nothing — the catalog renders from live API data |
| Added a new capability to the canonical vocab | `fern/pages/concepts/capabilities.mdx` |
| Changed an API endpoint / response shape | Re-run `./scripts/fetch-openapi.sh prod` to sync `fern/apis/registry/openapi.yml` |
| Added a new recipe | Create `fern/pages/recipes/<slug>.mdx` + add to `docs.yml` navigation |

## Deployment

```bash
fern generate --docs
```

Or connect the GitHub repo in the [Fern dashboard](https://app.buildwithfern.com) to auto-deploy on every push to `main`.

## Repo relationships

```
naaviq-voice-providers    public    FastAPI registry — source of truth
naaviq-admin              private   sync trigger + apply endpoint
naaviq-admin-ui           private   admin frontend
naaviq-docs               public    this repo — public docs site
```
