// Fetch + normalize gigs from public sources (RSS or JSON feeds).
// Returns a flat array of normalized gigs: { id, title, company, url, description, budgetUsd, source, postedAt }
import crypto from 'node:crypto';
import { logger } from './logger.js';

const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

function stripTags(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

// Very small, dependency-free RSS <item> extractor. Good enough for standard feeds.
function parseRss(xml, sourceName) {
  const items = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const raw of blocks) {
    const pick = (tag) => {
      const m = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
      if (!m) return '';
      return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
    };
    const title = stripTags(pick('title'));
    const link = stripTags(pick('link')) || stripTags(pick('guid'));
    const desc = stripTags(pick('description'));
    const date = pick('pubDate');
    if (!title) continue;
    items.push({
      id: hash(link || title),
      title,
      company: '',
      url: link,
      description: desc.slice(0, 1200),
      budgetUsd: null,
      source: sourceName,
      postedAt: date ? new Date(date).toISOString() : null,
    });
  }
  return items;
}

function parseJsonFeed(data, sourceName) {
  // RemoteOK-style array; first element is often metadata.
  const arr = Array.isArray(data) ? data.filter((x) => x && (x.position || x.title)) : [];
  return arr.map((j) => ({
    id: hash(String(j.id || j.url || j.position || Math.random())),
    title: j.position || j.title || 'Untitled',
    company: j.company || '',
    url: j.url || j.apply_url || '',
    description: stripTags(j.description || '').slice(0, 1200),
    budgetUsd: j.salary_min ? Number(j.salary_min) : null,
    source: sourceName,
    postedAt: j.date || null,
  }));
}

export async function fetchSource(source) {
  try {
    const res = await fetch(source.url, { headers: { 'User-Agent': 'GigHunterAI/1.0 (+public-feed-reader)' } });
    if (!res.ok) throw new Error(`${res.status}`);
    if (source.type === 'json') {
      return parseJsonFeed(await res.json(), source.name);
    }
    return parseRss(await res.text(), source.name);
  } catch (e) {
    logger.warn(`source "${source.name}" failed: ${e.message}`);
    return [];
  }
}

export async function fetchAll(sources = []) {
  const results = await Promise.all(sources.map(fetchSource));
  const flat = results.flat();
  // dedupe by id
  const seen = new Map();
  for (const g of flat) if (!seen.has(g.id)) seen.set(g.id, g);
  logger.info(`fetched ${flat.length} gigs, ${seen.size} unique from ${sources.length} sources`);
  return [...seen.values()];
}
