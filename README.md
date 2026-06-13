# ZenJEE — Mental Wellness Tracker for Indian Exam Students

> A privacy-first AI-powered wellness companion for students preparing for JEE, NEET, CUET, CAT, GATE, and UPSC.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.9-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%20strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-182%20passing-brightgreen?style=flat-square)](https://vitest.dev)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)](LICENSE)

---

## Overview

ZenJEE is a privacy-first mental wellness web application built specifically for students preparing for India's most demanding competitive exams — **JEE, NEET, CUET, CAT, GATE, and UPSC**.

### The Problem

India's competitive exam culture creates immense psychological pressure. Students face:

- Chronic sleep deprivation and burnout from multi-year preparation cycles
- Social comparison anxiety and perfectionism driven by peer rankings
- Family sacrifice and financial pressure compounding personal stress
- No accessible, stigma-free outlet for processing these emotions in real time

Professional counselling is expensive, scarce, and carries stigma. Generic wellness apps ignore the specific pressures of preparing for JEE or NEET. Students are left without support at exactly the moments they need it most.

### What ZenJEE Does

ZenJEE gives every exam student a private, AI-powered space to:

1. **Write freely** — journal entries are analysed by Gemini AI to surface stress triggers, emotional patterns, and personalised coping strategies
2. **Track mood daily** — a 10-point scale with colour-coded labels builds a visual history of emotional wellbeing
3. **Talk to ZenBot** — a context-aware conversational companion that understands exam culture and provides warm, non-clinical support
4. **Practice mindfulness** — six science-backed exercises, each under 10 minutes, requiring no equipment
5. **See the patterns** — a dashboard with 7-day mood trends and top stress triggers shows what's actually affecting wellbeing

All data stays on the device. There is no account, no server database, and journal content is encrypted at rest using AES-GCM 256-bit encryption.

---

## Key Features

| Feature | Description |
|---|---|
| **AI Journal Analysis** | Gemini 1.5 Flash reads each entry in JSON mode and extracts stress triggers, emotional patterns, personalised coping strategies, and a motivational message |
| **Mood Tracking** | 10-point scale mapped to named labels (overwhelmed → excellent) with colour coding; scores build into a 7-day trend |
| **ZenBot Chat** | Multi-turn conversation with full history; system prompt adapts to student's name, exam type, and recent mood score |
| **6 Mindfulness Exercises** | Box Breathing, 5-4-3-2-1 Grounding, Body Scan, Confidence Reset, Visualisation, 4-7-8 Breathing — filterable by type |
| **Analytics Dashboard** | 7-day mood bar chart, journalling streak, top stress triggers by frequency, exam countdown |
| **AES-GCM Encryption** | Journal content encrypted before localStorage using Web Crypto API (256-bit key, random 12-byte IV per entry) |
| **Crisis Detection** | AI flags high-risk entries and immediately surfaces iCall, Vandrevala Foundation, and NIMHANS helplines |
| **Zero Database** | No sign-up, no server-side storage, no analytics tracking — everything lives in `localStorage` |
| **WCAG Accessible** | Keyboard navigation, ARIA labels and live regions, skip-to-main, screen-reader tested |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3.9 (App Router), React 19 |
| Language | TypeScript 5 — strict mode, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` |
| AI | Google Gemini 1.5 Flash via `@google/generative-ai` — JSON response mode |
| Validation | Zod 3 — schema-first at every API trust boundary |
| Styling | Tailwind CSS v3 — custom zen/sage/sand/calm palette |
| Encryption | Web Crypto API — AES-GCM 256-bit, browser-native |
| Storage | `localStorage` — typed, versioned, SSR-safe helpers |
| Testing | Vitest 2 + Testing Library — 182 tests, 18 files |
| UI Primitives | Radix UI (Dialog, Select, Slider, Tooltip) |
| Deployment | Vercel — serverless, edge headers |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│                                                      │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Dashboard  │  │   Journal    │  │  Chat /     │  │
│  │ (trends)   │  │  + Mood      │  │  Mindful    │  │
│  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘  │
│        │                │                 │          │
│  ┌─────▼────────────────▼─────────────────▼──────┐   │
│  │      localStorage  (AES-GCM encrypted)        │   │
│  └───────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS (server-only)
┌────────────────────────▼────────────────────────────┐
│              Next.js API Routes                      │
│                                                      │
│  POST /api/analyze-journal  rate: 10 req/min         │
│  POST /api/chat             rate: 30 req/min         │
│  GET  /api/health                                    │
│                                                      │
│  Zod validation → Rate limiter → Gemini service      │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│          Google Gemini 1.5 Flash API                 │
│  JSON mode for journal analysis                      │
│  Multi-turn chat for ZenBot companion                │
└─────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- The Gemini API key exists only in `process.env` on the server — never bundled into client JavaScript
- Journal content sent to `/api/analyze-journal` is decrypted plaintext for the duration of the HTTPS request only; it is never stored server-side
- All localStorage reads and writes go through the typed storage module (`src/lib/storage`), which enforces schema versioning and SSR guards

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze-journal/route.ts   # POST — AI journal analysis
│   │   ├── chat/route.ts              # POST — ZenBot conversation
│   │   └── health/route.ts            # GET  — uptime / key check
│   ├── globals.css                    # Tailwind + custom component classes
│   ├── layout.tsx                     # Root layout, SEO, next/font
│   └── page.tsx                       # Entry — onboarding or app shell
├── components/
│   ├── chat/ChatView.tsx              # ZenBot UI with typing indicator
│   ├── dashboard/Dashboard.tsx        # Mood chart, streak, triggers, countdown
│   ├── journal/
│   │   ├── AnalysisCard.tsx           # Crisis banner, triggers, coping strategies
│   │   ├── JournalView.tsx            # Debounced auto-save, AI analyse button
│   │   └── MoodSlider.tsx             # Gradient track, per-score emoji + ARIA
│   ├── layout/
│   │   ├── AppShell.tsx               # Tab routing
│   │   └── Navigation.tsx             # Desktop header + mobile bottom nav
│   ├── mindfulness/MindfulnessView.tsx # 6 exercises, type filter pills
│   └── onboarding/OnboardingModal.tsx  # 2-step first-run profile setup
├── hooks/
│   ├── useChat.ts                     # Stateless multi-turn chat + fetch
│   └── useJournal.ts                  # Encrypt on persist, decrypt on load
├── lib/
│   ├── crypto/index.ts                # AES-GCM encrypt / decrypt
│   ├── gemini/
│   │   ├── client.ts                  # Singleton Gemini client (server-only)
│   │   ├── healthCheck.ts             # Key check without token burn
│   │   ├── prompts/
│   │   │   ├── chatCompanion.ts       # System prompt + history conversion
│   │   │   └── journalAnalysis.ts     # JSON-mode prompt with crisis guardrails
│   │   └── services/
│   │       ├── chatService.ts
│   │       └── journalAnalysisService.ts
│   ├── rateLimit/index.ts             # Sliding-window in-memory rate limiter
│   ├── storage/index.ts               # Typed, versioned localStorage wrapper
│   └── validators/schemas.ts          # Zod schemas — single source of truth
├── test/setup.ts                      # Vitest + Testing Library global setup
└── types/index.ts                     # All domain types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com) API key (free tier works)

### Local Development

```bash
git clone https://github.com/Ashish-CodeJourney/ZenJEE.git
cd ZenJEE
npm install
```

Create `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app prompts for name and exam type on first visit.

### Commands

```bash
npm run dev          # development server
npm run build        # production build
npm start            # serve production build
npm test             # run all 182 tests
npm run test:coverage # coverage report
npm run test:ui      # interactive Vitest UI
npm run lint         # ESLint
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key — server-only, never sent to the client |
| `NEXT_PUBLIC_APP_NAME` | No | Display name in browser tab. Defaults to `ZenJEE` |
| `NEXT_PUBLIC_STORAGE_VERSION` | No | localStorage schema version. Defaults to `1` |

---

## Deploy to Vercel

1. Fork this repo and import it at [vercel.com/new](https://vercel.com/new)
2. Add `GEMINI_API_KEY` in **Settings → Environment Variables**
3. Click **Deploy** — `vercel.json` handles framework detection, cache headers, and public env defaults automatically

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Ashish-CodeJourney/ZenJEE)

---

## API Reference

All responses follow `{ "success": true, ... }` on success and `{ "error": "..." }` on failure.

### POST /api/analyze-journal

Analyses a journal entry and returns structured emotional insights.

**Rate limit:** 10 requests/IP/minute

**Request:**
```json
{
  "content": "Today was rough. I couldn't focus during physics practice...",
  "moodScore": 3,
  "date": "2026-06-13"
}
```

| Field | Type | Constraints |
|---|---|---|
| `content` | `string` | 10–5000 characters |
| `moodScore` | `integer` | 1–10 |
| `date` | `string` | ISO 8601 — `YYYY-MM-DD` |

**Success (200):**
```json
{
  "success": true,
  "analysis": {
    "sentiment": "negative",
    "sentimentIntensity": 0.72,
    "stressTriggers": [{ "trigger": "...", "severity": "moderate", "category": "academic" }],
    "copingStrategies": [{ "id": "...", "title": "...", "steps": ["..."] }],
    "mindfulnessExercise": { "title": "Box Breathing", "durationMinutes": 5, "instructions": ["..."] },
    "motivationalMessage": "...",
    "crisisDetected": false,
    "summary": "..."
  }
}
```

**Errors:** `400` validation failure · `429` rate limit · `502` Gemini unavailable

---

### POST /api/chat

Sends a message to ZenBot and returns a context-aware reply. Conversation history is passed by the client on every request (stateless server).

**Rate limit:** 30 requests/IP/minute

**Request:**
```json
{
  "message": "I feel like I'm never going to be ready for JEE",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hey! How are you feeling today?" }
  ],
  "userContext": {
    "displayName": "Arjun",
    "examType": "JEE",
    "recentMoodScore": 4
  }
}
```

| Field | Type | Constraints |
|---|---|---|
| `message` | `string` | 1–1000 characters |
| `history` | `array` | Max 20 items |
| `userContext.examType` | `string` | `JEE` `NEET` `CUET` `CAT` `GATE` `UPSC` `OTHER` |

**Success (200):**
```json
{ "success": true, "reply": "That feeling is very common among JEE aspirants, Arjun..." }
```

**Errors:** `400` validation failure · `429` rate limit · `502` Gemini unavailable

---

### GET /api/health

Lightweight uptime check — verifies the Gemini key is configured without burning tokens.

```json
{ "ok": true, "geminiKeyConfigured": true, "timestamp": "2026-06-13T10:00:00.000Z" }
```

Returns `503` if the key is missing.

---

## Security

- **API key isolation** — `GEMINI_API_KEY` is accessed only in server-side API route handlers, never in any component or client bundle
- **AES-GCM 256-bit encryption** — journal text is encrypted with the Web Crypto API before writing to localStorage; each entry uses a randomly generated 12-byte IV; an XSS attacker who reads localStorage gets ciphertext, not journal content
- **Zod validation at every API boundary** — all request bodies are parsed through strict schemas before reaching any business logic
- **Sliding-window rate limiting** — per IP: 10 req/min on analyze, 30 req/min on chat; responses include `Retry-After` header
- **Security headers** applied globally:
  - `Content-Security-Policy` — scripts, styles, images, fonts, and connect sources all locked down
  - `X-Frame-Options: DENY` — clickjacking protection
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Cache-Control: no-store` on all API routes
- **AI safety guardrails** — hard-coded prompt instructions prohibit medical diagnoses, psychiatric labels, medication suggestions; crisis language triggers `crisisDetected: true` and surfaces helplines before any other response
- **CVE-2025-66478 patched** — upgraded from Next.js 15.1.3 to 15.3.9
- **No telemetry** — `NEXT_TELEMETRY_DISABLED=1` set in `next.config.ts`

