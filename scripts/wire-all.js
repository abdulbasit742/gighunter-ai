// Verify env + config and print readiness. Run: `npm run wire`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hubInfo } from '../src/lib/llmHub.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const checks = [];
const ok = (label, pass, hint = '') => checks.push({ label, pass, hint });

ok('config/profile.json present', fs.existsSync(path.join(root, 'config', 'profile.json')), 'cp config/profile.example.json config/profile.json');
ok('.env present', fs.existsSync(path.join(root, '.env')), 'cp .env.example .env');

const info = hubInfo();
ok(`LLM provider = ${info.provider}`, true);
if (info.provider === 'ollama') ok(`Ollama model = ${info.ollamaModel}`, true, 'make sure `ollama serve` is running');

console.log('\n=== GigHunter AI: wire check ===');
for (const c of checks) {
  console.log(`${c.pass ? 'OK  ' : 'MISS'}  ${c.label}${!c.pass && c.hint ? `  -> ${c.hint}` : ''}`);
}
const missing = checks.filter((c) => !c.pass).length;
console.log(missing ? `\n${missing} item(s) need attention.\n` : '\nAll set. Run: npm run hunt\n');
