
export interface ConvertedFileDoc {
    id: string;
    clientId: string | null;
    createdAt: Date;
    expiresAt: Date;
    filename: string;
    mp3Bytes: number;
    originalBytes: number;
    originalMime: string;
    originalName: string;
    storagePath: string;
}