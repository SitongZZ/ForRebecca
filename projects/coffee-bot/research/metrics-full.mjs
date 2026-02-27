import fs from 'node:fs';
import path from 'node:path';

const MENU_FILE = process.env.COFFEE_MENU_FILE || 'blank_street_menu.merged.poc.json';
const MENU = JSON.parse(fs.readFileSync(path.resolve('projects/coffee-bot/data', MENU_FILE), 'utf8'));

const AUTO_ACCEPT = Number(process.env.AUTO_ACCEPT || 0.82);
const NEEDS_CONFIRM = Number(process.env.NEEDS_CONFIRM || 0.68);

const tests = [
  // Cold espresso
  ['iced latte oat', 'Iced Latte', 'cold-espresso'],
  ['ice latte', 'Iced Latte', 'cold-espresso'],
  ['iced pistachio latte', 'Iced Pistachio Latte', 'cold-espresso'],
  ['pestichio late with oat', 'Pistachio Latte', 'cold-espresso'],
  ['pastichio latte', 'Pistachio Latte', 'cold-espresso'],
  ['iced americano', 'Iced Americano', 'cold-espresso'],
  ['iced mocha', 'Iced Mocha', 'cold-espresso'],
  ['iced cortado', 'Iced Cortado', 'cold-espresso'],
  ['daydream iced latte', 'Iced Daydream Latte', 'cold-espresso'],
  ['strawberries and cream iced latte', 'Iced Strawberries & Cream Latte', 'cold-espresso'],

  // Hot espresso
  ['latte', 'Latte', 'hot-espresso'],
  ['americano', 'Americano', 'hot-espresso'],
  ['flat white', 'Flat White', 'hot-espresso'],
  ['cappuccino', 'Cappuccino', 'hot-espresso'],
  ['mocha', 'Mocha', 'hot-espresso'],
  ['macchiato', 'Macchiato', 'hot-espresso'],
  ['double espresso', 'Double Espresso', 'hot-espresso'],
  ['cortado', 'Cortado', 'hot-espresso'],
  ['pistachio latte', 'Pistachio Latte', 'hot-espresso'],
  ['blondie latte', 'Blondie Latte', 'hot-espresso'],

  // Matcha/tea
  ['matcha latte', 'Matcha Latte', 'matcha-tea'],
  ['iced matcha latte', 'Iced Matcha Latte', 'matcha-tea'],
  ['matcha tea', 'Matcha Tea', 'matcha-tea'],
  ['earl grey tea', 'Earl Grey Tea', 'matcha-tea'],
  ['english breakfast tea', 'English Breakfast Tea', 'matcha-tea'],
  ['chamomile tea', 'Chamomile Tea', 'matcha-tea'],
  ['blueberry matcha', 'Blueberry Matcha', 'matcha-tea'],
  ['strawberry shortcake matcha', 'Strawberry Shortcake Matcha', 'matcha-tea'],
  ['iced earl grey matcha', 'Iced Earl Grey Matcha', 'matcha-tea'],
  ['blondie matcha', 'Blondie Matcha', 'matcha-tea'],

  // Cold quick / drinks
  ['cold brew', 'Original Cold Brew', 'cold-quick'],
  ['cold brew latte', 'Cold Brew Latte', 'cold-quick'],
  ['mocha cold brew latte', 'Mocha Cold Brew Latte', 'cold-quick'],
  ['classic iced tea', 'Classic Iced Tea', 'cold-quick'],
  ['orange juice', "Natalie's Orange Juice", 'cold-quick'],
  ['still water', 'Still Saratoga Water', 'cold-quick'],
  ['grapefruit sparkling water', 'Grapefruit Sparkling Water - Spindrift (vg)', 'cold-quick'],
  ['lemon limeade sparkling water', 'Lemon Limeade Sparkling Water - Spindrift (vg)', 'cold-quick'],

  // Hot non-espresso / other
  ['hot chocolate', 'Hot Chocolate', 'hot-other'],
  ['flavored milk', 'Flavored Milks', 'hot-other'],
  ['iced flavored milks', 'Iced Flavored Milks', 'hot-other'],
  ['hot brew', 'Hot Brew', 'hot-other'],

  // Intentional unknowns/noise
  ['dragon fruit cloud coffee', 'UNKNOWN', 'unknown'],
  ['banana smoothie', 'UNKNOWN', 'unknown'],
  ['pizza slice', 'UNKNOWN', 'unknown'],
  ['office supplies', 'UNKNOWN', 'unknown'],
  ['', 'UNKNOWN', 'unknown'],
  ['something warm', 'UNKNOWN', 'unknown'],
  ['surprise me', 'UNKNOWN', 'unknown'],
  ['team order pending', 'UNKNOWN', 'unknown']
];

