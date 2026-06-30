// Local embeddings via Ollama. Powers semantic matching (far better than keywords).
// Falls back gracefully: if embeddings unavailable, scorer just uses heuristics.
import { logger } from './logger.js';

const HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';

export async function embed(text) {
  const res = await fetch(`${HOST}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt: String(text).slice(0, 4000) }),
  });
  if (!res.ok) throw new Error(`embeddings ${res.status}`);
  const data = await res.json();
  return data.embedding || [];
}

export function cosine(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Build (and cache in-memory) the profile vector from skills + headline.
let _profileVec = null;
let _profileKey = '';
export async function profileVector(profile) {
  const key = `${profile.headline} ${(profile.skills||[]).join(' ')} ${(profile.preferredKeywords||[]).join(' ')}`;
  if (_profileVec && _profileKey === key) return _profileVec;
  try {
    _profileVec = await embed(key);
    _profileKey = key;
    return _profileVec;
  } catch (e) {
    logger.warn(`profileVector unavailable: ${e.message}`);
    return null;
  }
}
