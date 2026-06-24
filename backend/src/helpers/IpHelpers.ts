import type { Request } from "express";
import net from "net";

/**
 * Cleans common IP formats before validation.
 *
 * Handles:
 * - "127.0.0.1:5000"       -> "127.0.0.1"
 * - "[::1]:5000"           -> "::1"
 * - "::ffff:127.0.0.1"     -> "::ffff:127.0.0.1"
 */
function cleanRawIp(ip: string | null | undefined): string | null {
    if (!ip) return null;

    let cleaned = ip.trim();

    if (!cleaned) return null;

    // Handle bracketed IPv6 with port: [::1]:5000
    if (cleaned.startsWith("[")) {
        const closingBracketIndex = cleaned.indexOf("]");

        if (closingBracketIndex === -1) return null;

        cleaned = cleaned.slice(1, closingBracketIndex);
    }

    // Handle IPv4 with port: 127.0.0.1:5000
    // Do NOT do this for IPv6 because IPv6 contains colons.
    const looksLikeIpv4WithPort =
        cleaned.includes(":") &&
        cleaned.split(":").length === 2 &&
        cleaned.includes(".");

    if (looksLikeIpv4WithPort) {
        cleaned = cleaned.split(":")[0];
    }

    return cleaned.trim() || null;
}

/**
 * Normalize IP addresses so that IPv6/IPv4/local variants match.
 *
 * Examples:
 * - "::1"              -> "127.0.0.1"
 * - "::ffff:127.0.0.1" -> "127.0.0.1"
 * - "192.168.1.10"     -> "192.168.1.10"
 *
 * Returns null if missing or invalid.
 */
export const normalizeIp = (ip: string | null | undefined): string | null => {
    const cleaned = cleanRawIp(ip);

    if (!cleaned) return null;

    // IPv6 localhost
    if (cleaned === "::1") return "127.0.0.1";

    // IPv6-mapped IPv4
    if (cleaned.startsWith("::ffff:")) {
        const mappedIp = cleaned.replace("::ffff:", "");

        return net.isIP(mappedIp) ? mappedIp : null;
    }

    return net.isIP(cleaned) ? cleaned : null;
};

/**
 * Get the client's IP from the request, preferring x-forwarded-for,
 * then socket.remoteAddress, then req.ip, and normalize it.
 *
 * Returns null if missing or invalid.
 */
export const getClientIp = (req: Request): string | null => {
    const forwarded = req.headers["x-forwarded-for"];

    let rawIp: string | undefined;

    if (Array.isArray(forwarded)) {
        rawIp = forwarded[0];
    } else if (typeof forwarded === "string") {
        // Could be "ip1, ip2, ip3"
        rawIp = forwarded.split(",")[0]?.trim();
    } else if (req.socket?.remoteAddress) {
        rawIp = req.socket.remoteAddress;
    } else {
        rawIp = req.ip;
    }

    return normalizeIp(rawIp);
};