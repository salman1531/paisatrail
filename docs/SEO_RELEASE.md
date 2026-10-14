# SEO foundation and supplied blog release — 14 October 2026

The SEO review was checked against raw production responses and the code. Robots.txt and the five-page sitemap were valid, the social image returned 200, unknown routes returned genuine 404, and private/demo/auth routes retained noindex. Those mechanisms are preserved.

## Changes

The homepage is prerendered from the same public React component used by browsers. Its complete product content, single H1, crawlable links and footer arrive in initial HTML. The public renderer never imports App or account/API state. Private shells retain their route titles, canonical addresses, noindex and loading content, without duplicate homepage content. Development fallback metadata now uses the original request path.

Home copy says Track expenses and describes a free expense tracker/budget planner for everyday life. The meta description is global; currencies are not presented as geographic restrictions. About has a distinct title/description. The guide typo is corrected, and expected-payment wording uses recorded-money totals.

The public entry loads Home directly; account/demo/legacy hash/email-callback routes dynamically load App with its existing protected flow. The build reduces initial homepage JavaScript from approximately 622 kB to 235 kB (uncompressed), rather than claiming a measured speed or ranking improvement. Export remains deferred; its existing large-chunk warning is unrelated to the first homepage load.

The three articles supplied by the user are in content/blog. No replacement articles were created. Blog hub, three clean URLs, mobile-readable paragraphs/tables, visible publication dates, breadcrumbs, related links, navigation/footer links, social metadata and BlogPosting/BreadcrumbList data are generated at build time. No invented personal author, credentials or update date is supplied. Public copy omits AI references as requested. Fictional examples stay identified in the supplied prose and table captions. One terminology edit changes available-money calculations to recorded-money totals; product workflow links were verified. The nine canonical public pages are in sitemap and the blog/articles are in llms.txt and llm.txt. No private or demo pages are added.

## Validation and limits

136 unit/database tests passed before the final copy-only refinement; targeted blog tests are rerun after it. Production HTML checks inspect the real build: initial body/links, metadata, 19 noindex private shells, all nine sitemap URLs, article JSON-LD/dates, local link destinations, guide anchors and LLM links. HTTP Playwright checks pass for initial HTML, private shells and blog pages. The browser-dependent Playwright test was attempted but installed Chrome aborted before assertions. Connected browser verification covers Home at four widths, the four blog pages at four widths, demo navigation and signed-out account redirect. Release output records final build and production checks after deployment.

Search Console opened the signed-out introduction, so URL Inspection, indexing status and sitemap submission are not claimed. PageSpeed API returned 429; no Lighthouse score or field Core Web Vitals were available. Google Analytics remains paused. No database/schema/permissions/authentication configuration or financial calculations change. Keep the existing unstaged index.html guide-link edit separate.
