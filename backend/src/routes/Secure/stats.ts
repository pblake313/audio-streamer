import { Router } from "express";

import { getTrafficStats } from "../../controllers/Secure/Stats/GetTraffic";

const router = Router();

// Base route: /secure/stats. Behind secureMiddleWare (see secure.ts), so only
// logged-in users can see the site's traffic.

router.get("/traffic", getTrafficStats); // ?from=YYYY-MM-DD&to=YYYY-MM-DD, or ?days=N

export default router;
