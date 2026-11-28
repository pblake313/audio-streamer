import { SITE_URL } from "../../helpers/siteUrl";
import { allTheoryPaths } from "../../helpers/Theory/seo";
import type { RequestHandler } from "./$types";

/*
    Every public page, for search engines: the home page, the chord builder,
    and each key and scale page of the theory section (built from the same
    data as the pages, so it never drifts). robots.txt points here.
*/
const STATIC_PAGES = ["/", "/chord-builder"];

export const GET: RequestHandler = () => {
    const urls = [...STATIC_PAGES, ...allTheoryPaths()]
        .map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`)
        .join("\n");

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

    return new Response(body, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
};
