// 10-platform integration registry.
// Each platform declares HOW GigHunter can legally connect to it.
//
// mode meanings:
//   'public'  -> public JSON/RSS feed, works out of the box, no key, ToS-friendly
//   'api'     -> official API exists but needs OAuth/API key (you must register an app)
//   'manual'  -> NO public/official job feed; auto-access violates ToS. Use their UI;
//                GigHunter can still score + draft for gigs you paste in manually.
//
// This is deliberately honest: GigHunter never logs in or scrapes a site that
// forbids it. 'public' platforms hunt automatically today. 'api' platforms work
// once you add credentials. 'manual' platforms are drafting-only (you paste the gig).

export const PLATFORMS = [
  {
    key: 'remoteok',
    name: 'RemoteOK',
    mode: 'public',
    type: 'json',
    url: 'https://remoteok.com/api',
    notes: 'Public JSON feed. Works now, no key.',
  },
  {
    key: 'weworkremotely',
    name: 'We Work Remotely',
    mode: 'public',
    type: 'rss',
    url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    notes: 'Public RSS per category. Works now.',
  },
  {
    key: 'remotive',
    name: 'Remotive',
    mode: 'public',
    type: 'json',
    url: 'https://remotive.com/api/remote-jobs?category=software-dev',
    notes: 'Public JSON API. Works now, no key.',
  },
  {
    key: 'arbeitnow',
    name: 'Arbeitnow',
    mode: 'public',
    type: 'json',
    url: 'https://www.arbeitnow.com/api/job-board-api',
    notes: 'Public job-board JSON API. Works now.',
  },
  {
    key: 'jobicy',
    name: 'Jobicy',
    mode: 'public',
    type: 'json',
    url: 'https://jobicy.com/api/v2/remote-jobs?count=50&tag=development',
    notes: 'Public JSON API. Works now.',
  },
  {
    key: 'hackernews',
    name: 'Hacker News (Who is hiring / freelancer)',
    mode: 'public',
    type: 'rss',
    url: 'https://hnrss.org/newest?q=freelance+OR+contract+remote',
    notes: 'Public RSS via hnrss.org. Works now.',
  },
  {
    key: 'reddit-forhire',
    name: 'Reddit r/forhire',
    mode: 'public',
    type: 'rss',
    url: 'https://www.reddit.com/r/forhire/search.rss?q=hiring&restrict_sr=1&sort=new',
    notes: 'Public RSS. Works now (respect Reddit rate limits).',
  },
  {
    key: 'themuse',
    name: 'The Muse',
    mode: 'api',
    type: 'json',
    url: 'https://www.themuse.com/api/public/jobs?category=Software%20Engineering&page=1',
    envKey: 'THEMUSE_API_KEY',
    notes: 'Official API. Add &api_key=... (free key) for higher limits.',
  },
  {
    key: 'freelancer',
    name: 'Freelancer.com',
    mode: 'api',
    type: 'json',
    url: 'https://www.freelancer.com/api/projects/0.1/projects/active/',
    envKey: 'FREELANCER_OAUTH_TOKEN',
    notes: 'Official API. Register an app, get an OAuth token, set FREELANCER_OAUTH_TOKEN.',
  },
  {
    key: 'upwork',
    name: 'Upwork',
    mode: 'api',
    type: 'json',
    url: 'https://www.upwork.com/api/profiles/v2/search/jobs.json',
    envKey: 'UPWORK_OAUTH_TOKEN',
    notes: 'Official API requires approved app + OAuth2. NEVER scrape Upwork (instant ban). Set UPWORK_OAUTH_TOKEN once approved.',
  },
  {
    key: 'fiverr',
    name: 'Fiverr',
    mode: 'manual',
    type: null,
    url: null,
    notes: 'No public job/buyer-request API. Drafting-only: paste a brief and GigHunter scores + drafts. Do not scrape.',
  },
];

export function platformByKey(key) {
  return PLATFORMS.find((p) => p.key === key) || null;
}

// Turn enabled platforms into source objects the fetcher understands.
// Only 'public' and 'api' (when their env key is present) become live sources.
export function activeSources(enabledKeys = null) {
  return PLATFORMS.filter((p) => {
    if (enabledKeys && !enabledKeys.includes(p.key)) return false;
    if (p.mode === 'public') return true;
    if (p.mode === 'api') return !p.envKey || !!process.env[p.envKey];
    return false; // manual => not auto-fetched
  }).map((p) => ({ name: p.name, type: p.type, url: p.url, platform: p.key }));
}
