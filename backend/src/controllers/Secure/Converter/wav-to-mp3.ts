import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";

import {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    getFirestore,
    Timestamp,
} from "firebase-admin/firestore";

import { getStorage } from "firebase-admin/storage";
import ffmpegPath from "ffmpeg-static";

import { ConvertedFileDoc } from "../../../types/ConvertedFiles";
import { getSocketIO } from "../../../socket";

type ConversionStatus =
    | "queued"
    | "converting"
    | "storing"
    | "saving"
    | "complete"
    | "error";

interface ConversionProgressEvent {
    id: string;
    filename: string;
    percent: number;
    status: ConversionStatus;
    outputFilename?: string;
    message?: string;

    /*
     * Included when status is complete.
     */
    fileDoc?: ConvertedFileDoc;
}

export async function wavToMp3(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const socketId =
            typeof req.body.socketId ===
            "string"
                ? req.body.socketId
                : undefined;

        if (!socketId) {
            throw new Error(
                "No frontend socket ID was provided.",
            );
        }

        const files = req.files as
            | Express.Multer.File[]
            | undefined;

        if (!files?.length) {
            throw new Error(
                "No files sent.",
            );
        }

        const providedClientIds =
            toStringArray(
                req.body.clientIds,
            );

        /*
         * Every frontend file has a unique client ID.
         * The clientIds order must match wavFiles.
         */
        const fileEntries = files.map(
            (file, index) => ({
                file,
                clientId:
                    providedClientIds[
                        index
                    ] ?? randomUUID(),
            }),
        );

        /*
         * Tell the frontend all files
         * are currently waiting.
         */
        for (
            const entry of fileEntries
        ) {
            emitConversionProgress(
                socketId,
                {
                    id: entry.clientId,
                    filename:
                        entry.file
                            .originalname,
                    percent: 0,
                    status: "queued",
                },
            );
        }

        const convertedFiles:
            ConvertedFileDoc[] = [];

        /*
         * Process sequentially so multiple large FFmpeg
         * processes do not run simultaneously.
         */
        for (
            const entry of fileEntries
        ) {
            const {
                file,
                clientId,
            } = entry;

            try {
                validateWavFile(file);

                // console.log( `Converting ${file.originalname}...` );

                const storedFile =
                    await convertWavToMp3AndStore(
                        file,
                        socketId,
                        clientId,
                    );

                convertedFiles.push(
                    storedFile,
                );

                /*
                 * The frontend receives the exact document
                 * that was saved to Firestore.
                 */
                emitConversionProgress(
                    socketId,
                    {
                        id: clientId,
                        filename:
                            file.originalname,
                        outputFilename:
                            storedFile.filename,
                        percent: 100,
                        status: "complete",
                        fileDoc:
                            storedFile,
                    },
                );

                // console.log( `Stored ${storedFile.storagePath}`);
            } catch (
                caughtError
            ) {
                const message =
                    caughtError instanceof
                    Error
                        ? caughtError.message
                        : "Conversion failed.";

                emitConversionProgress(
                    socketId,
                    {
                        id: clientId,
                        filename:
                            file.originalname,
                        percent: 0,
                        status: "error",
                        message,
                    },
                );

                /*
                 * Stop the entire batch when
                 * one conversion fails.
                 */
                throw caughtError;
            }
        }

        return res
            .status(201)
            .json({
                message:
                    `${convertedFiles.length} file(s) converted successfully.`,
                files:
                    convertedFiles,
            });
    } catch (error) {
        next(error);
    }
}

