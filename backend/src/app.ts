import "./config/firebase";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import auth from "./routes/Auth/auth";
import secure from "./routes/Secure/secure";

import { generalRateLimiter } from "./middlewares/rateLimiters";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [];

app.use(
    helmet({
        crossOriginEmbedderPolicy: false, // prevent blocking audio streams
        contentSecurityPolicy: false, // needed since you use SvelteKit frontend
    }),
);

// --- CORS ---
const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ["x-access-token", "x-stream-token"],
};

app.use(cors(corsOptions));

app.use(generalRateLimiter);

app.use(express.json());
app.use(cookieParser());

app.use("/auth", auth);
app.use("/secure", secure);

// ERRORS
app.use(errorHandler);

export default app;