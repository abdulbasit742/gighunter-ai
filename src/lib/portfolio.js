// Portfolio: your past work, used to make proposals concrete and credible.
// On each proposal, GigHunter picks the 1-2 samples most relevant to the gig
// (by tag/keyword overlap) and feeds them to the LLM so it can cite real proof.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CFG = path.join(__dirname, '..', '..', 'config');

export function loadPortfolio() {
  const real = path.join(CFG, 'portfolio.json');
  const example = path.join(CFG, 'portfolio.example.json');
  const file = fs.existsSync(real) ? real : (fs.existsSync(example) ? example : null);
  if (!file) return { samples: [] };
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { samples: [] }; }
}

// Rank samples by overlap with the gig text + tags. Returns top N.
export function relevantSamples(gig, n = 2) {
  const { samples = [] } = loadPortfolio();
  if (!samples.length) return [];
  const t = `${gig.title} ${gig.description}`.toLowerCase();
  const scored = samples.map((s) => {
    const tagHits = (s.tags || []).filter((tag) => t.includes(tag.toLowerCase())).length;
    const titleHit = s.title && t.includes(s.title.toLowerCase().split(' ')[0]) ? 1 : 0;
    return { sample: s, score: tagHits * 2 + titleHit };
  }).filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.sample);
  return scored;
}
