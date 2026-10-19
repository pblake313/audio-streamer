# Audio Streamer

A private, PIN-protected portal for managing and streaming beats. Upload tracks with artwork and metadata, play them back through a full-featured audio player, A/B test mixes, rate and annotate tracks, and batch-convert WAV files to MP3.

**Live demo, screenshots, and project details:** https://demo.pattsway.com/project-details

## Tech Stack

| Layer    | Technology                                                   |
| -------- | ------------------------------------------------------------ |
| Frontend | SvelteKit (Svelte 4), TypeScript, Vite, WaveSurfer.js, Swiper |
| Backend  | Node.js, Express, TypeScript, Socket.IO, FFmpeg              |
| Data     | Firebase Firestore (metadata) and Firebase Storage (audio and images) |
| Auth     | PIN login, JWT access and refresh tokens bound to the client IP |

## Features

- **Beat library:** add, edit, delete, and trash beats with artwork, BPM, tags, and color labels
- **Audio player:** play/pause, seek, shuffle, repeat, and waveform scrubbing
- **A/B tester:** compare two tracks side by side
- **Ratings and notes:** rate each beat and keep a notepad per track
- **Destinations:** track where each beat is headed (for example YouTube or SoundCloud)
- **Filtering:** browse paginated beats with filters
- **WAV to MP3 converter:** batch-convert up to 20 WAVs at 320 kbps with live progress over WebSockets; converted files expire after 14 days
- **Security:** rate limiting, Helmet headers, CORS allow-list, and a 7-day device block after 5 wrong PIN attempts

## Repository Layout

```
audio-streamer/
├── frontend/   SvelteKit app (UI, audio player, portal pages)
└── backend/    Express API (auth, beats, converter, sockets)
```

Each folder has its own README with setup details:

- [frontend/README.md](frontend/README.md)
- [backend/README.md](backend/README.md)

## Quick Start

**Prerequisites:** Node.js 18 or later, npm, and a Firebase project with Firestore and Storage enabled.

```bash
git clone https://github.com/pblake313/audio-streamer
cd audio-streamer
```

**1. Start the backend** (runs on `http://localhost:3000` by default)

```bash
cd backend
npm install
cp example.env .env   # then fill in your Firebase credentials and secrets
npm run start
```

**2. Start the frontend** in a second terminal (runs on `http://localhost:5173`)

```bash
cd frontend
npm install
cp example.env .env   # set VITE_BACKEND_URL=http://localhost:3000
npm run dev
```

**3. Log in.** Open `http://localhost:5173`, go to the login page, and enter the `ACTIVE_PIN` you set in `backend/.env`.

> The backend only accepts requests from origins listed in `ALLOWED_ORIGINS`, so make sure it includes `http://localhost:5173` for local development.

## How Authentication Works

1. The user submits the PIN to `POST /auth/login-with-pin`.
2. The backend returns a short-lived **access token** (30 seconds) and sets an httpOnly **refresh token** cookie (48 hours). Both tokens contain the client IP.
3. Every `/secure/*` request sends the access token as a `Bearer` header. When the access token expires, the middleware checks the refresh cookie and returns a new access token in the `x-access-token` response header.
4. If the IP on a request does not match the IP in its token, the session is rejected and the user is logged out.
