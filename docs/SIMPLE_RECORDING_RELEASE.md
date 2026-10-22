# Simple recording — 2.0.0

Prepared 22 October 2026. This release combines the versioned forest UI rebuild, Overview consolidation and the user's decision to remove financial account tracking from the normal product flow. Production publication is authorized; the immutable deployment ID and final live checks belong in the release manifest in the parent workspace's outputs folder.

## Current product

Four primary destinations remain: Overview, Money Log, Income and Money Plan (Plan on phones). Categories, Settings, help and sign out stay accessible. Reports is consolidated into Overview → More insights. Financial Accounts, wallet filters, tracked balances and new-transfer actions are no longer part of normal navigation or recording. Earlier /app/accounts and /demo/accounts URLs redirect to Money Log; earlier Reports links redirect to Overview, preserving private/demo boundaries.

Single entries, bulk expenses and recurring schedules do not ask users to select a financial account. Optional payment-type labels (Cash, Credit Card, Debit Card, Bank Account, Others) remain labels, not wallet setup. New entries have no account assignment; recurring confirmations do not inherit an old schedule's wallet assignment. Compatible historical assignments are retained when correcting existing entries. A correction that cannot retain an earlier currency/opening-date link explains its removal before saving. Existing paired transfers stay correctable together without editable account endpoints; no new transfer action is offered.

Overview consistently shows Income left (recorded): received income minus expenses and net savings/investment contributions. The separate Budget remaining figure stays a spending allowance. Recorded cash movement is income minus expenses before contribution allocations, not a wallet/bank balance. All records in the selected dates/currency are included, with no hidden wallet filter. More insights keeps period comparisons and received-income sources; wallet breakdowns are removed. New demo scenarios have no financial accounts or transfers. Existing saved demo and real histories are not rewritten.

The user guide, eight screenshots, public privacy description, LLM files, compatibility redirects and current handoff are aligned. The sitemap retains ten canonical public URLs. Seventeen active private/auth/demo shells stay noindex. No analytics is enabled and no blog or fictional author was added.

## Backend and rollback

The user approved migration017 at action time on 22 October. It was run successfully in the existing production Supabase project. It adds private recurring schedules/confirmations and compatibility account/transfer tables and nullable fields. All four new tables were verified with RLS enabled, one private ownership policy each and anonymous SELECT denied. The financial account feature flag remains false. No existing transaction was rewritten or removed by this migration.

Version v1.0.0 and previews v2.0.0-preview.1 / v2.0.0-preview.2 remain immutable rollback references with complete verified bundles. Roll back the frontend using the saved deployment/tag; do not drop tables or erase financial history. The additive schema retains old-client recording compatibility. The unrelated index.html guide-link edit stays excluded from release commits.

## Verification

186 unit/database tests across 35 files passed, including private ownership, transfer pairing, recurring retry/skip/cadence, amount precision, recorded/plan reconciliation and simplified recording regressions. New tests cover account-free demo seeding/forms, all-history inclusion, compatible legacy corrections and retained transfer endpoints. The production database check reads schema/policy metadata only; no real user's finances were edited as a test.

In-app browser checks cover six pages at 320/390/768/1280/1440px (30 layouts), four visible primary labels and no horizontal document overflow. TypeScript and production Vite build passed. Public checks passed for ten canonical public URLs and seventeen private shells. Five HTTP tests passed, including old Reports/Accounts redirects and unchanged article metadata. Manual production-build demo tests saved a single expense, a two-row expense batch, one recurring confirmation and a correction: Overview reconciled income 180,000 − expenses 70,391 − savings 27,000 − investments 18,000 = recorded income left 64,609 PKR. The expense form and Transaction details contained no financial account fields. Axe with expanded insights reported zero automated violations and two manual checks. Further live checks and immutable deployment metadata are recorded after publication. The separate headless Chrome UI runner previously aborted with SIGABRT before application assertions; do not call that suite passed. Browser text stress and automated accessibility checks are useful evidence, not complete screen-reader or physical-device certification.
