import fs from 'node:fs';
import path from 'node:path';

const mainPath = path.resolve('projects/coffee-bot/data/blank_street_menu.json');
const pocPath = path.resolve('projects/coffee-bot/research/app-extract/output/blankstreet_menu_poc.json');
const outPath = path.resolve('projects/coffee-bot/data/blank_street_menu.merged.poc.json');

const main = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
const poc = JSON.parse(fs.readFileSync(pocPath, 'utf8'));

const map = new Map();
for (const i of main.items) map.set(i.canonical.toLowerCase(), i);
for (const i of poc.items) {
  const k = i.canonical.toLowerCase();
  if (!map.has(k)) map.set(k, { canonical: i.canonical, aliases: i.aliases });
  else {
    const existing = map.get(k);
    existing.aliases = [...new Set([...(existing.aliases || []), ...(i.aliases || [])])];
  }
}

const merged = { ...main, sourceMergeNote: 'merged with app/api PoC extract', items: [...map.values()].sort((a,b)=>a.canonical.localeCompare(b.canonical)) };
fs.writeFileSync(outPath, JSON.stringify(merged, null, 2));
console.log(`main items: ${main.items.length}`);
console.log(`poc items: ${poc.items.length}`);
console.log(`merged items: ${merged.items.length}`);
console.log(`wrote: ${outPath}`);
