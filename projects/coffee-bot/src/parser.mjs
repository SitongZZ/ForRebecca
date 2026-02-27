import fs from 'node:fs';
import path from 'node:path';

const MENU_FILE = process.env.COFFEE_MENU_FILE || 'blank_street_menu.merged.poc.json';
const MENU = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'projects', 'coffee-bot', 'data', MENU_FILE), 'utf8')
);

const AUTO_ACCEPT_THRESHOLD = Number(process.env.COFFEE_AUTO_ACCEPT || MENU.fuzzyThresholds?.autoAccept || 0.82);
const NEEDS_CONFIRM_THRESHOLD = Number(process.env.COFFEE_NEEDS_CONFIRM || MENU.fuzzyThresholds?.needsConfirm || 0.68);

const MILK_KEYWORDS = new Map([
  ['whole', 'Whole Milk'], ['full fat', 'Whole Milk'], ['semi', 'Semi-Skimmed Milk'], ['skim', 'Skimmed Milk'],
  ['oat', 'Oat Milk'], ['almond', 'Almond Milk'], ['soy', 'Soy Milk'], ['soya', 'Soy Milk'], ['coconut', 'Coconut Milk']
]);

const SIZE_KEYWORDS = new Map([
  ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['regular', 'Medium']
]);

const DEFAULT_SIZE = MENU.defaults?.size || 'Large';
const DEFAULT_MILK = MENU.defaults?.milk || 'Whole Milk';

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
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else current += ch;
    }
    fields.push(current);

    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (fields[idx] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function levenshtein(a, b) {
  const s = a || '';
  const t = b || '';
  const m = s.length;
  const n = t.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (!x || !y) return 0;
  if (x.includes(y) || y.includes(x)) return 0.93;
  const dist = levenshtein(x, y);
  const score = 1 - dist / Math.max(x.length, y.length);
  return Number(Math.max(0, Math.min(0.99, score)).toFixed(2));
}

function detectDrink(text) {
  // Exact alias match first.
  const exactMatches = [];
  for (const item of MENU.items) {
    for (const alias of item.aliases) {
      if (text.includes(alias)) exactMatches.push({ canonical: item.canonical, alias });
    }
  }

  if (exactMatches.length) {
    exactMatches.sort((a, b) => b.alias.length - a.alias.length);
    const top = exactMatches[0];
    const topCanonicals = [...new Set(exactMatches.filter(m => m.alias.length === top.alias.length).map(m => m.canonical))];
    if (topCanonicals.length > 1) {
      return { drink: topCanonicals.sort().join('/'), conf: 0.35, method: 'exact-ambiguous' };
    }
    return { drink: top.canonical, conf: 0.95, method: 'exact' };
  }

  // Fuzzy fallback.
  let best = { canonical: null, conf: 0 };
  for (const item of MENU.items) {
    for (const alias of item.aliases) {
      const score = similarity(text, alias);
      if (score > best.conf) best = { canonical: item.canonical, conf: score };
    }
  }

  if (!best.canonical || best.conf < NEEDS_CONFIRM_THRESHOLD) {
    return { drink: null, conf: 0.2, method: 'none' };
  }

  if (best.conf < AUTO_ACCEPT_THRESHOLD) {
    return { drink: best.canonical, conf: best.conf, method: 'fuzzy-confirm' };
  }

  return { drink: best.canonical, conf: best.conf, method: 'fuzzy-auto' };
}

function detectMilk(text) {
  for (const [k, v] of MILK_KEYWORDS.entries()) if (text.includes(k)) return { milk: v, defaulted: false };
  return { milk: DEFAULT_MILK, defaulted: true };
}

function detectSize(text) {
  for (const [k, v] of SIZE_KEYWORDS.entries()) if (text.includes(k)) return { size: v, defaulted: false };
  return { size: DEFAULT_SIZE, defaulted: true };
}

function parseRow(row) {
  const name = (row.name || '').trim();
  const raw = row.order_text || '';
  const qty = Number.parseInt(row.qty || '1', 10) || 1;
  const text = normalizeText(raw);

  const { drink: drinkDetected, conf: drinkConf, method } = detectDrink(text);
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
  } else if (method === 'fuzzy-confirm') {
    clarificationNeeded = true;
    reason = 'low_confidence_fuzzy_match';
  }

  const confidence = Math.min(0.99, Number((drinkConf + (sizeDefaulted ? 0 : 0.03) + (milkDefaulted ? 0 : 0.03)).toFixed(2)));

  return {
    name,
    raw_order_text: raw,
    quantity: qty,
    drink,
    size,
    milk,
    defaults_applied: { size: sizeDefaulted, milk: milkDefaulted },
    confidence,
    match_method: method,
    clarification_needed: clarificationNeeded,
    clarification_reason: reason
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
    exact_match_count: rows.filter(r => r.match_method === 'exact').length,
    fuzzy_auto_count: rows.filter(r => r.match_method === 'fuzzy-auto').length,
    fuzzy_confirm_count: rows.filter(r => r.match_method === 'fuzzy-confirm').length
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputJson, JSON.stringify({ summary, thresholds: { autoAccept: AUTO_ACCEPT_THRESHOLD, needsConfirm: NEEDS_CONFIRM_THRESHOLD }, orders: rows }, null, 2), 'utf8');

  console.log(`Parsed ${summary.total_orders} rows -> ${outputJson}`);
  console.log(`Clarifications needed: ${summary.clarification_count}`);
}

run();
