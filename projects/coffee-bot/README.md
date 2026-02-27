# Coffee Bot (Blank Street MVP)

## What this does (v0)
- Reads shared order CSV
- Parses free-text orders into structured fields
- Auto-applies default rule when unclear:
  - Size = Large
  - Milk = Whole Milk
- Flags high-risk ambiguity for manual confirmation

## Run
From workspace root:

```powershell
node projects/coffee-bot/src/parser.mjs
```

## Input sample
`projects/coffee-bot/samples/blank_street_orders_sample.csv`

## Output
`projects/coffee-bot/output/parsed_orders.json`

## Notes
- This is parser v0 (rule-based).
- Next step: add Blank Street menu matcher + cart draft generator.
