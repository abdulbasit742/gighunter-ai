// Budget & rate intelligence.
// Most gigs bury pay in free text ('$2k-3k', '50/hr', '€4000 month'). This pulls
// a normalized USD figure out of any posting and compares it to YOUR target rate,
// so you instantly know if a gig is worth your time.

const CUR = { '$': 1, 'usd': 1, '€': 1.08, 'eur': 1.08, '£': 1.27, 'gbp': 1.27, '₹': 0.012, 'inr': 0.012 };

function toUsd(amount, symbol) {
  const rate = CUR[(symbol || '$').toLowerCase()] ?? 1;
  return Math.round(amount * rate);
}

// Parse a money token like '$2,500', '3k', '50k', '€4000'.
function parseAmount(raw) {
  let s = raw.toLowerCase().replace(/[,\s]/g, '');
  let mult = 1;
  if (s.endsWith('k')) { mult = 1000; s = s.slice(0, -1); }
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n * mult : null;
}

// Extract budget info from gig text. Returns:
// { usd, period: 'hour'|'month'|'project'|null, min, max, raw } or null.
export function parseBudget(gig) {
  if (gig.budgetUsd != null) return { usd: gig.budgetUsd, period: gig.budgetPeriod || null, min: gig.budgetUsd, max: gig.budgetUsd, raw: `${gig.budgetUsd}` };
  const text = `${gig.title} ${gig.description}`;

  // currency symbol or code + number, optional range, optional /period
  const re = /([$€£₹]|usd|eur|gbp|inr)\s?([0-9][0-9.,]*\s?k?)(?:\s?[-–to]+\s?([$€£₹]|usd|eur|gbp|inr)?\s?([0-9][0-9.,]*\s?k?))?(?:\s?\/?\s?(hour|hr|h|day|week|month|mo|year|yr|project|fixed))?/i;
  const m = text.match(re);
  if (!m) return null;

  const sym = m[1];
  const a = parseAmount(m[2]);
  const b = m[4] ? parseAmount(m[4]) : null;
  if (a == null) return null;

  const minUsd = toUsd(a, sym);
  const maxUsd = b != null ? toUsd(b, m[3] || sym) : minUsd;
  const periodRaw = (m[5] || '').toLowerCase();
  const period = /h(ou)?r|^h$/.test(periodRaw) ? 'hour'
    : /month|^mo$/.test(periodRaw) ? 'month'
    : /year|^yr$/.test(periodRaw) ? 'year'
    : /day/.test(periodRaw) ? 'day'
    : /week/.test(periodRaw) ? 'week'
    : (periodRaw === 'project' || periodRaw === 'fixed') ? 'project'
    : null;

  return { usd: Math.round((minUsd + maxUsd) / 2), period, min: minUsd, max: maxUsd, raw: m[0].trim() };
}

// Compare a gig's pay to the user's target. profile.targetHourlyUsd and/or
// profile.minBudgetUsd drive this. Returns { verdict, note } where verdict is
// 'great' | 'ok' | 'low' | 'unknown'.
export function rateVerdict(gig, profile) {
  const b = parseBudget(gig);
  if (!b) return { verdict: 'unknown', note: 'no pay listed' };

  const targetHr = profile.targetHourlyUsd || null;
  const minProj = profile.minBudgetUsd || null;

  if (b.period === 'hour' && targetHr) {
    if (b.usd >= targetHr * 1.25) return { verdict: 'great', note: `$${b.usd}/hr vs target $${targetHr}` };
    if (b.usd >= targetHr * 0.9) return { verdict: 'ok', note: `$${b.usd}/hr near target $${targetHr}` };
    return { verdict: 'low', note: `$${b.usd}/hr below target $${targetHr}` };
  }
  // project / month / unknown-period: compare to min project budget
  if (minProj) {
    if (b.usd >= minProj * 2) return { verdict: 'great', note: `~$${b.usd} (${b.period||'project'})` };
    if (b.usd >= minProj) return { verdict: 'ok', note: `~$${b.usd} (${b.period||'project'})` };
    return { verdict: 'low', note: `~$${b.usd} below min $${minProj}` };
  }
  return { verdict: 'unknown', note: `~$${b.usd} (no target set)` };
}
