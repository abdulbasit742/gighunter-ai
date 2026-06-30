# Daily automation

Two ways to run GigHunter every morning. Pick one.

## Option A — Built-in scheduler (easiest)
Keep the server running on your always-on box (PC #1, where Ollama lives) and let it hunt itself.

In `.env`:
```
SCHEDULE_HUNT=true
SCHEDULE_HOUR=6        # 6 AM local
SCHEDULE_MINUTE=0
DIGEST_WEBHOOK_URL=    # paste your ClickUp/Slack/Discord webhook here
```
Then:
```bash
npm start
```
That's it. Every day at 6 AM it hunts, scores, drafts, and pushes a digest of the best new gigs to your webhook. Leave it running (or use pm2 / a Windows service to keep it alive across reboots).

## Option B — Cron (if you don't keep the server up)
```cron
0 6 * * *  cd /path/to/gighunter-ai && /usr/bin/node scripts/hunt.js >> hunt.log 2>&1
```

## Get the digest into ClickUp
1. In ClickUp, create (or open) the channel where you want gig alerts.
2. Add an **incoming webhook** integration and copy its URL.
3. Paste it into `DIGEST_WEBHOOK_URL`.

GigHunter auto-detects ClickUp / Slack / Discord from the URL and formats the message accordingly. Every morning you'll get the top new gigs (with scores + links) right where you work.

## Keep Ollama warm
So the morning hunt is instant:
```
OLLAMA_KEEP_ALIVE=-1
```
