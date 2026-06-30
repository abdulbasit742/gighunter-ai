# 🎯 GigHunter AI

> An autonomous freelancing agent that **hunts** freelance gigs from public sources, **scores** them against your profile using local AI, and **drafts** tailored proposals so you can apply in seconds.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![Status](https://img.shields.io/badge/status-ready--to--ship-blue.svg)]()

---

## Why

Finding good freelance work is a grind: tabs open across Upwork, RSS feeds, Hacker News "Who is hiring", remote boards. GigHunter AI does the boring part for you:

1. **Aggregates** gigs from public, ToS-friendly sources (RSS / public APIs / job feeds).
2. **Scores** each gig 0-100 against *your* skills, rates, and preferences using a local LLM (Ollama) — zero API cost, fully private.
3. **Drafts** a personalized proposal for the high-scoring ones.
4. **Serves** everything over a clean REST API + a one-command CLI "hunt".

> ⚠️ GigHunter only reads **public** sources and **drafts** proposals. It never logs into or auto-submits on marketplaces (that violates their ToS and gets you banned). You stay in control of the final click.

---

## Features

- 🔌 **Pluggable sources** — add any RSS/JSON feed in `config/profile.json`.
- 🧠 **Local-first AI** — defaults to Ollama (`qwen2.5:32b`), with OpenAI / Anthropic / Gemini / Groq fallbacks. Same LLM hub pattern as a production app.
- 🎯 **Smart scoring** — skill match, budget fit, freshness, and red-flag detection.
- ✍️ **Proposal drafting** — tailored, human-sounding, never spammy.
- 🗄️ **Zero-infra storage** — JSON store out of the box; swap to a DB later.
- 🌐 **REST API** — `/gigs`, `/gigs/:id`, `/proposals/:id`, `/health`.
- ⏰ **CLI hunter** — `npm run hunt` for a full cycle; cron it for daily leads.
- ✅ **CI smoke tests** — GitHub Actions green out of the box.

---

## Quick start

```bash
git clone https://github.com/abdulbasit742/gighunter-ai.git
cd gighunter-ai
npm install
cp .env.example .env
cp config/profile.example.json config/profile.json
# edit config/profile.json with your skills, rates, and feed URLs

# (optional) point at your local Ollama
# LLM_DEFAULT_PROVIDER=ollama  OLLAMA_HOST=http://127.0.0.1:11434  OLLAMA_MODEL=qwen2.5:32b

npm run hunt      # run one hunt cycle, prints scored gigs + drafts
npm start         # boot the REST API on http://localhost:3000
npm test          # smoke tests
```

---

## Configuration

Everything lives in `config/profile.json` (copy from the example):

```json
{
  "name": "Abdul Basit",
  "headline": "Full-stack & AI SaaS developer",
  "skills": ["node.js", "react", "postgres", "saas", "ai", "whatsapp api", "stripe"],
  "minBudgetUsd": 300,
  "preferredKeywords": ["saas", "automation", "ai", "whatsapp", "dashboard"],
  "avoidKeywords": ["wordpress only", "unpaid", "equity only"],
  "sources": [
    { "name": "RemoteOK", "type": "json", "url": "https://remoteok.com/api" },
    { "name": "WWR-Programming", "type": "rss", "url": "https://weworkremotely.com/categories/remote-programming-jobs.rss" }
  ]
}
```

### Environment (`.env`)

| Key | Default | What it does |
|---|---|---|
| `PORT` | `3000` | API port |
| `LLM_DEFAULT_PROVIDER` | `ollama` | `ollama` \| `openai` \| `anthropic` \| `gemini` \| `groq` \| `mock` |
| `LLM_DRY_RUN` | `false` | `true` = no real LLM calls, returns deterministic stubs |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Local Ollama endpoint |
| `OLLAMA_MODEL` | `qwen2.5:32b` | Local model |
| `OPENAI_API_KEY` | – | Fallback provider |
| `MIN_SCORE_TO_DRAFT` | `65` | Only draft proposals for gigs scoring >= this |

---

## API

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Liveness + config summary |
| `POST` | `/hunt` | Run a hunt cycle, returns scored gigs |
| `GET` | `/gigs` | List stored gigs (sorted by score) |
| `GET` | `/gigs/:id` | One gig with full detail |
| `POST` | `/gigs/:id/proposal` | Draft (or re-draft) a proposal |
| `GET` | `/proposals/:id` | Fetch a drafted proposal |

---

## Daily automation

Cron a daily hunt (6am):

```cron
0 6 * * *  cd /path/to/gighunter-ai && /usr/bin/node scripts/hunt.js >> hunt.log 2>&1
```

---

## Architecture

```
src/
  server.js          Express app + route wiring
  lib/
    llmHub.js        provider routing (ollama default, cloud fallbacks)
    sources.js       fetch + normalize public gig feeds (rss/json)
    scorer.js        score a gig 0-100 against your profile
    proposal.js      draft a tailored proposal via the LLM hub
    store.js         JSON-file persistence (swap for a DB later)
    logger.js        tiny logger
  routes/
    gigsRoutes.js
    proposalsRoutes.js
    healthRoutes.js
scripts/
  hunt.js            one full hunt cycle (CLI / cron)
  wire-all.js        verify env + config, print readiness
config/
  profile.example.json
tests/
  smoke.test.js
```

---

## Roadmap

- [ ] SQLite/Postgres store adapter
- [ ] Email/Slack/ClickUp daily digest
- [ ] Embeddings-based semantic match
- [ ] Web dashboard (React)

---

## License

MIT © 2026 Abdul Basit. **Free for commercial use** — clone it, rebrand it, ship it, sell it.
