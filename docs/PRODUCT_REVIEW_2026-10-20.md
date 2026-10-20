# Product review implementation — 20 October 2026

## Financial baseline and glossary (Phase 1)

Source reviewed: finance.totals, planning.spendingSummary, planning.moneyPlanSummary, goalProgress, reviewLogic.comparisonRanges, the Overview and Money Plan views, and filtered list/export predicates.

- Budget remaining = effective spending allowance minus recorded expense entries for the exact period and currency. Allowance is the explicit overall base or category-base sum, plus eligible positive unused carryover. Missing allowance is null; an intentional zero remains zero; overspending remains negative. Carryover is the only adjustment beyond the base limit found here.
- Income left (recorded) = recorded income minus expenses minus net savings contributions minus net investment contributions for the same period and currency. Net contributions are contributions minus withdrawals. Negative net contributions therefore increase this residual, without becoming earned income. Expected income, goal starting savings, planned contributions and other currencies do not enter it. This is not a bank balance.
- Unassigned in plan = received income minus saved goal contribution plans minus effective spending allowance. With no spending plan it is income after planned goals. Posting a planned movement does not deduct the plan again.
- Goal progress is lifetime starting savings plus linked contributions minus withdrawals. Selected-period goal contributions exclude starting savings.

The new reconciliation fixtures cover signed withdrawals, mixed currencies, out-of-period entries, starting savings, planned commitments, missing and zero limits, overspending and positive carryover. They pass before changing summary presentation. No ledger calculations, persistence, routes, authentication destinations or export predicates need changes.

## Proposed Overview structure

Period + currency filter → Budget remaining / spent versus allowance / Add expense → compact recorded-money values → spending breakdown with one factual observation → lifetime goal progress, when present → five recent records / View all transactions. Forecasts stay in Income. No budget: Set a spending budget. No activity: invite the first entry without a health judgement.

## Decisions retained and deferred

Keep PaisaTrace, the existing domain, Rubix Labs credit, passwords and five navigation tabs. Keep Income left (recorded), with a visible formula and bank-balance distinction; Unallocated recorded income is only a candidate until comprehension testing. Do not rename Money Log or Reports, remove Income, introduce onboarding prerequisites or roll out an unselected identity. The supplied promise/audience and navigation alternatives remain proposals.

The proposed five-person comprehension/findability tests, physical keyboard behavior, full assistive-technology evaluation and recovery completion require separate evidence. Do not describe them as passed or the entire requirements document as complete. Produce a reviewable implementation before treating those gates as satisfied.

## Implemented review pass

- Overview leads with Budget remaining and Add expense, followed by visible recorded figures, one factual spending observation, lifetime goal progress and five recent transactions. A desktop split uses the budget card width without changing mobile reading order. Forecasts remain in Income.
- Income left (recorded) retains its existing meaning and label. Period/currency and the record-based, non-bank nature of these amounts are visible; the signed calculation is available through How income left is calculated. Net savings/investment contribution labels are consistent across Overview, Money Plan, Reports and the guide.
- Currency filters explicitly say amounts are not converted. Report changes identify both ranges/method, amount differences and percentages only when defined. Missing records are not treated as a financial improvement.
- Entry actions name their type, the amount field identifies its currency, amount/category errors are associated, desktop amount focus and repeat-entry focus work, and draft/retry protections are retained. General savings still does not require a category.
- Login uses Forgot password?, preserves first-password setup for email-link accounts, labels demo records as samples, and places policies below account actions. The existing responsive fictional preview is retained.
- Shared focus/border tokens, tabular numbers and new annotation styles retain forest green/lime. Guide copy and seven actual demo screenshots are refreshed. No schema, auth destination, calculation, export predicate or route change is included. The sitemap still contains the same ten public URLs.

## Verification

- 164 unit/database tests in 31 files pass, including six new financial reconciliation/comparison fixtures and the shared normal-account/demo rendering check. The existing export/precision and ownership checks remain in this suite.
- TypeScript, production build and check-public-build pass: ten public documents, nineteen private/demo/auth shells. The three public HTTP tests also pass.
- Direct browser checks: seven workspace destinations at 360, 390, 768 and 1440 CSS pixels (28 combinations), all with no document-wide horizontal overflow and all five navigation buttons inside the viewport. Sign-in also fits at all four widths without document scrolling at 844/900px heights.
- Fictional PKR 123.45 expense: 48,240.00 → 48,116.55 budget remaining; 66,240.00 → 66,116.55 recorded income left. Overprecision preserves the draft; repeat entry clears amount/note and retains date/currency/category; closing returns focus to Add expense. Repeat entry also returns focus to Amount.
- Fictional PKR 125 goal contribution: saved 86,400 → 86,525, remaining 453,600 → 453,475; period net additions increase once and Above contribution plan is explicit. Use existing savings explains that it links an already-recorded movement.
- PKR→USD filter changes keep records separate, show no missing budget as a zero budget, and retain editable scope. Drilldowns keep expense/type/currency/date context; chips can be removed independently; All currencies shows individual amounts without a combined total.
- Reports show matching elapsed dates and factual percentage changes. Zero/negative prior values and missing history are covered by unit fixtures.
- Expense picker at 390×500 is bounded above the save footer, with both save actions inside the viewport. This is a short-viewport simulation, not a physical software-keyboard test.
- Keyboard category selection, amount submission, goal contribution entry, focus return and authentication entry/blank validation checked. No real email was sent and no real account or financial record was modified. Browser console error log was empty.
- New annotation text contrasts are 6.32:1 (white) and 6.74:1 (lime surface); control boundaries 3.09:1 and focus outline 5.24:1 against white. This is limited to the changed colors, not an app-wide conformance claim.

## State behavior and remaining gates

| Area | Reviewed states | Remaining evidence |
| --- | --- | --- |
| Financial summaries | Populated, missing budget, explicit zero, negative remaining, signed withdrawals, separate currencies; calculation fixtures reconcile | Five-person terminology/comprehension test, proposed replacement label |
| Expense flow | Initial focus, validation, retained values, success, repeat, dirty cancellation, pending guard retained | Controlled real network failure/retry and assistive-technology completion |
| Goals | Lifetime/period distinction, linked save once, above-plan wording, existing-savings explanation | Moderated findability testing |
| Reports | Period/method/currency, factual change, unavailable percentages/history | Moderated reporting comprehension |
| Authentication | Sign-in, signup entry, recovery entry, blank validation, existing loading/error paths retained | Test-account sign-in/signup and recovery completion for this release |
| Responsive/accessibility | Four requested widths, bounded short phone form, named controls, visible focus styles | Physical iOS/Android keyboards, screen reader, verified text zoom; browser zoom shortcut had no measurable effect in the embedded test browser |

The standalone Playwright suite collects 216 cases but installed Chrome aborts with SIGABRT before assertions; the bounded run stopped after the first browser launch failure. It is not claimed as passing. The three HTTP-only cases pass separately. Updated selectors follow the new visible copy; unrelated historical UI assertions were not comprehensively rewritten.

Keep this as a draft review update until the release gates above are resolved or explicitly scoped by the owner. This pass does not complete BRAND-01, ONBOARD-01, NAV-01 or the entire requirements document. No new name, audience restriction, four-tab structure, analytics tracking or financial accounting behavior is introduced.
