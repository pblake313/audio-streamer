import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { NextFunction, Request, Response } from "express";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import ffmpegPath from "ffmpeg-static";
import { ConvertedFileDoc } from "../../../types/ConvertedFiles";

export async function wavToMp3(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const socketId =
            typeof req.body.socketId === "string"
                ? req.body.socketId
                : undefined;

        const files = req.files as Express.Multer.File[] | undefined;

        if (!files?.length) {
            throw new Error("No files sent.");
        }

        const convertedFiles: ConvertedFileDoc[] = [];

        for (const file of files) {
            validateWavFile(file);

            console.log(`Converting ${file.originalname}...`);

            const storedFile = await convertWavToMp3AndStore(
                file,
                socketId
            );

            convertedFiles.push(storedFile);

            console.log(`Stored ${storedFile.storagePath}`);
        }

        return res.status(201).json({
            message: `${convertedFiles.length} file(s) converted successfully.`,
            files: convertedFiles,
        });
    } catch (error) {
        next(error);
    }
}

async function convertWavToMp3AndStore(
    file: Express.Multer.File,
    clientId?: string
): Promise<ConvertedFileDoc> {
    const mp3Buffer = await convertWavBufferToMp3(file.buffer);

    const id = randomUUID();

    const baseFilename =
        sanitizeFilename(path.parse(file.originalname).name) ||
        "converted-audio";

    const mp3Filename = await getUniqueMp3Filename(baseFilename);

    const storagePath = `WavConversions/${id}/${mp3Filename}`;

    const bucket = getStorage().bucket();
    const storageFile = bucket.file(storagePath);

    const createdAt = Timestamp.now();

    const expiresAt = Timestamp.fromMillis(
        createdAt.toMillis() + 336 * 60 * 60 * 1000
    );

    await storageFile.save(mp3Buffer, {
        resumable: false,
        metadata: {
            contentType: "audio/mpeg",
            cacheControl: "private, no-store, max-age=0",
        },
    });

    const storedMp3: ConvertedFileDoc = {
        id,
        clientId: clientId ?? null,
        createdAt,
        expiresAt,
        filename: mp3Filename,
        mp3Bytes: mp3Buffer.length,
        originalBytes: file.size,
        originalMime: file.mimetype,
        originalName: file.originalname,
        storagePath,
    };

    await getFirestore()
        .collection("WavConversions")
        .doc(id)
        .set(storedMp3);

    return storedMp3;
}


async function getUniqueMp3Filename(
    baseFilename: string
): Promise<string> {
    const conversions = getFirestore().collection("WavConversions");

    let duplicateNumber = 0;

    while (true) {
        const filename =
            duplicateNumber === 0
                ? `${baseFilename}.mp3`
                : `${baseFilename} (${duplicateNumber}).mp3`;

        const existingFile = await conversions
            .where("filename", "==", filename)
            .limit(1)
            .get();

        if (existingFile.empty) {
            return filename;
        }

        duplicateNumber++;
    }
}

function convertWavBufferToMp3(
    wavBuffer: Buffer
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        if (!ffmpegPath) {
            reject(
                new Error("FFmpeg executable could not be found.")
            );

            return;
        }

        const ffmpeg = spawn(
            ffmpegPath,
            [
                "-hide_banner",
                "-loglevel",
                "error",

                "-f",
                "wav",
                "-i",
                "pipe:0",

                "-map",
                "0:a:0",

                "-vn",

                "-codec:a",
                "libmp3lame",
                "-b:a",
                "320k",

                "-f",
                "mp3",
                "pipe:1",
            ],
            {
                windowsHide: true,
            }
        );

        const outputChunks: Buffer[] = [];

        let ffmpegError = "";
        let settled = false;

        function rejectOnce(error: Error) {
            if (settled) {
                return;
            }

            settled = true;
            reject(error);
        }

        ffmpeg.stdout.on("data", (chunk: Buffer) => {
            outputChunks.push(Buffer.from(chunk));
        });

        ffmpeg.stderr.setEncoding("utf8");

        ffmpeg.stderr.on("data", (chunk: string) => {
            ffmpegError += chunk;
        });

        ffmpeg.on("error", (error) => {
            rejectOnce(
                new Error(
                    `Could not start FFmpeg: ${error.message}`
                )
            );
        });

        ffmpeg.stdin.on(
            "error",
            (error: NodeJS.ErrnoException) => {
                if (error.code !== "EPIPE") {
                    rejectOnce(
                        new Error(
                            `Could not send WAV data to FFmpeg: ${error.message}`
                        )
                    );
                }
            }
        );

        ffmpeg.on("close", (exitCode) => {
            if (settled) {
                return;
            }

            if (exitCode !== 0) {
                rejectOnce(
                    new Error(
                        ffmpegError.trim() ||
                        `FFmpeg exited with code ${exitCode}.`
                    )
                );

                return;
            }

            const mp3Buffer = Buffer.concat(outputChunks);

            if (!mp3Buffer.length) {
                rejectOnce(
                    new Error(
                        "FFmpeg returned an empty MP3 file."
                    )
                );

                return;
            }

            settled = true;
            resolve(mp3Buffer);
        });

        ffmpeg.stdin.end(wavBuffer);
    });
}

function validateWavFile(
    file: Express.Multer.File
): void {
    if (!file.buffer?.length) {
        throw new Error(`"${file.originalname}" is empty.`);
    }

    const allowedMimeTypes = new Set([
        "audio/wav",
        "audio/x-wav",
        "audio/wave",
        "audio/vnd.wave",
    ]);

    const hasWavExtension =
        path.extname(file.originalname).toLowerCase() === ".wav";

    if (
        !allowedMimeTypes.has(file.mimetype) &&
        !hasWavExtension
    ) {
        throw new Error(
            `"${file.originalname}" is not a WAV file.`
        );
    }
}

function sanitizeFilename(filename: string): string {
    return filename
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);
}