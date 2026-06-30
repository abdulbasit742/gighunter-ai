# GigHunter CLI

Everything you can do in the dashboard, from the terminal. Great for SSH, cron, or just speed.

```bash
node bin/gighunter.js <command>
# or: npm run cli -- <command>
# or after `npm link`: gighunter <command>
```

## Commands
| Command | What it does |
|---|---|
| `hunt` | Run a full cycle: fetch, score, draft, digest, (ClickUp) |
| `list [status] [n]` | List gigs, optionally by status, limit n |
| `show <id>` | Show one gig's detail + its saved proposal |
| `draft <id>` | (Re)draft a proposal for a gig |
| `status <id> <state>` | Set status: new/seen/applied/won/rejected |
| `stats` | Pipeline, win-rate, platform leaderboard, winning keywords |
| `doctor` | Live-ping every platform |
| `platforms` | List the platform registry |

## Examples
```bash
gighunter hunt                 # find + score + draft today's gigs
gighunter list new 10          # top 10 new gigs
gighunter show a1b2c3          # inspect one
gighunter status a1b2c3 applied  # mark it applied
gighunter stats                # how's the pipeline doing
```

Output is color-coded: score in cyan, risky gigs flagged red/yellow, pay notes dimmed.
