# PaisaTrail handoff — 2 October 2026

React, TypeScript, Vite and Supabase. Repository: https://github.com/salman1531/paisatrail. Production: https://paisatrail-eight.vercel.app/. Clone the repository, run `npm ci`, copy `.env.example` to `.env.local`, set the public Supabase values and run `npm run dev`. Secrets never belong in `VITE_` values or Git.

## Implemented and configured

- Responsive dashboard, charts, category comparisons and a quick expense form at the top.
- Income, expenses, savings and investment contributions; independent monthly/yearly goals and category budgets. Exact money arithmetic and separate currencies.
- Supabase private per-user database, migrations 001–004 applied; RLS enabled on all four tables. Do not re-run migrations.
- Email/password login; signup verification; existing accounts can add a password from Settings or recovery. Password recovery is handled before opening the ledger and survives page reload.
- Category archive/restore, Excel exports and synthetic browser-local demo. Preserve the existing demo storage key.
- Vercel Hobby deployment, exact Supabase callback URL, Brevo custom SMTP. Real email delivery and magic-link sign-in were verified before the password change.
- Operator Salman Javed; support/deletion email salman.se95@gmail.com; Hirubix is credit only. Database region Sydney, Australia.
- Public About page, sitemap, robots, canonical metadata, llms files, operator-approved privacy/terms and dependency notices.

## Remaining operator steps

- Set your account password yourself and confirm sign-out/password sign-in and a real entry round trip. Never share the password with the assistant.
- The operator reviewed and approved publication on 2 October 2026. Production `VITE_PUBLIC_POLICY_REVIEWED=true` records that acknowledgment, not legal certification. Re-review after changes to actual practices.
- Verify the URL-prefix property in Google Search Console and submit `/sitemap.xml`. Rankings are not guaranteed.
- Full live two-account data isolation and cross-device entry persistence have not been verified; local database authorization tests cover these constraints.
- Vercel Hobby is restricted to personal non-commercial use. No domain purchase or paid upgrade is authorized.
- Brevo may require approving another outbound Supabase IP if its sending infrastructure changes; do not disable restrictions automatically.
- PaisaTrail remains the selected name for now. No trademark or domain clearance is claimed.

Run `npm test`, `npm run build` and `npm run test:ui`. Desktop browser automation may be blocked by the environment; record limitations honestly and use available native browser controls for layout checks.
