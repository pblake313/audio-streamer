import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { trackPageView } from "../../controllers/Public/TrackPageView";

const router = Router();

// Base route: /public. No login needed: these are for every visitor.

// one page view per navigation; generous for a real visitor, tight for a script
const trackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 150,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    handler: (req, res) => res.status(204).end(), // drop quietly, like any other bad track
});

router.post("/track", trackLimiter, trackPageView);

export default router;
