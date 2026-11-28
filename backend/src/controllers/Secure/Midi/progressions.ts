import { NextFunction, Request, Response } from "express";
import * as admin from "firebase-admin";

import { AppError } from "../../../errors/AppError";
import { artistKeyOf, validateProgression, validateProgressionEdit } from "../../../validators/ProgressionValidator";

// Saved chord progressions for the Chord Builder's "Inspired by" menu.
// All of these live under /secure, so secureMiddleWare has already checked the
// user is logged in before any database read or write happens.

const db = admin.firestore();
const COLLECTION = "ChordProgressions";
const MAX_RESULTS = 300;

/** POST /secure/midi/progressions: store an imported progression under an artist. */
export async function saveProgression(req: Request, res: Response, next: NextFunction) {
    try {
        const result = validateProgression(req.body);
        if ("error" in result) throw new AppError(400, result.error);

        const doc = await db.collection(COLLECTION).add({
            ...result.progression,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(201).send({
            message: "Progression saved.",
            progression: { ...result.progression, id: doc.id },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /secure/midi/progressions            every saved progression
 * GET /secure/midi/progressions?artist=x   only that artist's (by name or slug)
 */
export async function listProgressions(req: Request, res: Response, next: NextFunction) {
    try {
        const artist = typeof req.query.artist === "string" ? artistKeyOf(req.query.artist) : "";

        let query: admin.firestore.Query = db.collection(COLLECTION);
        if (artist) query = query.where("artistKey", "==", artist);

        // sorted here rather than in Firestore, so no composite index is needed
        const snapshot = await query.limit(MAX_RESULTS).get();
        const progressions = snapshot.docs
            .map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    artist: data.artist,
                    artistKey: data.artistKey,
                    song: data.song,
                    keyRoot: data.keyRoot,
                    scale: data.scale,
                    bpm: data.bpm,
                    chords: data.chords,
                    sourceFile: data.sourceFile ?? null,
                    createdAt: data.createdAt?.toMillis?.() ?? 0,
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).send({ message: "Progressions fetched.", progressions });
    } catch (error) {
        next(error);
    }
}

/** PATCH /secure/midi/progressions/:id: rename the song and/or change its artist. */
export async function editProgression(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (!id || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new AppError(400, "Invalid progression id.");

        const result = validateProgressionEdit(req.body);
        if ("error" in result) throw new AppError(400, result.error);

        const ref = db.collection(COLLECTION).doc(id);
        const snapshot = await ref.get();
        if (!snapshot.exists) throw new AppError(404, "Progression not found.");

        await ref.update(result.changes);
        res.status(200).send({ message: "Progression updated.", id, changes: result.changes });
    } catch (error) {
        next(error);
    }
}

/** DELETE /secure/midi/progressions/:id */
export async function deleteProgression(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (!id || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new AppError(400, "Invalid progression id.");

        const ref = db.collection(COLLECTION).doc(id);
        const snapshot = await ref.get();
        if (!snapshot.exists) throw new AppError(404, "Progression not found.");

        await ref.delete();
        res.status(200).send({ message: "Progression deleted.", id });
    } catch (error) {
        next(error);
    }
}
