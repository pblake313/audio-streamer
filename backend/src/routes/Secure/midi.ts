import { Router } from "express";

import { exportMidi } from "../../controllers/Secure/Midi/export-midi";

const router = Router();

// Base route: /secure/midi (protected by secureMiddleWare in secure.ts)

router.post("/export", exportMidi);

export default router;
