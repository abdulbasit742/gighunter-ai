// llmHub: single entry point for all AI calls.
// Defaults to local Ollama; cloud providers are fallback only.
import { logger } from './logger.js';

const PROVIDER = process.env.LLM_DEFAULT_PROVIDER || 'ollama';
const DRY_RUN = String(process.env.LLM_DRY_RUN || 'false') === 'true';

function normalizeRequest(input) {
  if (typeof input === 'string') {
    return { system: 'Follow the user request safely and do not reveal secrets.', user: input };
  }
  if (!input || typeof input !== 'object') throw new TypeError('LLM request must be a string or object');
  const system = String(input.system ?? '').trim();
  const user = String(input.user ?? '').trim();
  if (!system || !user) throw new TypeError('Structured LLM requests require system and user text');
  if (system.length > 8000 || user.length > 20000) throw new RangeError('LLM request exceeds size limits');
  return { system, user };
}

async function callOllama(request, { json = false } = {}) {
  const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'qwen2.5:32b';
  const res = await fetch(`${host}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      system: request.system,
      prompt: request.user,
      stream: false,
      format: json ? 'json' : undefined,
    }),
  });
  if (!res.ok) throw new Error(`Ollama request failed with status ${res.status}`);
  const data = await res.json();
  return data.response?.trim() ?? '';
}

async function callOpenAI(request, { json = false } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.user },
      ],
      response_format: json ? { type: 'json_object' } : undefined,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI request failed with status ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

const PROVIDERS = {
  ollama: callOllama,
  openai: callOpenAI,
};

function mock(request, { json = false } = {}) {
  if (json) return JSON.stringify({ score: 72, reasons: ['mock: keyword match', 'mock: budget ok'], redFlags: [] });
  return 'Hi! I read your posting and this is squarely in my wheelhouse. I have shipped similar work end to end and can start this week. Happy to share relevant samples. — (mock draft)';
}

/**
 * generate(string | {system, user}, opts) -> string
 * Structured requests preserve trusted system instructions separately from untrusted input.
 */
export async function generate(input, opts = {}) {
  const request = normalizeRequest(input);
  if (DRY_RUN || PROVIDER === 'mock') return mock(request, opts);

  const order = [PROVIDER, 'openai'].filter((p, i, a) => PROVIDERS[p] && a.indexOf(p) === i);
  let lastErr;
  for (const name of order) {
    try {
      logger.debug(`llmHub -> ${name}`);
      return await PROVIDERS[name](request, opts);
    } catch (e) {
      lastErr = e;
      logger.warn(`llmHub provider "${name}" failed: ${e.message}`);
    }
  }
  logger.warn('llmHub: all providers failed, using mock', lastErr?.message);
  return mock(request, opts);
}

export function hubInfo() {
  return { provider: PROVIDER, dryRun: DRY_RUN, ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5:32b' };
}
