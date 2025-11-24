import { getStorage } from 'firebase-admin/storage';

export async function signFirestoreUrl(fileUrl: string, expirationMinutes: number, expirationHours: number): Promise<string> {
    try {
        // Initialize Firebase Storage bucket
        const bucket = getStorage().bucket();

        // Extract the bucket name
        const bucketName = bucket.name;

        // Parse the file path from the URL
        const filePath = fileUrl.split(`${bucketName}/`)[1]?.split('?')[0]; // Adjusted to match the actual URL structure

        if (!filePath) {
            throw new Error("Invalid file URL format. Could not extract file path.");
        }

        // Decode the file path to handle encoded characters like `%2F`
        const decodedFilePath = decodeURIComponent(filePath);

        // Get the file reference
        const file = bucket.file(decodedFilePath);

        // Convert expiration hours and minutes to milliseconds
        const expiresInMs = (expirationHours * 60 * 60 * 1000) + (expirationMinutes * 60 * 1000);

        // Generate a signed URL
        const [signedUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + expiresInMs,
        });

        return signedUrl;
    } catch (error) {
        throw error;
    }
}
