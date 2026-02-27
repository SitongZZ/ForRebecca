import fs from 'node:fs';
import path from 'node:path';

const DRINK_KEYWORDS = new Map([
  ['latte', 'Latte'],
  ['flat white', 'Flat White'],
  ['americano', 'Americano'],
  ['cappuccino', 'Cappuccino'],
  ['matcha', 'Matcha Latte'],
  ['mocha', 'Mocha'],
  ['espresso', 'Espresso'],
]);

const MILK_KEYWORDS = new Map([
  ['whole', 'Whole Milk'],
  ['full fat', 'Whole Milk'],
  ['semi', 'Semi-Skimmed Milk'],
  ['skim', 'Skimmed Milk'],
  ['oat', 'Oat Milk'],
  ['almond', 'Almond Milk'],
  ['soy', 'Soy Milk'],
  ['soya', 'Soy Milk'],
  ['coconut', 'Coconut Milk'],
]);

const SIZE_KEYWORDS = new Map([
  ['small', 'Small'],
  ['medium', 'Medium'],
  ['large', 'Large'],
  ['regular', 'Medium'],
]);

const DEFAULT_SIZE = 'Large';
const DEFAULT_MILK = 'Whole Milk';

function normalizeText(text = '') {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j += 1) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);

    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (fields[idx] || '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

function detectDrink(text) {
  const hits = [];
  for (const [k, v] of DRINK_KEYWORDS.entries()) {
    if (text.includes(k)) hits.push(v);
  }
  const uniq = [...new Set(hits)];
  if (uniq.length === 0) return { drink: null, conf: 0.0 };
  if (uniq.length > 1) return { drink: uniq.sort().join('/'), conf: 0.35 };
  return { drink: uniq[0], conf: 0.85 };
}

function detectMilk(text) {
  for (const [k, v] of MILK_KEYWORDS.entries()) {
    if (text.includes(k)) return { milk: v, defaulted: false };
  }
  return { milk: DEFAULT_MILK, defaulted: true };
}

function detectSize(text) {
  for (const [k, v] of SIZE_KEYWORDS.entries()) {
    if (text.includes(k)) return { size: v, defaulted: false };
  }
  return { size: DEFAULT_SIZE, defaulted: true };
}

function parseRow(row) {
  const name = (row.name || '').trim();
  const raw = row.order_text || '';
  const qty = Number.parseInt(row.qty || '1', 10) || 1;
  const text = normalizeText(raw);

  const { drink: drinkDetected, conf: drinkConf } = detectDrink(text);
  const { size, defaulted: sizeDefaulted } = detectSize(text);
  const { milk, defaulted: milkDefaulted } = detectMilk(text);

  let drink = drinkDetected;
  let clarificationNeeded = false;
  let reason = '';

  if (!text) {
    clarificationNeeded = true;
    reason = 'blank_order';
    drink = 'UNKNOWN';
  } else if (!drinkDetected) {
    clarificationNeeded = true;
    reason = 'no_drink_detected';
    drink = 'UNKNOWN';
  } else if (drinkDetected.includes('/')) {
    clarificationNeeded = true;
    reason = 'multiple_drink_candidates';
  }

  const confidence = Math.min(
    0.99,
    Number((drinkConf + (sizeDefaulted ? 0 : 0.07) + (milkDefaulted ? 0 : 0.07)).toFixed(2))
  );

  return {
    name,
    raw_order_text: raw,
    quantity: qty,
    drink,
    size,
    milk,
    defaults_applied: {
      size: sizeDefaulted,
      milk: milkDefaulted,
    },
    confidence,
    clarification_needed: clarificationNeeded,
    clarification_reason: reason,
  };
}

function run() {
  const base = path.resolve(process.cwd(), 'projects', 'coffee-bot');
  const inputCsv = path.join(base, 'samples', 'blank_street_orders_sample.csv');
  const outputDir = path.join(base, 'output');
  const outputJson = path.join(outputDir, 'parsed_orders.json');

  const raw = fs.readFileSync(inputCsv, 'utf8');
  const rows = parseCsv(raw).map(parseRow);

  const summary = {
    total_orders: rows.length,
    clarification_count: rows.filter(r => r.clarification_needed).length,
    auto_default_size_count: rows.filter(r => r.defaults_applied.size).length,
    auto_default_milk_count: rows.filter(r => r.defaults_applied.milk).length,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputJson, JSON.stringify({ summary, orders: rows }, null, 2), 'utf8');

  console.log(`Parsed ${summary.total_orders} rows -> ${outputJson}`);
  console.log(`Clarifications needed: ${summary.clarification_count}`);
}

run();
