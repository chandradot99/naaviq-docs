#!/usr/bin/env node
// Fetches live registry data and rewrites the catalog MDX pages between
// {/* GENERATED:START <key> */} and {/* GENERATED:END */} markers.
//
// Fail-soft: if the API is unreachable, leaves the previous generated
// content in place so `fern docs dev` still works offline.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = resolve(__dirname, "../fern/pages/catalog");
const API_BASE = process.env.NAAVIQ_API_BASE ?? "https://naaviq-voice-providers-production.up.railway.app";
const VOICES_PER_PROVIDER = 12;

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

async function fetchAllPaginated(path) {
  const results = [];
  const pageSize = 200;
  let offset = 0;
  while (true) {
    const sep = path.includes("?") ? "&" : "?";
    const page = await fetchJson(`${path}${sep}limit=${pageSize}&offset=${offset}`);
    const items = Array.isArray(page) ? page : (page.data ?? []);
    results.push(...items);
    if (!Array.isArray(page) && page.total != null) {
      if (results.length >= page.total) break;
    } else if (items.length < pageSize) {
      break;
    }
    offset += items.length;
    if (items.length === 0) break;
  }
  return results;
}

async function fetchVoiceSample(slug) {
  const res = await fetchJson(`/v1/providers/${slug}/voices?limit=${VOICES_PER_PROVIDER}`);
  return { sample: res.data ?? [], total: res.total ?? (res.data ?? []).length };
}

function esc(s) {
  return String(s ?? "").replace(/[<>{}|]/g, (c) => `\\${c}`);
}

function renderProvidersGrid(providers) {
  const active = providers.filter((p) => !p.deprecated_at);
  active.sort((a, b) => a.display_name.localeCompare(b.display_name));
  const cards = active.map((p) => {
    const badge = p.type.toUpperCase();
    const href = `https://naaviq-voice-providers-production.up.railway.app/v1/providers/${p.provider_id}`;
    return `  <Card title="${esc(p.display_name)}" href="${href}">
    **${badge}** · id \`${p.provider_id}\` · source \`${p.source}\`
  </Card>`;
  });
  return `<CardGroup cols={3}>
${cards.join("\n")}
</CardGroup>

_${active.length} active providers. Updated ${new Date().toISOString().slice(0, 10)}._`;
}

function renderModelsByLanguage(models) {
  const byLang = new Map();
  for (const m of models) {
    if (m.deprecated_at) continue;
    const langs = m.languages?.length ? m.languages : ["*"];
    for (const lang of langs) {
      if (!byLang.has(lang)) byLang.set(lang, { stt: new Set(), tts: new Set() });
      byLang.get(lang)[m.type]?.add(m.provider_id);
    }
  }
  const keys = [...byLang.keys()].sort((a, b) => {
    if (a === "*") return 1;
    if (b === "*") return -1;
    return a.localeCompare(b);
  });
  const rows = keys.map((lang) => {
    const { stt, tts } = byLang.get(lang);
    const sttList = [...stt].sort().join(", ") || "—";
    const ttsList = [...tts].sort().join(", ") || "—";
    return `| \`${lang}\` | ${sttList} | ${ttsList} |`;
  });
  return `| Language | STT providers | TTS providers |
|---|---|---|
${rows.join("\n")}

_${keys.length} languages indexed. \`*\` = wildcard (provider supports many, no explicit list)._`;
}

function renderVoiceGallery(providers, samples) {
  const sections = providers
    .filter((p) => samples.has(p.provider_id) && samples.get(p.provider_id).sample.length > 0)
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
    .map((p) => {
      const { sample, total } = samples.get(p.provider_id);
      const rows = sample.map((v) => {
        const langs = (v.languages ?? []).slice(0, 4).join(", ") || "—";
        const preview = v.preview_url ? `[preview](${v.preview_url})` : "—";
        const name = esc(v.display_name ?? v.name ?? v.voice_id);
        return `| \`${v.voice_id ?? v.id}\` | ${name} | ${v.gender ?? "—"} | ${langs} | ${preview} |`;
      });
      const more =
        total > sample.length
          ? `\n\n_+ ${total - sample.length} more — see \`/v1/providers/${p.provider_id}/voices\`._`
          : "";
      return `### ${esc(p.display_name)}

| id | name | gender | languages | preview |
|---|---|---|---|---|
${rows.join("\n")}${more}`;
    });
  const totalVoices = [...samples.values()].reduce((s, x) => s + x.total, 0);
  return `_${totalVoices} voices across ${sections.length} providers. Showing up to ${VOICES_PER_PROVIDER} per provider._

${sections.join("\n\n")}`;
}

function renderCompareTable(providers, models, samples) {
  const active = providers.filter((p) => !p.deprecated_at);
  active.sort((a, b) => a.display_name.localeCompare(b.display_name));
  const rows = active.map((p) => {
    const pModels = models.filter((m) => m.provider_id === p.provider_id && !m.deprecated_at);
    const voiceTotal = samples.get(p.provider_id)?.total ?? 0;
    const streaming = pModels.some((m) => m.streaming) ? "yes" : "—";
    const langs = new Set();
    for (const m of pModels) for (const l of m.languages ?? []) langs.add(l);
    const langCount = langs.has("*") ? "many" : String(langs.size);
    return `| ${esc(p.display_name)} | ${p.type} | ${pModels.length} | ${voiceTotal} | ${langCount} | ${streaming} |`;
  });
  return `| Provider | Type | Models | Voices | Languages | Streaming |
|---|---|---|---|---|---|
${rows.join("\n")}`;
}

function replaceMarker(source, key, body) {
  const start = `{/* GENERATED:START ${key} */}`;
  const end = `{/* GENERATED:END */}`;
  const escRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escRx(start)}[\\s\\S]*?${escRx(end)}`);
  if (!re.test(source)) throw new Error(`missing marker block for "${key}"`);
  return source.replace(re, `${start}\n${body}\n${end}`);
}

async function rewrite(file, key, body) {
  const path = resolve(PAGES_DIR, file);
  const source = await readFile(path, "utf8");
  const next = replaceMarker(source, key, body);
  if (next !== source) {
    await writeFile(path, next);
    console.log(`  wrote ${file}`);
  } else {
    console.log(`  unchanged ${file}`);
  }
}

async function main() {
  console.log(`Fetching from ${API_BASE}…`);
  let providers, models;
  try {
    providers = await fetchAllPaginated("/v1/providers");
    models = await fetchAllPaginated("/v1/models");
  } catch (err) {
    console.warn(`  registry unreachable (${err.message}) — skipping catalog generation`);
    process.exit(0);
  }
  const active = providers.filter((p) => !p.deprecated_at);
  const samples = new Map();
  for (const p of active) {
    try {
      samples.set(p.provider_id, await fetchVoiceSample(p.provider_id));
    } catch (err) {
      console.warn(`  voice sample failed for ${p.provider_id}: ${err.message}`);
      samples.set(p.provider_id, { sample: [], total: 0 });
    }
  }
  const totalVoices = [...samples.values()].reduce((s, x) => s + x.total, 0);
  console.log(`  ${providers.length} providers, ${models.length} models, ${totalVoices} voices`);
  await rewrite("all-providers.mdx", "providers", renderProvidersGrid(providers));
  await rewrite("models-by-language.mdx", "models-by-language", renderModelsByLanguage(models));
  await rewrite("voice-gallery.mdx", "voices", renderVoiceGallery(providers, samples));
  await rewrite("compare.mdx", "compare", renderCompareTable(providers, models, samples));
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
