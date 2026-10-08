# PaisaTrace handoff — updated 7 October 2026

React, TypeScript, Vite and Supabase. Repository: https://github.com/salman1531/paisatrail. Production: https://paisatrace.vercel.app/. Clone the repository, run `npm ci`, copy `.env.example` to `.env.local`, set the public Supabase values and run `npm run dev`. Secrets never belong in `VITE_` values or Git.

## Implemented and configured

- Responsive dashboard, charts, category comparisons and a quick expense form at the top.
- Income, expenses, savings and investment contributions; independent monthly/yearly goals and category budgets. Exact money arithmetic and separate currencies.
- Supabase private per-user database, migrations 001–004 applied; RLS enabled on all four tables. Do not re-run migrations.
- Email/password login; signup verification; existing accounts can add a password from Settings or recovery. Password recovery is handled before opening the ledger and survives page reload.
- Category archive/restore, Excel exports and synthetic browser-local demo. Preserve the existing demo storage key.
- Vercel Hobby deployment, exact Supabase callback URL, Brevo custom SMTP. Real email delivery and magic-link sign-in were verified before the password change.
- Operator Salman Javed; support/deletion email salman.se95@gmail.com; Rubix Labs is credit only. Database region Sydney, Australia.
- Public About page, sitemap, robots, canonical metadata, llms files, operator-approved privacy/terms and dependency notices.

## Remaining operator steps

- Set your account password yourself and confirm sign-out/password sign-in and a real entry round trip. Never share the password with the assistant.
- The operator reviewed and approved publication on 2 October 2026. Production `VITE_PUBLIC_POLICY_REVIEWED=true` records that acknowledgment, not legal certification. Re-review after changes to actual practices.
- Verify the URL-prefix property in Google Search Console and submit `/sitemap.xml`. Rankings are not guaranteed.
- Full live two-account data isolation and cross-device entry persistence have not been verified; local database authorization tests cover these constraints.
- Vercel Hobby is restricted to personal non-commercial use. No domain purchase or paid upgrade is authorized.
- Brevo may require approving another outbound Supabase IP if its sending infrastructure changes; do not disable restrictions automatically.
- PaisaTrace is the selected name. No trademark or domain clearance is claimed.

Run `npm test`, `npm run build` and `npm run test:ui`. Desktop browser automation may be blocked by the environment; record limitations honestly and use available native browser controls for layout checks.

## 4 October update

User confirmed password login works. Goals are now one monthly-only panel with January–December buttons, saved-month indicators and unsaved-change protection. Annual goal records remain stored but their controls and comparisons are hidden. The separate default plan panel is removed. Existing defaults prefill unsaved months; saving stores independent monthly values. Emergency target is an optional expansion within Goals. Google ownership is verified; sitemap submitted 4 October but Google initially reported Could not fetch despite valid XML and HTTP 200.


## 5 October update

Approved optional expense subcategories implemented in Categories, quick expense, Add/Edit entry, search, spending detail and Excel exports. Main category IDs remain the reporting and goal link; optional subcategory IDs add detail without double-counting. Migration 005 adds owner/parent foreign keys, server validation and private per-user access. Used subcategories are archived and can be restored under an active parent. The operator approved migration and deployment. Local unit/database tests and build pass; direct browser checks cover persistence, main totals, editing and mobile layout. Standalone Chrome UI test launch remains blocked by the environment.


## 5 October clarity follow-up

Read-only checks in the operator account confirmed October saved goals matched Overview. Targets were too far down and Daily entries lacked goal progress. Show monthly targets beside recorded totals on both tabs and the same GoalsOverview panel on Daily entries. Saving a month's goals selects that month in reports. Replace two expense selects with one leaf picker; resolve the main category automatically. Existing generic Expenses-only accounts receive common subcategories via migration 006; new accounts seed them once. Keep existing direct-category entries editable.

Overview presents recorded totals with monthly targets, cash flow, spending charts, recent entries and shortcuts to categories, entries and emergency savings. Detailed goals/category limits and previous-month comparison expand on demand. Daily entries shows the same monthly goal progress. Expense entry uses one leaf-category picker and saves its parent automatically. Migration 006 seeds starter expense choices for generic Expenses categories without children and for new accounts.

