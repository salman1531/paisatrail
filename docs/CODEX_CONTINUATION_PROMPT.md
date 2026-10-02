# Continue PaisaTrail in Codex

Open this repository as your Codex project, then paste the prompt below.

```text
Continue this existing PaisaTrail project from its current state.

Read AGENTS.md, README.md, docs/PROJECT_HANDOFF.md, VERIFICATION.md, and .agents/skills/personal-finance-app/SKILL.md before making changes. Use the current React/TypeScript/Vite stack with Supabase; preserve the working app and existing design decisions.

First review the implementation for bugs, authentication and per-user data isolation, exact money calculations, date/month boundaries, category history, Excel export safety, and responsive layout. Report actionable findings with file references and practical impact. Fix confirmed problems, then run npm test and npm run build. Run npm run test:ui for meaningful UI changes. Previous local verification passed 26 automated tests, 15 browser tests, and the production build; verify the current checkout again.

Keep these requirements: PKR by default, email magic-link login without passwords or profile setup, multiple entries per day, editable expense/income/savings/investment categories, monthly/yearly views, previous-month category comparisons, actual spending/savings versus monthly targets, emergency-fund planning, and real XLSX export. Keep currencies separate and preserve the existing demo storage key.

Next, help complete free deployment using Vercel and Supabase. No real backend, public website deployment, or login-email sender has been configured or verified yet. Apply the three SQL migrations in order to a new Supabase project, configure custom SMTP and correct authentication redirects, and verify real email login, cross-device persistence, and isolation between two users.

Privacy/terms pages remain drafts until the operator name, public contact email and final HTTPS site URL are supplied. Review those policies against the actual setup. Keep sitemap and llms.txt limited to public content.

Check current free-plan limits and Vercel Hobby eligibility before deployment. Ask for missing account details when needed. Do not buy domains, enable paid plans, publish invented legal details, or put secrets in Git or browser VITE_ variables. Keep changes reviewable and update the handoff documentation as work progresses.
```

The source repository is public at https://github.com/salman1531/paisatrail. Financial records require authenticated, private per-user storage; public source does not make those records public.
