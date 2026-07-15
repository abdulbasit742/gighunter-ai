# Prompt-safety reference review

Reviewed on 2026-07-15.

## OpenAI Agents SDK

Relevant pattern: input guardrails and tripwires run at a defined boundary and can stop an agent before unsafe work continues.

Adopted: a stable fail-closed error code, explicit assessment metadata, and automated tests for blocked inputs.

Not adopted: the SDK runtime or model-based guardrail agents. GigHunter keeps a deterministic dependency-free guard for its narrow feed-ingestion surface.

## NVIDIA NeMo Guardrails

Relevant pattern: separate input/output rails and evaluate jailbreak or prompt-injection behavior as its own security control.

Adopted: independent input classification, output validation, bounded text, and a dedicated regression scanner.

Not adopted: Colang configuration, hosted detectors, or a separate guardrail model.

## Microsoft Semantic Kernel

Relevant pattern: distinguish trusted execution instructions from untrusted prompt variables and validate content around model calls.

Adopted: structured system/user messages and one shared policy module used by scoring and proposal generation.

Not adopted: kernel migration, plugins, planners, or automatic tool execution.

## Result

The smallest coherent improvement was to prevent raw feed text from sharing the trusted instruction channel, block high-risk listings from drafting, keep deterministic scoring available with visible flags, and validate model score/draft outputs before storing or displaying them.
