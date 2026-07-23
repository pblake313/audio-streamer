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

export function getDateAgeInDays(timestamp: any): number {
    const date = firestoreTimestampToDate(timestamp);

    if (!date || isNaN(date.getTime())) {
        return 0;
    }

    const diffMs = Date.now() - date.getTime();

    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getUploadedAtString(timestamp: any): string | null {
    const date = firestoreTimestampToDate(timestamp);
    if (!date) return null;

    const now = new Date();

    const diffMs = now.getTime() - date.getTime();

    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30.44;
    const year = day * 365.25;

    if (diffMs < day) {
        return "Uploaded today.";
    }

    if (diffMs < day * 2) {
        return "Uploaded yesterday.";
    }

    if (diffMs < week) {
        return "Uploaded this week.";
    }

    if (diffMs < month) {
        const weeks = Math.floor(diffMs / week);
        return `Uploaded ${weeks} ${weeks === 1 ? "week" : "weeks"} ago.`;
    }

    if (diffMs < year) {
        const months = Math.floor(diffMs / month);
        return `Uploaded ${months} ${months === 1 ? "month" : "months"} ago.`;
    }

    const years = Math.floor(diffMs / year);
    return `Uploaded ${years} ${years === 1 ? "year" : "years"} ago.`;
}

export function fileSizeTranslator(fileSizeBytes: number): string {
    if (!Number.isFinite(fileSizeBytes) || fileSizeBytes < 0) {
        return "Invalid file size";
    }

    if (fileSizeBytes === 0) {
        return "0 bytes";
    }

    const units = ["bytes", "KB", "MB", "GB"];
    const unitIndex = Math.min(
        Math.floor(Math.log(fileSizeBytes) / Math.log(1024)),
        units.length - 1
    );

    const size = fileSizeBytes / Math.pow(1024, unitIndex);
    const decimals = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;

    return `${size.toFixed(decimals)} ${units[unitIndex]}`;
}

export function removeFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf(".");

    const filenameWithoutExtension =
        lastDotIndex <= 0
            ? filename
            : filename.slice(0, lastDotIndex);

    return filenameWithoutExtension
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
export function formatDate(value: unknown): string {
    if (!value) {
        return "";
    }

    let date: Date;

    if (value instanceof Date) {
        date = value;
    } else if (typeof value === "string" || typeof value === "number") {
        date = new Date(value);
    } else if (
        typeof value === "object" &&
        value !== null &&
        "_seconds" in value
    ) {
        date = new Date(
            Number((value as { _seconds: number })._seconds) * 1000
        );
    } else if (
        typeof value === "object" &&
        value !== null &&
        "seconds" in value
    ) {
        date = new Date(
            Number((value as { seconds: number }).seconds) * 1000
        );
    } else if (
        typeof value === "object" &&
        value !== null &&
        "toDate" in value &&
        typeof (value as { toDate: () => Date }).toDate === "function"
    ) {
        date = (value as { toDate: () => Date }).toDate();
    } else {
        return "";
    }

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",

    }).format(date);
}