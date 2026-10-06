# Verification

The following checks passed locally on 2 October 2026:

- TypeScript compilation and Vite production build.
- 26 automated financial, database, email-client request, and Excel workbook tests.
- 15 end-to-end browser tests in installed Chrome: 5 workflows each at 1440×1000, 768×1024, and 390×844.
- Desktop and phone screenshots were inspected; the page does not overflow horizontally at the tested widths. Phone navigation, entry dates, and account sign-out are available.

The database migration was executed in PGlite with distinct authenticated user identities and an anonymous role. Checks cover read/update/delete isolation, cross-user category references, forged ownership, anonymous access, one-time category seeds, preservation of archived history, immutable category types, and server-side validation of dates/money/settings.

Excel tests load the generated XLSX back into ExcelJS and check actual cell types, literal formula-like notes, net contribution totals by currency, frozen headers, and an empty export. The browser tests also exercise an actual file download.

The email client request was tested against a mocked HTTP response. No real sign-in email was sent. No Supabase project or hosting account has been configured, no live database migration has been run, and no public deployment has been performed. Live email delivery, sign-in callbacks, cross-device synchronization, and hosted isolation remain to be verified after the setup in README.md.

The browser preview currently runs in explicit demo mode with synthetic local data. The production build includes an on-demand Excel module; it is downloaded when exporting, rather than on initial page load.

PKR is the default for new accounts and fresh demos. Accounting precision is explicitly defined, including two decimal places for PKR, so browser locale-data changes cannot alter stored amount interpretation. Browser and database checks confirm that two same-day entries with the same category and amount remain separate, survive reload, and reconcile in totals. Existing account currency preferences are not overwritten by the default-currency migration.

Category comparison checks cover January versus December, missing and negative baselines, isolated currencies and corrections. Goal checks cover all-category totals despite a category filter, overspending, remaining savings and emergency contributions within total savings. Public policy pages are prelaunch drafts until operator/contact/origin values are supplied.


## Dashboard update — 2 October 2026

Added monthly income/expense chart with keyboard/touch month selection and a data table, expense category ring with exact amounts, cash flow before contributions, net savings/investment rate, and entry/activity counts. Emergency fund now remains visible at small widths. All values use the existing integer-minor-unit calculations and selected currency; chart scope is labelled.

26 automated tests and the production build passed on this checkout. Manual in-app-browser checks found no page-wide overflow at 390, 768 and 1440 pixels. Updated desktop and phone views were inspected. The Playwright suite could not launch installed Chrome in the desktop sandbox (SIGABRT/EPERM); its results do not establish a UI regression. Added dashboard browser coverage for month selection, no-income state, chart table and layout; this new test is unverified until Chrome can launch.

A limited source review found bespoke React components, no image/template assets copied from another product, and existing Lucide icons and Google Fonts. Web searches show that financial summaries and category/trend charts are common features. This is not proof of source provenance, trademark clearance, or worldwide originality. The new dashboard uses purpose-written components and existing dependencies, with no competitor assets or code incorporated.

## Period goals and quick expenses — 2 October 2026

31 automated tests pass, including period/currency independence, explicit zero goals, withdrawals, archived categories, annual goal derivation, cross-user read/write isolation, anonymous access denial and invalid replacement rollback in PGlite. TypeScript compilation and the production build pass.

Manual in-app-browser checks verified quick expense saving, monthly targets, annual targets derived from monthly plans, reload persistence, and category budget comparisons using synthetic demo data. Added browser coverage for backdated quick expenses and monthly/yearly/category goal persistence. The standalone Chrome test runner remains blocked by the sandbox's browser launch restrictions; automated UI results are unverified. No live Supabase migration or real-account deployment has been performed.

Deployments must apply 004_period_goals.sql before using the new API. Existing default monthly planning amounts and financial records are preserved. Saved period goals keep their currency; switching display currency does not convert them. Blank monthly overrides revert to labelled current defaults, so unsaved months are not immutable historical plan snapshots.

## Public-launch review and branding — 2 October 2026

Replaced the generic leaf with a purpose-drawn P/trail SVG in the sidebar, login, loading state and favicon. Added generated third-party license notices and public links. Added DENY framing headers for Vercel/Cloudflare. Policy draft/indexing status now also depends on an explicit VITE_POLICY_REVIEWED acknowledgment; filling operator fields alone no longer publishes the drafts.

31 tests, TypeScript compilation and the production build pass. npm production audit reports a moderate UUID advisory via ExcelJS (two affected package entries). Inspected ExcelJS source uses v4 rather than the advisory's affected v3/v5/v6 paths; the bundled library has not been patched and exploitability was not comprehensively validated. This was a launch/provenance review, not a full security scan or a legal/trademark clearance. Live provider setup and account workflows remain unverified.


6 October 2026 update: 52 unit/database tests pass, including private admin denial/self-escalation, bounded metadata queries, active-session/recent-sign-in deletion checks, exact target confirmation, atomic dependent-record deletion and prevention of a deleted account reopening a ledger. TypeScript and production build pass. Custom spending names tested through the browser for all four types; mobile entry-list page checked at320/390/430/768 widths without horizontal overflow, with desktop checked at1280. Four guide screenshots use synthetic demo data. Live database RLS confirmed on all five finance tables; anon entries SELECT and initializer execute denied. Live response headers confirmed. No real account deletion performed. Automated UI suite cannot launch Chrome (SIGABRT/EPERM before assertions); recovery regression is preserved but still needs a real operator-run recovery check. Admin migration applied with explicit user approval.
