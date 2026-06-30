// llmHub: single entry point for all AI calls.
// Defaults to local Ollama; cloud providers are fallback only.
// Mirrors the production "AI Brain Bridge" pattern: one hub, many providers.
import { logger } from './logger.js';

const PROVIDER = process.env.LLM_DEFAULT_PROVIDER || 'ollama';
const DRY_RUN = String(process.env.LLM_DRY_RUN || 'false') === 'true';

async function callOllama(prompt, { json = false } = {}) {
  const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'qwen2.5:32b';
  const res = await fetch(`${host}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, format: json ? 'json' : undefined }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.response?.trim() ?? '';
}

async function callOpenAI(prompt, { json = false } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: json ? { type: 'json_object' } : undefined,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

const PROVIDERS = {
  ollama: callOllama,
  openai: callOpenAI,
  // anthropic / gemini / groq follow the same shape; add as needed.
};

// Deterministic stub so the whole pipeline works with zero AI configured.
function mock(prompt, { json = false } = {}) {
  if (json) return JSON.stringify({ score: 72, reasons: ['mock: keyword match', 'mock: budget ok'], redFlags: [] });
  return 'Hi! I read your posting and this is squarely in my wheelhouse. I have shipped similar work end to end and can start this week. Happy to share relevant samples. — (mock draft)';
}

/**
 * generate(prompt, opts) -> string
 * Tries the default provider, then falls back gracefully, then mock.
 */
export async function generate(prompt, opts = {}) {
  if (DRY_RUN || PROVIDER === 'mock') return mock(prompt, opts);

  const order = [PROVIDER, 'openai'].filter((p, i, a) => PROVIDERS[p] && a.indexOf(p) === i);
  let lastErr;
  for (const name of order) {
    try {
      logger.debug(`llmHub -> ${name}`);
      return await PROVIDERS[name](prompt, opts);
    } catch (e) {
      lastErr = e;
      logger.warn(`llmHub provider "${name}" failed: ${e.message}`);
    }
  }
  logger.warn('llmHub: all providers failed, using mock', lastErr?.message);
  return mock(prompt, opts);
}

export function hubInfo() {
  return { provider: PROVIDER, dryRun: DRY_RUN, ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5:32b' };
}
