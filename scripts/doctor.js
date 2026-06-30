// Live doctor: ping every platform and report what actually works right now.
// Run: `npm run doctor`
import { PLATFORMS, activeSources } from '../src/lib/platforms.js';
import { fetchSource } from '../src/lib/sources.js';

const pad = (s, n) => String(s).padEnd(n);

console.log('\n=== GigHunter AI :: platform doctor ===\n');

for (const p of PLATFORMS) {
  if (p.mode === 'manual') {
    console.log(`${pad('SKIP', 5)} ${pad(p.name, 34)} manual (drafting-only)`);
    continue;
  }
  if (p.mode === 'api' && p.envKey && !process.env[p.envKey]) {
    console.log(`${pad('KEY?', 5)} ${pad(p.name, 34)} needs ${p.envKey}`);
    continue;
  }
  try {
    const gigs = await fetchSource({ name: p.name, type: p.type, url: p.url });
    const status = gigs.length > 0 ? 'OK' : 'EMPTY';
    console.log(`${pad(status, 5)} ${pad(p.name, 34)} ${gigs.length} gigs`);
  } catch (e) {
    console.log(`${pad('FAIL', 5)} ${pad(p.name, 34)} ${e.message}`);
  }
}

const live = activeSources();
console.log(`\n${live.length} platform(s) currently active for auto-hunt.`);
console.log('Tip: set THEMUSE_API_KEY / FREELANCER_OAUTH_TOKEN / UPWORK_OAUTH_TOKEN to enable more.\n');
