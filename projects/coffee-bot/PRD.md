# Coffee Bot PRD (MVP)

## Goal
Reduce friction and ordering errors in team coffee runs.

## Current Pain
1. Orders entered in shared Excel are often ambiguous.
2. Manual re-checking is repetitive and error-prone.
3. Building final order for the nearest restaurant is time-consuming.

## MVP Scope
- Input: Shared Excel file with teammate names + free-text order notes.
- Parse and normalize orders (drink/size/milk/temp/sugar/extras/food item).
- Detect ambiguity and generate clarification list before checkout.
- Select nearest allowed restaurant location.
- Build a structured cart draft (not auto-pay).
- Human confirmation screen before final order placement.
- Payment remains manual by Freddie using company Amex.

## Out of Scope (MVP)
- Fully automatic payment
- Handling every restaurant in the UK at launch
- Company-wide SSO integration

## Proposed Workflow
1. Freddie posts Excel in team chat as usual.
2. Coffee Bot ingests the sheet (or a local exported copy).
3. Bot parses each row into structured fields.
4. Bot returns:
   - clean order table
   - ambiguous entries requiring confirmation
   - missing items
5. After clarification, bot creates final order payload.
6. Bot opens nearest branch website and pre-fills items (where feasible).
7. Freddie reviews and clicks confirm/pay manually.

## Data Model (v1)
- person_name
- raw_order_text
- item_type (drink/food)
- product_name
- size
- milk_type
- sugar_level
- temperature
- addons
- quantity
- confidence_score
- clarification_needed (bool)
- clarification_question

## Technical Plan (v1)
- Parser layer: rule-based + LLM fallback for messy text
- Validation layer: menu catalog matcher + confidence scoring
- Clarification layer: auto-generated questions
- Restaurant layer: geolocation + nearest store selection
- Checkout layer: browser automation for cart preparation

## Safety & Controls
- No payment automation
- Explicit final confirmation required
- Audit log for all inferred edits
- Reversible order changes before submit

## Success Metrics
- >=50% reduction in prep time per coffee run
- <=2% order correction rate post-delivery
- 100% manual confirmation before purchase

## Next Build Milestones
- M1: Excel parser + ambiguity detector
- M2: Menu matcher for one target chain (e.g., Pret or Starbucks)
- M3: Draft cart generator + review UI
- M4: Browser-assisted checkout (manual final pay)
