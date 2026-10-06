/** Email callbacks use the public site, even when signup starts on a local preview. */
export function authRedirectUrl(siteUrl = import.meta.env.VITE_SITE_URL, currentOrigin = location.origin): string {
  const configured = siteUrl?.trim();
  if (!configured) return new URL('/', currentOrigin).href;
  const site = new URL(configured);
  if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash) {
    throw new Error('The account email return address is not configured correctly. Please contact support.');
  }
  return new URL('/', site.origin).href;
}
