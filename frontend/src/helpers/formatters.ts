export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}


export function firestoreTimestampToDate(timestamp: any): Date | null {
    if (!timestamp) return null;

    if (timestamp instanceof Date) {
        return timestamp;
    }

    if (typeof timestamp === "string") {
        return new Date(timestamp);
    }

    if (typeof timestamp._seconds === "number") {
        return new Date(
            timestamp._seconds * 1000 +
            Math.floor((timestamp._nanoseconds || 0) / 1_000_000),
        );
    }

    if (typeof timestamp.seconds === "number") {
        return new Date(
            timestamp.seconds * 1000 +
            Math.floor((timestamp.nanoseconds || 0) / 1_000_000),
        );
    }

    return null;
}

export function formatTimeRemaining(ms: number): string {
    const totalMinutes = Math.ceil(ms / 1000 / 60);

    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
        return `${days} day${days === 1 ? "" : "s"}${hours > 0 ? `, ${hours} hour${hours === 1 ? "" : "s"}` : ""}`;
    }

    if (hours > 0) {
        return `${hours} hour${hours === 1 ? "" : "s"}${minutes > 0 ? `, ${minutes} minute${minutes === 1 ? "" : "s"}` : ""}`;
    }

    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}