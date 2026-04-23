# naaviq-docs

Public documentation site for the Naaviq voice provider registry.

**Live site:** `docs.naaviq.ai` (configured in `fern/docs.yml`)
**Built with:** [Fern](https://buildwithfern.com) — the same platform Deepgram, Cohere, and Webflow use.
**Source data:** The registry API at `providers.naaviq.ai` (repo: `naaviq-voice-providers`).

## What lives here

- `fern/docs.yml` — site configuration: navigation, theme, tabs
- `fern/pages/` — MDX content (Concepts, Recipes, Contribute, Changelog)
- `fern/apis/registry/openapi.yml` — OpenAPI spec ingested from `naaviq-voice-providers`; drives the API Reference section and the generated SDKs
- `fern/assets/` — logos, favicons, audio samples
- `scripts/fetch-openapi.sh` — pulls the latest spec from the running API

## Local development

```bash
# 1. Use the pinned Node version (.nvmrc → Node 22 LTS)
nvm use

# 2. Install Fern CLI
npm install -g fern-api

# 3. Pull the latest OpenAPI spec from the local API
#    (requires naaviq-voice-providers running on :8000)
./scripts/fetch-openapi.sh local

# 4. Preview the docs site
fern docs dev
```

The preview runs at `http://localhost:3000`.

## Updating content

| What changed | What to update |
|---|---|
| Added a new provider to `naaviq-voice-providers` | Nothing here — the catalog renders from live API data |
| Added a new capability to the canonical vocab | `fern/pages/concepts/capabilities.mdx` |
| Changed an API endpoint / response shape | Re-run `./scripts/fetch-openapi.sh` to sync `apis/registry/openapi.yml` |
| Added a new recipe | Create `fern/pages/recipes/<slug>.mdx` + add to `docs.yml` navigation |
| Added a new sync source type | `fern/pages/contribute/writing-a-syncer.mdx` |

## Deployment

Deployed via Fern's hosted platform. Push to `main` → Fern picks up the changes → deploys to `docs.naaviq.ai`.

## Repo relationships

```
naaviq-voice-providers    public    FastAPI registry — source of truth
naaviq-admin              private   sync trigger + apply endpoint
naaviq-admin-ui           private   admin frontend
naaviq-docs               public    this repo — public docs site
```
