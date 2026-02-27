# Blank Street App/API Menu Extraction PoC

## Scope
Goal: derive a reliable menu data source from mobile-app-backed APIs in read-only mode.

## What was completed

### 1) Android package + app config discovery (safe)
- Identified Android package from Play listing: `blankstreet.uk`.
- Attempted direct APK retrieval from third-party mirror endpoints was blocked by anti-bot protection (Cloudflare).
- Safe fallback used: inspect public web/app bundles and storefront runtime data only.

### 2) Endpoint/config inspection
- From Blank Street bundle/runtime, identified ordering surface via `order.online` storefront.
- Observed GraphQL endpoints in runtime:
  - `https://order.online/graphql/storepageFeed?operation=storepageFeed`
  - `https://order.online/graphql/businessInfo?operation=allBusinessStores`
  - plus related GraphQL operations (attestation/dropoff options).

### 3) Menu API/data identification
- Loaded store page in browser session:
  - `https://order.online/store/blank-street-coffee-e-broadway-dorchester-st-27957649?pickup=true`
- Extracted loaded GraphQL results from in-memory Apollo cache (`window.__APOLLO_CLIENT__.cache.extract()`), specifically `storepageFeed` payload.
- Recovered category + item + price menu data from `itemLists`.

### 4) Normalization into Coffee Bot format
Generated files:
- Raw extract: `research/app-extract/output/order_online_menu_extract.tsv`
- Normalized: `research/app-extract/output/blankstreet_menu_poc.json`

Normalization summary:
- Raw rows: **70**
- Drink-category rows: **60**
- Deduped normalized menu items: **50**

### 5) Legal/safety constraints
- Read-only extraction only; no checkout submission or payment actions.
- Respect platform ToS and robots/anti-bot controls.
- Do **not** bypass auth/captcha protections.
- Do **not** scrape private user/account/order history.
- Prefer official partner APIs where available; this PoC uses publicly exposed storefront data visible to end users.

## Reproducible steps (PoC)
1. Start Coffee Bot local app/server environment.
2. Open storefront page in browser session:
   - `https://order.online/store/blank-street-coffee-e-broadway-dorchester-st-27957649?pickup=true`
3. Run extraction snippet in page context (or browser automation):
   - read `window.__APOLLO_CLIENT__.cache.extract()`
   - locate `ROOT_QUERY` -> `storepageFeed(...)` -> `itemLists`
   - export `category, item, price` rows.
4. Save rows to:
   - `research/app-extract/output/order_online_menu_extract.tsv`
5. Normalize:
   - `node projects/coffee-bot/research/app-extract/normalize-menu.mjs`
6. Output produced:
   - `research/app-extract/output/blankstreet_menu_poc.json`

## Notes / limitations
- Store menu is location-dependent and can vary by region/time.
- Some options/modifiers are not fully represented in this PoC extract.
- For production reliability, schedule periodic refresh and multi-store aggregation.
