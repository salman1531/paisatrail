# Everyday-task UI refinement — 17 October 2026

Overview now begins with a short heading, shared period/currency controls and Spending budget left with Add expense. Recorded income, Income left (recorded), net savings and net investments remain visible. Income left is explained as income after recorded outflows; the spending allowance and recorded money remain separate, with unchanged accounting. Active goals show compact lifetime progress.

The five labeled navigation destinations remain visible at tablet widths, with bottom navigation through 900px. Account/Sign out remains in the existing phone/tablet account menu. Demo and normal accounts share the workspace, summary and reporting components and financial labels.

Money Plan places planned commitments and editable goals/spending before supporting recorded activity. Unassigned in plan remains in Plan details. Money Log groups records by date, places category/context on the left and amount/type on the right, and uses the three-dot action menu at every size. Notes expand and collapse without losing their full text.

A shared PeriodControls component is used by Overview/Income/Money Plan and the independent Money Log/Reports scope editors. Reporting currency and entry-list currency retain separate state. Custom ranges read the submitted native date fields; local analysis ranges never change the planning period. Cross-month and cross-year date labels retain the necessary years.

Reports and Overview lead with ranked category bars; Show category ring retains the optional hierarchical chart and both views use the existing drill-down and currency arithmetic. CategoryPicker is one searchable combobox, including recent choices, grouped parent/child names, keyboard arrows/Enter/Escape and Other for custom names. The workspace footer contains Help, Privacy, Terms and the existing Rubix Labs link; public and authentication footers retain their existing variants.

The homepage enlarges the budget/action portion of a new real screenshot of synthetic demo data. Six guide screenshots and the corresponding guide/LLM copy have been refreshed. Public routes, sitemap inclusion and private noindex boundaries are unchanged.

Validation:

- 141 unit/integration tests, including category path search, compact date boundaries and identical summary output for normal/demo ledger fixtures.
- TypeScript, production build and public-build checks (nine canonical public pages and 19 private shells).
- Connected-browser checks across the five main destinations at 320, 390, 660, 768, 900, 1024 and 1440px: labeled navigation and no document overflow. Phone balance/Add expense are visible without scrolling; Money Log starts showing records in the initial viewport.
- Connected-browser checks: keyboard category selection, Other recovery, exact parent association, one sample save and both remaining totals updating, report-to-log type/currency/category chips, custom dates and unchanged Overview context, optional ring, row menu and compact footer. These use synthetic demo records only.
- The standalone Playwright runner was attempted. Chrome aborted on startup with SIGABRT, before executing any assertions. Tests were updated for the new controls and a focused scan-clarity suite was added; do not count the headless suite as passed. Real account authentication and physical-phone keyboard/screen-reader behavior were not retested in this presentation release.

Preserve the preexisting unrelated index.html edit separately; it is excluded from publication. No migration, grants, authentication configuration or analytics changes are needed.
