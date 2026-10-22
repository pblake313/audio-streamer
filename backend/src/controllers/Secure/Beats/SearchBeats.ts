import { NextFunction, Request, Response } from "express";
import * as admin from "firebase-admin";
import { Beat } from "../../../types/Beat";
import { AppError } from "../../../errors/AppError";
import { signBeatAudioUrls } from "../../../helpers/SignFirestoreUrl";

const db = admin.firestore();

const MAX_RESULTS = 50;

/*
 * Lowercase, accents dropped (é -> e), apostrophes / backticks / quotes
 * removed ("Pi`erre" -> "pierre"), any other punctuation becomes a space.
 * The query and the track text go through the same steps, so they line up.
 * (Keep in sync with the frontend's copy in BeatsStore.)
 */
export function normalizeSearchText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/['‘’`´"“”]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

// the text a track can be found by
export function beatSearchText(beat: Beat): string {
    return normalizeSearchText(
        [
            beat.beatTitle,
            beat.tagOne,
            beat.tagTwo,
            beat.customTag,
            beat.mood,
            beat.trackType,
            beat.key,
            beat.mode,
        ]
            .filter(Boolean)
            .join(" "),
    );
}

// every query word appears in the track text (also checked with spaces
// removed, so "pierrebourne" or "uzivert" still match)
function matchesQuery(beat: Beat, words: string[]): boolean {
    const text = beatSearchText(beat);
    const squashed = text.replace(/ /g, "");

    return words.every((word) => text.includes(word) || squashed.includes(word));
}

function toMillis(value: unknown): number {
    const date = value as any;

    if (!date) return 0;
    if (typeof date.toMillis === "function") return date.toMillis();
    if (date instanceof Date) return date.getTime();

    return new Date(date).getTime() || 0;
}

/*
 * GET /secure/beats/search?q=midnight trap
 *
 * Firestore has no text search, so this reads the whole collection and
 * matches in memory: every word in the query has to appear somewhere in
 * the title, artist tags, custom tag, mood, type, key, or mode. Fine for a
 * personal library; results come back most recently updated first.
 */
export async function searchBeats(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const rawQuery = String(req.query.q ?? "");

        if (rawQuery.length > 100) {
            throw new AppError(400, "Search is too long.");
        }

        const query = normalizeSearchText(rawQuery);

        if (!query) {
            return res.status(200).send({ beats: [], hasMore: false });
        }

        const words = query.split(" ");

        const snapshot = await db.collection("Beats").get();

        const matches = snapshot.docs
            .map((doc) => ({ ...(doc.data() as Beat), id: doc.id }))
            .filter((beat) => matchesQuery(beat, words))
            .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));

        const beats = await Promise.all(
            matches.slice(0, MAX_RESULTS).map((beat) => signBeatAudioUrls(beat)),
        );

        return res.status(200).send({
            beats,
            hasMore: matches.length > MAX_RESULTS,
        });
    } catch (error) {
        next(error);
    }
}
