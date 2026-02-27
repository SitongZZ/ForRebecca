# App/API Extraction Workspace

## Files
- `scan-chunks.mjs`: scans downloaded JS chunks for endpoint/config hints
- `fetch-shopify-menu.mjs`: exploratory storefront GraphQL probe (Shopify path; low menu coverage)
- `normalize-menu.mjs`: converts TSV extract -> Coffee Bot menu JSON
- `output/order_online_menu_extract.tsv`: extracted category/item/price rows
- `output/blankstreet_menu_poc.json`: normalized Coffee Bot menu (PoC)
- `POC_REPORT.md`: end-to-end findings + legal/safety constraints + reproducible steps
