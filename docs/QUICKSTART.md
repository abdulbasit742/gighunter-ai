# Quickstart — connect everything the easy way

Three commands. No config files to hand-edit.

```bash
npm install
npm run setup     # answer a few questions → writes config + .env for you
npm start         # open http://localhost:3000/app
```

## The wizard (`npm run setup`)
Asks you, in plain language:
- your name, headline, skills, min budget, preferred/avoid keywords
- which platforms to enable (type `all-public` to turn on all 7 working ones)
- your LLM provider (default: local Ollama `qwen2.5:32b`)
- any optional platform API tokens (The Muse / Freelancer / Upwork)

It writes `config/profile.json` and `.env` for you. Done.

## The dashboard (`/app`)
A single web page where you can:
- ✅ tick/untick platforms and **Save** (no editing JSON)
- 🩺 **Check platforms** — live pings each one, shows ok / empty / needs-key / fail
- ▶ **Run hunt now** — fetches, scores, drafts, and lists top gigs with their scores

## Still prefer the terminal?
```bash
npm run doctor    # which platforms are live right now
npm run hunt      # one hunt cycle, prints top gigs
```

That is it. Enable platforms with a checkbox, hunt with a button.
