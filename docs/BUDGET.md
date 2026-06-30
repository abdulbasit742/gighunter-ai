# Budget & rate intelligence

Gigs hide pay in free text: `$2k-3k`, `50/hr`, `€4000/month`, `5k fixed`. GigHunter parses it, normalizes to USD, and tells you if it's worth your time, automatically.

## Set your targets
In `config/profile.json`:
```json
{
  "targetHourlyUsd": 35,
  "minBudgetUsd": 300
}
```

## What it does
For every gig it extracts a pay figure (handling `$`, `€`, `£`, `₹`, `k` shorthand, ranges, and periods), converts to USD, and assigns a verdict:
- **great** — well above your target (score +8)
- **ok** — at or near target
- **low** — below target (score -10)
- **unknown** — no pay listed

The verdict feeds the score (good pay ranks higher, low pay sinks) and shows on the gig as `pay: $50/hr vs target $35`.

## Why it matters
You stop opening gigs that were never going to pay enough, and the well-paid ones rise to the top on their own.