---

## Testing

**182 tests across 18 test files — all passing.**

```bash
npm test              # run all tests
npm run test:coverage # with v8 coverage report
npm run test:ui       # interactive Vitest UI
```

| Layer | What is covered |
|---|---|
| Unit — utilities | `cn()`, date helpers, mood label/colour mapping |
| Unit — validators | All Zod schemas: valid inputs, boundary values, rejection of malformed data |
| Unit — rate limiter | Allow/deny logic, sliding window expiry, per-key isolation |
| Unit — storage | Read/write/clear, SSR guard, schema versioning |
| Unit — Gemini prompts | Prompt content, safety guardrail presence, crisis instruction inclusion, history conversion |
| Unit — Gemini services | SDK call structure, error propagation, key-absent failure modes |
| Integration — API routes | Full request→response cycle: 200 success, 400 validation, 429 rate limit, 502 upstream failure |
| Component | Render, user interactions, accessibility attributes, conditional display logic |
| E2E smoke | Full request-to-response contract for both API endpoints |

---

## Mental Health Disclaimer

> **ZenJEE is a wellness aid, not a substitute for professional mental health care.**
>
> The journal analysis and chat features are designed to provide emotional support and self-reflection tools within a peer-support scope. They do not constitute medical advice, psychological assessment, clinical therapy, or diagnosis of any kind.
>
> If you are experiencing persistent distress, depression, anxiety, or any mental health crisis, please reach out to a qualified mental health professional.

**Crisis resources (India):**

| Helpline | Number |
|---|---|
| iCall (TISS) | 9152987821 |
| Vandrevala Foundation (24/7) | 1860-2662-345 |
| NIMHANS Helpline | 080-46110007 |

---

## License

MIT License — Copyright (c) 2026 Ashish Vaghela

See [LICENSE](LICENSE) for full text.
