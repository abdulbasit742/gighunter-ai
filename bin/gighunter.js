#!/usr/bin/env node
// Unified GigHunter CLI. One entry point for everything you'd do from the terminal.
// Usage: node bin/gighunter.js <command> [args]   (or `npm link` then `gighunter <command>`)
import { runHunt } from '../scripts/huntCore.js';
import { store, VALID_STATUS } from '../src/lib/store.js';
import { draftProposal } from '../src/lib/proposal.js';
import { loadProfile } from '../src/lib/profile.js';
import { computeStats } from '../src/lib/analytics.js';
import { PLATFORMS } from '../src/lib/platforms.js';
import { fetchSource } from '../src/lib/sources.js';

const [cmd, ...args] = process.argv.slice(2);
const c = { reset:'\x1b[0m', dim:'\x1b[2m', b:'\x1b[1m', g:'\x1b[32m', y:'\x1b[33m', r:'\x1b[31m', cy:'\x1b[36m' };
const color = (k, s) => `${c[k]}${s}${c.reset}`;

function printGig(g, i) {
  const v = g.verdict && g.verdict !== 'clean' ? color(g.verdict==='avoid'?'r':'y', ` [${g.verdict}]`) : '';
  const pay = g.payNote ? color('dim', ` · ${g.payNote}`) : '';
  console.log(`${color('cy', String(g.score).padStart(3))}  ${g.title}${v}`);
  console.log(`     ${color('dim', `${g.source} · ${g.status||'new'}`)}${pay}`);
  if (g.url) console.log(`     ${color('dim', g.url)}`);
}

function usage() {
  console.log(`\n${color('b','GigHunter CLI')}\n\n` +
    `  hunt                 run a full hunt cycle (fetch, score, draft, digest)\n` +
    `  list [status] [n]    list gigs (optional status: ${VALID_STATUS.join('|')})\n` +
    `  show <id>            show one gig + its proposal\n` +
    `  draft <id>           (re)draft a proposal for a gig\n` +
    `  status <id> <state>  set a gig's status (${VALID_STATUS.join('|')})\n` +
    `  stats                pipeline, win-rate, platform leaderboard\n` +
    `  doctor               live-ping every platform\n` +
    `  platforms            list the platform registry\n`);
}

async function main() {
  switch (cmd) {
    case 'hunt': {
      const r = await runHunt();
      console.log(color('g', `\n✓ hunt complete`));
      console.log(`  ${r.totalGigs} total · ${r.newGigs} new · ${r.draftedProposals.length} drafted · ${r.clickupPushed||0} -> clickup\n`);
      r.topGigs.forEach(printGig);
      break;
    }
    case 'list': {
      const status = VALID_STATUS.includes(args[0]) ? args[0] : null;
      const n = Number(args.find((a) => /^\d+$/.test(a))) || 20;
      const gigs = store.listGigs({ status }).slice(0, n);
      if (!gigs.length) { console.log(color('dim', 'no gigs. run: gighunter hunt')); break; }
      gigs.forEach(printGig);
      break;
    }
    case 'show': {
      const g = store.getGig(args[0]);
      if (!g) { console.log(color('r', 'not found')); break; }
      printGig(g);
      console.log('\n' + (g.description || '').slice(0, 800));
      const p = store.getProposal(g.id);
      if (p) console.log(color('b', `\n--- proposal (${p.tone||'?'}) ---\n`) + p.body);
      break;
    }
    case 'draft': {
      const g = store.getGig(args[0]);
      if (!g) { console.log(color('r', 'not found')); break; }
      const p = await draftProposal(g, loadProfile());
      store.saveProposal(p);
      console.log(color('g', '✓ drafted:\n') + p.body);
      break;
    }
    case 'status': {
      const [id, state] = args;
      if (!VALID_STATUS.includes(state)) { console.log(color('r', `status must be: ${VALID_STATUS.join(', ')}`)); break; }
      const g = store.setStatus(id, state);
      console.log(g ? color('g', `✓ ${id} -> ${state}`) : color('r', 'not found'));
      break;
    }
    case 'stats': {
      const s = computeStats(loadProfile());
      console.log(`\n${color('b','Pipeline')}`);
      s.pipeline.forEach((p) => console.log(`  ${p.stage.padEnd(9)} ${p.count}`));
      console.log(`\n${color('b','Win rate')} ${(s.winRate*100).toFixed(0)}%   ${color('b','Avg score')} ${s.avgScore}`);
      if (s.platforms.length) {
        console.log(`\n${color('b','Platform leaderboard')}`);
        s.platforms.forEach((p) => console.log(`  ${p.platform.padEnd(20)} won ${p.won}/${p.applied}  win ${(p.winRate*100).toFixed(0)}%  avg ${p.avgScore}`));
      }
      if (s.winningKeywords.length) console.log(`\n${color('b','Winning keywords')} ` + s.winningKeywords.map((k) => `${k.keyword}(${k.count})`).join(', '));
      console.log('');
      break;
    }
    case 'doctor': {
      for (const p of PLATFORMS) {
        if (p.mode === 'manual') { console.log(`${color('dim','skip ')} ${p.name} (manual)`); continue; }
        if (p.mode === 'api' && p.envKey && !process.env[p.envKey]) { console.log(`${color('y','key? ')} ${p.name} needs ${p.envKey}`); continue; }
        try { const gigs = await fetchSource({ name: p.name, type: p.type, url: p.url }); console.log(`${gigs.length?color('g','ok   '):color('y','empty')} ${p.name} ${gigs.length}`); }
        catch (e) { console.log(`${color('r','fail ')} ${p.name} ${e.message}`); }
      }
      break;
    }
    case 'platforms': {
      PLATFORMS.forEach((p) => console.log(`  ${p.key.padEnd(16)} ${color('dim', p.mode.padEnd(7))} ${p.name}`));
      break;
    }
    default: usage();
  }
}

main().catch((e) => { console.error(color('r', `error: ${e.message}`)); process.exit(1); });
