// Load the user profile (skills, rates, sources). Falls back to the example if not configured.
// If profile has no explicit `sources`, we derive live sources from the platform registry.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeSources } from './platforms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CFG = path.join(__dirname, '..', '..', 'config');

export function loadProfile() {
  const real = path.join(CFG, 'profile.json');
  const example = path.join(CFG, 'profile.example.json');
  const file = fs.existsSync(real) ? real : example;
  const profile = JSON.parse(fs.readFileSync(file, 'utf8'));

  // If the user enabled platforms by key, use those; else any explicit sources;
  // else default to all active public platforms.
  if (Array.isArray(profile.platforms) && profile.platforms.length) {
    profile.sources = activeSources(profile.platforms);
  } else if (!Array.isArray(profile.sources) || !profile.sources.length) {
    profile.sources = activeSources();
  }
  return profile;
}
