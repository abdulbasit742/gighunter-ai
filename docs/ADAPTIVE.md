# Adaptive scoring (self-learning)

GigHunter gets smarter the more you use it, without any model training.

## How it works
Every time you mark a gig **won** or **rejected**, that becomes a training signal:
- Words & platforms common in your **wins** get positive weight.
- Words & platforms common in your **rejections** get negative weight.

On each hunt, GigHunter builds this model from your history and nudges new gig scores toward what actually pays you. The nudge is bounded to **±15 points** so it refines the ranking but never overrides the core heuristic + semantic score.

## Why it's safe & explainable
- Needs at least **3 decided gigs** before it does anything (no noise from a cold start).
- Weights are clamped to ±5 per token so one lucky win can't dominate.
- Every adjustment shows up in the gig's reasons, e.g. `learned +12 (+whatsapp, +saas, +broadcast)`, so you always see *why* a gig ranked up.

## What this means for you
The more you act on gigs, the better the top of your list matches the work you actually win. It's a feedback loop tuned to *your* track record, running entirely on your own machine.
