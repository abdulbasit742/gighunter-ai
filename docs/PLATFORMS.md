# Platform Integrations (10)

GigHunter connects to platforms in one of three honest modes. It **never** logs in or scrapes a site that forbids it.

| # | Platform | Mode | Works | How to enable |
|---|----------|------|-------|---------------|
| 1 | RemoteOK | `public` | ✅ now | nothing, public JSON |
| 2 | We Work Remotely | `public` | ✅ now | nothing, public RSS |
| 3 | Remotive | `public` | ✅ now | nothing, public JSON API |
| 4 | Arbeitnow | `public` | ✅ now | nothing, public JSON API |
| 5 | Jobicy | `public` | ✅ now | nothing, public JSON API |
| 6 | Hacker News (hiring) | `public` | ✅ now | nothing, public RSS |
| 7 | Reddit r/forhire | `public` | ✅ now | nothing, public RSS |
| 8 | The Muse | `api` | 🔑 with key | set `THEMUSE_API_KEY` (free) |
| 9 | Freelancer.com | `api` | 🔑 with token | register app → set `FREELANCER_OAUTH_TOKEN` |
| 10 | Upwork | `api` | 🔑 with approval | approved OAuth app → set `UPWORK_OAUTH_TOKEN` |
| + | Fiverr | `manual` | ✍️ drafting-only | no public feed; paste a brief, GigHunter scores + drafts |

## What "mode" means
- **public** — Open JSON/RSS feed. Hunts automatically today, zero config, ToS-friendly.
- **api** — Official API exists but needs a key/OAuth token. Add the credential and the platform turns on automatically (the registry checks for the env key).
- **manual** — The platform has **no** public/official job feed and forbids scraping. GigHunter will NOT touch it programmatically. You paste the gig text and still get AI scoring + a drafted proposal.

## Why not just auto-apply everywhere?
Upwork, Fiverr, etc. ban accounts that automate logins/applications. GigHunter keeps you safe: it gathers and drafts, **you** click submit. That is the difference between a tool you can rely on and a banned account.

## Choosing platforms
In `config/profile.json`, set `platforms` to the keys you want:
```json
"platforms": ["remoteok", "remotive", "hackernews", "freelancer"]
```
Leave it empty to auto-use every working public platform.

## Check what is live
```bash
npm run doctor
```
Pings each platform and prints OK / EMPTY / FAIL / KEY? so you never guess.

## Adding an 11th platform
Drop a new entry in `src/lib/platforms.js`. If it is a standard JSON or RSS feed, that is all you need, the fetcher and scorer handle the rest.
