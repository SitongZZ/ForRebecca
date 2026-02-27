import fs from 'node:fs';
import path from 'node:path';

const inPath = path.resolve('projects/coffee-bot/research/app-extract/output/order_online_menu_extract.tsv');
const outPath = path.resolve('projects/coffee-bot/research/app-extract/output/blankstreet_menu_poc.json');

const DRINK_CATEGORY_HINTS = [
  'cold espresso', 'cold non-espresso', 'cold quick', 'cold teas',
  'grab n\' go drinks', 'hot espresso', 'hot non-espresso', 'hot quick', 'hot teas', 'most ordered'
];

const lines = fs.readFileSync(inPath, 'utf8').split(/\r?\n/).filter(Boolean);
const rows = lines.map(l => {
  const [category, name, price] = l.split('\t');
  return { category, name, price };
});

const drinkRows = rows.filter(r => {
  const c = (r.category || '').toLowerCase();
  return DRINK_CATEGORY_HINTS.some(h => c.includes(h));
});

const dedup = new Map();
for (const r of drinkRows) {
  const key = r.name.toLowerCase();
  if (!dedup.has(key)) dedup.set(key, r);
}

const items = [...dedup.values()].map(r => {
  const base = r.name.toLowerCase();
  const aliases = new Set([base]);
  aliases.add(base.replace(/&/g, 'and'));
  aliases.add(base.replace(/\s+/g, ' '));
  if (base.includes('latte')) aliases.add(base.replace('latte', 'late'));
  if (base.startsWith('iced ')) aliases.add(base.replace(/^iced\s+/, 'ice '));

  return {
    canonical: r.name,
    aliases: [...aliases],
    sourceCategory: r.category,
    sourcePrice: r.price
  };
});

const normalized = {
  chain: 'Blank Street',
  source: {
    kind: 'order.online apollo cache (browser session)',
    extractedAt: new Date().toISOString(),
    notes: 'Read-only extraction from storefront data loaded in browser session; no purchase actions performed.'
  },
  defaults: { size: 'Large', milk: 'Whole Milk' },
  fuzzyThresholds: { autoAccept: 0.82, needsConfirm: 0.68 },
  items,
  milks: ['Whole Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk', 'Skimmed Milk', 'Semi-Skimmed Milk', 'Coconut Milk'],
  sizes: ['Small', 'Medium', 'Large']
};

fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2));
console.log(`rows: ${rows.length}`);
console.log(`drink rows: ${drinkRows.length}`);
console.log(`normalized items: ${items.length}`);
console.log(`wrote: ${outPath}`);