Overview priority order: selected month, income/expense/savings/investment totals with goals, cash remaining, quick expense, recent entries, analytical charts, workspace shortcuts, and expandable detailed goals/comparison. Keep quick expense near the top and the DOM order aligned with the visual order on mobile.

Mobile forms use 16px input text to avoid browser focus zoom. Dialogs lock background scroll and restore previous styles, focus without scrolling and the page position on close. Monetary inputs preview words (PKR lakh/crore, appropriate currency fractions). Static bootstrap and account/ledger loading show a spinner with status text. Goals offers optional income-based 80/20/0, 80/10/10 and 70/20/10 examples; only an explicit draft action applies them, then Save persists. No investment products or returns are recommended.

Goals also supports percentage input for expenses, cash savings and investments (0–100%, two decimals), with earnings remaining a fixed amount. Derived amounts preview in money/words and save as independent fixed monthly targets. Changing earnings recalculates the draft; switching months resets amount mode. Suggestions explicitly apply as amount drafts.

Subcategories now extend to savings and investments via migration 007, with owner/parent constraints and private RLS unchanged. Generic default roots receive 19 expense, 9 savings and 8 investment choices; existing names/archived choices are preserved. New profiles seed once. Savings subcategories can count toward the emergency fund; parent/child flags count each entry once. Add/Edit entry uses one leaf picker for every kind. Amount words use the requested trailing lowercase currency format, e.g. One lakh fifty thousand pkr.

## PaisaTrace rebrand — 5 October
The user selected PaisaTrace. Rename display branding, titles, exports and public content, while retaining the GitHub/Vercel project addresses, Supabase IDs, existing browser storage keys and recovery keys. No database records migrate. Public SEO uses consistent site name/description, canonical links, WebSite schema on home, SoftwareApplication facts on About, a sharing image, and real FAQ content. Retain the existing Google verification token; the new origin needs its own Search Console property. No domain ownership, trademark clearance or search ranking is claimed.

The free production alias https://paisatrace.vercel.app is now attached to the existing Vercel project. VITE_SITE_URL is updated in Vercel and local ignored configuration. Supabase Site URL and exact https://paisatrace.vercel.app/ authentication redirect are approved and saved; the previous redirect is retained for existing links. New-origin Search Console ownership is verified under the approved account; sitemap submitted on 5 October. It initially reports Couldn't fetch, despite public HTTP 200 checks. Google live homepage test confirms URL is available and can be indexed; Request indexing returned daily Quota Exceeded. Do not claim indexing or ranking. SMTP sender display name is saved as PaisaTrace; existing signup/recovery templates use neutral wording and ConfirmationURL. The old alias remains functional with new-origin canonical URLs, preserving existing authentication links.

Rebrand release a702326 passed TypeScript/build and all 40 unit/database tests. Live new-origin home, About, policies, sharing image, sitemap and robots return HTTP 200; mobile demo and public page have no horizontal overflow. Standalone Playwright public-page run was unavailable because its web-server command could not locate npm; direct browser verification completed.

Planning flow update: examples plus Create my own split (up to 100% total), amount previews and Save plan for [month] confirmation save the chosen monthly goals directly. Cancel leaves existing goal values intact; income/category edits are preserved in the save. Shared Modal retains mobile scroll restoration. Remaining income ignores category/search filters, uses the full selected period/currency, shows no-income guidance rather than a negative balance, and labels an excess as Above recorded income with a positive amount. No database migration is required.

Verification: TypeScript/build and all 41 unit/database tests passed. The standalone Playwright suite could not launch Chrome (all cases failed before execution), so direct browser demo checks verified custom validation, mobile confirmation/cancel, successful save, preserved category targets, independent months, reload persistence and category-filter consistency. The overview cash-flow and savings-rate details also use all period categories.

The user requested general positioning rather than Pakistan-only wording. Remove the audience restriction from titles, About, llms, terms and sharing graphic. Keep PKR default/currency units and other currency support; do not imply currency conversion or make new international legal-compliance claims.

## 6 October email redirect fix

