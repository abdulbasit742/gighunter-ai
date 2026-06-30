# Multi-variant proposals

Different gigs reward different angles. A startup founder skims; an engineering lead wants to see you understand the problem. GigHunter now drafts **three tones at once** so you pick the best fit instead of guessing.

## The three tones
- **concise** — punchy, 80-110 words, leads with the outcome. Great for high-volume boards.
- **warm** — friendly, rapport-building, 130-170 words. Great for founders/small teams.
- **technical** — credibility-first, outlines an approach. Great for engineering-led clients.

## In the dashboard
Open a gig's proposal and hit **Generate variants**. You'll see all three side by side. Pick one, tweak if needed, **copy**, or **save** it as the gig's proposal.

## API
```http
POST /gigs/:id/variants            # -> { variants: [{tone, body}, ...] }
POST /gigs/:id/proposal/select     # body: { body, tone } -> saves chosen variant
GET  /api/tones                    # -> { tones: [...] }
```

All variants are portfolio-aware and run through the same safe LLM hub (local Ollama by default). They're generated in parallel, so it's nearly as fast as one.
