# Prompt safety

Gig titles and descriptions come from external feeds and are untrusted data. A listing can contain text that looks like instructions to an AI model even when the feed itself is legitimate.

## Behavior

- **Low risk:** the listing is sanitized, bounded, placed inside `UNTRUSTED_GIG_DATA`, and may be scored or drafted.
- **Medium risk:** the same isolation applies and content-safety flags are returned for human review.
- **High risk:** deterministic scoring continues with a score cap and visible red flags, but model proposal drafting is blocked with `untrusted_gig_blocked`.

High-risk patterns include attempts to override prior instructions, reveal secrets or system prompts, or execute tools and shell commands.

## Trust boundary

`src/lib/promptSafety.js` owns classification, text limits, message construction, and model-output validation. `src/lib/llmHub.js` keeps trusted system instructions separate from user content for both Ollama and OpenAI.

The guard is defense in depth, not proof that a listing is safe. Users must still inspect the original posting, URL, client history, payment terms, and platform rules before applying.

## Verification

```bash
node --test tests/promptSafety.test.js
npm run security-check
npm test
```

When adding a new AI path, use the policy module rather than interpolating `gig.title` or `gig.description` directly into a trusted prompt.
