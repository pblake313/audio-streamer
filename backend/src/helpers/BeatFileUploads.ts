import admin from "firebase-admin";
import sharp from "sharp";
import { parseBuffer } from "music-metadata";

type UploadBeatParams = {
    file: Express.Multer.File;
    beatId: string;
};

/* ---------------------------------------------
   Validation
---------------------------------------------- */

async function validateArtworkFile(
    file: Express.Multer.File,
): Promise<void> {


    if (!file?.buffer?.length) {
        throw new Error("Artwork file is missing or empty.");
    }

    try {
        const metadata = await sharp(file.buffer).metadata();

        if (
            !metadata.format ||
            !metadata.width ||
            !metadata.height
        ) {
            throw new Error("Invalid image metadata.");
        }

        if (metadata.format === "svg") {
            throw new Error(
                "SVG artwork files are not supported.",
            );
        }
    } catch (error: any) {
        if (
            error?.message ===
            "SVG artwork files are not supported."
        ) {
            throw error;
        }

        throw new Error(
            "Artwork must be a valid JPG, JPEG, PNG, WebP, GIF, TIFF, AVIF, HEIF, or another supported raster image.",
        );
    }
}

async function validateMp3File(
    file: Express.Multer.File,
): Promise<void> {
    console.log(file)

    if (!file?.buffer?.length) {
        throw new Error("MP3 file is missing or empty.");
    }

    try {
        const metadata = await parseBuffer(
            file.buffer,
            {
                mimeType: "audio/mpeg",
                size: file.size,
                path: file.originalname,
            },
            {
                duration: false,
                skipCovers: true,
            },
        );

        const container =
            metadata.format.container?.toLowerCase() ?? "";

        const codec =
            metadata.format.codec?.toLowerCase() ?? "";

        const isMp3 =
            container.includes("mpeg") &&
            (
                codec.includes("layer 3") ||
                codec.includes("layer iii") ||
                codec.includes("mp3")
            );

        if (!isMp3) {
            throw new Error("Not a valid MP3.");
        }
    } catch (err) {
        console.log(err)
        throw new Error(
            "Audio file must be a valid MP3 file.",
        );
    }
}

/*
 * WAV files are read directly instead of through music-metadata: the
 * installed version's RIFF parser fails to recognise WAV headers.
 *
 * Layout: "RIFF" <size> "WAVE", then chunks of <4-char id> <size> <data>.
 * "fmt " holds the byte rate; "data" holds the audio, so
 * duration = data size / byte rate.
 */
type WavInfo = {
    byteRate: number;
    dataBytes: number;
};

function readWavInfo(buffer: Buffer): WavInfo | null {
    if (buffer.length < 12) return null;
    if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
    if (buffer.toString("ascii", 8, 12) !== "WAVE") return null;

    let byteRate = 0;
    let dataBytes = 0;
    let offset = 12;

    while (offset + 8 <= buffer.length) {
        const chunkId = buffer.toString("ascii", offset, offset + 4);
        const chunkSize = buffer.readUInt32LE(offset + 4);
        const body = offset + 8;

        if (chunkId === "fmt " && body + 12 <= buffer.length) {
            byteRate = buffer.readUInt32LE(body + 8);
        }

        if (chunkId === "data") {
            // some encoders write a placeholder size; trust what's actually there
            dataBytes = Math.min(chunkSize, buffer.length - body);
            break;
        }

        // chunks are padded to an even number of bytes
        offset = body + chunkSize + (chunkSize % 2);
    }

    if (!byteRate || !dataBytes) return null;

    return { byteRate, dataBytes };
}

async function validateWavFile(
    file: Express.Multer.File,
): Promise<void> {
    if (!file?.buffer?.length) {
        throw new Error("WAV file is missing or empty.");
    }

    if (!readWavInfo(file.buffer)) {
        throw new Error(
            "Audio file must be a valid WAV file.",
        );
    }
}

/* ---------------------------------------------
   Duration
---------------------------------------------- */

function roundDuration(seconds: number | undefined): number | null {
    return typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0
        ? Math.round(seconds * 10) / 10
        : null;
}

// Length of an MP3 or WAV in seconds, or null if it can't be read.
export async function getAudioDurationSeconds(
    file: Express.Multer.File,
    format: "mp3" | "wav",
): Promise<number | null> {
    if (format === "wav") {
        const info = readWavInfo(file.buffer);
        return info ? roundDuration(info.dataBytes / info.byteRate) : null;
    }

    try {
        const metadata = await parseBuffer(
            file.buffer,
            {
                mimeType: "audio/mpeg",
                size: file.size,
                path: file.originalname,
            },
            {
                duration: true,
                skipCovers: true,
            },
        );

        return roundDuration(metadata.format.duration);
    } catch {
        return null;
    }
}

/* ---------------------------------------------
   Storage URL
---------------------------------------------- */

