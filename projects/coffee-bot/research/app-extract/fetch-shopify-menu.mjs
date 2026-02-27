import fs from 'node:fs';
import path from 'node:path';

const ENDPOINT = 'https://3e3a02.myshopify.com/api/2025-01/graphql';
const TOKEN = '3adb07de8814413b3c9a5d157b25cab9'; // extracted from Blank Street web bundle (_app)

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
      'Accept-Language': 'en-GB'
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const PRODUCTS_QUERY = `
query Products($first:Int!, $after:String) {
  products(first:$first, after:$after, sortKey:TITLE) {
    pageInfo { hasNextPage }
    edges {
      cursor
      node {
        id
        title
        handle
        productType
        tags
        availableForSale
        options { name values }
        variants(first: 50) {
          edges {
            node {
              id
              title
              availableForSale
              selectedOptions { name value }
            }
          }
        }
      }
    }
  }
}`;

async function fetchAllProducts() {
  let after = null;
  const out = [];
  for (;;) {
    const data = await gql(PRODUCTS_QUERY, { first: 100, after });
    const conn = data.products;
    for (const edge of conn.edges) out.push(edge.node);
    if (!conn.pageInfo.hasNextPage) break;
    after = conn.edges[conn.edges.length - 1]?.cursor;
    if (!after) break;
  }
  return out;
}

function normalizeToCoffeeBot(products) {
  const drinks = products.filter(p => {
    const t = `${p.title} ${p.productType || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
    return /(coffee|latte|espresso|americano|cappuccino|matcha|tea|chocolate|brew|mocha|drink)/.test(t);
  });

  const items = drinks.map(p => {
    const title = p.title.trim();
    const aliasBase = title.toLowerCase();
    const aliases = new Set([aliasBase]);
    aliases.add(aliasBase.replace(/\s+/g, ' '));
    aliases.add(aliasBase.replace(/\biced\b/g, 'ice').trim());
    if (aliasBase.includes('latte')) aliases.add(aliasBase.replace('latte', 'late')); // typo safety

    return {
      canonical: title,
      aliases: [...aliases].filter(Boolean)
    };
  });

  return {
    chain: 'Blank Street',
    source: {
      kind: 'shopify_storefront_graphql',
      endpoint: ENDPOINT,
      extractedAt: new Date().toISOString(),
      notes: 'Read-only extraction from publicly exposed storefront API config in web/app bundle.'
    },
    defaults: { size: 'Large', milk: 'Whole Milk' },
    fuzzyThresholds: { autoAccept: 0.82, needsConfirm: 0.68 },
    items,
    milks: ['Whole Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk', 'Skimmed Milk', 'Semi-Skimmed Milk', 'Coconut Milk'],
    sizes: ['Small', 'Medium', 'Large']
  };
}

async function main() {
  const products = await fetchAllProducts();
  const base = path.resolve('projects/coffee-bot/research/app-extract/output');
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(base, 'shopify_products_raw.json'), JSON.stringify(products, null, 2));

  const menu = normalizeToCoffeeBot(products);
  fs.writeFileSync(path.join(base, 'blankstreet_menu_from_api.json'), JSON.stringify(menu, null, 2));

  console.log(`Fetched products: ${products.length}`);
  console.log(`Normalized drink/menu items: ${menu.items.length}`);
}

main().catch(err => {
  console.error(err.message || String(err));
  process.exit(1);
});
