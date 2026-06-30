// Interactive setup wizard: `npm run setup`
// Walks you through profile + platform + LLM config with plain questions.
// Writes config/profile.json and .env. No deps, uses node:readline.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { PLATFORMS } from '../src/lib/platforms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const CFG = path.join(root, 'config', 'profile.json');
const ENV = path.join(root, '.env');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q, def = '') => new Promise((res) => rl.question(def ? `${q} [${def}] ` : `${q} `, (a) => res(a.trim() || def)));

function banner() {
  console.log('\n=== GigHunter AI :: setup wizard ===');
  console.log('Press Enter to accept the [default]. This writes config/profile.json + .env.\n');
}

async function run() {
  banner();

  // --- profile ---
  const name = await ask('Your name?', 'Abdul Basit');
  const headline = await ask('One-line headline?', 'Full-stack & AI SaaS developer');
  const skillsRaw = await ask('Your skills (comma separated)?', 'node.js, react, postgres, saas, ai, whatsapp api, stripe');
  const minBudget = await ask('Minimum budget in USD?', '300');
  const prefRaw = await ask('Preferred keywords?', 'saas, automation, ai, whatsapp, dashboard, api');
  const avoidRaw = await ask('Avoid keywords?', 'unpaid, equity only, data entry, wordpress only');

  // --- platforms ---
  console.log('\nAvailable platforms:');
  PLATFORMS.forEach((p, i) => {
    const tag = p.mode === 'public' ? 'works now' : p.mode === 'api' ? `needs ${p.envKey || 'key'}` : 'manual/drafting-only';
    console.log(`  ${String(i + 1).padStart(2)}. ${p.name.padEnd(34)} (${tag})`);
  });
  const pubKeys = PLATFORMS.filter((p) => p.mode === 'public').map((p) => p.key);
  const pick = await ask('\nWhich platforms? Enter numbers (e.g. 1,2,3) or "all-public"', 'all-public');
  let platforms;
  if (pick.toLowerCase() === 'all-public') platforms = pubKeys;
  else platforms = pick.split(',').map((n) => PLATFORMS[Number(n.trim()) - 1]).filter(Boolean).map((p) => p.key);

  // --- LLM ---
  const provider = await ask('\nLLM provider (ollama/openai/mock)?', 'ollama');
  let ollamaModel = 'qwen2.5:32b';
  let openaiKey = '';
  if (provider === 'ollama') ollamaModel = await ask('Ollama model?', 'qwen2.5:32b');
  if (provider === 'openai') openaiKey = await ask('OpenAI API key?', '');

  // --- optional platform keys ---
  const apiPicked = PLATFORMS.filter((p) => p.mode === 'api' && platforms.includes(p.key));
  const apiKeys = {};
  for (const p of apiPicked) {
    apiKeys[p.envKey] = await ask(`Token for ${p.name} (${p.envKey}) [skip with Enter]`, '');
  }

  // --- write profile ---
  const profile = {
    name, headline,
    skills: skillsRaw.split(',').map((s) => s.trim()).filter(Boolean),
    minBudgetUsd: Number(minBudget) || 0,
    preferredKeywords: prefRaw.split(',').map((s) => s.trim()).filter(Boolean),
    avoidKeywords: avoidRaw.split(',').map((s) => s.trim()).filter(Boolean),
    platforms,
  };
  fs.writeFileSync(CFG, JSON.stringify(profile, null, 2));

  // --- write .env ---
  const env = [
    'PORT=3000',
    `LLM_DEFAULT_PROVIDER=${provider}`,
    'LLM_DRY_RUN=false',
    'MIN_SCORE_TO_DRAFT=65',
    'OLLAMA_HOST=http://127.0.0.1:11434',
    `OLLAMA_MODEL=${ollamaModel}`,
    `OPENAI_API_KEY=${openaiKey}`,
    'OPENAI_MODEL=gpt-4o-mini',
    ...Object.entries(apiKeys).map(([k, v]) => `${k}=${v}`),
  ].join('\n') + '\n';
  fs.writeFileSync(ENV, env);

  console.log('\n✅ Wrote config/profile.json and .env');
  console.log('Next:');
  console.log('  npm run doctor   # see which platforms are live');
  console.log('  npm run hunt     # hunt + score + draft');
  console.log('  npm start        # API + dashboard at http://localhost:3000/app\n');
  rl.close();
}

run();