async function convertWavToMp3AndStore(
    file: Express.Multer.File,
    socketId: string,
    clientId: string,
): Promise<ConvertedFileDoc> {
    emitConversionProgress(
        socketId,
        {
            id: clientId,
            filename:
                file.originalname,
            percent: 1,
            status: "converting",
        },
    );

    /*
     * The 1–80% range represents FFmpeg conversion.
     * This is estimated because the WAV duration
     * is not currently calculated.
     */
    const mp3Buffer =
        await convertWavBufferToMp3(
            file.buffer,
            (percent) => {
                emitConversionProgress(
                    socketId,
                    {
                        id: clientId,
                        filename:
                            file.originalname,
                        percent,
                        status:
                            "converting",
                    },
                );
            },
        );

    const id = randomUUID();

    const baseFilename =
        sanitizeFilename(
            path.parse(
                file.originalname,
            ).name,
        ) ||
        "converted-audio";

    const mp3Filename =
        await getUniqueMp3Filename(
            baseFilename,
        );

    const storagePath =
        `WavConversions/${id}/${mp3Filename}`;

    const bucket =
        getStorage().bucket();

    const storageFile =
        bucket.file(storagePath);

    const createdAt =
        Timestamp.now();

    const expiresAt =
        Timestamp.fromMillis(
            createdAt.toMillis() +
                336 *
                    60 *
                    60 *
                    1000,
        );

    /*
     * FFmpeg has finished.
     * Upload the MP3 to Storage.
     */
    emitConversionProgress(
        socketId,
        {
            id: clientId,
            filename:
                file.originalname,
            outputFilename:
                mp3Filename,
            percent: 85,
            status: "storing",
        },
    );

    await storageFile.save(
        mp3Buffer,
        {
            resumable: false,
            metadata: {
                contentType:
                    "audio/mpeg",
                cacheControl:
                    "private, no-store, max-age=0",
            },
        },
    );

    /*
     * Firebase Storage is complete.
     * Save the Firestore document.
     */
    emitConversionProgress(
        socketId,
        {
            id: clientId,
            filename:
                file.originalname,
            outputFilename:
                mp3Filename,
            percent: 95,
            status: "saving",
        },
    );

    const storedMp3:
        ConvertedFileDoc = {
        id,
        clientId,
        createdAt,
        expiresAt,
        filename:
            mp3Filename,
        mp3Bytes:
            mp3Buffer.length,
        originalBytes:
            file.size,
        originalMime:
            file.mimetype,
        originalName:
            file.originalname,
        storagePath,
    };

    await getFirestore()
        .collection(
            "WavConversions",
        )
        .doc(id)
        .set(storedMp3);

    /*
     * Returning this document allows the caller
     * to send it to the frontend through Socket.IO.
     */
    return storedMp3;
}

function emitConversionProgress(
    socketId: string,
    payload: ConversionProgressEvent,
): void {
    getSocketIO()
        .to(socketId)
        .emit(
            "conversionProgress",
            payload,
        );
}

function toStringArray(
    value: unknown,
): string[] {
    if (
        Array.isArray(value)
    ) {
        return value.map(String);
    }

    if (
        typeof value === "string"
    ) {
        return [value];
    }

    return [];
}

async function getUniqueMp3Filename(
    baseFilename: string,
): Promise<string> {
    const conversions =
        getFirestore().collection(
            "WavConversions",
        );

    let duplicateNumber = 0;

    while (true) {
        const filename =
            duplicateNumber === 0
                ? `${baseFilename}.mp3`
                : `${baseFilename} (${duplicateNumber}).mp3`;

        const existingFile =
            await conversions
                .where(
                    "filename",
                    "==",
                    filename,
                )
                .limit(1)
                .get();

        if (
            existingFile.empty
        ) {
            return filename;
        }

        duplicateNumber++;
    }
}

