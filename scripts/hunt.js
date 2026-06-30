// CLI entry: `npm run hunt`. Run a full cycle and pretty-print the result.
import { runHunt } from './huntCore.js';

const result = await runHunt();
console.log('\n=== GigHunter AI ===');
console.log(`Hunted: ${result.huntedAt}`);
console.log(`Total gigs scored: ${result.totalGigs}`);
console.log(`Proposals drafted: ${result.draftedProposals.length}\n`);
console.log('Top gigs:');
for (const g of result.topGigs) {
  console.log(`  [${String(g.score).padStart(3)}] ${g.title}  (${g.source})`);
  if (g.url) console.log(`        ${g.url}`);
}
console.log('');
