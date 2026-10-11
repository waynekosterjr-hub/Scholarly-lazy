<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Academic Research & Writing Studio

This repository contains the Academic Research & Writing Studio application.

## For AI Assistants (Codex)
If you are an AI assistant tasked with modifying or understanding this codebase, **[read CODEX.md](CODEX.md) first**. It contains all the necessary pointers on project structure, tech stack, and state management to help you take control of this project efficiently.

## Run Locally

For containers on Windows, see [Run with Podman](PODMAN.md). The included `Containerfile` builds the production app; supply `.env.local` only at runtime.

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

*Note: The dev command uses `tsx` to run the Express backend alongside the Vite frontend.*
The server loads `.env.local` first, then `.env`; existing process environment variables take precedence. `PORT` defaults to 3000. Firebase Authentication provides Google sign-in. Draft changes are cached on this device immediately and synchronized to Firestore after a short debounce; the save indicator distinguishes local storage from confirmed cloud writes.
