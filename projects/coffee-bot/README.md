# Coffee Bot (Blank Street MVP)

## What this does (v0)
- Reads shared order CSV
- Parses free-text orders into structured fields
- Auto-applies default rule when unclear:
  - Size = Large
  - Milk = Whole Milk
- Flags high-risk ambiguity for manual confirmation

## Run parser (CLI)
From workspace root:

```powershell
node projects/coffee-bot/src/parser.mjs
```

## Open local product page (Excel upload OR online form + confirm)

```powershell
node projects/coffee-bot/app/server.mjs
```
Then open: `http://localhost:4173`

### Excel columns expected
- `name`
- `order_text`
- `qty`

## Input sample
`projects/coffee-bot/samples/blank_street_orders_sample.csv`

## Output
- CLI parser output: `projects/coffee-bot/output/parsed_orders.json`
- Product page output: rendered in browser (review table + final order draft)

## Notes
- Parser is v1 (menu-aware for Blank Street aliases, auto-guess first).
- Includes alias support for items like Pistachio Latte (including common typo variants).
- Default rule when unclear: Large + Whole Milk.
- Manual confirmation and manual payment remain required.
