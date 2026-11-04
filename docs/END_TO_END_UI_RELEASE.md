# End-to-end UI preview 2.4.0-preview.1

Based on the 2.3.1-preview.2 source at `1401030`. Keep the previous branch and hosted preview for rollback. This preview adds no database migration, permission, currency, or public route. Production is unchanged.

| Brief | Implementation |
| --- | --- |
| SHR-01 | The space filter, balance heading, cards and person list resolve the same scope. All spaces is explicit even with one returned space. Reporting dates apply to spending and repayment history, independently of all-time debt. Stale report data is hidden when a reporting scope changes. |
| SHR-02–04 | An empty group guides the user to Add person or the first expense. Active spaces keep their records and relevant actions. Shared expense entry inherits the selected space; the review shows the payer, total and exact shares. Repayments show sender, receiver and status, with unchanged confirmation and cancellation rules. |
| SHR-05 | Period spending and the user's share are visible on Overview and Reports. Chart records keep space, dates and PKR visible. The demo includes earlier weeks across two groups and traceable repayment events; existing demo edits are retained until reset. |
| EXP-01–03 | The Overview expense card carries period and currency to the Expenses view in Money Log. Add expense opens the form directly. Amount and currency appear together, with field-specific validation, retained drafts and the existing idempotent save. Search and category filters clear independently. A save reports the date and currency and keeps the list filters. |
| EXP-04 | The Overview compares equal day counts with the preceding cycle and calls out missing history. Both the chart and exact-amount table open the matching record dates. |
| HOME-01–02 | Home has a single demo chooser and readable native previews for category spending and who owes whom. The preview caption and destination switch together. |
| AUTH-01 | Sign-in, signup and password recovery name the intended workspace. Workspace choice uses allow-listed destinations. Same-browser email handoff remains time-limited, with the last workspace or chooser as fallback. |

Browser checks used fictional data: both demo destinations and workspace-specific account modes; 360/390 px expense form at a 430 px simulated viewport, invalid amount focus and one saved record; two shared groups with separate debts; date filters without debt changes; pending repayment confirmation and reversal; keyboard chart drill-down and masking. The physical iPhone and Android keyboard, live email delivery and a live two-account repayment still need acceptance. Shell Playwright Chrome aborted before assertions; do not treat the previous release's CI as verification of this release.

Local verification: 245 unit/database tests; TypeScript; production-mode Vite build with fictional credentials; public audit (12 sitemap pages, 33 private/noindex shells, 484 internal links).

## 2.4.0-preview.2 — public links and guide check

The preview refreshes the guide instructions and five fictional screenshots, and generates the public links in both LLM files from the same canonical page list used by the sitemap. The release build audit passed: 12 public URLs, 33 noindex shells, all 13 demo destinations linked from the guide and LLM files, 14 versioned guide image sources, and 484 internal links. Nineteen focused tests and the production build passed. The guide fit a 390 px browser viewport without horizontal overflow.

On 4 November 2026, the live sitemap matched the preview's 12 public URLs. The existing Search Console submission reported Success, 12 discovered pages, and a last read of 31 October. Demo, account and private routes remain out of the sitemap and search index. The guide passed Google's live URL test and Search Console accepted crawl requests for the guide, privacy policy, Personal Finance and Shared Expenses landing pages. Submission and crawl requests do not establish indexing. The copy and image changes in this preview have not been deployed.
