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
   Upload MP3
---------------------------------------------- */

export async function uploadBeatMp3({
    file,
    beatId,
}: UploadBeatParams): Promise<string> {
    await validateMp3File(file);

    const bucket = admin.storage().bucket();
    const uploadVersion = Date.now();

    // Use a new object name for each upload so the raw private
    // URL genuinely changes and the audio element cannot reuse
    // the previous MP3.
    const fileName =
        `Beats/${beatId}/MP3Preview/` +
        `${beatId}-${uploadVersion}.mp3`;

    const fileUpload = bucket.file(fileName);

    return new Promise((resolve, reject) => {
        const blobStream = fileUpload.createWriteStream({
            resumable: false,
            metadata: {
                contentType: "audio/mpeg",
                cacheControl:
                    "private, no-store, max-age=0, no-transform",
            },
        });

        blobStream.on("error", (error) => {

            reject(
                new Error(
                    error.message ||
                        "Unable to upload MP3 file.",
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
                            "MP3 uploaded, but failed to keep it private.",
                    ),
                );
            }
        });

        blobStream.end(file.buffer);
    });
}
