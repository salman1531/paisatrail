# PaisaTrail

A simple responsive personal finance app: email-only sign-in, dated expenses/income, savings and investment contributions, monthly/yearly reporting, editable categories, emergency planning, and Excel export.

## Try it locally

Requires Node.js 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Without Supabase environment values, use **Explore the demo**. Demo data is synthetic, saved only in that browser, and never uploaded to Supabase. Use **Reset demo** to start over. Demo mode is not authentication and does not sync between devices.

## Connect email sign-in and private storage

1. Create a free [Supabase project](https://supabase.com/dashboard). Choose a region appropriate for your users.
2. Run the files in `supabase/migrations/` in numeric order, once each, in that project's SQL Editor. The initial migration creates the schema, server-side validation, and row-level authorization; the second sets PKR as the default for new accounts; the third adds a monthly savings target and keeps emergency contributions within it. Alternatively, link the project with the Supabase CLI and run `supabase db push`. Do not run the initial migration repeatedly against an existing schema.
3. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` to your project URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to the project's public publishable key (the legacy public anon key also works). These values are intended for browser use. Never put a service-role key, database password, or SMTP secret in a `VITE_` variable.
4. In Supabase Authentication, enable email sign-in and user signup. Keep email verification enabled. Set the Site URL to the final application origin, and allow `http://localhost:5173/` and `http://127.0.0.1:5173/` as local redirect URLs. Add the exact production origin followed by `/` before testing deployment.
5. For a public app, configure custom SMTP in Supabase. Its default email service sends only to members of the Supabase project team and currently allows two emails per hour. [Official SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp). Use a mail provider whose free quota and verified sender requirements fit your account. Credentials belong in Supabase's SMTP settings, not this app. Do not assume a free email-sending tier also supplies a sending domain; use an existing verified sender where supported, or resolve provider requirements before going public.
6. Restart the development server after changing environment values. Enter your email and open the emailed sign-in link. A new user gets Expenses, Savings, Investments, and Income categories automatically; no password or profile wizard is needed.

The browser calls Supabase's authenticated API. PostgreSQL row-level security enforces user ownership for reads, writes, and the data used for Excel exports. Cross-user category references are blocked by both validation and a composite foreign key. Category types cannot be changed by renaming. Removing categories with history archives them; existing records remain available and editable.

For a small personal deployment without buying a sending domain, an existing Gmail account can be used as SMTP if that account supports app passwords: enable 2-Step Verification, create a dedicated app password, use `smtp.gmail.com` with port `587`, and set the SMTP username and sender to that Gmail address. Enter the app password directly in Supabase's SMTP settings. This is an option for low-volume use, subject to account restrictions and sending limits; it is not a high-volume mail service. [Google app passwords](https://support.google.com/accounts/answer/185833), [SMTP settings](https://support.google.com/mail/answer/7104828), [sending limits](https://support.google.com/mail/answer/22839). Never provide your normal Google password. Verify delivery with your account before making this the production sender.

## Deploy with Vercel and GitHub

The repository is `https://github.com/salman1531/paisatrail`. Clone it on your laptop, run `npm ci`, and use `npm run dev`. The app is at the repository root, even though the original local workspace uses `outputs/pocket-ledger`.

Create a Vercel account using GitHub and import the PaisaTrail repository. Choose Vite, build command `npm run build`, output `dist`, and leave Root Directory at the repository root. The included `vercel.json` preserves the security headers. Vercel Hobby is free for personal, non-commercial use; commercial use needs another suitable hosting plan. [Vercel Hobby terms](https://vercel.com/docs/plans/hobby), [GitHub integration](https://vercel.com/docs/git/vercel-for-github), [Vite setup](https://vercel.com/docs/frameworks/frontend/vite).

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to Vercel's environment settings after creating Supabase. Without them, the deployed site is a demo preview. Use the assigned Vercel website address; no domain purchase is required. Add the exact production origin plus `/` to Supabase's allowed redirects and Site URL, then redeploy after changing build values. Test a real login link, data reload, another device, separate-account isolation and Excel export before inviting users.

For public policy pages, configure `VITE_OPERATOR_NAME`, `VITE_CONTACT_EMAIL` and `VITE_SITE_URL` (the exact HTTPS production origin, such as your assigned Vercel address). `predev` and `prebuild` generate privacy/terms HTML and Markdown, `llms.txt`, an `llm.txt` copy, `robots.txt`, and `sitemap.xml`. Missing details leave visible prelaunch drafts, an empty sitemap and robots disallowing indexing. These files contain only public product and policy information, never account records. Review the actual operator identity, providers, retention/deletion practices and applicable laws before public launch. The current draft does not claim that any particular jurisdiction's compliance requirements are met.

For login emails, Gmail SMTP with an eligible app password is a low-volume option without purchasing a domain. Brevo's free tier currently includes 300 daily emails and SMTP; authenticate a sender domain for a lasting branded setup. Resend currently includes 3,000 monthly emails, capped at 100 daily, with domain verification needed for public delivery. Keep email credentials in Supabase, not in the repository or frontend. [Brevo pricing](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans), [Resend pricing](https://resend.com/pricing).

## Alternative: Cloudflare Pages hosting

The frontend builds to static files; the backend is Supabase. There is no application server or local database file to keep running.

1. Add the two public Supabase values to `.env.local` and run `npm run build`. Values are embedded at build time; changing them requires a new build.
2. Create a free Cloudflare account and a **Pages** project using **Direct Upload**. Upload the contents of `dist/` (or a ZIP with `index.html` at its root). [Official direct-upload instructions](https://developers.cloudflare.com/pages/get-started/direct-upload/).
3. Use the assigned `https://…pages.dev` address. No custom website domain is required. Add that exact address plus `/` to Supabase's allowed redirects and set it as the Site URL.
4. Test a sign-in link on the deployed address. Add an entry, refresh, then sign in with the same email on another device and verify that it appears. Sign in with a different email and verify that the first account's entries do not appear. Test an Excel export and an archived category.
5. For updates, run a new build and upload the new `dist/` contents. Database changes need a new migration; preserve existing financial records. Keep both accounts on free plans unless you explicitly choose an upgrade.

Alternatively, connect a Git repository to Pages, use `npm run build`, output directory `dist`, and configure the two public environment values in the build settings. Choose Git integration at project creation if you want it: direct-upload projects do not switch to Git integration later.

Free hosting is subject to provider quotas. [Cloudflare static asset requests](https://developers.cloudflare.com/pages/functions/pricing/) are free; [Supabase's free plan](https://supabase.com/pricing) has database, usage, and project limits, and inactive projects may be paused. Custom SMTP has its own sending limits. Email deliverability, backend setup, and live deployment require your provider accounts and have not been verified by the local demo.

## Financial behavior

- New accounts and fresh demos default to PKR. Existing currency preferences are preserved. Use Settings to change a saved preference, or Reset demo to load fresh PKR sample data.
- Record as many separate entries on the same date as you need, including multiple entries in the same category. Each entry has its own identity; recording another entry never replaces the previous one.
- Store money as integer minor units. Supported currencies: USD, PKR, EUR, GBP, AED, JPY, KWD; their precision is respected. Dates are calendar dates with the selected timezone used for today's default.
- Savings and investments are contributions minus withdrawals; they are not consumption expenses or investment returns.
- “Left to allocate” is income minus expenses and net savings/investment contributions for the selected period. It is not a reconciled bank balance.
- Different currencies are never added together. Dashboard totals use the selected display currency; entries and exports retain the original currency. Changing the display currency resets planning targets instead of pretending to convert amounts.
- Emergency progress includes only savings categories marked as emergency funds, including their historical and archived entries. Estimates assume fixed contributions and no interest or withdrawals.
- The overview compares each category in a selected month against the previous calendar month; January compares with December of the prior year. Missing baselines show new activity rather than an infinite percentage.
- Monthly expense and savings comparisons use all categories in the profile currency. Targets repeat monthly and are current settings, not snapshots of historical plans. Emergency contributions are included within total savings and are not subtracted twice.
- Monthly planning amounts are optional user targets. A deficit is shown rather than silently reducing allocations. No investment advice or promised returns are provided.
- Excel export applies year/month/category/search filters. It includes typed dates and amounts, literal notes, and summaries grouped by month, category, financial type, and currency. Formula-like notes are never executed as formulas. An empty export still contains headers.

## Verification

```sh
npm test
npm run build
npm run test:ui
```

The UI suite uses installed Google Chrome. Run `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.ts` if using bundled Chromium instead. Tests run against the production preview, starting it if necessary. Unit tests cover exact money parsing, month/year boundaries, emergency balances, and real XLSX round trips. The migration runs in a local PostgreSQL-compatible PGlite database for cross-user access, anonymous access, forged ownership, category history, and validation checks. UI tests exercise entry creation/edit/delete, category rename/archive, export downloads, planning, and layout at 390px, 768px, and 1440px widths.

These local checks do not replace testing live email delivery and the deployed Supabase project. The app loads all history in paginated requests; it does not silently assume the API's first page contains every entry. For much larger deployments, move aggregate calculations and export streaming to authenticated server operations while retaining row-level authorization.
