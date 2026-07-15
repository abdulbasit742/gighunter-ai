#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import process from 'node:process';

const files = {
  proposal: await readFile('src/lib/proposal.js', 'utf8'),
  scorer: await readFile('src/lib/scorer.js', 'utf8'),
  hub: await readFile('src/lib/llmHub.js', 'utf8'),
  policy: await readFile('src/lib/promptSafety.js', 'utf8'),
};

const findings = [];
const requirePattern = (file, pattern, message) => {
  if (!pattern.test(files[file])) findings.push(`${file}: ${message}`);
};
const forbidPattern = (file, pattern, message) => {
  if (pattern.test(files[file])) findings.push(`${file}: ${message}`);
};

requirePattern('proposal', /proposalMessages/, 'proposal drafting must use the prompt safety policy');
requirePattern('proposal', /validateDraftOutput/, 'proposal output must be validated');
requirePattern('scorer', /assessGigContent/, 'scoring must expose content-safety flags');
requirePattern('scorer', /validateScoreResponse/, 'model score output must be schema-validated');
requirePattern('hub', /role:\s*'system'/, 'cloud calls must preserve the trusted system role');
requirePattern('hub', /system:\s*request\.system/, 'Ollama calls must preserve trusted system text');
requirePattern('policy', /UNTRUSTED_GIG_DATA/, 'untrusted listings must use an explicit data boundary');
requirePattern('policy', /untrusted_gig_blocked/, 'high-risk listings must have a stable fail-closed code');

forbidPattern('proposal', /GIG DESCRIPTION:\s*\$\{gig\.description\}/, 'raw gig descriptions cannot be interpolated into trusted prompts');
forbidPattern('scorer', /Description:\s*\$\{gig\.description\}/, 'raw gig descriptions cannot be interpolated into scoring prompts');

if (findings.length) {
  console.error('Prompt safety check failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Prompt safety check passed.');
