// Fetch + normalize gigs from public sources (RSS or JSON feeds), then dedupe.
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import { logger } from './logger.js';
import { dedupeGigs } from './dedupe.js';

const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const MAX_RESPONSE_BYTES = Number(process.env.SOURCE_MAX_BYTES || 5_000_000);
const TIMEOUT_MS = Number(process.env.SOURCE_TIMEOUT_MS || 15_000);

function stripTags(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  const normalized = ip.toLowerCase();
  return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
}

export async function validateSourceUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('source URL must use http or https');
  if (String(process.env.ALLOW_PRIVATE_SOURCES || 'false') === 'true') return url;
  const records = await dns.lookup(url.hostname, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) throw new Error('private/local source URLs are blocked');
  return url;
}

async function boundedBody(res) {
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > MAX_RESPONSE_BYTES) throw new Error(`response exceeds ${MAX_RESPONSE_BYTES} bytes`);
  const body = await res.text();
  if (Buffer.byteLength(body) > MAX_RESPONSE_BYTES) throw new Error(`response exceeds ${MAX_RESPONSE_BYTES} bytes`);
  return body;
}

function parseRss(xml, sourceName) {
  const items = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const raw of blocks) {
    const pick = (tag) => {
      const match = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
      return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
    };
    const title = stripTags(pick('title'));
    const link = stripTags(pick('link')) || stripTags(pick('guid'));
    const description = stripTags(pick('description'));
    const date = pick('pubDate');
    if (!title) continue;
    let postedAt = null;
    if (date && Number.isFinite(new Date(date).getTime())) postedAt = new Date(date).toISOString();
    items.push({ id: hash(link || title), title, company: '', url: link, description: description.slice(0, 1200), budgetUsd: null, source: sourceName, postedAt });
  }
  return items;
}

function parseJsonFeed(data, sourceName) {
  const arr = Array.isArray(data) ? data.filter((x) => x && (x.position || x.title)) : (data?.jobs || data?.data || []);
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 2_000).map((job) => ({
    id: hash(String(job.id || job.url || job.slug || job.position || job.title || crypto.randomUUID())),
    title: String(job.position || job.title || 'Untitled').slice(0, 300),
    company: String(job.company || job.company_name || job.companyName || '').slice(0, 200),
    url: String(job.url || job.apply_url || job.jobUrl || '').slice(0, 2_000),
    description: stripTags(job.description || job.excerpt || '').slice(0, 1200),
    budgetUsd: job.salary_min ? Number(job.salary_min) : null,
    source: sourceName,
    postedAt: job.date || job.pub_date || job.created_at || null,
  }));
}

export async function fetchSource(source) {
  try {
    const url = await validateSourceUrl(source.url);
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'error',
      headers: { 'User-Agent': 'GigHunterAI/2.0 (+public-feed-reader)', Accept: 'application/json, application/rss+xml, application/xml, text/xml;q=0.9' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await boundedBody(res);
    if (source.type === 'json') return parseJsonFeed(JSON.parse(body), source.name);
    return parseRss(body, source.name);
  } catch (error) {
    logger.warn(`source "${source?.name || 'unknown'}" failed: ${error.message}`);
    return [];
  }
}

export async function fetchAll(sources = []) {
  const results = await Promise.all(sources.slice(0, 50).map(fetchSource));
  const flat = results.flat();
  const seen = new Map();
  for (const gig of flat) if (!seen.has(gig.id)) seen.set(gig.id, gig);
  const deduped = dedupeGigs([...seen.values()]);
  logger.info(`fetched ${flat.length} gigs -> ${seen.size} unique -> ${deduped.length} after near-dupe merge`);
  return deduped;
}
