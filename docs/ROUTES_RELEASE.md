# PaisaTrace custom domain, page URLs and minimal-copy release

12 October 2026. Current production origin: https://paisatrace.hirubix.com.

## Changes

Home and password authentication are separate. Seven demo pages open directly with synthetic browser data. Private pages require sign-in and retain only known app return destinations. Page navigation uses the History API with popstate/hash compatibility, route titles, Back/Forward and reload. No paths contain financial data or account email. Ledger scope checks prevent showing real-account data during a switch to demo, or demo data while the real ledger loads. Admin authorization remains server-enforced.

Clean public documents, current-domain canonicals, sitemap, robots and absolute LLM links are generated at build time. Legacy `.html` URLs redirect. Private/demo/auth pages are excluded from sitemap and have route-specific noindex HTML and response headers. Unknown paths are not rewritten to the home page. Existing Vercel-origin values migrate to the custom domain while independently configured installations retain their own origin.

Login artwork no longer extends the laptop/tablet page; the form remains visible without clipping or disabling document scrolling. On phones the duplicate artwork/story is omitted. Signup and errors may need natural scrolling on short screens; fields and feedback remain accessible.

The pending 12 October product review is included: unassigned plan amounts are neutral and separate from Activity; compact goal/spending cards; optional methodology and advanced editors; quiet records; simplified category/settings screens; report drill-down preserves exact dates and currency; full numeric values use non-wrapping digits. Passwords remain primary by the operator's explicit choice. Financial calculations, ownership rules and schemas are unchanged.

## Verification

- TypeScript, production generation and Vite build passed.
- 127 unit/database tests passed, including safe route parsing/returns and migrated authentication origins.
- Connected-browser checks: sign-in had zero excess page height at 1366×768, 1024×768, 768×1024 and 768×700; seven workspace destinations at six widths (320, 390, 660, 768, 1024, 1440) had no horizontal document overflow.
- Direct demo entry, reload, Back/Forward, clean user-guide route, protected-route sign-in and route-specific built metadata were checked.
- Guide screenshots use isolated fictional sample data. No account records were changed.
- The required Playwright run was attempted; installed Chrome aborted at browser launch before assertions (SIGABRT). Added regression tests are not claimed as passing UI runs. Physical-device keyboards, assistive technology and real signup/recovery delivery still require separate verification.
- Supabase readback confirmed Site URL on the custom domain and the exact /auth/callback allow-list entry. Earlier Vercel email destinations are retained.
- Vercel confirmed production VITE_SITE_URL update. No GA4 or paid service was enabled.

Publication and production URL checks are recorded after deployment. Search Console ownership, sitemap submission and rankings on the new domain are not claimed by this code release.
