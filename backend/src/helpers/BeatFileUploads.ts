import admin from 'firebase-admin';
import sharp from 'sharp';

type UploadBeatParams = {
    file: Express.Multer.File;
    beatId: string;
};


export async function uploadBeatArtwork({
    file,
    beatId,
}: UploadBeatParams): Promise<string> {

    const bucket = admin.storage().bucket();

    // Better to include the extension since you're converting to webp
    const fileName = `Beats/${beatId}/Artwork/${beatId}.webp`;

    let fileBuffer = file.buffer;
    let contentType = file.mimetype;

    if (file.mimetype.startsWith("image/")) {
        try {
            fileBuffer = await sharp(file.buffer).webp().toBuffer();
            contentType = "image/webp";
        } catch (error: any) {
            throw new Error(
                error.message || "Error converting image to WebP format."
            );
        }
    }

    const fileUpload = bucket.file(fileName);

    return new Promise((resolve, reject) => {
        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType,
                cacheControl: "public, max-age=31536000",
            },
        });

        blobStream.on("error", (error) => {
            reject(
                new Error(error.message || "Unable to upload artwork file. An unknown error has occurred.")
            );
        });

        blobStream.on("finish", async () => {
            try {
                await fileUpload.makePublic();

                const encodedFileName = fileUpload.name.split("/").map(encodeURIComponent).join("/");

                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodedFileName}`;

                resolve(publicUrl);
            } catch (error: any) {
                reject(
                    new Error( error.message || "Artwork uploaded, but failed to make it public." )
                );
            }
        });

        blobStream.end(fileBuffer);
    });
}
export async function uploadBeatMp3({
    file,
    beatId,
}: UploadBeatParams): Promise<string> {
    const bucket = admin.storage().bucket();

    const fileName = `Beats/${beatId}/MP3Preview/${beatId}.mp3`;
    const fileUpload = bucket.file(fileName);

    return new Promise((resolve, reject) => {
        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype || "audio/mpeg",
                cacheControl: "private, max-age=0, no-transform",
            },
        });

        blobStream.on("error", (error) => {
            reject(
                new Error(
                    error.message ||
                        "Unable to upload MP3 file. An unknown error has occurred."
                )
            );
        });

        blobStream.on("finish", async () => {
            try {
                /**
                 * Keep the file private.
                 * Do NOT call makePublic().
                 */
                await fileUpload.makePrivate({ strict: false });

                /**
                 * This is a private Google Storage URL.
                 * It looks like a normal URL, but it will NOT be publicly playable
                 * unless the object/bucket is public.
                 */
                const encodedFileName = fileUpload.name
                    .split("/")
                    .map(encodeURIComponent)
                    .join("/");

                const privateUrl = `https://storage.googleapis.com/${bucket.name}/${encodedFileName}`;

                resolve(privateUrl);
            } catch (error: any) {
                reject(
                    new Error(
                        error.message ||
                            "MP3 uploaded, but failed to keep it private."
                    )
                );
            }
        });

        blobStream.end(file.buffer);
    });
}