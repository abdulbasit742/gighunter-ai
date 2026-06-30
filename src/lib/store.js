// JSON-file store with gig STATUS tracking (new | seen | applied | won | rejected).
// Status + timestamps survive across hunts so you never lose track of a lead.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const GIGS = path.join(DATA_DIR, 'gigs.json');
const PROPOSALS = path.join(DATA_DIR, 'proposals.json');

const VALID_STATUS = ['new', 'seen', 'applied', 'won', 'rejected'];

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
    let added = 0;
    for (const g of gigs) {
      const prev = db[g.id];
      if (!prev) added++;
      db[g.id] = { ...prev, ...g, status: prev?.status || 'new', firstSeen: prev?.firstSeen || new Date().toISOString() };
    }
    write(GIGS, db);
    return { total: Object.keys(db).length, added };
  },
  listGigs({ status = null } = {}) {
    let list = Object.values(read(GIGS));
    if (status) list = list.filter((g) => g.status === status);
    return list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  },
  getGig(id) { return read(GIGS)[id] || null; },
  // Generic patch for arbitrary fields (timestamps, follow-up counters, etc.).
  patchGig(id, patch) {
    const db = read(GIGS);
    if (!db[id]) return null;
    db[id] = { ...db[id], ...patch };
    write(GIGS, db);
    return db[id];
  },
  setStatus(id, status) {
    if (!VALID_STATUS.includes(status)) throw new Error(`bad status: ${status}`);
    const db = read(GIGS);
    if (!db[id]) return null;
    db[id].status = status;
    // Stamp the applied time so the follow-up engine knows when the clock started.
    if (status === 'applied' && !db[id].appliedAt) db[id].appliedAt = new Date().toISOString();
    if (status === 'won') db[id].wonAt = new Date().toISOString();
    write(GIGS, db);
    return db[id];
  },
  newCount() { return Object.values(read(GIGS)).filter((g) => g.status === 'new').length; },
  saveProposal(p) { const db = read(PROPOSALS); db[p.gigId] = p; write(PROPOSALS, db); return p; },
  getProposal(gigId) { return read(PROPOSALS)[gigId] || null; },
};

export { VALID_STATUS };
