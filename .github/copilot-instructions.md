# Copilot / AI Agent Instructions — HospCare Backend

Quick orientation (why): this is a small Express + MongoDB backend for a healthcare app. Key responsibilities: auth, appointments, scheduling algorithms, and a medicine-suggestion AI integration.

- **Start**: `npm install` then `npm run start` (uses `nodemon index.js`). See [package.json](package.json).
- **Env**: required: `DB_URL`, `JWT_SECRET`, `PORT` (optional), `GEMINI_API_KEY` for AI. DB name used: `HospCare` (see [utils/lib.js](utils/lib.js)).

- **Project layout**:
  - `index.js` — app entry, routes mounted: `/api` (treatment), `/api/Medical`, `/api/auth`, `/api/chatBot` ([index.js](index.js)).
  - `routes/` — express routers (e.g., [routes/treatment.route.js](routes/treatment.route.js), [routes/auth.route.js](routes/auth.route.js)).
  - `controller/` — request handlers and business logic (examples: `auth.controller.js`, `Scheduling.controller.js`, `MedicineChatBot.js`).
  - `utils/lib.js` — MongoDB connection; all controllers call this to get `db` and then `db.collection(name)`.
  - `Algorithm/` — scheduling/time logic used for appointments (`TimeSchedular.js`, `getTime.js`).
  - `models/` — sparse/unused; `models/user.model.js` is empty currently.
  - `utils/disease.js` — canonical mapping of disease -> suggested medicines used by controllers/AI.

- **Patterns & conventions to follow**:
  - ES modules (`type: "module"` in `package.json`) — use `import` / `export`.
  - DB usage: controllers call `const db = await connectDB()` then `db.collection(<collectionName>)`. User categories map to collection names (`patient`, `doctor`, `medical`) inside `auth.controller.js`.
  - File uploads: `auth.controller.js` configures `multer` to write to `uploads/` and exposes `upload` export.
  - Authentication: JWT tokens created with `process.env.JWT_SECRET` (3h expiry). Validation endpoint: `/api/auth/user` (see [routes/auth.route.js](routes/auth.route.js)).
  - Appointment status updates: batch endpoints under `/doctors/appointment/Status/:n` call scheduling algorithms and update `Appointment` collection (see [routes/treatment.route.js](routes/treatment.route.js) and [controller/Scheduling.controller.js](controller/Scheduling.controller.js)).
  - AI integration: `controller/MedicineChatBot.js` uses `@google/generative-ai` (Gemini) and expects `GEMINI_API_KEY`. It returns structured JSON; controllers call `MedicineChatBot.generateMedicineSuggestion(message)` at `/api/chatBot`.

- **What agents should do (concrete actions)**
  - When editing controllers, prefer calling `connectDB()` and operating on `db.collection(...)` rather than creating new DB clients.
  - Respect category logic in `auth.controller.js` (doctors vs patients vs medical); keep collection names consistent.
  - For changes touching routes, update the mounts in `index.js` if adding new top-level paths.
  - For AI/chat changes, mirror the prompt/response structure in `MedicineChatBot.js` and preserve the JSON response schema used by callers.
  - If adding tests or scripts, add `npm` scripts to `package.json` (current `start` uses `nodemon`).

- **Examples to reference while coding**
  - JWT generation: [controller/auth.controller.js](controller/auth.controller.js) — `generateToken(user)`.
  - DB connect: [utils/lib.js](utils/lib.js) — returns `client.db('HospCare')`.
  - Gemeni usage: [controller/MedicineChatBot.js](controller/MedicineChatBot.js) — `model.generateContent(prompt)` and JSON parsing fallback.
  - Disease list: [utils/disease.js](utils/disease.js) — canonical medicine suggestions.

- **Do not change without checking**
  - Database name (`HospCare`) and collection conventions (category-based collections).
  - AI prompt schema used by `MedicineChatBot.generateMedicineSuggestion` — callers expect structured JSON.

If anything here is unclear or you want additional examples (tests, CI, or API contract docs), tell me which area to expand.
