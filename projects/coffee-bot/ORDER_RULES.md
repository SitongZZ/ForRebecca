# Coffee Bot Order Rules (Blank Street MVP)

## Parsing Priority
1. Use explicit user text first.
2. If item/size/milk is ambiguous, apply defaults.
3. Flag only high-risk ambiguity for confirmation.

## Default Rule (Excel cell compatible)
If order details are unclear, auto-apply:
- Size: Large
- Milk: Whole Milk

Suggested Excel helper text:
`If unclear, Coffee Bot auto-defaults to Large + Whole Milk.`

## Clarification Threshold (Auto-guess first)
- Low risk ambiguity -> auto-guess + log confidence
- High risk ambiguity (e.g., two different drink intents) -> ask confirmation

## Example
- "latte" -> Latte, Large, Whole Milk
- "americano with milk" -> Americano + Whole Milk, Large
- blank order -> Flag for confirmation (no drink intent found)