function createStorageUrl(
    bucketName: string,
    fileName: string,
): string {
    const encodedFileName = fileName
        .split("/")
        .map(encodeURIComponent)
        .join("/");

    return (
        `https://storage.googleapis.com/` +
        `${bucketName}/${encodedFileName}`
    );
}

/* ---------------------------------------------
   Upload artwork
---------------------------------------------- */

export async function uploadBeatArtwork({
    file,
    beatId,
}: UploadBeatParams): Promise<string> {
    await validateArtworkFile(file);

    const bucket = admin.storage().bucket();

    // The object is overwritten, but the returned URL is
    // versioned so the browser does not reuse the old image.
    const fileName =
        `Beats/${beatId}/Artwork/${beatId}.webp`;

    let fileBuffer: Buffer;

    try {
        fileBuffer = await sharp(file.buffer)
            .rotate()
            .webp({
                quality: 85,
            })
            .toBuffer();
    } catch (error: any) {
        throw new Error(
            error?.message ||
                "Error converting artwork to WebP format.",
        );
    }

    const fileUpload = bucket.file(fileName);

    return new Promise((resolve, reject) => {
        const blobStream = fileUpload.createWriteStream({
            resumable: false,
            metadata: {
                contentType: "image/webp",
                cacheControl:
                    "public, max-age=31536000, immutable",
            },
        });

        blobStream.on("error", (error) => {
            reject(
                new Error(
                    error.message ||
                        "Unable to upload artwork file.",
                ),
            );
        });

        blobStream.on("finish", async () => {
            try {
                await fileUpload.makePublic();

                const publicUrl = createStorageUrl(
                    bucket.name,
                    fileUpload.name,
                );

                const versionedUrl =
                    `${publicUrl}?v=${Date.now()}`;

                resolve(versionedUrl);
            } catch (error: any) {
                reject(
                    new Error(
                        error?.message ||
                            "Artwork uploaded, but failed to make it public.",
                    ),
                );
            }
        });

        blobStream.end(fileBuffer);
    });
}

/* ---------------------------------------------
   Upload audio (MP3 / WAV) and stems (ZIP)
---------------------------------------------- */

// Stores a file privately; it's only reachable through signed URLs.
function uploadPrivateFile(
    file: Express.Multer.File,
    fileName: string,
    contentType: string,
    label: string,
): Promise<string> {
    const bucket = admin.storage().bucket();
    const fileUpload = bucket.file(fileName);

    return new Promise((resolve, reject) => {
        const blobStream = fileUpload.createWriteStream({
            resumable: false,
            metadata: {
                contentType,
                cacheControl:
                    "private, no-store, max-age=0, no-transform",
            },
        });

        blobStream.on("error", (error) => {

            reject(
                new Error(
                    error.message ||
                        `Unable to upload ${label} file.`,
                ),
            );
        });

        blobStream.on("finish", async () => {
            try {
                await fileUpload.makePrivate({
                    strict: false,
                });

                const privateUrl = createStorageUrl(
                    bucket.name,
                    fileUpload.name,
                );

                resolve(privateUrl);
            } catch (error: any) {
                reject(
                    new Error(
                        error?.message ||
                            `${label} uploaded, but failed to keep it private.`,
                    ),
                );
            }
        });

        blobStream.end(file.buffer);
    });
}

/*
 * Each upload gets a new object name so the raw private URL genuinely
 * changes and the audio element cannot reuse the previous file.
 */

export async function uploadBeatMp3({
    file,
    beatId,
}: UploadBeatParams): Promise<string> {
    await validateMp3File(file);

    const fileName =
        `Beats/${beatId}/MP3Preview/` +
        `${beatId}-${Date.now()}.mp3`;

    return uploadPrivateFile(file, fileName, "audio/mpeg", "MP3");
}

export async function uploadBeatWav({
    file,
    beatId,
}: UploadBeatParams): Promise<string> {
    await validateWavFile(file);

    const fileName =
        `Beats/${beatId}/WAV/` +
        `${beatId}-${Date.now()}.wav`;

    return uploadPrivateFile(file, fileName, "audio/wav", "WAV");
}

// a zip starts with "PK" plus a local-file or end-of-archive signature
function isZipFile(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;

    const signature = buffer.readUInt32LE(0);

    return signature === 0x04034b50 || signature === 0x06054b50;
}

export async function uploadBeatStems({
    file,
    beatId,
}: UploadBeatParams): Promise<string> {
    if (!file?.buffer?.length || !isZipFile(file.buffer)) {
        throw new Error("Stems must be a valid ZIP file.");
    }

    const fileName =
        `Beats/${beatId}/Stems/` +
        `${beatId}-${Date.now()}.zip`;

    return uploadPrivateFile(file, fileName, "application/zip", "Stems");
}

/* ---------------------------------------------
   Size limits
---------------------------------------------- */

export const MAX_MP3_BYTES = 10 * 1024 * 1024;
export const MAX_WAV_BYTES = 100 * 1024 * 1024;
export const MAX_STEMS_BYTES = 200 * 1024 * 1024;
