import { NextFunction, Request, Response } from "express";
import admin from "firebase-admin";
import { getBeatById } from "../../../helpers/GetBeatById";
import {
    uploadBeatArtwork,
    uploadBeatMp3,
} from "../../../helpers/BeatFileUploads";
import { Beat, TrackType } from "../../../types/Beat";
import { signFirestoreUrl } from "../../../helpers/SignFirestoreUrl";

type EditBeatFiles = {
    newArtwork?: Express.Multer.File[];
    newMp3File?: Express.Multer.File[];
};

type EditableBeatFields = Pick<
    Beat,
    | "beatTitle"
    | "bpm"
    | "key"
    | "mode"
    | "trackType"
    | "tagOne"
    | "tagTwo"
    | "customTag"
    | "customTagColor"
    | "mood"
>;

type BeatUpdateFields = EditableBeatFields &
    Pick<Beat, "artworkUrl" | "mp3Url">;

export async function editBeat(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const beatId = req.params.beatId;

        if (!beatId ) {
            throw new Error("Missing beat ID.");
        }

        // Validate incoming form fields.
        const validEditBeatRequest = createValidEditBeatObject(
            req.body,
        );

        const files = req.files as EditBeatFiles | undefined;

        const newArtwork =
            files?.newArtwork?.[0] ?? null;

        const newMp3File =
            files?.newMp3File?.[0] ?? null;

        // Throws if the beat does not exist.
        const originalBeat = await getBeatById(beatId);

        // Preserve the existing URLs unless a new file is uploaded.
        const beatUpdate: BeatUpdateFields = {
            ...validEditBeatRequest,
            artworkUrl: originalBeat.artworkUrl,
            mp3Url: originalBeat.mp3Url,
        };

        if (newArtwork) {

            console.log('new artwork joint.')
            if (newArtwork.size > 5 * 1024 * 1024) {
                throw new Error(
                    "Artwork file is too large. Please upload a file under 5 MB.",
                );
            }

            beatUpdate.artworkUrl =
                await uploadBeatArtwork({
                    file: newArtwork,
                    beatId,
                });
        }

        if (newMp3File) {
            if (newMp3File.size > 10 * 1024 * 1024) {
                throw new Error(
                    "MP3 file is too large. Please upload a file under 10 MB.",
                );
            }

            beatUpdate.mp3Url = await uploadBeatMp3({
                file: newMp3File,
                beatId,
            });
        }

        const updatedAt = new Date();

        await admin
            .firestore()
            .collection("Beats")
            .doc(beatId)
            .update({
                ...beatUpdate,
                updatedAt,
            });

        const updatedBeat: Beat = {
            ...originalBeat,
            ...beatUpdate,
            updatedAt,
        };

        updatedBeat.mp3Url = await signFirestoreUrl(updatedBeat.mp3Url, 0, 1)

        return res.status(200).send({updatedBeat});
    } catch (error: any) {
        next(error);
    }
}

const validKeys: Beat["key"][] = [
    "C",
    "G",
    "D",
    "A",
    "E",
    "B",
    "F♯",
    "C♯",
    "F",
    "B♭",
    "E♭",
    "A♭",
];

const validModes: Beat["mode"][] = [
    "Major",
    "Minor",
    "Harmonic Minor",
    "Melodic Minor",
    "Dorian",
    "Phrygian",
    "Lydian",
    "Mixolydian",
    "Locrian",
];

const validTrackTypes: TrackType[] = [
    "Beat",
    "Reference",
];

function optionalString(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmedValue = value.trim();

    return trimmedValue || null;
}

export function createValidEditBeatObject(
    obj: Record<string, unknown>,
): EditableBeatFields {
    const beatTitle =
        typeof obj.beatTitle === "string"
            ? obj.beatTitle.trim()
            : "";

    if (!beatTitle) {
        throw new Error("Track title is required.");
    }

    if (
        typeof obj.trackType !== "string" ||
        !validTrackTypes.includes(
            obj.trackType as TrackType,
        )
    ) {
        throw new Error("Invalid track type.");
    }

    // BPM, key, and mode are required for beats, optional for references.
    const musicalInfoRequired = obj.trackType === "Beat";

    const rawBpm = optionalString(String(obj.bpm ?? ""));
    let bpm: number | null = null;

    if (rawBpm !== null || musicalInfoRequired) {
        bpm = Number(rawBpm);

        if (!Number.isFinite(bpm) || bpm <= 0) {
            throw new Error(
                "BPM must be a valid number greater than zero.",
            );
        }
    }

    const key = optionalString(obj.key);

    if (
        (key !== null || musicalInfoRequired) &&
        !validKeys.includes(key as Beat["key"])
    ) {
        throw new Error("Invalid track key.");
    }

    const mode = optionalString(obj.mode);

    if (
        (mode !== null || musicalInfoRequired) &&
        !validModes.includes(mode as Beat["mode"])
    ) {
        throw new Error("Invalid track mode.");
    }


    const customTag = optionalString(obj.customTag);
    let customTagColor = optionalString(obj.customTagColor);

    if (customTagColor) {
        // Remove a leading # if one was sent.
        customTagColor = customTagColor.replace(/^#/, "");

        if (!/^[0-9a-fA-F]{6}$/.test(customTagColor)) {
            throw new Error("Invalid custom tag color.");
        }

        customTagColor = customTagColor.toLowerCase();
    }
    return {
        beatTitle,
        bpm,
        key: key as Beat["key"],
        mode: mode as Beat["mode"],
        trackType: obj.trackType as TrackType,
        tagOne: optionalString(obj.tagOne),
        tagTwo: optionalString(obj.tagTwo),
        customTag,
        customTagColor: customTag
            ? customTagColor
            : null,
        mood: optionalString(obj.mood),
    };
}