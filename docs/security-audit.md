# Security audit — untrusted gig content

Date: 2026-07-15

## Fixed

- Raw gig descriptions no longer share the trusted instruction channel with proposal or scoring rules.
- High-risk override, exfiltration, and command/tool instructions are blocked from model drafting.
- Gig title and description lengths are bounded and control characters are normalized.
- OpenAI and Ollama calls preserve separate system and user fields.
- LLM score JSON is shape-checked, clamped, and list lengths are bounded.
- Draft output is bounded and rejected when it contains restricted internal-data language.
- Deterministic scoring exposes content-safety flags and caps high-risk listings instead of silently trusting them.
- CI and a source scanner prevent direct raw-description interpolation from returning.

## Residual risks

- Pattern matching cannot identify every adversarial or obfuscated instruction.
- Medium-risk listings can still be sent to the configured model inside an explicit untrusted-data boundary.
- Local or cloud models may ignore instructions despite role separation.
- Feed URLs and client identity can still be fraudulent even when prompt content is safe.
- The existing provider hub falls back to deterministic mock output after provider failure; operators should use `LLM_DRY_RUN=true` deliberately during tests and monitor provider health in production.

## Operational rule

Never add model tools, automatic application submission, marketplace credentials, or external messaging to the listing-processing path without a separate authorization, human approval, and audit design.