User verified a new signup email but its callback returned to localhost. Signup and password recovery previously sent location.origin; both now use the configured HTTPS VITE_SITE_URL through authRedirectUrl, including requests initiated from local previews or old aliases. An unconfigured development app still uses its current origin. Invalid configured destinations are rejected. Supabase dashboard readback confirmed Site URL https://paisatrace.vercel.app and the exact new-origin redirect already saved; no access-rule change was needed. Existing email links cannot be rewritten; confirmed users can sign in directly on the public site. Never record email callback tokens in source, diagnostics or handoff.

TypeScript/build and 43 unit/database tests passed, including configured redirect handling and signup/recovery SDK request checks. The focused Playwright auth test could not launch Chrome (SIGABRT before execution); it is not an app assertion failure. Google Search Console now reports sitemap Success with four discovered pages; the indexing report is still processing.

User confirmed signup works after the redirect fix and chose to retain the free Gmail/Brevo setup (Brevo rewrites the sender address; display name is PaisaTrace). Real password recovery still needs the user to complete a new-password test.

Usability review and guide: generated /guide.html and /guide.md provide 11 steps plus troubleshooting, public jump navigation and support. Guide links appear before sign-in and in every workspace header, opening separately to preserve edits. Add income/savings/investment now preselects the correct form type; Add/Edit save selects its reporting month and clears entry filters. Main summary cards use all categories like overall goals and remaining income. A filter scope note and Clear entry filters explain list/chart/export behavior. Quick expense capture precedes summary cards; planning examples are a collapsed optional disclosure. Sitemap now includes the guide; technical sitemap/llms footer links are removed but files remain served. No database migration.

Read docs/UX_REVIEW.md for evidence, remaining usability suggestions and test limits. TypeScript/build and 43 unit/database tests passed; direct browser checks covered shortcuts, filter summary consistency, optional planning, guide anchors and phone layout. Playwright still cannot launch Chrome (failure before assertions).

The user requested the display credit Powered by Rubix Labs. Keep its destination https://www.hirubix.com/ unchanged. This is credit only; Salman Javed remains the operator and support contact is unchanged.

## 7 October product-review release

This section supersedes earlier layout/currency notes. Overview leads with the three main answers and compact capture below. Daily entries is list-first, with a collapsed monthly budget summary. Entry-list filters affect only the list/export; dashboard charts keep full period/currency scope. Narrow transaction rows stack with Actions menus. Reporting currency, entry default and saved goal currencies are distinct. Migration009 pins legacy defaults/emergency amounts to their original planning currency and preserves existing accounts/categories/history; only new profiles receive the canonical hierarchy. Goals show Using default plan, Customize and Use defaults, with dirty-currency guards. Demo scenarios use four months of coherent values per currency. Account & support offers all-record export, contact and email deletion requests; no automated request/status service is claimed. Updated public guide screenshots use fictional demo data. Recurring templates, reminders, named savings goals and debt tracking remain follow-up product work.

Migration009 applied 7 October; live readback confirms planning-currency backfill and unchanged finance RLS/anon initializer restrictions. All 56 unit/database checks pass; direct responsive checks cover 320–1280px. Standalone Chrome runner remains blocked before assertions.

## 7 October second product-review release

Keep the Goals editor mounted but hidden after first opening it. Its selected month/currency, amount/percentage fields, category limits, planning split and emergency draft survive tab navigation. Reporting currency changes cannot remount it. Switching goal currency preserves the selected month and asks before discarding dirty goal/emergency fields. Saving explicitly selects the saved month/currency in reports. Sign-out asks before discarding drafts; beforeunload requests the browser's unsaved-changes warning (browser behavior varies). Drafts are memory-only, not durable across confirmed reloads or account changes.

Reset workspace navigation, filters, dialogs, goal context and admin state on identity/mode changes. An inaccessible admin route renders Overview. Verified sign-out from a synthetic local admin fixture followed by demo entry shows a populated Overview; this does not certify backend authorization.

Money Log has its own currency filter, independent of Reporting currency. Search/category/currency scope applies to both the list and Excel export; all-record export ignores list scope. New entry saves clear all list filters. Export details now state entry currency. Delete confirmation identifies amount/currency, parent/subcategory, date, movement and note, with Delete entry as the action. Cancellation is non-destructive; no real record was deleted.

