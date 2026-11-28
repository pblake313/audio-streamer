import { get } from "svelte/store";
import { autoLoginAttempted } from "./Auth/authFunctions";
import { user } from "../stores/UserStore";

/*
    Counts one page view for the portal's Traffic page (POST /public/track).

    - Anonymous: a random id kept in localStorage tells "same visitor" apart
      from "new visitor". No cookies, no personal data.
    - The first page of a tab session is a "visit", and only it reports where
      the visitor came from (document.referrer doesn't change on in-app links).
    - Your own browsing doesn't count: nothing is sent while logged in, and
      private pages (/portal, /login) are skipped.
    - Fire-and-forget: tracking never blocks or breaks the page.
*/
const backendLink = import.meta.env.VITE_BACKEND_URL;
const SKIP = /^\/(portal|login|maintenance)(\/|$)/;

const VISITOR_KEY = "as_visitor";
const VISIT_KEY = "as_visit";

function visitorId() {
    try {
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(VISITOR_KEY, id);
        }
        return id;
    } catch {
        return crypto.randomUUID(); // storage blocked: still counts, just not as a returning visitor
    }
}

function startsVisit() {
    try {
        if (sessionStorage.getItem(VISIT_KEY)) return false;
        sessionStorage.setItem(VISIT_KEY, "1");
        return true;
    } catch {
        return false;
    }
}

// the auto-login check decides whether this is you; wait for it
function loginChecked() {
    return new Promise<void>((resolve) => {
        if (get(autoLoginAttempted)) return resolve();
        const stop = autoLoginAttempted.subscribe((done) => {
            if (!done) return;
            queueMicrotask(() => stop());
            resolve();
        });
    });
}

export async function trackPageView(path: string) {
    if (!backendLink || SKIP.test(path) || !("randomUUID" in crypto)) return;

    await loginChecked();
    if (get(user)) return;

    const newVisit = startsVisit();
    try {
        await fetch(`${backendLink}/public/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "omit",
            keepalive: true,
            body: JSON.stringify({
                path,
                visitorId: visitorId(),
                newVisit,
                referrer: newVisit ? document.referrer : "",
            }),
        });
    } catch {
        // offline, blocked by an extension...: not worth bothering anyone about
    }
}
