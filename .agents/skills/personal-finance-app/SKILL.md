---
name: personal-finance-app
description: Build or extend a simple multi-user personal finance app with email-only sign-in, daily entries, monthly and yearly reports, editable expense/savings/investment categories, and Excel export, plus income and optional savings planning.
---

# Personal Finance App

Build a working application that helps each user understand their cash flow and decide how much to spend, save, and allocate to investments. The user's requirements are free operation, deployability, and responsive use on phones, tablets, and desktops; the stack is flexible. Treat allocation targets as editable planning inputs. The product must show the assumptions behind a plan and explain when income cannot cover it.

## Scope and implementation choices

Follow the requested feature scope and existing repository conventions. For a new project without a chosen stack, propose Next.js with TypeScript and PostgreSQL as a practical default; record the assumption and proceed with local implementation. Do not replace an existing stack. Use the project's supported authentication and database tooling, checking current official documentation when needed.

Choose open-source packages and services with a usable free tier for hosting, persistence, and authentication. Check current official pricing and deployment documentation before committing to providers; verify compatibility with the chosen runtime and the intended personal or commercial use. Account for quotas, inactivity pauses, authentication email limits, storage, and bandwidth. Explain practical free-tier limitations without promising unlimited use or permanent free pricing. Avoid paid APIs, mandatory custom domains, and credit-card-dependent services unless the user approves them. Use manual financial entry so bank connections and market-data subscriptions are not required.

Interpret multiple users as independent accounts with private financial records by default. Shared households, invitations, and an administrator viewing other users' finances require a specified access model; do not infer that every user can see everyone's finances. Ask about shared ownership only when it affects the requested work.

For an initial application, implement a simple end-to-end flow: enter email, verify via a magic link, land on the current month, add a dated entry, review monthly or yearly totals, manage categories, and export the selected data to Excel. Do not require a password, profile form, account setup wizard, or planning targets before entry. Keep income, emergency-fund planning, and allocation settings available as optional features. Use manual entry initially unless integrations are part of the request.

Read [references/finance-rules.md](references/finance-rules.md) before implementing calculations, schemas, or reports.

## Product behavior

- Authentication: one email field and a send-link action, followed by verification through the emailed link. Typing an arbitrary email alone cannot authenticate ownership. Use short-lived, single-use links and supported session handling. Keep email deliverability and free-tier limits in the deployment checks.
- Dashboard: default to the current month with a year selector, month selector, and yearly overview. Show expense, savings, and investment totals separately; include income and remaining cash when recorded. Keep budgets and emergency planning secondary so the main screen stays simple. Support useful empty states and a clear add-entry action.
- Daily entries: default the date to today in the user's timezone, with amount and category required and notes optional. Allow past dates and multiple entries per day. Derive year and month from the entry's calendar date. Offer create, edit, delete, and category/date filters. Handle corrections consistently in every dependent report. Use a default cash account and configurable currency so users need not set up accounts before recording entries.
- Categories: seed Expenses, Savings, and Investments for each user once. Users can add, rename, and delete their own categories. Keep the internal financial kind separate from the editable label so renaming cannot change accounting. Offer kind selection for new categories. For a category with entries, deletion must offer archiving or reassignment within the same financial kind, preserving those entries and report totals. Keep archived labels visible on historical records; never cascade-delete financial entries when removing a category.
- Excel export: generate an actual .xlsx workbook for the chosen year, month, or all-history filter and the current authenticated user only. Include a Transactions sheet with date, category, kind, amount, currency, and notes, plus a Summary sheet with monthly/category totals separated by currency and financial kind. Write dates and amounts as typed cells with useful formatting; write user-entered text as literal strings, never formulas. Match the current filter and report totals, include readable headers and frozen header rows, and handle an empty export gracefully. Use a free, open-source library and perform ownership checks at the export endpoint.
- Budget planner: allow amount or percentage targets for spending, emergency savings, other savings, and investment contributions. Show proposed versus actual amounts separately and make percentage denominators explicit. Never present one fixed allocation as universally ideal.
- Emergency fund: allow an editable target amount or target months of essential expenses, identify which expenses count as essential, and show current funded amount, gap, and an estimated completion date when a positive contribution supports it.
- Investment tracking: distinguish contributions from market value and returns. Begin with manual contributions and optional manually entered valuations. Do not infer profits from contributions or promise future returns.
- Settings: currency, timezone, essential categories, allocation targets, and profile preferences. Keep financial assumptions editable and visible where they affect results.

## Data and correctness

Enforce ownership in server queries, mutations, reports, downloads, and background jobs using the authenticated identity. Client-supplied owner IDs are never sufficient authorization. Include ownership in relationships so a transaction cannot reference another user's account or category. Apply the same controls to shared resources if later introduced.

Use database decimal types or integer minor units for money; validate amounts and use explicit rounding. Keep currencies separate unless a dated exchange-rate source and conversion policy are supplied. Use calendar transaction dates and the user's configured timezone for reporting periods.

Avoid double-counting internal transfers, goal contributions, recurring forecasts, and investment purchases as ordinary income or expenses. Keep actual recorded activity separate from plans and forecasts. Do not silently create transactions while rendering a dashboard.

Protect credentials with the authentication library's supported practices. Keep secrets server-side and outside version control; avoid logging financial details or access tokens. Make any demo data clearly synthetic and isolate it from real records.

## Validation and delivery

Test meaningful financial invariants: precise amount handling, period boundaries, transfers excluded from cash-flow income and expenses, deficit plans, zero-income percentages, empty histories, emergency-fund completion estimates, and transaction corrections. Test attempts by one authenticated user to read, update, delete, or export another user's records through the actual server boundary. Verify email-link authentication, one-time default category creation, history after category rename/archive/reassignment, month/year filters across year boundaries, and Excel export totals and cell types. Include formula-like notes in the export check to confirm they remain literal text.

Run the project's required build and checks. Exercise the core user flow and inspect responsive layouts, labels, keyboard access, error states, and loading states. Verify narrow phone, tablet, and desktop viewports; forms and primary actions must be touch-friendly, charts must fit, and tables must remain usable without causing page-wide horizontal overflow. Use mobile navigation appropriate to the screen size. Do not imply compatibility with every device without testing.

Make the app deployable: provide environment variable names without secret values, database migrations, build/start commands, and instructions for the selected free hosting and database services. Keep persistent data outside ephemeral hosting filesystems. Configure production authentication redirects and server-side authorization. When deployment is requested and the necessary accounts and access are available, deploy within the authorized scope, run migrations safely, and verify the hosted sign-in and core transaction flow. If provider access is missing, complete the deployable artifact and identify the exact remaining account or credential step; never report an unperformed deployment as complete.

Clearly distinguish implemented, verified, and unverified behavior in the handoff, including setup steps, provider limits, any required environment variables, and the verified deployment URL when available.

Complete implementation and requested deployment within the user's authorized scope. This skill does not itself authorize external account connections, money movement, purchasing investments, or incurring charges.
