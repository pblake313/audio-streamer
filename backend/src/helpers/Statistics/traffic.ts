import * as admin from "firebase-admin";

/*
    Simple site traffic, in the spirit of pattsway's daily active devices.

    One Firestore doc per day (UTC) holds that day's totals, so the dashboard
    reads at most ~90 small docs:

        Statistics/traffic/days/{YYYY-MM-DD}
            views       page views
            visitors    unique visitors that day (one per browser per day)
            visits      sessions (a visit = one browser tab session)
            pages       { "/theory/d-minor": 12, ... }   views per page
            referrers   { "google.com": 4, "Direct": 9 } where visits came from
            devices     { mobile, tablet, desktop }      visits per device type

        Statistics/traffic/visitors/{visitorId_day}
            marks a visitor as counted for a day (so they count once)

    The visitor id is a random UUID the browser makes and keeps in
    localStorage: no cookies, no IP, nothing that identifies a person.
*/

const db = admin.firestore();
const TRAFFIC = db.collection("Statistics").doc("traffic");
const DAYS = TRAFFIC.collection("days");
const VISITORS = TRAFFIC.collection("visitors");

export type DeviceType = "mobile" | "tablet" | "desktop";

export type PageView = {
    path: string;
    visitorId: string;
    /** first page of a browser session: counts a visit, its referrer and device */
    newVisit: boolean;
    referrer: string; // a hostname, or "Direct"
    device: DeviceType;
};

const today = () => new Date().toISOString().slice(0, 10);
const { increment, serverTimestamp } = admin.firestore.FieldValue;

export async function recordPageView(view: PageView) {
    const day = today();
    const dayRef = DAYS.doc(day);
    const visitorRef = VISITORS.doc(`${view.visitorId}_${day}`);

    await db.runTransaction(async (tx) => {
        const seen = await tx.get(visitorRef);
        const firstToday = !seen.exists;

        if (firstToday) {
            tx.set(visitorRef, {
                day,
                createdAt: serverTimestamp(),
                // for an optional Firestore TTL policy on this field: these
                // markers are only needed for the day they're about
                expireAt: admin.firestore.Timestamp.fromMillis(Date.now() + 1000 * 60 * 60 * 48),
            });
        }

        // set + merge with nested objects keeps "/" and "." in page paths as plain map keys
        const update: Record<string, any> = {
            day,
            updatedAt: serverTimestamp(),
            views: increment(1),
            pages: { [view.path]: increment(1) },
        };
        if (firstToday) update.visitors = increment(1);
        if (view.newVisit) {
            update.visits = increment(1);
            update.referrers = { [view.referrer]: increment(1) };
            update.devices = { [view.device]: increment(1) };
        }

        tx.set(dayRef, update, { merge: true });
    });
}

type Counts = Record<string, number>;

const addInto = (total: Counts, more: Counts | undefined) => {
    for (const [name, n] of Object.entries(more ?? {})) total[name] = (total[name] ?? 0) + (Number(n) || 0);
};

const top = (counts: Counts, limit: number) =>
    Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

/** Every day from `from` to `to` (YYYY-MM-DD, UTC, both included). */
function daysBetween(from: string, to: string) {
    const list: string[] = [];
    const d = new Date(`${from}T00:00:00Z`);
    const end = new Date(`${to}T00:00:00Z`).getTime();
    while (d.getTime() <= end) {
        list.push(d.toISOString().slice(0, 10));
        d.setUTCDate(d.getUTCDate() + 1);
    }
    return list;
}

/** Traffic from `from` to `to` (both included), every day present even with no traffic. */
export async function getTraffic(from: string, to: string) {
    const dayList = daysBetween(from, to);

    const id = admin.firestore.FieldPath.documentId();
    const snap = await DAYS.where(id, ">=", from).where(id, "<=", to).get();
    const byDay = new Map(snap.docs.map((doc) => [doc.id, doc.data()]));

    const pages: Counts = {};
    const referrers: Counts = {};
    const devices: Counts = { desktop: 0, mobile: 0, tablet: 0 };

    const series = dayList.map((day) => {
        const data = byDay.get(day) ?? {};
        addInto(pages, data.pages);
        addInto(referrers, data.referrers);
        addInto(devices, data.devices);
        return {
            day,
            views: Number(data.views) || 0,
            visitors: Number(data.visitors) || 0,
            visits: Number(data.visits) || 0,
        };
    });

    const sum = (field: "views" | "visitors" | "visits") => series.reduce((n, d) => n + d[field], 0);

    return {
        days: series,
        totals: { views: sum("views"), visitors: sum("visitors"), visits: sum("visits") },
        pages: top(pages, 15),
        referrers: top(referrers, 10),
        devices: top(devices, 3),
    };
}
