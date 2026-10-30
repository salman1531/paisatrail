# UI completion — 2.3.1-preview.1

Baseline: unchanged U01–U33 specification, 26 October v1.0; completion started 31 October 2026. v2.3.0 production commit 91340c8fd70c9ea05fec0e44d644fec05a108729 and its complete bundle remain preserved. No database migrations or financial rule changes.

## Implemented

- U03/U27/U31: PersonalWorkspaceState consumes the common shell and navigation configuration while loading or retrying an authenticated ledger. Identity boundaries remain guarded. Session initialization still has a separate neutral loader.
- U20/U23: field-linked shared-expense and repayment errors identify/focus the affected control and retain the draft. Native required/date validation, server validation, exact money, split allocation and SaveAttempt stable request identities are retained.
- U28–U30: after hydration signed-in visitors see Open workspace, using only allow-listed workspace paths or the chooser. Anonymous prerendered HTML remains public/indexable; the UI hint grants no access, stores no extra account data and never initializes a ledger. React and generated public navigation use the same lazy client observer with sign-out race protection and cleanup.
- U33: Linux CI installs the lockfile-matched browser and runs all UI projects plus unit/database tests and public build checks with a fake project. Optional installed Chrome remains available. Local matched Chromium also fails before assertions: macOS denies MachPortRendezvous bootstrap_check_in (1100). No unsafe workaround is used.

## Verification status

243 unit/database tests passed locally. TypeScript and a production-mode preview build pass. Public build audit covers 12 sitemap pages, 33 private/noindex shells and 487 links. New browser tests cover field associations/drafts, signed-in public CTAs, generated navigation and authenticated ledger retry through isolated fixtures. CI and additional browser results are recorded separately in outputs/ui-completion-2026-10-31. Do not equate prepared tests with passing tests.

## Phone acceptance checklist (iPhone Safari and Android Chrome)

1. Open both workspaces; compare selector/account positions and four destinations plus More. Open/close menus and dialogs; check no page movement or hidden final records.
2. Open an expense, focus amount/date/notes with the keyboard visible, scroll to the final field and Save footer, dismiss keyboard, close and confirm that normal page scrolling is restored. Use fictional records or discard the draft.
3. Enter an invalid repayment amount; Save must focus the amount, explain the correction and preserve input. Never record a payment that did not happen in your real account.
4. Increase browser text/zoom, try long names/amounts, rotate the phone and check all actions remain reachable.
5. Hide amounts: cards, rows, chart focus/tooltips and exact-value views must mask consistently.
6. Sign in with the same account and open each workspace; check the public Open workspace action, safe return destination and account-menu Sign out. Passwords stay on your own device.

User has both physical phone types and one ordinary account. One account covers both workspaces, but cannot independently verify a second receiver's confirmation or permission isolation. Two-user scenarios use fictional local database/service actors; independent live two-account acceptance remains pending unless a second dedicated account is supplied. Physical device, true browser zoom and full screen-reader checks must be recorded by the person performing them.
