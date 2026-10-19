# Audio Streamer: Frontend

The SvelteKit app for Audio Streamer. It contains the public home page, the PIN login, and the private portal where beats are managed, played, and converted.

See the [root README](../README.md) for a project overview.

## Prerequisites

- Node.js 18 or later
- The [backend](../backend/README.md) running locally or deployed

## Getting Started

From the `frontend` directory:

```bash
npm install
cp example.env .env
npm run dev
```

The dev server runs at `http://localhost:5173`.

## Environment Variables

Create `frontend/.env` from `example.env`. Never commit your real `.env`.

| Variable            | Required | Description                                               |
| ------------------- | -------- | --------------------------------------------------------- |
| `VITE_BACKEND_URL`  | Yes      | Base URL of the backend API, for example `http://localhost:3000` |
| `VITE_FRONTEND_URL` | No       | Public URL of this app                                    |

Variables prefixed with `VITE_` are embedded in the client bundle at build time, so never put secrets in them.

## Scripts

| Command           | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with hot reload            |
| `npm run build`   | Build the production app into `build/`               |
| `npm run preview` | Preview the production build locally                 |
| `npm run start`   | Run the built app with Node (`node build`)           |

## Routes

| Path                         | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `/`                          | Public home page with project details         |
| `/login`                     | PIN login                                     |
| `/portal`                    | Beat library and audio player (auth required) |
| `/portal/add-beat`           | Upload a new beat                             |
| `/portal/edit-beat/[beatId]` | Edit an existing beat                         |
| `/portal/converter`          | Batch WAV to MP3 converter                    |
| `/maintenance`               | Maintenance page                              |

## Project Structure

```
src/
├── routes/        SvelteKit pages and layouts
├── components/    UI components, grouped by type (buttons, forms, lists, standalone, ...)
├── stores/        Svelte stores for app state (audio player, beats, user, socket, tokens, ...)
├── helpers/       Fetch wrappers, auth helpers, formatters, transitions
└── lib/           Shared types and select options
static/            Fonts, images, videos, robots.txt
```

### API Requests

All backend calls go through two helpers in `src/helpers/Fetchers/`:

- **`publicFetch.ts`** is for `/auth/*` routes that need no token.
- **`authorizedFetch.ts`** is for `/secure/*` routes. It attaches the access token, reads a refreshed token from the `x-access-token` response header, and logs the user out when the backend says to.

Requests are sent with credentials so the refresh token cookie is included.

### Real-time Updates

`stores/socketStore.ts` opens a Socket.IO connection to the backend. The converter uses it to receive `conversionProgress` events while WAV files are processed.

## Deployment

The app uses `@sveltejs/adapter-node`, so it runs as a Node server:

```bash
npm run build
npm run start
```

Set `VITE_BACKEND_URL` before building, and add the deployed frontend URL to the backend's `ALLOWED_ORIGINS`.
