import { getStorage } from 'firebase-admin/storage';

export async function signImageUrl(url: string): Promise<string> {
    const storage = getStorage();
    const bucket = storage.bucket();  // Assumes default bucket, adjust if necessary

    // Extract path from URL (Firebase Storage URLs usually contain `bucket-name/path/to/file`)
    const path = url.split('.appspot.com/')[1];

    // Generate a signed URL for the extracted path
    const [signedUrl] = await bucket.file(path).getSignedUrl({
        action: 'read',
        expires: Date.now() + 48 * 60 * 60 * 1000, // URL expires in 48 hours
    });

    return signedUrl;
}