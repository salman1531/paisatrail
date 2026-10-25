# Common workspaces release — 2.2.0

Prepared 25 October 2026. The user authorized combining the Shared Expenses preview with the new public-site/login/navigation requirements and deploying to production. The unrelated dirty index.html is excluded.

## Delivered behavior

- Home gives both workspaces comparable positioning, separate sample-data demo choices, a named preview selector, readable phone balance crops and a common getting-started/FAQ section.
- `/personal-finance` and `/shared-expenses` have independent prerendered introductions, features, walkthroughs, currency details and workspace-specific signup/sign-in links. They contain synthetic examples only; account code is loaded separately.
- PublicNav is shared between React pages and generated guide, About, policies and articles. Native disclosures support keyboard, focus, Escape and outside dismissal. Phone navigation is a nonmodal disclosure with large targets and an explicit Close state.
- Password sign-in remains primary. Its fields precede demos on phones; desktop uses a shorter story beside a contained form. Email has one boundary, password visibility is labelled, email survives errors/mode changes, progress is announced and synchronous guards prevent duplicate requests. Verification still requires deliberate email identity acceptance.
- Only the two explicit workspace `next` destinations are accepted. Existing safe private returns and pending invitations have priority. A workspace-only one-hour browser handoff supports verification/recovery in a new tab, without tokens or financial records, and is disclosed in Privacy. Generic returning sign-in uses the last enabled workspace; otherwise it opens the chooser. A shared-only account never initializes the personal ledger.
- Both modules use the same forest/lime/white navigation tokens, sizes, outline icon stroke and named workspace dropdown. Switching demos stays in demos. Account preferences/help/sign-out remain separate.
- Common footer, guide HTML/Markdown, native screenshots, LLM resources, route metadata and sitemap are aligned. Sitemap: twelve public URLs; private/demo/auth/join paths remain noindex.
- Includes the prior Shared Expenses 2.2.0-preview.1 work; see SHARED_UX_ACCEPTANCE.md. Migration019 extends only the existing authorized report JSON, preserving member checks and grants.

## Verification and limitations

Unit/database, TypeScript, version, production build and public-link checks are required. In-app browser evidence covers seven public/auth/workspace screens at 360/390/768/1280/1440, login field priority, menus, preview choice, switching, validation and recovery context. 200% root text plus expanded spacing reflows on phones. Native guide captures use fictional local data.

Standalone Chrome Playwright still aborts at launch with SIGABRT before UI assertions. Request-only tests run independently; do not call the full UI suite passing. Automated axe checks cover home, login and shared screens; any manual-review entries remain listed in saved evidence. Full screen-reader, physical phone keyboard and fresh real-email delivery journeys remain operator/device acceptance items. No real account password, transaction or collaborator was changed for testing. Analytics remains paused.

## Publication and rollback

Apply only migration019 before this frontend. Migration018 is already live and must not be rerun. Record the actual database result, remote production commit, Vercel deployment and live checks in the release manifest, not by inference from this source document. Preserve immutable v2.1.1 production and v2.2.0-preview.1 tags, complete bundles and prior manifests. A frontend rollback requires no financial record deletion or database rollback.

## Recorded release checks

25 October: 230 unit/database tests in 41 files passed; TypeScript and release metadata passed. Build audit: twelve public pages, thirty-three private shells and 477 internal links checked. Thirty-five in-app layouts had no horizontal page overflow. Home/login axe checks had zero violations and zero manual items; Shared at enlarged text had zero violations and one contrast review item (listed in evidence). Native physical-device/full screen-reader acceptance remains outstanding.

Migration019 was applied successfully in the existing production project on 25 October. Read-only verification returned timeline=true, totals=true, anonymous EXECUTE=false, authenticated EXECUTE=true and exact ACL unchanged=true. No new grants, tables, financial writes or member changes were made. Final remote commit/deployment verification is recorded in the version manifest after publication.
