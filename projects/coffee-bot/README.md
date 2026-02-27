# Coffee Bot (Blank Street MVP)

## What this does (v1.5)
- Reads team orders from Excel/CSV or online form
- Parses free-text orders into structured fields
- Uses Blank Street menu v1.5 (top 30 common drinks)
- Applies typo-tolerant matching (exact + fuzzy)
- Uses confidence thresholds:
  - auto accept >= 0.82
  - confirm required >= 0.68 and < 0.82
- Auto-applies defaults when unclear:
  - Size = Large
  - Milk = Whole Milk
- Generates **Checkout Assist** page (stop before payment)

## Run parser (CLI)
From workspace root:

```powershell
node projects/coffee-bot/src/parser.mjs
```

## Open local product page

```powershell
node projects/coffee-bot/app/server.mjs
```
Then open: `http://localhost:4173`

## Excel columns expected
- `name`
- `order_text`
- `qty`

## Input sample
`projects/coffee-bot/samples/blank_street_orders_sample.csv`

## Output
- CLI parser output: `projects/coffee-bot/output/parsed_orders.json`
- Product page output: review table + checkout-assist page

## Current limitations
- Website/app checkout is not fully automated yet
- Payment remains manual (Freddie confirms and pays with Amex)
