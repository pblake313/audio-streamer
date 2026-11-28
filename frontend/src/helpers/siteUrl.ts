/**
 * The live site's origin, with no trailing slash. Link previews, canonical
 * links and the sitemap all need absolute URLs, so they're built from
 * VITE_FRONTEND_URL; set it to the live site URL before building for production.
 */
export const SITE_URL = (import.meta.env.VITE_FRONTEND_URL || "https://demo.pattsway.com").replace(/\/+$/, "");
