# Overview consolidation — 2.0.0-preview.2

Prepared 22 October 2026 on codex/forest-finance-rebuild. This is a local review build; production v1.0.0 is unchanged. Preview 1 is preserved under v2.0.0-preview.1 and its verified complete Git bundle. This release supersedes the previous five-tab navigation requirement at the user's request.

## Result

The four primary destinations are Overview, Money Log, Income and Money Plan (Plan on phones). Accounts, Categories, Settings and Help stay secondary. Demo and signed-in accounts share the same labels and components.

Overview retains its financial summary, charts, budget/goal progress and recent transactions. More insights follows recent transactions and is initially collapsed. It contains only the formerly unique period comparison, received-income source breakdown and account breakdown. It uses Overview's exact planning period, currency and account scope; it has no competing filters or duplicated financial cards/charts. Matching elapsed days remains the comparison default, with an explicit full-previous-period option. Empty/zero/negative histories retain factual explanations and no unsupported percentage.

Money Log owns custom/full-year/all-history dates, transaction filters and Excel export. Clicking an account in More insights opens matching date/account/currency scope in Money Log. Existing recorded-money, transfer, forecast and goal arithmetic is unchanged. Whole-account budget comparisons and lifetime goal labels retain their earlier scope rules.

/app/reports and /demo/reports permanently redirect to the corresponding Overview. Both dev/preview HTTP middleware and Vercel handle these redirects, including trailing slashes and query strings. The route parser and allow-listed post-login destination also canonicalize old links without crossing the private/demo boundary. Reports is no longer emitted as an active private HTML shell.

The public Overview feature card, guide HTML/Markdown and eight screenshots, LLM discovery files, hosting metadata, route tests, release notes and handoff are aligned. Sitemap/robots/canonical checks pass: ten public URLs, nineteen private/auth/demo shells. No private workspace URLs were added to the sitemap. Public privacy/terms were checked; their data handling remains accurate and no new data collection was introduced. Existing articles retain their authorship and dates. No analytics was enabled or Search Console submission performed in this release.

## Verification

- TypeScript and production build passed; existing lazy ExcelJS chunk-size warning remains.
- 180 unit/database tests across 34 files passed, including new account/currency/date scope and empty-state comparison regressions. Normal/demo rendering equivalence remains covered.
- Four Playwright HTTP checks passed: initial homepage HTML, private noindex shells, supplied blog metadata and legacy report redirects with query/trailing-slash cases.
- In-app browser: all seven active workspace pages checked at 320, 390, 768, 1280 and 1440px (35 layouts); no horizontal document overflow and all four labelled navigation targets visible.
- Expanded insights checked at 320px; 200% root text plus increased spacing at 390/1280px also had no document overflow. This is not a physical-device keyboard or browser-zoom certification.
- Axe 4.14 with insights expanded: zero automated violations; two checks still require manual interpretation. Not a complete accessibility conformance claim.
- Manual synthetic checks: shared account filter, elapsed/full comparison, account drill-down with matching Money Log chips, old demo bookmark redirect and built-preview private metadata. No financial records were saved or deleted; guide examples were unsaved drafts and discarded.
- The new Playwright mobile consolidation test was attempted once. Installed Chrome exited with SIGABRT during launch, before application assertions. The browser UI test is not claimed as passed; the historical full-suite limitation remains.

Evidence and synthetic screenshots: parent workspace outputs/overview-consolidation-2026-10-22/. Current production-style preview: http://127.0.0.1:4199/demo/overview. Dev server remains on 4196.

## Release and rollback

No database migration or production deployment was performed. Migration017 is still prepared/tested locally and must be applied, with controlled real-account verification, before promoting the broader rebuild. Preserve v1.0.0 and v2.0.0-preview.1; never move their tags or erase history. Restore either immutable frontend snapshot to roll back. Do not drop additive tables to restore the visual design. The unrelated index.html edit is intentionally excluded from the version commit.
