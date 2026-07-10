// Budget and rate intelligence: parse common pay formats and compare them to profile targets.
const CUR = { '$': 1, usd: 1, '€': 1.08, eur: 1.08, '£': 1.27, gbp: 1.27, '₹': 0.012, inr: 0.012 };

function toUsd(amount, symbol) {
  const rate = CUR[(symbol || '$').toLowerCase()] ?? 1;
  return Math.round(amount * rate);
}

function parseAmount(raw) {
  let value = String(raw).toLowerCase().replace(/[,\s]/g, '');
  let multiplier = 1;
  if (value.endsWith('k')) { multiplier = 1000; value = value.slice(0, -1); }
  const number = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(number) ? number * multiplier : null;
}

export function parseBudget(gig) {
  if (gig.budgetUsd != null) return { usd: Number(gig.budgetUsd), period: gig.budgetPeriod || null, min: Number(gig.budgetUsd), max: Number(gig.budgetUsd), raw: String(gig.budgetUsd) };
  const text = `${gig.title || ''} ${gig.description || ''}`;
  const money = '([$€£₹]|usd|eur|gbp|inr)';
  const amount = '([0-9][0-9.,]*\\s?k?)';
  const range = `(?:\\s?(?:-|–|to)\\s?${money}?\\s?${amount})?`;
  const period = '(?:\\s?(?:\\/|per)?\\s?(hour|hr|h|day|week|month|mo|year|yr|project|fixed))?';
  const match = text.match(new RegExp(`${money}\\s?${amount}${range}${period}`, 'i'));
  if (!match) return null;

  const first = parseAmount(match[2]);
  const second = match[4] ? parseAmount(match[4]) : null;
  if (first == null) return null;
  const min = toUsd(first, match[1]);
  const max = second == null ? min : toUsd(second, match[3] || match[1]);
  const rawPeriod = String(match[5] || '').toLowerCase();
  const normalizedPeriod = /^(hour|hr|h)$/.test(rawPeriod) ? 'hour'
    : /^(month|mo)$/.test(rawPeriod) ? 'month'
    : /^(year|yr)$/.test(rawPeriod) ? 'year'
    : rawPeriod === 'day' ? 'day'
    : rawPeriod === 'week' ? 'week'
    : /^(project|fixed)$/.test(rawPeriod) ? 'project'
    : null;
  return { usd: Math.round((min + max) / 2), period: normalizedPeriod, min, max, raw: match[0].trim() };
}

export function rateVerdict(gig, profile) {
  const budget = parseBudget(gig);
  if (!budget) return { verdict: 'unknown', note: 'no pay listed' };
  const targetHourly = profile.targetHourlyUsd || null;
  const minimumProject = profile.minBudgetUsd || null;
  if (budget.period === 'hour' && targetHourly) {
    if (budget.usd >= targetHourly * 1.25) return { verdict: 'great', note: `$${budget.usd}/hr vs target $${targetHourly}` };
    if (budget.usd >= targetHourly * 0.9) return { verdict: 'ok', note: `$${budget.usd}/hr near target $${targetHourly}` };
    return { verdict: 'low', note: `$${budget.usd}/hr below target $${targetHourly}` };
  }
  if (minimumProject) {
    if (budget.usd >= minimumProject * 2) return { verdict: 'great', note: `~$${budget.usd} (${budget.period || 'project'})` };
    if (budget.usd >= minimumProject) return { verdict: 'ok', note: `~$${budget.usd} (${budget.period || 'project'})` };
    return { verdict: 'low', note: `~$${budget.usd} below min $${minimumProject}` };
  }
  return { verdict: 'unknown', note: `~$${budget.usd} (no target set)` };
}
