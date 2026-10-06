# PaisaTrace handoff — updated 5 October 2026

React, TypeScript, Vite and Supabase. Repository: https://github.com/salman1531/paisatrail. Production: https://paisatrace.vercel.app/. Clone the repository, run `npm ci`, copy `.env.example` to `.env.local`, set the public Supabase values and run `npm run dev`. Secrets never belong in `VITE_` values or Git.

## Implemented and configured

- Responsive dashboard, charts, category comparisons and a quick expense form at the top.
- Income, expenses, savings and investment contributions; independent monthly/yearly goals and category budgets. Exact money arithmetic and separate currencies.
- Supabase private per-user database, migrations 001–004 applied; RLS enabled on all four tables. Do not re-run migrations.
- Email/password login; signup verification; existing accounts can add a password from Settings or recovery. Password recovery is handled before opening the ledger and survives page reload.
- Category archive/restore, Excel exports and synthetic browser-local demo. Preserve the existing demo storage key.
- Vercel Hobby deployment, exact Supabase callback URL, Brevo custom SMTP. Real email delivery and magic-link sign-in were verified before the password change.
- Operator Salman Javed; support/deletion email salman.se95@gmail.com; Hirubix is credit only. Database region Sydney, Australia.
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
