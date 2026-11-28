import { error, redirect } from "@sveltejs/kit";
import { parseKey } from "../../../../helpers/Theory/keys";
import { hasScaleKind, parseScaleKind } from "../../../../helpers/Theory/scales";
import { DEFAULT_KEY, theoryPath } from "../../../../helpers/Theory/urls";
import type { PageLoad } from "./$types";

/*
    /theory, /theory/d-minor and /theory/d-minor/blues are all this one page.

    Every page has exactly one address, so search engines see one page per key
    and scale, never duplicates: other spellings ("Dm", "D minor"), the old
    ?key=&scale= links, and a scale the key type doesn't have (Dorian on a
    major key) all redirect (301) to the canonical path. ?position= and the
    #section ride along.
*/
export const load: PageLoad = ({ params, url }) => {
    const search = new URLSearchParams(url.searchParams);

    // the old query-string links: /theory?key=d-minor&scale=blues
    const legacyKey = search.get("key");
    const legacyScale = search.get("scale");
    search.delete("key");
    search.delete("scale");

    const keyText = params.key ?? legacyKey;
    const scaleText = params.scale ?? legacyScale;

    const key = keyText ? parseKey(keyText) : DEFAULT_KEY;
    if (!key) error(404, "That key isn't on the circle of fifths");

    let scale = scaleText ? parseScaleKind(scaleText) : null;
    if (scaleText && !scale) error(404, "We don't have that scale yet");
    if (scale && !hasScaleKind(key.mode, scale)) scale = null; // Dorian on a major key -> the key page

    const path = theoryPath(key, scale);
    const query = search.toString();
    if (url.pathname !== path || legacyKey || legacyScale) {
        redirect(301, `${path}${query ? `?${query}` : ""}`);
    }

    return { key, scale };
};
