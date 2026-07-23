import { Timestamp } from "firebase-admin/firestore";

export interface ConvertedFileDoc {
    id: string;
    clientId: string | null;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    filename: string;
    mp3Bytes: number;
    originalBytes: number;
    originalMime: string;
    originalName: string;
    storagePath: string;
}