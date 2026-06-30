# Go Live

A short checklist to run GigHunter AI for real, daily.

## Checklist
- [ ] `npm install`
- [ ] `.env` filled (provider + model)
- [ ] `config/profile.json` tuned to your real skills/rates
- [ ] Ollama running and model warm (`OLLAMA_KEEP_ALIVE=-1`)
- [ ] `npm run wire` shows all OK
- [ ] `npm test` green
- [ ] `npm run hunt` returns real gigs

## Daily automation (cron)
Run a hunt every morning at 6am and log output:
```cron
0 6 * * *  cd /path/to/gighunter-ai && /usr/bin/node scripts/hunt.js >> hunt.log 2>&1
```

## Deploy the API (optional)
It is a stateless Express app. Any Node host works (Render, Railway, a VPS, or your own box):
```bash
NODE_ENV=production PORT=3000 node src/server.js
```
Put it behind a reverse proxy (nginx/caddy) for TLS.

## Scaling notes
- Swap `lib/store.js` for SQLite or Postgres when you outgrow JSON.
- Add a digest step (email / Slack / ClickUp) at the end of `huntCore.js` to push top gigs to where you actually look.
- Respect each source's robots.txt and ToS. GigHunter reads public feeds only and never auto-submits.
