import { NextFunction, Request, Response } from "express";
import { recordPageView, type DeviceType } from "../../helpers/Statistics/traffic";

/*
    POST /public/track: one page view from the site.

        { path: "/theory/d-minor", visitorId: "<uuid>", newVisit: true, referrer: "https://www.google.com/" }

    Public on purpose (visitors aren't logged in), so everything is checked and
    anything odd is quietly dropped: the reply is always 204 and never says why,
    there's nothing to learn by poking at it. Bots and private pages aren't counted.
*/

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|monitor|curl|wget|python|axios/i;
// private or not-a-page paths: never counted
const SKIP = /^\/(portal|login|maintenance|api)(\/|$)/;

// our own hosts (from ALLOWED_ORIGINS), so moving around the site isn't a "referrer"
const OWN_HOSTS = new Set(
    (process.env.ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((origin) => hostOf(origin.trim()))
        .filter(Boolean),
);

function hostOf(url: string) {
    try {
        return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
        return "";
    }
}

function cleanPath(raw: unknown) {
    if (typeof raw !== "string" || !raw.startsWith("/") || raw.length > 200) return null;
    let path = raw.split(/[?#]/)[0].toLowerCase();
    if (path.length > 1) path = path.replace(/\/+$/, "");
    // letters, numbers and - _ / only (keeps Firestore map keys tidy)
    if (!/^\/[a-z0-9\-_/]*$/.test(path) || SKIP.test(path)) return null;
    return path;
}

function cleanReferrer(raw: unknown) {
    const host = typeof raw === "string" && raw ? hostOf(raw) : "";
    if (!host || OWN_HOSTS.has(host) || host === "localhost") return "Direct";
    return host.replace(/[^a-z0-9.\-]/g, "").slice(0, 80) || "Direct";
}

function deviceOf(userAgent: string): DeviceType {
    if (/ipad|tablet|kindle|silk|playbook/i.test(userAgent) || (/android/i.test(userAgent) && !/mobi/i.test(userAgent))) {
        return "tablet";
    }
    return /mobi|iphone|ipod|android/i.test(userAgent) ? "mobile" : "desktop";
}

export async function trackPageView(req: Request, res: Response, next: NextFunction) {
    try {
        const userAgent = req.header("user-agent") ?? "";
        const path = cleanPath(req.body?.path);
        const visitorId = req.body?.visitorId;

        if (!path || typeof visitorId !== "string" || !UUID.test(visitorId) || !userAgent || BOTS.test(userAgent)) {
            return res.status(204).end();
        }

        await recordPageView({
            path,
            visitorId: visitorId.toLowerCase(),
            newVisit: req.body?.newVisit === true,
            referrer: cleanReferrer(req.body?.referrer),
            device: deviceOf(userAgent),
        });

        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}
