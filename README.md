# Forge Your Destiny 
A choice-driven interactive adventure game where player decisions shape the storyline leading to multiple possible outcomes.

Team Members: Gabriela Aldana, Whitney Afunugo, Andra Butler, Alan Preciado, Daniel Ejimadu

## Features (Sprint 1)
- main menu interface
- character selection screen
- navigation between screens
- basic UI design w/ React and TypeScript

## Current Progress
focuses on setting up project structure and implementing core user interactions, such as starting a new game and selecting a character (Sprint 1)

## Firebase Setup

This app now includes a Firebase bootstrap module in `src/firebase.ts`.

1. Copy `.env.example` to `.env.local`.
2. Fill in the `VITE_FIREBASE_*` values from your Firebase project settings.
3. Restart the Vite dev server.
4. Enable Anonymous authentication in the Firebase Console.
5. The active Firebase project is set to `choose-your-adventure-b8818` in `.firebaserc`.
6. Hosting is configured to deploy `dist` as an SPA through `firebase.json`.
7. Firestore is configured for user-owned game progress in `gameProgress/{uid}` with prototype owner-only rules.

If the env values are missing, the app still runs and shows a Firebase status message on the main menu.

The main menu includes a `Play as Guest` button that signs in with anonymous Firebase Auth when the project is configured.