function normalizeText(text = '') { return text.trim().toLowerCase().replace(/\s+/g, ' '); }

function levenshtein(a, b) {
  const s = a || ''; const t = b || '';
  const m = s.length, n = t.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const x = normalizeText(a), y = normalizeText(b);
  if (!x || !y) return 0;
  if (x.includes(y) || y.includes(x)) return 0.93;
  const dist = levenshtein(x, y);
  return Number(Math.max(0, Math.min(0.99, 1 - dist / Math.max(x.length, y.length))).toFixed(2));
}

function detectDrink(text) {
  const exact = [];
  for (const item of MENU.items) {
    for (const alias of item.aliases || []) {
      if (text.includes(normalizeText(alias))) exact.push({ canonical: item.canonical, alias: normalizeText(alias) });
    }
  }
  if (exact.length) {
    exact.sort((a, b) => b.alias.length - a.alias.length);
    return { drink: exact[0].canonical, conf: 0.95, method: 'exact', clarify: false };
  }

  let best = { canonical: null, conf: 0 };
  for (const item of MENU.items) {
    for (const alias of item.aliases || []) {
      const score = similarity(text, alias);
      if (score > best.conf) best = { canonical: item.canonical, conf: score };
    }
  }
  if (!best.canonical || best.conf < NEEDS_CONFIRM) return { drink: 'UNKNOWN', conf: 0.2, method: 'none', clarify: true };
  if (best.conf < AUTO_ACCEPT) return { drink: best.canonical, conf: best.conf, method: 'fuzzy-confirm', clarify: true };
  return { drink: best.canonical, conf: best.conf, method: 'fuzzy-auto', clarify: false };
}

function evalMetrics() {
  let tp = 0, fp = 0, fn = 0, confirm = 0;
  const byCat = {};

  for (const [input, expected, cat] of tests) {
    const d = detectDrink(normalizeText(input));
    if (!byCat[cat]) byCat[cat] = { total: 0, hit: 0 };
    byCat[cat].total += 1;

    if (d.clarify) confirm += 1;

    if (expected === 'UNKNOWN') {
      if (d.drink !== 'UNKNOWN') fp += 1;
      else byCat[cat].hit += 1;
    } else {
      if (d.drink === expected) {
        tp += 1;
        byCat[cat].hit += 1;
      } else if (d.drink === 'UNKNOWN') {
        fn += 1;
      } else {
        fp += 1;
      }
    }
  }

  const nonUnknownTotal = tests.filter(t => t[1] !== 'UNKNOWN').length;
  const coverage = Number((tp / nonUnknownTotal * 100).toFixed(1));
  const fpRate = Number((fp / tests.length * 100).toFixed(1));
  const fnRate = Number((fn / nonUnknownTotal * 100).toFixed(1));
  const confirmRate = Number((confirm / tests.length * 100).toFixed(1));

  const byCategory = Object.fromEntries(
    Object.entries(byCat).map(([k, v]) => [k, Number((v.hit / v.total * 100).toFixed(1))])
  );

  return { sampleSize: tests.length, coverage, fpRate, fnRate, confirmRate, byCategory };
}

function percentile(arr, p) {
  const a = [...arr].sort((x, y) => x - y);
  const i = Math.ceil((p / 100) * a.length) - 1;
  return a[Math.max(0, Math.min(i, a.length - 1))];
}

function timeE2E() {
  const times = [];
  const rows = tests.slice(0, 30).map(([input], i) => ({ name: `u${i}`, order_text: input, qty: 1 }));

  for (let i = 0; i < 200; i += 1) {
    const t0 = performance.now();
    const parsed = rows.map(r => detectDrink(normalizeText(r.order_text)));
    const agg = new Map();
    for (const p of parsed) {
      if (p.drink === 'UNKNOWN') continue;
      agg.set(p.drink, (agg.get(p.drink) || 0) + 1);
    }
    const summary = [...agg.entries()].map(([k, v]) => `${v}x ${k}`).join('\n');
    const _renderLike = `<ul>${summary}</ul>`;
    const t1 = performance.now();
    times.push(t1 - t0);
  }

  return {
    runs: times.length,
    p50Ms: Number(percentile(times, 50).toFixed(2)),
    p90Ms: Number(percentile(times, 90).toFixed(2))
  };
}

const metrics = evalMetrics();
const timing = timeE2E();
console.log(JSON.stringify({ menuFile: MENU_FILE, thresholds: { auto: AUTO_ACCEPT, confirm: NEEDS_CONFIRM }, metrics, timing }, null, 2));
