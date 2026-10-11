# Codex Instructions

This document provides a comprehensive overview of the Academic Research & Writing Studio architecture to help AI coding assistants (like Codex, GitHub Copilot, or Gemini) efficiently understand and modify the project.

## Tech Stack
- **Frontend**: React 19, Vite, TailwindCSS (v4), `motion` (for animations), `lucide-react` (for icons).
- **Backend**: Node.js, Express, `tsx` (for dev server), `esbuild` (for production server bundle).
- **AI Integration**: `@google/genai` (using Gemini models like `gemini-3.5-flash`).
- **Database/Persistence**: Firebase (`firebase` for client, `firebase-admin` for backend), storing projects locally or in Firestore.
- **Styling**: Tailwind CSS via Vite plugin.

## Project Structure
- `server.ts`: The main Express server. Contains all the backend API routes (e.g., `/api/scholarly/search`, `/api/rubric/extract`, `/api/strategy/outline`). It proxies requests to Semantic Scholar and uses Gemini for AI processing.
- `src/App.tsx`: The main React component that maintains the core document state (rubric, references, outline, content, title page) and orchestrates modals and panels.
- `src/components/`: Contains UI components (e.g., `Header`, `LeftPanel`, `CenterEditor`, `RightPanel`, various Modals).
- `src/lib/`: Contains utility services, including `firebase.ts` for database connection and `projectsService.ts` for saving/loading papers.
- `src/utils/`: Formatting utilities, like `citationFormatter.ts`.
- `src/types.ts`: Shared TypeScript interfaces across the app.
- `vite.config.ts`: Vite configuration. Note: HMR can be disabled via the `DISABLE_HMR` environment variable to save CPU during AI agent edits.

## Key State Management in `App.tsx`
The application relies heavily on lifting state up to `App.tsx` and passing it down to components. The core state includes:
- `rubric` (`AssignmentRubric`): Evaluated assignment constraints and criteria.
- `references` (`ScholarlyPaper[]`): Selected scholarly sources from Semantic Scholar or extracted from imported documents.
- `content` (`string`): The current markdown/text draft of the paper.
- `outline` (`OutlineSection[]`): AI-generated paper outline mapped to sources.
- `studentDirection` (`string`): The thesis or intent of the student.
- `progressionSteps` (`ProgressionStep[]`): Log of actions taken by the user/AI during the research process.

## Development Workflow
To run the project locally:
1. Ensure dependencies are installed (`npm install`).
2. Add necessary environment variables to `.env.local` (like `GEMINI_API_KEY`).
3. Start the dev server: `npm run dev` (this uses `tsx server.ts` to run the Express backend).
4. To build for production, use `npm run build` which bundles the Vite frontend and uses `esbuild` to compile `server.ts` into a CommonJS bundle (`dist/server.cjs`).

## AI Integration Details
The backend uses `@google/genai` to communicate with the Gemini API.
- The `generateContentWithRetry` wrapper in `server.ts` includes exponential backoff for `503` errors.
- Prompts are defined inline inside the route handlers in `server.ts`. They take the payload (rubric, text, selected articles) from the frontend and respond with structured JSON for the frontend to digest.

## Key Interactions
- **Search Scholar**: `App.tsx` -> `LeftPanel` -> `handleSearchSemanticScholar` -> `/api/scholarly/search`. (Queries Semantic Scholar API and reports service errors without generating substitute references).
- **Proofread**: Sends the document content + rubric to `/api/proofread/review`. Results are shown in `ProofreadModal`.
- **Editor Assist**: The `CenterEditor` highlights text and requests changes via `/api/editor/assist` based on the context of the essay and selected references.
- **Document Import**: Handled in `/api/document/analyze-import`, extracting the title, rubric matching, and identifying all references using AI.

## Document exports and AI selection
- `src/utils/documentLayout.ts` is the shared Word/PDF block parser. Preserve authored prose and collapse only adjacent identical headings. Professor Review does not silently rewrite or format the draft.
- Word uses explicit Letter paper, black 12pt Times New Roman, 24pt line spacing, and page numbers. PDFKit generates downloadable PDFs from the same blocks. Do not restore browser printing as the PDF export pipeline.
- The Export modal lazily previews actual PDF pages with PDF.js. Word may wrap differently on other font/rendering environments. The center panel is a Markdown draft editor, not a paginated Word editor.
- Title-page details are never invented. Missing details and standalone author/year citations are flagged. Assignment-specific layout and source verification still require review.
- `ExportReadiness` gives users per-line edit/remove/keep actions with guarded undo; it does not apply automatic deletions or certify sources. `exportReadiness.ts` excludes bibliography entries and complete sentences from likely citation fragments. Metadata checks apply student/course fields only when a title page is enabled.
- Export details may be explicitly saved and applied on this device under `scholardesk.student-details:<userId>`. Never automatically apply another account's details or carry paper titles/due dates into another assignment. Text corrections use App's normal document setter and autosave.
- ModelSelector loads `/api/models`; `aiFetch` attaches `X-AI-Model` to subsequent AI requests, and every generation route honors it. Scholar search and PDF export do not require AI model access. Catalog membership does not guarantee entitlement; providers can reject listed models. Do not silently substitute models.
- Desktop distributions must not bundle `.env.local`. Firebase login identifies users; it does not transfer AI billing to them. Public hosted AI requires server-side identity verification and per-user limits. Desktop packaging and managed billing are not implemented yet.

## Important Pointers for Modification
- When adding new API routes or backend functionality, add them to `server.ts`.
- Always strictly type new data structures in `src/types.ts`.
- User persistence logic is tied to Firebase and handled in `src/lib/projectsService.ts`. Ensure to mock or handle unauthorized states properly.
