# CUNY Buddies

CUNY students upload a photo or PDF of their course schedule. The app detects
time blocks from the schedule and matches students who share classes or free
gaps. It recommends people (classmates, shared-gap buddies) and activities, and
lets matched users friend, chat, and view each other's schedules.

## Product shape

- **Auth:** CUNY login (`@login.cuny.edu`); WorkOS for email + password.
- **Schedule ingest:** user uploads the printable schedule (photo/PDF). The app
  detects the same classes and the same free blocks across users. During
  onboarding the user picks a minimum common free-block duration (e.g. match
  within 5 or within 30 minutes).
- **Matching:** core algorithm finds shared classes and overlapping gaps. An LLM
  layer sits on top as a sorting function over similar choices (clubs, majors,
  and so on) to score compatibility and order matches on screen.
- **Social:** friend other users, chat, and view their schedules.

## User schema (planned)

Name; optional show only first letter of last name; age; gender field with a
toggle; majors / year; hobbies; clubs; "Looking for ___"; friends / studymates /
connections / custom connection types; social media links. Stored in MongoDB.

## Stack

Next.js (deploy on Vercel) + MongoDB. See the Next.js notes below.

## My scope in this repo

Frontend pages (profile, data display, settings) and the user schema. Wireframes
inform the page layouts.

---

## Commands

```bash
npm install        # required once; node_modules is gitignored
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint (flat config in eslint.config.mjs)
```

There is no test setup yet.

## Architecture

App Router project (`app/`). Currently close to the create-next-app scaffold:
`layout.tsx` (root layout, Geist fonts), `page.tsx` (home), `globals.css`.

- **Data layer (planned, not built):** `mongodb` and `server-only` are
  dependencies but nothing connects to a database yet. Keep DB access in
  server-only modules.
- **Config:** connection string is `MONGODB_URI` in `.env.local` (gitignored);
  `.env.example` shows the shape.
- **Styling:** Tailwind CSS v4, configured CSS-first in `app/globals.css`
  (`@import "tailwindcss"`, `@theme inline`). There is no `tailwind.config` file;
  Tailwind runs through the Turbopack loader wired in `next.config.ts`.
- **Imports:** `@/*` maps to the repo root (see `tsconfig.json`).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
