// src/helpers/ip.ts
import type { Request } from "express";

/**
 * Normalize IP addresses so that IPv6/IPv4/local variants match.
 * Examples:
 * - "::1"              → "127.0.0.1"
 * - "::ffff:127.0.0.1" → "127.0.0.1"
 * - "192.168.1.10"     → "192.168.1.10"
 */
export const normalizeIp = (ip: string | null | undefined): string => {
	if (!ip) return "";

	// IPv6 localhost
	if (ip === "::1") return "127.0.0.1";

	// IPv6-mapped IPv4 (e.g. "::ffff:127.0.0.1")
	if (ip.startsWith("::ffff:")) {
		return ip.replace("::ffff:", "");
	}

	return ip;
};

/**
 * Get the client's IP from the request, preferring x-forwarded-for,
 * then socket.remoteAddress, then req.ip, and normalize it.
 */
export const getClientIp = (req: Request): string => {
	const forwarded = req.headers["x-forwarded-for"];

	let rawIp: string | undefined;

	if (Array.isArray(forwarded)) {
		rawIp = forwarded[0];
	} else if (typeof forwarded === "string") {
		// Could be "ip1, ip2, ip3"
		rawIp = forwarded.split(",")[0].trim();
	} else if (req.socket?.remoteAddress) {
		rawIp = req.socket.remoteAddress;
	} else {
		rawIp = req.ip;
	}

	return normalizeIp(rawIp);
};
