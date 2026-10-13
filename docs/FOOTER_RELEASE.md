# Landing page and navigation — 13 October 2026

PaisaTrace uses https://paisatrace.hirubix.com. A forest-green landing hero, lime account action, visible demo action and linked feature cards replace the plain introduction. Feature links lead to the corresponding isolated demo pages.

SiteFooter shares public link groups with generated About, Guide, Privacy and Terms pages through scripts/site-footer.mjs. Explore, Account, Help and Legal include support when a valid public contact is configured. The Powered by Rubix Labs link retains https://www.hirubix.com/. Authentication uses a collapsed Help & information footer to keep fields visible; opening it reveals the same links.

The phone/tablet page-header account menu provides Settings, Categories, User guide and Sign out (Exit demo in the sample workspace). It uses the existing sign-out function, disables the action during saving, closes on navigation and supports Escape. Desktop sidebar sign-out and Settings sign-out remain available. No account, financial, database or provider permissions changed.

Public generation refreshes clean-route navigation, guide instructions and both LLM files. The sitemap retains exactly five indexable public routes; private, authentication and demo pages remain excluded. Privacy/terms data practices are unchanged; only their shared footer changed. About no longer advertises an obsolete twelve-month chart.

Validation: 127 unit/database tests and TypeScript passed. Connected browser checked the landing at six widths, all seven workspace pages at six widths including open phone/tablet menu bounds, and four public documents at six widths. No horizontal document overflow or off-screen menus remained. Sign-in document height matched the viewport at 1366×768, 1024×768, 768×700, 768×1024 and 390×844. Compact footer links opened; mobile Exit demo returned to /login. Real-account sign-out was not exercised. Playwright was attempted but Chrome SIGABRT prevented assertions; added UI regressions are not claimed as passing. Physical-phone keyboard and assistive-technology testing remain separate.

The existing uncommitted index.html edit is excluded. Deployment and production readbacks are recorded in the workspace release output after publication.
