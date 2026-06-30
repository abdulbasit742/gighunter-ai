// Load the user profile (skills, rates, sources). Falls back to the example if not configured.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CFG = path.join(__dirname, '..', '..', 'config');

export function loadProfile() {
  const real = path.join(CFG, 'profile.json');
  const example = path.join(CFG, 'profile.example.json');
  const file = fs.existsSync(real) ? real : example;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
