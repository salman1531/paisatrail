# 8 October enhancement verification

Scope: user-supplied requirements REQ-01–12; extend the existing app, preserve history and monthly goals. Analytics/SEO remain paused.

## Calculation decisions

- Actuals use the exact period/currency and include historical archived labels.
- Savings/investments are contributions minus withdrawals; market value is not tracked.
- Explicit zero plans remain distinct from missing plans. No division by zero.
- Year reports add monthly plans; custom ranges prorate monthly amounts by calendar days, rounding each month in currency minor units. An incomplete set of monthly plans is labelled Not set rather than an understated combined allowance.
- Category targets are included in overall plans. Children reconcile to their parent, with direct historical entries shown as No subcategory.
- Warning thresholds are a view setting; 80% is the initial default.

## Automated checks

- Unit/database suite: 81 unit/database tests passed; includes cross-owner rejection, atomic bulk rollback, exact retries, lost-response reconciliation, separate identical purchases, monthly-plan aggregation, leap-day range boundaries, currency isolation, category targets and contributions minus withdrawals.
- TypeScript and production build passed. Excel export remains lazy-loaded; the existing bundle-size warning remains.
- Standalone Playwright suite attempted; Chrome aborts before assertions (SIGABRT / EPERM). This is an environment limitation, not a passed UI suite. 84 UI scenarios collect successfully. The bounded retry stopped at the first Chrome launch failure before assertions; the other 83 did not run. Revised selectors and enhancement scenarios are provided for CI or a working runner.

## Direct browser checks

Only synthetic demo records are used. Results are updated as verification completes.

- Mobile sign-in email/password/submit are above the fold at 390×844; preview image does not precede them.
- Two expenses totalling PKR 3,700 save together; expenses increase and income remaining decreases by 3,700; exactly two new Money Log records appear.
- Overview, Money Log, Categories and Goals have no document overflow at 320, 390, 660, 768, 900 and 1280px. The bulk modal has no content overflow at 320, 390, 660, 768 and 1280px. Full-page native captures are used for wide guide images to avoid viewport-panel clipping.

- Saving Home's PKR 50,000 category limit updates the chart to PKR 54,000 actual / 108% / PKR 4,000 over budget. Saving the Savings category target of PKR 20,000 shows PKR 27,000 actual / 135% / PKR 7,000 above target.
- Renaming and archiving Groceries preserves the linked records and their archived label.
- Cash expenses persist and filter correctly. Income source Freelance records appear in the income ring and its matching Money Log drill-down. Payment choices are static; there is no custom payment field.
- The inclusive 1–15 September custom range shows the half-month PKR 58,500 expense plan and PKR 69,313.50 actual. Date submission reads the displayed form values; input events also keep date drafts synchronized.
- Ring totals reconcile to parent/child entries and keep selected currencies separate. New income sources are Income categories, including received Investment returns; investment contributions remain a different kind.

## Provider state

Supabase migration 010 applied successfully on 8 October, with no record edits/deletes. Live constraints and RLS were verified: authenticated ownership remains auth.uid() = user_id. Migration 011 also applied and verified, enforcing only Cash, Credit Card, Debit Card, Bank Account and Others on expense entries. No access grants changed. Do not repeat either migration. Database verification preceded frontend publication. Confirm the Vercel release/PR before reporting live frontend status.
