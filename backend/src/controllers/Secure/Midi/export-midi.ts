import { NextFunction, Request, Response } from "express";

import { AppError } from "../../../errors/AppError";
import { buildMidiFile } from "../../../helpers/midiWriter";
import { validateMidiExport } from "../../../validators/MidiExportValidator";

/**
 * POST /secure/midi/export
 * Turns a chord progression from the Chord Builder into a .mid file.
 * Lives under /secure, so secureMiddleWare has already checked the
 * user's access token (and refreshed it if needed) before this runs.
 */
export async function exportMidi(req: Request, res: Response, next: NextFunction) {
    try {
        const result = validateMidiExport(req.body);

        if ("error" in result) {
            throw new AppError(400, result.error);
        }

        const file = buildMidiFile(result.song);

        const safeTitle = (result.song.title || "chord-progression")
            .replace(/[^\w\- ]+/g, "")
            .trim()
            .replace(/\s+/g, "-") || "chord-progression";

        res.status(200);
        res.setHeader("Content-Type", "audio/midi");
        res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mid"`);
        res.setHeader("Content-Length", file.length);
        res.send(file);
    } catch (error) {
        next(error);
    }
}