function convertWavBufferToMp3(
    wavBuffer: Buffer,
    onProgress: (
        percent: number,
    ) => void,
): Promise<Buffer> {
    return new Promise(
        (
            resolve,
            reject,
        ) => {
            if (!ffmpegPath) {
                reject(
                    new Error(
                        "FFmpeg executable could not be found.",
                    ),
                );

                return;
            }

            const ffmpeg =
                spawn(
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
                        windowsHide:
                            true,
                    },
                );

            const outputChunks:
                Buffer[] = [];

            let ffmpegError =
                "";

            let settled =
                false;

            let estimatedPercent =
                1;

            let progressInterval:
                | ReturnType<
                    typeof setInterval
                >
                | null = null;

            function clearProgressInterval() {
                if (
                    progressInterval !==
                    null
                ) {
                    clearInterval(
                        progressInterval,
                    );

                    progressInterval =
                        null;
                }
            }

            function rejectOnce(
                error: Error,
            ) {
                if (settled) {
                    return;
                }

                settled = true;

                clearProgressInterval();

                reject(error);
            }

            /*
             * Estimated conversion progress.
             * It advances to 80%, then waits
             * until FFmpeg actually completes.
             */
            progressInterval =
                setInterval(
                    () => {
                        if (
                            settled ||
                            estimatedPercent >=
                                80
                        ) {
                            return;
                        }

                        estimatedPercent++;

                        onProgress(
                            estimatedPercent,
                        );
                    },
                    250,
                );

            ffmpeg.stdout.on(
                "data",
                (
                    chunk: Buffer,
                ) => {
                    outputChunks.push(
                        Buffer.from(
                            chunk,
                        ),
                    );
                },
            );

            ffmpeg.stderr.setEncoding(
                "utf8",
            );

            ffmpeg.stderr.on(
                "data",
                (
                    chunk: string,
                ) => {
                    ffmpegError +=
                        chunk;
                },
            );

            ffmpeg.on(
                "error",
                (error) => {
                    rejectOnce(
                        new Error(
                            `Could not start FFmpeg: ${error.message}`,
                        ),
                    );
                },
            );

            ffmpeg.stdin.on(
                "error",
                (
                    error:
                        NodeJS.ErrnoException,
                ) => {
                    if (
                        error.code !==
                        "EPIPE"
                    ) {
                        rejectOnce(
                            new Error(
                                `Could not send WAV data to FFmpeg: ${error.message}`,
                            ),
                        );
                    }
                },
            );

            ffmpeg.on(
                "close",
                (exitCode) => {
                    if (
                        settled
                    ) {
                        return;
                    }

                    clearProgressInterval();

                    if (
                        exitCode !==
                        0
                    ) {
                        rejectOnce(
                            new Error(
                                ffmpegError.trim() ||
                                    `FFmpeg exited with code ${exitCode}.`,
                            ),
                        );

                        return;
                    }

                    const mp3Buffer =
                        Buffer.concat(
                            outputChunks,
                        );

                    if (
                        !mp3Buffer.length
                    ) {
                        rejectOnce(
                            new Error(
                                "FFmpeg returned an empty MP3 file.",
                            ),
                        );

                        return;
                    }

                    onProgress(80);

                    settled = true;

                    resolve(
                        mp3Buffer,
                    );
                },
            );

            ffmpeg.stdin.end(
                wavBuffer,
            );
        },
    );
}

function validateWavFile(
    file: Express.Multer.File,
): void {
    if (
        !file.buffer?.length
    ) {
        throw new Error(
            `"${file.originalname}" is empty.`,
        );
    }

    const allowedMimeTypes =
        new Set([
            "audio/wav",
            "audio/x-wav",
            "audio/wave",
            "audio/vnd.wave",
        ]);

    const hasWavExtension =
        path
            .extname(
                file.originalname,
            )
            .toLowerCase() ===
        ".wav";

    if (
        !allowedMimeTypes.has(
            file.mimetype,
        ) &&
        !hasWavExtension
    ) {
        throw new Error(
            `"${file.originalname}" is not a WAV file.`,
        );
    }
}

function sanitizeFilename(
    filename: string,
): string {
    return filename
        .trim()
        .replace(
            /[^a-zA-Z0-9_-]+/g,
            "-",
        )
        .replace(
            /^-+|-+$/g,
            "",
        )
        .slice(0, 100);
}