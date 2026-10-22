# Forest workspace preview — 2.0.0-preview.1

Historical preview 1 record. For the current four-tab build, see [Overview consolidation](OVERVIEW_CONSOLIDATION_RELEASE.md). The original acceptance evidence below describes preview 1.

Prepared 22 October 2026. Branch: `codex/forest-finance-rebuild`.

This is a local review version, not a production deployment. Production remains at the recorded 1.0.0 baseline, commit `79281a64571987ec9fd38a89d5f4038868f77105`, tag `v1.0.0`. The stopped Cloud & Teal experiment remains separate. See VERSIONING.md for the previous deployment and verified production Git bundle.

## Delivered behaviour

The shared forest-green system covers labelled desktop navigation, five labelled phone tabs, the secondary account menu, consistent controls, visible focus, compact financial cards and full-screen narrow recording forms. Password authentication, protected email callbacks, ownership rules, currencies, historical entries and existing Money Plan calculations remain in place.

Overview shows a known tracked-account balance, or explicitly recorded income left when no account balance is known, plus received income, expenses and Budget remaining. Charts include zero-based income/expense bars, ranked category shares, exact-value tables, and account history through today. When a balance cannot be known, a separately labelled cumulative income-minus-expense chart is used. The account scope filters recorded cards, charts and recent records together. Budgets cover all accounts; subset views explicitly withhold a budget comparison instead of subtracting subset spending from the whole plan. Lifetime goal progress remains labelled across all accounts. Dated expected items appear only when there are some, outside actual totals.

Money Log supports account/type/currency/date/category/payment/search scope, removable chips, grouped compact rows, a read-only details dialog, correction and recovery. Transfer counts and paging are included. Details restore focus and scroll position. Reports keep their independent date/account/comparison selections during SPA navigation and drill into matching Money Log records. Reports include source/account breakdowns and export with the same date, account and currency predicate. Transfers and goal allocations are labelled separately.

Income foregrounds received money, source shares and recent receipts. Upcoming payments stay separate. Accounts have a name, type, currency, dated signed opening balance, archive control and activity link. Existing real and saved demo entries are never automatically assigned. New fictional demo scenarios illustrate account assignments and transfers. Display preferences provide readable/day-first/ISO transaction dates and hide-on-open privacy; these preferences are browser-local and described as such. Settings retains existing exports, support and password/account controls.

The guide, its eight screenshots, private Accounts routes, LLM discovery text and policy descriptions are updated. The sitemap remains the same ten canonical public URLs. Private/demo/auth pages remain noindex. No analytics was enabled and no blog or fabricated author was added.

## Accounting and recording contracts

- Opening balance is at the start of its date; that date's assigned activity follows it. Unassigned entries remain in recorded totals but are excluded from balances. Investment balances reflect contributions, not market prices.
- Internal transfers require different owned accounts with the same currency. No exchange-rate conversion or fee model is implied. Transfers do not become income or expenses.
- An optional transfer-linked savings/investment allocation changes goal progress once without a second account debit. Its transfer and entry edit/remove/restore together. Existing goal-negative checks still apply.
- Weekly/monthly/yearly schedules create expected items only. Confirm an actual amount, account and date to create one linked actual entry. Anchor-day clamping does not drift; skipped/posted occurrence markers prevent reposting. Correct a posted entry in Money Log, or restore it after removal. Changing future schedule amounts leaves posted history intact. Frequency/type/currency/anchor changes require stopping and creating a new schedule.
- Stable draft IDs, pending locks and exact-payload reconciliation cover lost-response retries. Account and schedule creation reconciles an existing owned ID rather than creating a second one. Transfer and recurring confirmation writes are atomic database functions.
- Exports use typed dates/numbers and literal user strings. Transactions, transfers, account configuration, schedules and confirmation history have distinct sheets. Export details describe configuration/lifetime sheets that are not transaction-search totals.

## Database setup — prepared, not applied live

`supabase/migrations/017_accounts_and_recurring.sql` is additive and follows 016. It adds `accounts`, `account_transfers`, `recurring_schedules` and `recurring_occurrences`, each with owner-scoped RLS, plus nullable account/transfer references on entries. Mutation functions authenticate the owner, preserve relationships and serialize confirmation/transfer operations. Direct ordinary transfer/occurrence mutation is not granted.

The migration has been executed against disposable local PostgreSQL/PGlite fixtures. It has not been run in the production Supabase project. The frontend detects an older backend and keeps the existing ledger operational while showing that Accounts needs setup. Apply the migration and verify a controlled real-account smoke test before promoting this preview. Browser-based changes to access rules require action-time confirmation. No real user's records were deleted or modified during this verification.

Rollback changes the frontend version; it does not drop these tables or financial history. A restored 1.0.0 UI does not expose Accounts/schedules, and protected linked transfer allocations require the newer UI for paired edits. New integrity rules may reject an old client's attempt to edit/remove one side. Restore the newer frontend to manage those records. Do not remove the migration to recover an older visual design.

## Verification

- TypeScript build: passed.
- Unit/database suite: **177 tests across 33 files passed**. Includes currency precision/filters, chart reconciliation, opening dates, unassigned history, transfer pairing/retry/removal/recovery, recurring cadence/confirmation/skip/retry, cross-owner and anonymous rejection, stopped archived schedules, recovery history protection, and account-wide cascade on a disposable identity.
- Production Vite build: passed. ExcelJS remains a large, lazily loaded export chunk.
- Public build checks: passed; ten canonical public pages, Accounts private/demo shells, shared brand and original article metadata checked. Accessibility audit code is development-only and absent from production bundles.
- Three Playwright HTTP checks: passed for initial public HTML, private noindex shells and article metadata.
- Full Playwright UI command was attempted (222 cases enumerated). Installed Chrome aborted with SIGABRT during launch, before application assertions. One launch failure was reported and 221 cases did not run. The full UI suite is **not passed**; some historical cases also retain older UI labels and need updating before final release acceptance. New account/recurrence scenarios are in `tests/ui/forest-workspace.spec.ts`.
- In-app browser: all eight workspace destinations checked at 320, 390, 768, 1280 and 1440px; no horizontal document overflow and five visible navigation labels. At 390/1280px, 200% root text plus increased spacing passed on all eight pages after overflow fixes. This is a development text stress test, not a physical-device/browser-zoom certification.
- Axe 4.14: no automated violations on the eight tested workspace pages at phone width, and Home, login, signup, guide, privacy and terms. SVG contrast/icon-name checks still require human interpretation. These results are not a full accessibility conformance claim.
- Manual synthetic flows: account opening-date correction; transfer balance conservation; paired goal allocation/remove/restore; schedule creation without actual spending; one adjusted confirmation; amount focus; category keyboard selection without moving the date field; privacy removal of financial content; report drill-down/Back preserving account scope; real downloaded report workbook checked as exactly two PKR Cash wallet records.
- Sign-in fields/submit fit without vertical document scrolling at 1280×720, 1024×768, 768×1024 and 390×844.

Evidence JSON and full-resolution synthetic screenshots are in the parent workspace `outputs/forest-preview-2026-10-22/`. Guide image sources are in `public/guide-images/*.png`.

## Acceptance still needed

Review the preview before production replacement. Live migration/real-account write-and-refresh verification, the blocked full UI runner, physical mobile keyboards, browser zoom and complete screen-reader testing remain outstanding. No automated bank sync, market valuation, FX transfers, bill notifications or reopening of skipped occurrences is claimed. Display preferences apply in this browser rather than syncing to the profile. The first version of account history uses period-end snapshots; account opening dates enter the series explicitly rather than inventing earlier balances.
