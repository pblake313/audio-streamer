import { rateLimit } from "express-rate-limit";
import type { Request } from "express";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function skipPreflight(req: Request) {
    return req.method === "OPTIONS";
}

function getRateLimitMessage(message: unknown) {
    if (typeof message === "string") return message;

    return "Too many requests. Please try again later.";
}

export const generalRateLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipPreflight,
    message: "Too many requests. Please wait a few minutes and try again.",
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            message: getRateLimitMessage(options.message),
        });
    },
});

export const loginLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 35,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipPreflight,
    skipSuccessfulRequests: true,
    message: "Too many login attempts. Please wait a few minutes and try again.",
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            message: getRateLimitMessage(options.message),
        });
    },
}); 