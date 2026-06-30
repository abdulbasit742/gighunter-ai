# Follow-up engine

The single cheapest way to win more freelance work: follow up once. Most people never do. GigHunter tracks it for you.

## How it works
- When you mark a gig **applied**, GigHunter stamps the time (`appliedAt`).
- After **3 days** with no reply, the gig shows up in your follow-up list with a ready-to-send, low-pressure message.
- After **7 days**, it suggests one final nudge, then stops (no pestering).

## Use it
```bash
# API
GET  /api/followups            # gigs due for a nudge + draft messages
POST /gigs/:id/followup        # mark that you sent one (advances the counter)
```
The daily digest and dashboard can surface these so your morning view includes "3 follow-ups due" alongside new gigs.

## The messages
Two tones, both human and respectful:
- **Nudge 1 (day 3):** warm re-introduction, offers to share samples.
- **Nudge 2 (day 7):** gracious last touch, bows out politely if timing's off.

No spam, no pressure, just the timely reminder that turns silence into replies.
