# ClickUp bridge

Run your whole freelancing pipeline inside ClickUp. When enabled, every hunt pushes the best new gigs into a ClickUp list as tasks, scored, prioritized, and linked.

## Setup
1. Get a personal API token from ClickUp (Settings → Apps → API Token).
2. Find the List ID where you want gigs to land (open the list, it's in the URL).
3. In `.env`:
```
CLICKUP_API_TOKEN=pk_xxx
CLICKUP_LIST_ID=901xxxxxxx
```
That's it. The next hunt creates a task per top gig.

## What each task looks like
- **Title:** `[87] Build a WhatsApp broadcast SaaS`
- **Priority:** mapped from score (85+ urgent, 70+ high, 50+ normal, else low)
- **Description:** score, source, pay note, any risk flags, a snippet, and a link to the original
- **Tags:** `gighunter`, plus the source platform

## Notes
- Only gigs scoring >= `MIN_SCORE_TO_DRAFT` and not flagged `avoid` are pushed.
- Fully optional: leave the env vars unset and this does nothing.
- This is the task-level integration. For a lightweight feed instead, use the digest webhook (`DIGEST_WEBHOOK_URL`) which can also point at a ClickUp channel.
