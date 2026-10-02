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

