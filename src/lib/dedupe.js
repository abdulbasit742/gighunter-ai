// Cross-platform near-duplicate detection.
// The same gig often gets posted to RemoteOK, WWR, and a company site at once.
// We don't want 3 rows for 1 job. This collapses near-duplicates and records
// every source a gig appeared on, so the dashboard shows ONE gig with its sources.

// Normalize a title for comparison: lowercase, strip punctuation & common noise.
function normTitle(t = '') {
  return t.toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(remote|contract|freelance|urgent|hiring|f\/?t|p\/?t|senior|junior|mid)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shingles(s, n = 3) {
  const set = new Set();
  const clean = s.replace(/\s+/g, ' ');
  for (let i = 0; i + n <= clean.length; i++) set.add(clean.slice(i, i + n));
  return set;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

// Decide if two gigs are the same underlying job.
export function isDuplicate(g1, g2, threshold = 0.82) {
  const t1 = normTitle(g1.title);
  const t2 = normTitle(g2.title);
  if (!t1 || !t2) return false;
  if (t1 === t2) return true;
  // company match + high title similarity is a strong signal
  const sim = jaccard(shingles(t1), shingles(t2));
  const sameCompany = g1.company && g2.company && g1.company.toLowerCase() === g2.company.toLowerCase();
  if (sameCompany && sim >= 0.6) return true;
  return sim >= threshold;
}

// Collapse an array of gigs. Keeps the richest record, merges sources/urls.
export function dedupeGigs(gigs) {
  const kept = [];
  for (const g of gigs) {
    const match = kept.find((k) => isDuplicate(k, g));
    if (!match) {
      kept.push({ ...g, sources: [g.source].filter(Boolean), altUrls: [g.url].filter(Boolean) });
      continue;
    }
    // merge: prefer the longer description, collect every source + url
    if ((g.description || '').length > (match.description || '').length) match.description = g.description;
    if (g.budgetUsd != null && match.budgetUsd == null) match.budgetUsd = g.budgetUsd;
    if (g.source && !match.sources.includes(g.source)) match.sources.push(g.source);
    if (g.url && !match.altUrls.includes(g.url)) match.altUrls.push(g.url);
  }
  // reflect merged sources back into the display `source` field
  for (const k of kept) k.source = k.sources.length > 1 ? `${k.sources[0]} +${k.sources.length - 1}` : (k.sources[0] || k.source);
  return kept;
}
