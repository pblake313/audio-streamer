import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

dotenv.config();

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error('Required Firebase environment variables are not set');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const app = express();
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

app.use(
    helmet({
        crossOriginEmbedderPolicy: false, // prevent blocking audio streams
        contentSecurityPolicy: false      // needed since you use SvelteKit frontend
    })
);

// --- CORS ---
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
exposedHeaders: ["x-access-token", "x-stream-token"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


// new
import auth from './routes/Auth/auth'
app.use('/auth', auth)

import secure from './routes/Secure/secure'
app.use('/secure', secure)
// for users who have successfully entered the pin.




export default app;
