import { SITE_URL } from "../../helpers/siteUrl";
import type { RequestHandler } from "./$types";

// https://www.robotstxt.org/robotstxt.html
// (was static/robots.txt; a route so the sitemap line uses the live site URL)
export const GET: RequestHandler = () =>
    new Response(`User-agent: *\nDisallow: /portal\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
