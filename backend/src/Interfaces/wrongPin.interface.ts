export interface WrongPinDoc {
    id?: string;
    ip: string;
    dateCreated: FirebaseFirestore.Timestamp | Date;
    attempts: number;
    blocked: boolean;
    lastTouched: FirebaseFirestore.Timestamp | Date;
}
