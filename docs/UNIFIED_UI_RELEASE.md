# Unified UI release — 2.3.0

Requirement baseline: 26 October 2026 v1.0. Verification: 26–28 October 2026. Production publication authorized 28 October 2026. No database migration or access-rule change.

Both products consume WorkspaceShell, WorkspacePageHeader, WorkspaceBottomNavigation, the same ProductSwitcher and WorkspaceAccountMenu, and WorkspaceUI primitives. Domain services and calculations remain independent. Shared Overview retains /shared/dashboard; Repayments retains /shared/settlements, including demo routes. Account and privacy actions share positions. Settings has section save actions; manual refresh is secondary. The old shared hamburger and standalone sign-out treatments are removed.

## Requirement traceability

| Requirement | Implementation and evidence |
| --- | --- |
| U01 | WorkspaceShell: 240px sidebar, 32px desktop padding, single configured content origin. 65 viewport/page checks in responsive-matrix-final.json. |
| U02 | WorkspacePageHeader: title, primary action, privacy, secondary menu, account. Content-sized wrap retains long/enlarged labels. |
| U03 | ProductSwitcher selected state; common Settings/Help/Sign out menu; native disclosure Escape/outside dismissal; shared keyboard checks. |
| U04 | Shared destinations and routeTitle use Overview/Repayments; route slugs preserved; Categories is secondary. Route unit checks. |
| U05 | Same selector-left/account-right phone header, title/actions below, 16px content padding at 360/390/768px. |
| U06 | WorkspaceBottomNavigation: four product-specific destinations plus More, equal targets and safe-area padding; one shared modal sheet. |
| U07 | More has secondary pages, Settings, Help & about; native showModal traps focus and restores More on Escape. |
| U08 | Reflowing card grids, whole amount digits, full-screen phone dialogs, scroll body and stable save footer; normal and 200% text checks. Physical on-screen keyboards remain a device-testing limit. |
| U09 | design-system.css semantic colours and unified-workspace.css spacing/radius/state tokens shared by both products; no palette change. |
| U10 | Shared 16px body/14px support, 28px desktop headings, tabular numerals, 20px panels, 12px panels/8px controls, 44px controls. Automated contrast checks plus manual token review; see limitations. |
| U11 | Lucide outline icons, consistent shared navigation controls, decorative aria-hidden and named standalone controls. |
| U12 | PeriodControls supplies both Personal date/currency views and Shared ScopeControls, including optional space and applied custom dates. No currency conversion. |
| U13 | Existing period/space predicates retained. All-time outstanding stays independent from dated activity; browser date-change checks retained debt totals. |
| U14 | MetricCard used by both Overview summary sets; interactive cards are buttons, other metrics are articles. |
| U15 | Existing integer precision/calculations and independent services retained. Masking removes chart shapes/accessible amounts, exact-value tables and monetary text. |
| U16 | DashboardLayout shared main/support/context/recent slots; Personal income/expense and category analysis; Shared trends/outstanding by person, category/context rows and recent records. |
| U17 | Known-empty Personal records show first steps; Shared setup recognizes empty groups and guides Add person then Add expense. Fictional one-person group and subsequent split tested. |
| U18 | No-history, filtered-empty and no-outstanding wording remain distinct; empty groups say No expenses yet, not Settled; singular 1 person verified. |
| U19 | Common InfoDisclosure, compact context rows and reduced repeated financial scope; Help & about contains legal/provider/version links. |
| U20 | Modal reused by both products, compact/wide variants, same header/close and mobile full-screen body/footer. |
| U21 | Shared AmountField in recording forms, decimal keyboards and currency words; contextual selections retained; optional fields remain under More details. |
| U22 | FormFooter: Cancel, optional secondary add-another, primary save. Planning forms also use guarded Cancel. PKR100/2 previewed PKR50 each; partial repayment preview verified. |
| U23 | Existing stable IDs, pending guards, SaveAttempt ambiguous-outcome locking, dirty warnings/recovery and audit semantics retained. 237 unit/database tests and browser draft/record/reload checks. |
| U24 | Shared PanelHeader/WorkspacePanel and RecordRow in Money Log, shared expenses and repayments; compact group/person rows; existing filters/modal scroll restoration retained. |
| U25 | Personal amount/type retained; shared total/share/payer and repayment direction/date/space/status remain visible. |
| U26 | Shared BarChart primitive for Personal income/expense and Shared spending; common CategoryBar, zero-based scales, native keyboard/touch actions and exact-value tables. |
| U27 | Shared LoadingState/RetryState and independent partial resources; no fabricated totals on failed reports. Existing export uses Money Log scope; pagination absent when unnecessary. |
| U28 | Existing common Home and two public product introductions retained with comparable demos/previews; refreshed synthetic images. |
| U29 | PublicNav retained common destinations; mobile Sign in link added. Login stays form-first with labelled fields and password visibility. |
| U30 | workspaceIntent/safeReturnPath/auth callback mechanisms unchanged; regression tests cover safe destinations and shared-only initialization boundary. |
| U31 | Shared shell/header/nav/switcher/menu/toolbar/metrics/panels/rows/charts/dialogs/system states are consumed by both products, with workspace-specific data/actions. |
| U32 | No migrations/financial rewrites. Existing database authorization, split, pending/confirmed, exact money and export tests pass alongside UI-specific checks. |
| U33 | This mapping, tests/build logs, desktop/mobile page/form/menu/empty-state screenshots and machine-readable checks are stored in the parent workspace outputs/unified-ui-2026-10-26. |

## Verification and practical limits

237 unit/database tests in 42 files passed. TypeScript and the production build passed. Public audit verifies 12 public sitemap URLs and 33 private/noindex shells; guide and LLM copy use the new visible labels without changing bookmarks. Final build audit is recorded separately with the release manifest.

65 page/viewport checks cover 13 destinations at 360, 390, 768, 1280 and 1440px without horizontal page overflow. Both Overviews have zero automated axe violations at normal and 200% root text with enlarged spacing. Native modal More, Escape/focus return, consistent account actions, masked values and period/debt scope were inspected directly. These automated results are not an accessibility-conformance certification. SVG contrast, pictographic-name checks and physical-device/screen-reader/keyboard combinations need continuing manual assessment.

A fictional group was created, its one-person setup recognized, another tracked person added, a PKR100 equal expense saved once, and PKR20 repayment reduced the PKR50 debt to PKR30 after reload. No real account financial records were written or deleted. Backend failure/ambiguous retries and cross-user authorization were exercised in the existing local database/service tests; live email delivery and real-account cross-device writes were not repeated for this UI-only release.

The standalone Chrome Playwright runner still terminates with SIGABRT before assertions. Its failed launch is retained as ui-runner-attempt.txt, never reported as a passing UI suite. Browser-driven checks above are separate evidence.

## Continuity and rollback

Guide HTML/Markdown and LLM files describe the common shell, mobile More, Account menu, Help & about and stable routes. Public policies, canonical routes, sitemap scope and noindex rules remain intact. Analytics stays paused. Production v2.2.0, commit 28fe0bb8294792e8ff5fc0b6f83465ff7d4a5cb9 and Vercel deployment 4QioNme6Dem8p1esgetRRJkdaj7a remain the immutable rollback baseline. Its verified bundle is preserved in outputs/backups/2026-10-25. The paused menu working copy has its own 26 October archive. Exclude the unrelated index.html guide-link edit from release commits and build from the committed source. No schema reversal or financial-data deletion is required to roll back this frontend.
