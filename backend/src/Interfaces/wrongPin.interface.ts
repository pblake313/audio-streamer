export interface WrongPinDoc {
    id?: string;
    ip: string;
    dateCreated: FirebaseFirestore.Timestamp | Date;
    attempts: number;
    blocked: boolean;
    updatedAt: FirebaseFirestore.Timestamp | Date;
    lastAttempt: FirebaseFirestore.Timestamp | Date;
}
