# Continue PaisaTrail on another laptop

```sh
git clone https://github.com/salman1531/paisatrail.git
cd paisatrail
npm ci
npm run dev
```

Install Node.js 22.12 or newer (Node 24 recommended) and Git first. Authenticate with your GitHub account to clone this private repository. Copy .env.example to .env.local when connecting Supabase; demo mode works without it. Dependencies and builds are regenerated locally.

## Implemented

- Responsive overview, daily entries, categories, planning and settings.
- PKR defaults, multiple entries per day, income, expenses, savings and investments; savings/investment withdrawals.
- Previous-month category comparisons, including cross-year boundaries, signed changes and percentage changes when a prior baseline exists.
- Monthly actual spending/savings compared with editable targets; emergency contributions are included in total savings.
- Private email-link sign-in integration and paginated Supabase reads, with server-enforced ownership.
- Category archive/restore, date and category filters, and actual Excel export.
- Public privacy and terms drafts, sitemap, robots.txt, llms.txt, and an llm.txt compatibility copy generated at build time.
- Vercel deployment configuration, all database migrations, and local automated checks.

## Still needed before going live

Create Supabase and Vercel free accounts. Apply all three SQL migrations once, in numeric order. Configure custom SMTP for public login links. Provide the operator name, public contact email and final website address in the build settings to finalize the policy pages. Review the policy wording against your actual operation, providers, retention practices and applicable laws before publication.

No real backend, public deployment or email sender has been configured. Demo records live only in the browser and do not move with the repository; this repository contains source and synthetic fixtures, not personal financial records. Source can be continued on another laptop without service accounts. Live cross-device financial data requires Supabase.

## Existing design decisions

The selected name is PaisaTrail. Exact web searches found no matching name, but no worldwide exclusivity, trademark clearance or domain availability is claimed. The local folder retains the former pocket-ledger name; branding and exports use PaisaTrail. The old demo storage key is intentionally retained so existing local demo changes survive.

Monthly comparisons use the previous month, as requested. Plans are current repeating targets, not versioned historical budgets. Investment contributions do not measure returns. Emergency calculations use only categories explicitly marked for that fund. Target currency changes reset targets rather than pretending to convert money.

## Commands

```sh
npm test
npm run build
npm run test:ui
```

Browser tests use installed Chrome; for bundled Chromium, install it with Playwright and adjust the channel in playwright.config.ts. Live email delivery, callbacks, cross-device sync and hosted user isolation remain unverified. See VERIFICATION.md for local test evidence.
