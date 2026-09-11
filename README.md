# MOS Project Frontend

React/TypeScript/Vite frontend for MOS Project.

## Stack

- React 19
- TypeScript
- Vite 7
- Tailwind CSS 4
- React Router 7
- Bun 1.3+ (Package Manager & Runner)

## Directory

Run all frontend commands from:

```powershell
cd FRONTEND
```

## Install

```bash
bun install
```

## Environment

Create `.env` from `.env.example` or set these values:

```env
VITE_API_TARGET=local
VITE_API_LOCAL_URL=https://localhost:7223
VITE_API_DEPLOY_URL=https://api.mos-grader-app.info.vn
VITE_API_BASE_URL=
VITE_GOOGLE_CLIENT_ID=
VITE_LOCAL_AGENT_BASE_URL=http://localhost:5286
VITE_LOCAL_AGENT_API_KEY=DEV_LOCAL_AGENT_KEY_CHANGE_ME
```

API origin selection is centralized in `src/config/api.ts`. Do not hardcode API origins in components or services.
Local Agent config is also resolved from `src/config/api.ts` so FE code can call the localhost agent without embedding URLs or keys directly in components.

## Run locally

```bash
bun dev
```

Frontend URL:

- `http://localhost:5173`

Run with LAN host:

```bash
bun dev:lan
```

Frontend LAN URL example:

- `http://192.168.20.198:5173`

Backend should normally run at:

- `https://localhost:7223`

Production domains in the current deployment plan:

- Frontend: `https://mos-grader-app.info.vn`
- Backend: `https://api.mos-grader-app.info.vn`
- Local Agent on each client PC: `http://localhost:5286`

## Backend target modes

```bash
bun dev:be-local
bun dev:be-deploy
bun dev:be-local:lan
bun dev:be-deploy:lan
```

Build variants:

```bash
bun run build
bun run build:be-local
bun run build:be-deploy
```

## Checks & Quality Control

```bash
bun run format    # Format code with Biome
bun run check     # Biome check & lint
bun run build     # Type-check (tsc) & Vite production build
```

## API usage rules

- Use `authFetch` from `src/services/auth-fetch.ts` for protected API calls.
- Keep token lifecycle behavior in `src/context/AuthContext.tsx` intact.
- Do not bypass permission-aware UI states.
- Keep service DTOs synchronized with `API_CONTRACT.md`.

## High-value files

- API config: `src/config/api.ts`
- Auth lifecycle: `src/context/AuthContext.tsx`
- Authenticated fetch helper: `src/services/auth-fetch.ts`
- Local Agent service: `src/services/local-agent.service.ts`
- Grading services: `src/services/grading.service.ts`
- Analytics services: `src/services/analytics.service.ts`
- Main grading UI: `src/pages/GradingView.tsx`
- Class grading UI: `src/pages/ClassGradingPage.tsx`

## Related docs

- Root overview: `../README.md`
- Onboarding: `../ONBOARDING.md`
- API contract: `../API_CONTRACT.md`
- API examples: `../API_QUICK_REFERENCE.md`
