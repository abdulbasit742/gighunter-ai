// Scam & red-flag detector. Freelancers lose hours (and sometimes money) on bad
// gigs. This scans each gig for known warning signs and returns a risk score +
// human-readable flags. High risk gets demoted and labeled, never silently dropped.

const RULES = [
  { re: /(registration|application|training|starter|onboarding)\s+fee/i, weight: 40, flag: 'asks for an upfront fee' },
  { re: /\b(pay|send|transfer).{0,20}(before|first|upfront|deposit)\b/i, weight: 35, flag: 'wants payment before work' },
  { re: /\b(western union|moneygram|gift card|crypto only|bitcoin only|btc only)\b/i, weight: 45, flag: 'sketchy payment method' },
  { re: /\b(telegram|whatsapp)\b.{0,30}\b(only|directly|contact)\b/i, weight: 25, flag: 'pushes off-platform contact' },
  { re: /\b(no experience|anyone can|easy money|earn \$?\d{3,}\/day|\$\d{3,} per day)\b/i, weight: 30, flag: 'too-good-to-be-true earnings' },
  { re: /\b(data entry|copy paste|form filling)\b.{0,30}\b(\$?\d{3,})\b/i, weight: 20, flag: 'low-skill task, inflated pay' },
  { re: /\b(unpaid|for exposure|equity only|revenue share only|no budget)\b/i, weight: 30, flag: 'unpaid / exposure only' },
  { re: /\b(urgent+|asap|immediately)\b.{0,40}\b(hire|start|pay)\b/i, weight: 10, flag: 'high-pressure urgency' },
  { re: /\b(personal|bank|ssn|social security|credit card)\s+(info|information|details|number)\b/i, weight: 50, flag: 'requests personal/financial info' },
];

// Returns { risk: 0..100, flags: string[], verdict: 'clean'|'caution'|'avoid' }.
export function scanGig(gig) {
  const text = `${gig.title} ${gig.description}`;
  let risk = 0;
  const flags = [];
  for (const rule of RULES) {
    if (rule.re.test(text)) { risk += rule.weight; flags.push(rule.flag); }
  }
  // Vague-scope heuristic: very short description on a paid gig.
  if ((gig.description || '').length < 60 && gig.title) {
    risk += 8; flags.push('very thin description');
  }
  risk = Math.min(100, risk);
  const verdict = risk >= 45 ? 'avoid' : risk >= 20 ? 'caution' : 'clean';
  return { risk, flags, verdict };
}
