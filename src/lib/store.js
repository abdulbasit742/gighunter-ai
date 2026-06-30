// Dead-simple JSON-file store. Swap for SQLite/Postgres later without touching callers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const GIGS = path.join(DATA_DIR, 'gigs.json');
const PROPOSALS = path.join(DATA_DIR, 'proposals.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(GIGS)) fs.writeFileSync(GIGS, '{}');
  if (!fs.existsSync(PROPOSALS)) fs.writeFileSync(PROPOSALS, '{}');
}
function read(file) { ensure(); return JSON.parse(fs.readFileSync(file, 'utf8')); }
function write(file, obj) { ensure(); fs.writeFileSync(file, JSON.stringify(obj, null, 2)); }

export const store = {
  upsertGigs(gigs) {
    const db = read(GIGS);
    for (const g of gigs) db[g.id] = { ...db[g.id], ...g };
    write(GIGS, db);
    return Object.keys(db).length;
  },
  listGigs() {
    return Object.values(read(GIGS)).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  },
  getGig(id) { return read(GIGS)[id] || null; },
  saveProposal(p) {
    const db = read(PROPOSALS);
    db[p.gigId] = p;
    write(PROPOSALS, db);
    return p;
  },
  getProposal(gigId) { return read(PROPOSALS)[gigId] || null; },
};
