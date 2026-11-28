import { Router } from "express";

import { exportMidi } from "../../controllers/Secure/Midi/export-midi";
import {
    deleteProgression,
    editProgression,
    listProgressions,
    saveProgression,
} from "../../controllers/Secure/Midi/progressions";

const router = Router();

// Base route: /secure/midi. Everything here is behind secureMiddleWare (see
// secure.ts), so only logged-in users can export, store or fetch progressions.

router.post("/export", exportMidi);

// saved progressions for the Chord Builder's "Inspired by" menu
router.get("/progressions", listProgressions); // ?artist=<name> to filter
router.post("/progressions", saveProgression);
router.patch("/progressions/:id", editProgression); // rename / change artist
router.delete("/progressions/:id", deleteProgression);

export default router;
