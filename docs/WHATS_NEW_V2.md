# What's new in v2.0

GigHunter went from "good" to "world-class". Highlights:

## 🧠 Semantic AI matching
Scoring now blends three signals:
1. **Heuristic** — skills/keywords/budget/freshness (instant, free)
2. **Semantic** — local embeddings (`nomic-embed-text` via Ollama) compute how close a gig is to *your* profile by meaning, not just exact words. A gig that says "build a messaging blast tool" now matches your "whatsapp broadcast" skill even without the exact phrase.
3. **LLM refine** — for borderline gigs only (45-80), to save compute.

Pull the embed model once: `ollama pull nomic-embed-text`. No embeddings? It degrades gracefully to heuristics.

## 🗂️ Status tracking
Every gig now carries a status: `new → seen → applied → won → rejected`. Status **survives across hunts**, so you never re-process or lose a lead. New gigs are flagged automatically; the dashboard shows a "N new" badge.

## 📨 Daily digest
`npm run digest` (or automatic at the end of every hunt) prints the best new gigs and, if you set `DIGEST_WEBHOOK_URL`, pushes them to Slack / Discord / ClickUp. Cron it for a daily 6am drop.

## 🖥️ Upgraded dashboard (`/app`)
- Filter tabs: All / New / Applied / Won
- Per-gig actions: open, draft proposal, mark applied/won/skip
- **Proposal modal**: preview, edit, **copy to clipboard**, re-draft
- Live platform health + "N new" badge

## Same safe principles
Still ToS-safe: public feeds + official APIs only, never auto-login or auto-submit. You stay in control of the final click.
