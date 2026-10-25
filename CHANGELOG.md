# Changelog

## 2.2.0 — 25 October 2026

- Bring the tested Shared Expenses dashboard, scoped reporting, clearer split and repayment forms, resilient loading and retry flows into the production release.
- Give both workspaces common forest/lime navigation tokens and Lucide outline icons, a named workspace dropdown and separate account controls.
- Introduce public Personal Finance and Shared Expenses pages, equal homepage visibility, two demo choices, responsive previews and accessible shared public navigation.
- Put sign-in fields first on mobile, remove nested email borders, and preserve validated workspace intent through password sign-in, verification and recovery.
- Refresh the common guide, privacy storage disclosure, footer, public metadata, sitemap and LLM files. Migration019 extends the existing member-only read report without changing permissions.
- Preserve immutable 2.1.1 production and 2.2.0-preview.1 backups for rollback.


## 2.2.0-preview.1 — 24 October 2026

Shared Expenses review: explicit financial scope, complete spending reports, actionable summaries, simpler people setup, split and repayment reviews, responsive forms, recovery states and representative demo scenarios. Read docs/SHARED_UX_ACCEPTANCE.md for readiness and verification. Production 2.1.1 is preserved; migration019 extends read-only reporting without changing financial rules.


## 2.1.1 — 2026-10-23

- Introduce both independent modules on the common homepage and account pages, with clearly named demos.
- Keep Switch product visible at the top of every workspace on phones, tablets and desktops.
- Align public navigation, About, shared terms description, user guide, LLM files and SEO metadata. Sitemap remains limited to the ten canonical public pages.

## 2.1.0 — 2026-10-23

- Independent Shared Expenses workspace with private collaborative groups, invitations, splits and repayments.
- Personal Finance 2.0.0 remains preserved as the production rollback baseline.

## 2.0.0 — 2026-10-22

- Simplify recording by removing financial account selection from single/bulk entries and recurring schedules.
- Remove wallet navigation, filters, tracked-balance summaries and new-transfer actions. Overview uses recorded income left and recorded cash movement.
- Preserve existing entries, compatible historical assignments and paired transfer corrections; no data deletion. The approved additive database setup enables private recurring confirmations.
- Refresh public guidance, screenshots and compatibility links. Preview 2 and the previous production release remain available for rollback.

## 2.0.0-preview.2 — 2026-10-22

- Consolidate Reports into Overview: optional period comparisons, income sources and account breakdowns follow its shared period, currency and account scope.
- Keep four labelled primary destinations; leave detailed dates, search and Excel export in Money Log.
- Redirect old report URLs to Overview, and align public feature links, guide screenshots and discovery files.
- Preserve production v1.0.0 and the complete v2.0.0-preview.1 rollback snapshot. No database migration or deployment is included.

## 2.0.0-preview.1 — local review build, 2026-10-22

- Forest workspace, labelled responsive navigation, compact summaries and actual-activity charts.
- Dated manual accounts, same-currency transfers and atomic optional goal allocations.
- Expected recurring schedules with individual paid/received confirmation and retry protection.
- Transaction details, shared account filters, report drill-down/persistence and matching Excel exports.
- Browser-local display/privacy preferences, refreshed guide screenshots and private Accounts routes.
- Additive migration 017 prepared and tested locally; not applied to production.
- Production remains on 1.0.0 pending review. See docs/FOREST_WORKSPACE_RELEASE.md for verification and remaining acceptance checks.

## 1.1.0-preview.1 — paused draft, 2026-10-21

The Cloud & Teal direction was stopped by the user and was never deployed. Preserved on codex/cloud-teal-accessibility and in the paused-theme Git bundle.

## 1.0.0 — baseline recorded 2026-10-21

Production baseline: 79281a64571987ec9fd38a89d5f4038868f77105. Previous release dates are preserved in repository history.
