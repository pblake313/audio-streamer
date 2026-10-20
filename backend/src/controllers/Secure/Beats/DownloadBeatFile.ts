import { NextFunction, Request, Response } from "express";
import archiver from "archiver";
import { getStorage } from "firebase-admin/storage";
import { getBeatById } from "../../../helpers/GetBeatById";
import { getStoragePathFromUrl } from "../../../helpers/SignFirestoreUrl";
import { AppError } from "../../../errors/AppError";
import { Beat } from "../../../types/Beat";

type BeatFileKind = "artwork" | "mp3" | "wav" | "stems";

const fileInfo: Record<
    BeatFileKind,
    {
        label: string;
        extension: string;
        contentType: string;
        url: (beat: Beat) => string | null | undefined;
    }
> = {
    // artwork is converted to WebP on upload
    artwork: {
        label: "Artwork",
        extension: "webp",
        contentType: "image/webp",
        url: (beat) => beat.artworkUrl,
    },
    mp3: {
        label: "MP3",
        extension: "mp3",
        contentType: "audio/mpeg",
        url: (beat) => beat.mp3Url,
    },
    wav: {
        label: "WAV",
        extension: "wav",
        contentType: "audio/wav",
        url: (beat) => beat.wavUrl,
    },
    stems: {
        label: "Stems",
        extension: "zip",
        contentType: "application/zip",
        url: (beat) => beat.stemsUrl,
    },
};

// "My Beat: v2" -> "My Beat v2"; keeps the download name safe for headers and file systems
function safeFileName(name: string): string {
    return name
        .replace(/[\\/:*?"<>|\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "track";
}

// headers must be ASCII: plain fallback name, plus the full name encoded (e.g. "F♯")
function contentDisposition(downloadName: string): string {
    const asciiName = downloadName.replace(/[^\x20-\x7e]/g, "_");

    return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`;
}

// stems keep the name they were uploaded with; everything else is "<title>.<ext>"
function downloadNameFor(beat: Beat, kind: BeatFileKind): string {
    if (kind === "stems" && beat.stemsFileName) {
        return safeFileName(beat.stemsFileName);
    }

    return `${safeFileName(beat.beatTitle)}.${fileInfo[kind].extension}`;
}

/*
 * Streams one of a track's files back as a download, e.g.
 * GET /secure/beats/download-wav/:beatId. The files are private in
 * storage, so this route (behind the secure middleware) is the only
 * way to fetch them.
 */
export function downloadBeatFile(kind: BeatFileKind) {
    const info = fileInfo[kind];

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const beatId = req.params.beatId;

            if (!beatId) {
                throw new AppError(400, "Missing beat ID.");
            }

            // Throws if the beat does not exist.
            const beat = await getBeatById(beatId);

            const storedUrl = info.url(beat);

            if (!storedUrl) {
                throw new AppError(404, `This track has no ${info.label.toLowerCase()} file.`);
            }

            const storageFile = getStorage()
                .bucket()
                .file(getStoragePathFromUrl(storedUrl));

            const [fileExists] = await storageFile.exists();

            if (!fileExists) {
                throw new AppError(404, `${info.label} file was not found in storage.`);
            }

            const [metadata] = await storageFile.getMetadata();

            res.status(200);
            res.setHeader("Content-Type", metadata.contentType || info.contentType);
            res.setHeader(
                "Content-Disposition",
                contentDisposition(downloadNameFor(beat, kind)),
            );

            if (metadata.size) {
                res.setHeader("Content-Length", String(metadata.size));
            }

            const fileStream = storageFile.createReadStream();

            fileStream.on("error", (error) => {
                if (!res.headersSent) {
                    next(error);
                    return;
                }

                res.destroy(error);
            });

            fileStream.pipe(res);
        } catch (error) {
            next(error);
        }
    };
}

/*
 * Every file saved on a track (artwork, WAV, MP3, stems) in one zip:
 * GET /secure/beats/download-all/:beatId. Files are stored uncompressed
 * in the zip; audio, WebP, and the stems zip are already compressed,
 * so squeezing them again would only make the download slower.
 */
export async function downloadAllBeatFiles(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const beatId = req.params.beatId;

        if (!beatId) {
            throw new AppError(400, "Missing beat ID.");
        }

        // Throws if the beat does not exist.
        const beat = await getBeatById(beatId);

        const bucket = getStorage().bucket();
        const kinds: BeatFileKind[] = ["artwork", "wav", "mp3", "stems"];

        // only files the track has, and that are actually in storage
        const entries = [];

        for (const kind of kinds) {
            const storedUrl = fileInfo[kind].url(beat);
            if (!storedUrl) continue;

            const storageFile = bucket.file(getStoragePathFromUrl(storedUrl));
            const [fileExists] = await storageFile.exists();
            if (!fileExists) continue;

            entries.push({ storageFile, name: downloadNameFor(beat, kind) });
        }

        if (!entries.length) {
            throw new AppError(404, "This track has no files to download.");
        }

        res.status(200);
        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            contentDisposition(`${safeFileName(beat.beatTitle)}.zip`),
        );

        const archive = archiver("zip", { store: true });

        archive.on("error", (error) => {
            if (!res.headersSent) {
                next(error);
                return;
            }

            res.destroy(error);
        });

        archive.pipe(res);

        for (const entry of entries) {
            archive.append(entry.storageFile.createReadStream(), { name: entry.name });
        }

        await archive.finalize();
    } catch (error) {
        next(error);
    }
}
