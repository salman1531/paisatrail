# Shared Expenses 2.2.0-preview.1

24 October 2026. Implementation of the supplied “Shared Expenses Final Requirements”, version 2.0 (23 October). P0/P1 are the scope. This is a local review build, not a production release declaration.

## Baseline and rollback

Branch `codex/shared-ux-2-2` starts from the exact source tree used by production 2.1.1. Production remains commit `4ffdc699d42235d1acfe92220e1efea0c28c0855`, deployment `BNpcLNosdf7ZwN1DdmefyM1tPFYN`. Tag `v2.1.1` and the complete bundle `outputs/backups/2026-10-23/paisatrace-v2.1.1.bundle` in the parent workspace remain immutable; `git bundle verify` passed again on 24 October. The unrelated dirty index.html guide-link edit is excluded from this release.

## Calculations and contracts

- Expense amounts remain integer PKR minor units. `allocate` and migration018 use the same largest-remainder allocation and UUID tie break. Exact allocations equal the total; percentages total 100.00%. An excluded payer remains supported.
- Shared spending is the sum of included, non-cancelled expenses in the stated dates/space. Your share sums the authenticated participant's allocations; You paid sums their payer amounts. These are three different values.
- `shared_pairs` / `shared_summary` remain authoritative for all-time debts. Pending/cancelled repayments never reduce confirmed debt. Debts stay in their original space; the net card is only a summary, not a payment instruction or bank balance.
- Migration019 only extends the JSON returned by the existing `shared_report(uuid,date,date)`: totals, daily spending buckets and repayment totals by status. Existing categories/people, member checks and authenticated-only grants remain compatible. No tables, access grants, personal records or mutation functions change. **019 is tested locally, not applied in production. Do not rerun018.**
- Expense dates use inclusive civil-date comparisons. Activity retains UTC event-date semantics with an exclusive following-midnight boundary, including sub-millisecond events. Weekly charts use Monday-based buckets clipped to the applied range; longer ranges use months. Missing buckets within a range are zero; unavailable requests are labelled unavailable, never fabricated as zero.
- Complete aggregates come from the report RPC, independently of paginated records. History requests fetch 21 rows to display 20 plus a real next-page signal. Person drill-down uses a separate inner-join alias so it does not truncate the full allocation embedded in each expense. No Shared Expenses export is offered.
- URL query scope persists the period, space and record drill-down. Repayment/history and drilled-record page offsets are separate. Expense details preserve the list and focus; group navigation restores saved scroll after data is rendered.
- Mutations retain context locking, server versions and immutable idempotency receipts. Unknown network outcomes freeze the draft and retry the identical command/payload before accepting edits. Business errors retain editable input. Successful sections render independently while other requests wait or fail.

## Requirement traceability

“Implemented” below describes the code and local evidence, not production deployment or a certification. Browser checks use fictional data; database checks use isolated PGlite users.