Overview distinguishes Recorded income remaining from Expense budget remaining. Expand pending savings/investment contributions to understand goals not yet recorded; these amounts are never deducted twice or presented as spendable cash. Spending breakdown can switch between parents and subcategories; generic single-parent expense accounts default to subcategory detail, retaining direct and archived history. No migration or recategorization is performed. Optional history mapping and subcategory limits remain follow-ups, alongside recurring templates/monthly review and real-account write/sync/recovery verification.

Guide copy and desktop overview/entries screenshots refreshed from fictional September demo data, with existing versioned image delivery retained. All 59 unit/database tests and production build pass. Direct browser checks cover drafts, currency/month context, sign-out cancellation, admin fixture transition, mixed-currency list scope/delete cancellation and widths 320/390/660/900/1280 without horizontal overflow. A real serialized currency-filtered XLSX was reopened and checked; artifact is in workspace outputs, not account data. Browser download event capture still times out and standalone Playwright Chrome still aborts before assertions; the UI suite's 69 cases are collected but are not claimed as executed successfully. Live backend writes and cross-device sync were not retested in this release.

The operator selected **Money Log** for desktop/mobile navigation, page title and guide. Subtitle: “Everything you earn, spend, and set aside.” UI selectors and current public copy use this name; internal entries storage/routes stay the same.

Publication workflow: publish this follow-up on codex/money-log-review and merge after checking the remote source tree against the tested local files. The signed-in browser fallback recovered after connector errors. No database migration is needed.

## 8 October enhancement brief

Google Analytics and SEO setup are paused at the user's request. The initial-homepage guide-link edit in index.html predates this work and is separate from the enhancement release.

- Overview: six compact clickable summaries, planned/actual comparison for expenses, net savings and net investments, category breakdown ordered by actual amount, top-five/all toggle, configurable in-view 80/90/100% expense warning threshold and parent/child transaction drill-down. Income/spending trend and calculation explanations are optional disclosures. Negative expense variance means overspending; negative contribution variance means above target.
- Reports: month, year, all history and inclusive custom date range. Year comparisons add monthly plans, ignoring preserved annual records. Partial-month plans prorate by calendar days, rounding each month in minor units; any missing month's plan/limit makes the aggregated comparison Not set. List type/category/subcategory/currency filters affect only Money Log and its export. No currency conversion.
- Categories: sticky Add/search/type/status toolbar, compact financial rows and expandable children. Dialog edits keep scroll; linked choices archive after confirmation. Income categories remain supported.
- Expense sessions: up to 50 rows, each with a stable UUID/category/date/amount/note; one currency and a running total. Single statement inserts are atomic under existing RLS. Exact-payload checks before insert and after ambiguous errors make retries safe without collapsing legitimate identical purchases. Bulk errors retain the draft and Cancel confirms before discarding. Single entries also retain IDs across retries and offer Save & add another.
- Monthly Goals: optional parent-category savings and investment targets alongside expense limits. These are included within overall targets. Child limits are not separately tracked. Migration **010_contribution_category_targets.sql** extends type-matching validation without new grants or policies; do not re-run it once applied.
- Mobile login: form first in DOM, with branding and submit visible before marketing content on phones. Preview image remains on larger screens.

Verification and release status are recorded in docs/ENHANCEMENT_REVIEW_2026-10-08.md. No real users or financial records are deleted or modified as tests.

8 October additional steering: Income starters are Salary, Business, Freelance, Gifts, Rental income, Investment returns and Other income. Preserve existing generic/custom/archived income history. Migration 011 adds these once and nullable expense-only payment_method with the fixed values Cash, Credit Card, Debit Card, Bank Account and Others. No custom payment labels or account numbers. Both 010 and 011 have been applied and their production constraints/owner RLS verified; do not rerun. Primary Overview chart is a native SVG category/subcategory ring with Income/Expenses toggle and record drill-down. Budget progress is secondary and expandable; its proper column comparison graph has planned/actual amounts and a signed scale for withdrawals.
