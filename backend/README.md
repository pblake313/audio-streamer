# Audio Streamer Backend
This is the backend service for the audio-streamer application. It handles authentication, beat management, secure audio streaming, Firebase interaction, and all API logic.

## Getting Started
Make sure you are inside the backend directory: cd backend

Install dependencies:

```bash
npm install
```

Start the application:
```bash
npm run start
```

## Environment Variables
The backend requires a .env file in /backend.

Copy the example file:
`example.env`

Do NOT commit your real .env or Firebase keys. Only commit example.env.

## Firebase Setup
Create a Firebase project at https://console.firebase.google.com

**Enable Firestore:** 
Build → Firestore Database → Create Database

**Generate a service account key:** 
Project Settings → Service Accounts → Generate New Private Key
Download the JSON file.

Insert the values from the service account into your .env file you have created.

Make sure the private key keeps the \n formatting.

## Scripts
npm install        installs dependencies
npm run start      starts the server

## Notes
Do not commit your real .env or Firebase JSON key.
Ensure Firestore and Storage are enabled in your Firebase project.
Make sure your backend URLs match the frontend configuration.