| ID | Implementation | Local evidence / remaining boundary |
|---|---|---|
| SE01 | Label Total, Your share, You paid and confirmed debt independently | Required 3,600/1,800 example regression; 100/50 browser flow |
| SE02 | All-time outstanding cards separate from date-scoped panels; space filters both | Inclusive-date/report DB regression; date UI check |
| SE03 | Fixed PKR text; integer money; inclusive dates | Boundary, leap-year and precision regressions |
| SE04 | Existing financial mutations unchanged; additive read-only019 | Existing split/correction/authorization suite passes |
| SE05 | Page-specific primary actions; section saves in Settings | All seven pages inspected; no global expense action in Settings |
| SE06 | Labelled sidebar, five-item phone navigation plus More, split desktop grid, full-screen narrow forms | 28 page/width checks; 360/768/1280/1440; screenshot pairs |
| SE07 | Scoped semantic tokens, scalable typography, tabular figures, Lucide outline icons | Axe checks and explicit colour pair checks; no colour-only statuses |
| SE08 | Three debt cards; trend/people, category/spaces, expense/repayment rows | Desktop and phone dashboard captures; start of content visible at1280×720 |
| SE09 | Zero-based weekly/monthly bars, ranked 0–100% categories | Totals/bucket tests, exact values and drill-down |
| SE10 | Person/space/direction actions; Total/share/payer records; compact groups | Browser details and return-focus checks; long-name demo |
| SE11 | All time/month/last/custom; editable drafts; visible scope and clear actions | Invalid reversed dates retain applied report; URL round-trip regression |
| SE12 | Period totals/paid-share/repayments separated from all-time debt | Full-report tests including more than one page; date changes retain debt |
| SE13 | Native button charts, exact table/text values, category/person/time record links | Hidden chart geometry/ARIA tests; category UI drill-down |
| SE14 | Add person explicitly offers invitation or tracking with no access | Tracked-person UI flow; explicit join/history-claim DB tests |
| SE15 | Friend name first, generated space name, optional override; no automatic invitation | Invitation is a later explicit history-link action; consent tests preserved |
| SE16 | Manage people gathers participant actions; settings secondary; repayment by debt | Group details desktop/phone captures |
| SE17 | No visible internal IDs; account/tracked/inactive labels; blocked-removal guidance | Membership, leave, history and outsider regression checks |
| SE18 | Essential recording fields, current group preselected, More details | Phone form capture and successful save |
| SE19 | Live allocation totals/remaining; payer, total and your-share review; required rounding copy | Equal/exact/percentage and excluded-payer regressions |
| SE20 | Dirty close warning; focused validation; stable retry; locked unknown outcome | Dirty Escape check; stable payload/retry tests and server receipts |
| SE21 | Complete details and permitted edit/cancel/restore with history explanation | Details UI and correction/cancellation DB regressions |
| SE22 | Record repayment and explicit sender/receiver/space/date review | Tracked partial-repayment browser flow |
| SE23 | Applicable confirmation/effect directly above footer | Registered pending → confirmed demo flow; receiver-only server tests |
| SE24 | Pending/confirmed/cancelled records with authorized actions; cancel-and-replace | Registered/group and registered/direct scenarios in PGlite; historical rollback checks |
| SE25 | Human-readable events, repayment attribution and dates, distinct filtered empty states, accurate pager | Event labels, inclusive dates and 20/21-row regression |
| SE26 | Fixed PKR, profile-local feedback, browser-only preferences and temporary toggle explanation | Settings inspected; privacy/membership links retained |
| SE27 | Per-section streaming successes, loading, unavailable/previous snapshot and retry | Failed-report/other-success test; slow-request streaming test |
| SE28 | Native modal focus trap/Escape/return, status/error announcements, 44px actions, rem text, reduced motion | Desktop Reports and phone Dashboard/form axe runs; 200% text + spacing reflow. Full screen-reader and physical keyboard/device checks remain open |
| SE29 | Masks card/list/detail/review amounts and all chart geometry/labels/tables | SSR privacy regression and live hidden chart check. Display only; no permission change |
| SE30 | Fictional multiple groups/friend, dates/categories, all split/repayment states, settled space, long names | Seed reconciliation test. Existing saved demos are preserved; explicit reset loads new examples |

## Required scenario evidence

- **R01:** existing financial and reporting tests cover equal/exact/percentage, cent rounding and excluded payer. Phone preview showed100 total and50 each.
- **R02:** October boundary records, categories/timeline/person totals, all-time invariant and a >20-record report pass in the database fixture. Invalid date UI keeps the old report; category drill opens the correct dated expense; closing details restores focus and URL.
- **R03:** two registered-user scenarios remain in the DB suite: group receipt with wrong-receiver rejection and identical-command retry, and direct-friend receipt after explicit consent. In the demo, Sana's pending1,500 receipt left8,000 outstanding until confirmation, then displayed6,500 and no pending confirm action.
- **R04:** the browser created a separate fictional group and tracked person, saved100 equally, recorded20 received, and showed30 outstanding after reload. No real account was edited.
- **R05:** existing server correction, stale version, repayment conflict, cancellation/restoration and account-removal/history tests pass.
- **R06:** client tests retain the original immutable payload/key after an unknown outcome; server receipts prevent duplicates and reject changed-payload reuse. UI buttons are guarded synchronously and show saving progress.
- **R07:** owner/member/outsider/anonymous, tracked no-access, explicit account/history claim, expired/revoked invitation and unsafe removal/leave cases remain covered in PGlite. No live invitation or permission grant was created for testing.
- **R08:** local browser checks cover native modal close/stay/focus return, phone footers, visibility masking, responsive navigation and text/spacing reflow. Physical mobile keyboards and a full screen-reader pass are still required before declaring complete acceptance.

## Verification and release status

Evidence is in the parent workspace `outputs/shared-ux-2026-10-24/`: desktop/phone screenshots of Dashboard, Reports, group details, expense entry and repayment review; responsive-checks.json; accessibility reports; flow notes. Guide screenshots are new synthetic captures, not real users' data.

223 unit/database tests across 39 files pass, TypeScript and the production build pass, and public checks validate 10 public pages, 33 private shells and 349 internal links. The requested 28 responsive page/width combinations have no document overflow and retain visible product switching.

Production is unchanged. The preview version must not be labelled a completed production release until019 is applied, the frontend is deployed and live member/report checks pass. A real-account UI session, physical-device keyboard checks and full screen-reader testing have not been claimed. Standalone Playwright Chrome still aborts at launch with SIGABRT; request-only HTTP tests pass, and in-app browser checks are separate evidence. There is no claim that the blocked UI suite passed.
