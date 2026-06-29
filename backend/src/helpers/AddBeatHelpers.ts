// src/validators/validateAddBeatRequest.ts
import type { Request } from "express";
import { AppError } from "../errors/AppError";
import type { Beat, FutureDestination, TrackType } from "../types/Beat";
import { isValidBpm } from "../validators/BpmValidator";

export type ValidatedAddBeatRequest = Omit<
    Beat,
    "id" | "createdAt" | "updatedAt" | "artworkUrl" | "mp3Url"
>;

const validTrackTypes: TrackType[] = ["Beat", "Reference"];

const validFutureDestinations: FutureDestination[] = [
    "Soundcloud",
    "Youtube",
    "Pattsway",
];

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

const validRatings: Beat["rating"][] = [0, 1, 2, 3, 4, 5];

function cleanString(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();

    return trimmed.length ? trimmed : null;
}

function requiredString(value: unknown, fieldName: string): string {
    const cleaned = cleanString(value);

    if (!cleaned) {
        throw new AppError(400, `Invalid Request: Missing ${fieldName}.`);
    }

    return cleaned;
}

function parseBpm(value: unknown): number {
    const bpm = Number(value);

    if (!Number.isFinite(bpm)) {
        throw new AppError(400, "Invalid Request: BPM must be a number.");
    }

    if (!isValidBpm(bpm)) {
        throw new AppError(400, "Invalid Request: Invalid BPM.");
    }

    return bpm;
}

function parseTrackType(value: unknown): TrackType {
    if (!validTrackTypes.includes(value as TrackType)) {
        throw new AppError(400, "Invalid Request: Invalid track type.");
    }

    return value as TrackType;
}

function parseKey(value: unknown): Beat["key"] {
    const key = requiredString(value, "Key");

    const normalizedKey = key.replace("#", "♯").replace("b", "♭");

    if (!validKeys.includes(normalizedKey as Beat["key"])) {
        throw new AppError(400, "Invalid Request: Invalid key.");
    }

    return normalizedKey as Beat["key"];
}

function parseMode(value: unknown): Beat["mode"] {
    const mode = requiredString(value, "Mode");

    if (!validModes.includes(mode as Beat["mode"])) {
        throw new AppError(400, "Invalid Request: Invalid mode.");
    }

    return mode as Beat["mode"];
}

function parseRating(value: unknown): Beat["rating"] {
    if (value === undefined || value === null || value === "") {
        return 0;
    }

    const rating = Number(value);

    if (!Number.isInteger(rating)) {
        throw new AppError(400, "Invalid Request: Rating must be a number.");
    }

    if (!validRatings.includes(rating as Beat["rating"])) {
        throw new AppError(
            400,
            "Invalid Request: Rating must be between 0 and 5."
        );
    }

    return rating as Beat["rating"];
}

function parseFutureDestinations(value: unknown): FutureDestination[] {
    if (!value) return [];

    let destinations: string[] = [];

    if (Array.isArray(value)) {
        destinations = value
            .map((item) => cleanString(item))
            .filter((item): item is string => Boolean(item));
    }

    if (typeof value === "string") {
        const cleaned = cleanString(value);

        if (!cleaned) return [];

        try {
            const parsed = JSON.parse(cleaned);

            if (Array.isArray(parsed)) {
                destinations = parsed
                    .map((item) => cleanString(item))
                    .filter((item): item is string => Boolean(item));
            }
        } catch {
            destinations = cleaned
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
    }

    const invalidDestination = destinations.find(
        (destination) =>
            !validFutureDestinations.includes(destination as FutureDestination)
    );

    if (invalidDestination) {
        throw new AppError(
            400,
            `Invalid Request: Invalid future destination "${invalidDestination}".`
        );
    }

    return destinations as FutureDestination[];
}

function parseCustomTagColor(value: unknown): string | null {
    const color = cleanString(value);

    if (!color) return null;

    const normalizedColor = color.replace("#", "");

    if (!/^[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
        throw new AppError(
            400,
            "Invalid Request: Custom tag color must be a valid hex color."
        );
    }

    return normalizedColor;
}

export function validateAddBeatRequest(req: Request): ValidatedAddBeatRequest {
    const body = req.body;

    const validObject: ValidatedAddBeatRequest = {
        beatTitle: requiredString(body.title, "Title"),
        tagOne: cleanString(body.tagOne),
        tagTwo: cleanString(body.tagTwo),
        mood: cleanString(body.mood),
        bpm: parseBpm(body.bpm),
        key: parseKey(body.key),
        mode: parseMode(body.mode),
        trackType: parseTrackType(body.trackType),
        customTag: cleanString(body.customTag),
        customTagColor: parseCustomTagColor(body.customTagColor),
        futureDestinations: parseFutureDestinations(body.futureDestinations),
        rating: parseRating(body.rating),
        notepad: cleanString(body.notepad),
    };

    return validObject;
}