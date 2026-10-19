# Audio Streamer: Backend

The Express API for Audio Streamer. It handles PIN authentication, beat management, file uploads to Firebase Storage, signed audio URLs, WAV to MP3 conversion, and real-time progress over Socket.IO.

See the [root README](../README.md) for a project overview.

## Prerequisites

- Node.js 18 or later
- A Firebase project with **Firestore** and **Storage** enabled

FFmpeg does not need to be installed separately. It ships with the `ffmpeg-static` package.

## Getting Started

From the `backend` directory:

```bash
npm install
cp example.env .env   # then fill in the values below
npm run start
```

The server listens on `http://localhost:3000` unless `PORT` is set. `npm run start` uses nodemon, which restarts the server when files in `src/` change.

## Environment Variables

Create `backend/.env` from `example.env`. Never commit your real `.env` or Firebase key file.

| Variable                    | Required | Description                                                       |
| --------------------------- | -------- | ----------------------------------------------------------------- |
| `PORT`                      | No       | Port to listen on (default `3000`)                                |
| `ALLOWED_ORIGINS`           | Yes      | Comma-separated list of frontend origins allowed by CORS and Socket.IO, for example `http://localhost:5173` |
| `ACTIVE_PIN`                | Yes      | The 6-digit PIN used to log in                                    |
| `ACCESS_SECRET`             | Yes      | Secret for signing access tokens                                  |
| `REFRESH_SECRET`            | Yes      | Secret for signing refresh tokens                                 |
| `BEATS_PAGE_SIZE`           | No       | Beats returned per page                                           |
| `CONVERTED_FILES_PAGE_SIZE` | No       | Converted files returned per page                                 |
| `FIREBASE_PROJECT_ID`       | Yes      | From your service account JSON                                    |
| `FIREBASE_CLIENT_EMAIL`     | Yes      | From your service account JSON                                    |
| `FIREBASE_PRIVATE_KEY`      | Yes      | From your service account JSON. Wrap it in quotes and keep the `\n` line breaks. |
| `FIREBASE_STORAGE_BUCKET`   | Yes      | Your bucket name, for example `your-project.appspot.com`          |

Use long random strings for the secrets. You can generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Firebase Setup

1. Create a project at https://console.firebase.google.com.
2. Enable Firestore: **Build → Firestore Database → Create database**.
3. Enable Storage: **Build → Storage → Get started**.
4. Generate a service account key: **Project Settings → Service accounts → Generate new private key**.
5. Copy `project_id`, `client_email`, and `private_key` from the downloaded JSON into your `.env`, then delete or safely store the JSON file.

### Firestore Collections

| Collection         | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `Beats`            | Beat metadata, ratings, notes, destinations, file paths |
| `WavConversions`   | Converted MP3 records with an `expiresAt` timestamp     |
| `wrongPinAttempts` | Failed login attempts and blocks per IP                 |

Some queries combine filters and ordering. If Firestore returns a "requires an index" error, follow the link in the error message to create the index.

## API Reference

### Public routes: `/auth`

| Method | Path                   | Description                                               |
| ------ | ---------------------- | --------------------------------------------------------- |
| POST   | `/auth/login-with-pin` | Log in with `{ pin }`. Returns an access token and sets the refresh cookie. |
| GET    | `/auth/logout`         | Clear the refresh cookie                                  |
| GET    | `/auth/check-ip`       | Check whether the current IP is blocked                   |

### Secure routes: `/secure` (require a `Bearer` access token)

| Method | Path                                        | Description                          |
| ------ | ------------------------------------------- | ------------------------------------ |
| GET    | `/secure/get-authorized-user`               | Return the current session           |
| POST   | `/secure/beats/add-beat`                    | Create a beat (`mp3File`, `artworkFile`) |
| POST   | `/secure/beats/update-beat/:beatId`         | Edit a beat (`newMp3File`, `newArtwork` optional) |
| GET    | `/secure/beats/get-beat/:beatId`            | Get one beat                         |
| GET    | `/secure/beats/get-live-beats/:page`        | Get a page of active beats           |
| POST   | `/secure/beats/get-filtered-beats/:page`    | Get a page of beats matching filters |
| POST   | `/secure/beats/update-rating/:beatId`       | Update a beat's rating               |
| POST   | `/secure/beats/update-notepad/:beatId`      | Update a beat's notes                |
| POST   | `/secure/beats/toggle-destination/:beatId`  | Toggle a destination on a beat       |
| GET    | `/secure/beats/mark-trash/:beatId`          | Move a beat to trash                 |
| GET    | `/secure/beats/delete-beat/:beatId`         | Permanently delete a beat            |
| POST   | `/secure/converter/wav-to-mp3`              | Convert up to 20 WAVs (`wavFiles`, max 50 MB each) to 320 kbps MP3 |
| GET    | `/secure/converter/get-files/:page`         | Get a page of converted files        |
| GET    | `/secure/converter/download-converted-file/:fileId` | Download a converted MP3     |

File uploads use `multipart/form-data`.

## Authentication

- **Access token:** a JWT that lasts 30 seconds, sent in the `Authorization: Bearer` header.
- **Refresh token:** a JWT that lasts 48 hours, stored in an httpOnly `refresh_token` cookie (`Secure`, `SameSite=None`).
- Both tokens contain the client IP. A request from a different IP is rejected with `forceLogout`.
- When the access token expires, `secureMiddleware` checks the refresh cookie and returns a new access token in the `x-access-token` response header.
- After 5 wrong PIN attempts, the IP is blocked for 7 days.

## Rate Limits

| Scope        | Limit                       |
| ------------ | --------------------------- |
| All requests | 300 per 15 minutes per IP   |
| PIN login    | 35 per 15 minutes per IP    |

## Background Jobs

`src/workers/conversion-cleanup-worker.ts` runs at startup and every 6 hours. It deletes `WavConversions` records whose `expiresAt` has passed (14 days after conversion), along with their files in Storage.

## Socket.IO

The server shares its HTTP port with Socket.IO. During a conversion it emits `conversionProgress` events to the requesting client's socket ID.

## Project Structure

```
server.ts            Entry point: HTTP server, Socket.IO, cleanup worker
src/
├── app.ts           Express app: Helmet, CORS, rate limiting, routes, error handler
├── config/          Firebase Admin setup
├── routes/          Route definitions (Auth, Secure)
├── controllers/     Request handlers
├── middlewares/     Auth, rate limiters, error handler
├── helpers/         Upload, signed URL, IP, and wrong-PIN helpers
├── validators/      Input validators
├── workers/         Background jobs
├── types/           Shared TypeScript types
└── errors/          AppError class
```

## Scripts

| Command         | Description                            |
| --------------- | -------------------------------------- |
| `npm install`   | Install dependencies                   |
| `npm run start` | Start the server with nodemon and ts-node |
