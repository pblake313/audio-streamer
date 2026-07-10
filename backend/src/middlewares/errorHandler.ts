// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.statusCode,
            message: err.message,
            data: err.details ?? null
        });
    }

    return res.status(500).json({
        status: 500,
        message: err.message || "An unknown error has occurred.",
        data: null
    });
}