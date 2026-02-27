import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('projects/coffee-bot/research/app-extract/chunks');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
const out = new Set();

for (const f of files) {
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  const urls = t.match(/https?:\/\/[^'"`\s)]+/g) || [];
  for (const u of urls) out.add(u);

  const apiish = t.match(/[A-Za-z0-9._-]+\/(?:api|graphql|menu|order|store|location|catalog)[A-Za-z0-9_\/.?=&-]*/gi) || [];
  for (const a of apiish) out.add(a);
}

for (const line of [...out]) console.log(line);
