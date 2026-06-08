# MOS Project Frontend

React/TypeScript/Vite frontend for MOS Project.

## Stack

- React 19
- TypeScript
- Vite 7
- Tailwind CSS 4
- React Router 7

## Directory

Run all frontend commands from:

```powershell
cd FRONTEND
```

## Install

```powershell
npm install
```

## Environment

Create `.env` from `.env.example` or set these values:

```env
VITE_API_TARGET=local
VITE_API_LOCAL_URL=https://localhost:7223
VITE_API_DEPLOY_URL=https://be-mos-excel-grade.onrender.com
VITE_API_BASE_URL=
VITE_GOOGLE_CLIENT_ID=
```

API origin selection is centralized in `src/config/api.ts`. Do not hardcode API origins in components or services.

## Run locally

```powershell
npm run dev
```

Frontend URL:

- `http://localhost:5173`

Run with LAN host:

```powershell
npm run dev:lan
```

Frontend LAN URL example:

- `http://192.168.20.198:5173`

Backend should normally run at:

- `https://localhost:7223`

## Backend target modes

```powershell
npm run dev:be-local
npm run dev:be-deploy
npm run dev:be-local:lan
npm run dev:be-deploy:lan
```

Build variants:

```powershell
npm run build
npm run build:be-local
npm run build:be-deploy
```

## Checks

```powershell
npm run lint
npm run build
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
- Grading services: `src/services/grading.service.ts`
- Analytics services: `src/services/analytics.service.ts`
- Main grading UI: `src/pages/GradingView.tsx`
- Class grading UI: `src/pages/ClassGradingPage.tsx`

## Related docs

- Root overview: `../README.md`
- Onboarding: `../ONBOARDING.md`
- API contract: `../API_CONTRACT.md`
- API examples: `../API_QUICK_REFERENCE.md`
