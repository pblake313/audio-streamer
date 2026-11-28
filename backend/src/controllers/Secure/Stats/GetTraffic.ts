import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../errors/AppError";
import { getTraffic } from "../../../helpers/Statistics/traffic";

/*
    GET /secure/stats/traffic : behind secureMiddleWare, so only a logged-in
    user can see the traffic.

        ?from=2026-11-01&to=2026-11-27   any range (UTC days, both included)
        ?days=30                         the last N days, today included

    Ranges are capped at a year to keep reads small; no dates means the last 30 days.
*/
const MAX_DAYS = 366;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ONE_DAY = 24 * 60 * 60 * 1000;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const isRealDay = (text: unknown): text is string =>
    typeof text === "string" && DAY.test(text) && isoDay(Date.parse(`${text}T00:00:00Z`) || 0) === text;

export async function getTrafficStats(req: Request, res: Response, next: NextFunction) {
    try {
        const today = isoDay(Date.now());
        let from: string;
        let to: string;

        if (req.query.from !== undefined || req.query.to !== undefined) {
            if (!isRealDay(req.query.from) || !isRealDay(req.query.to)) {
                throw new AppError(400, "Pick a start and end date.");
            }
            from = req.query.from;
            to = req.query.to > today ? today : req.query.to; // nothing to show past today
            if (from > to) throw new AppError(400, "The start date is after the end date.");
            const span = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / ONE_DAY + 1;
            if (span > MAX_DAYS) throw new AppError(400, "Pick a range of a year or less.");
        } else {
            const asked = Number(req.query.days);
            const days = Number.isInteger(asked) && asked >= 1 && asked <= MAX_DAYS ? asked : 30;
            to = today;
            from = isoDay(Date.now() - (days - 1) * ONE_DAY);
        }

        res.status(200).send({ from, to, ...(await getTraffic(from, to)) });
    } catch (error) {
        next(error);
    }
}
