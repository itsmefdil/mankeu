# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Mankeu is a personal finance management application featuring a React/Vite frontend (with mobile APK support via Capacitor) and an Express/TypeScript backend running on Bun with PostgreSQL via Drizzle ORM.

## Architecture

- **`backend/`**: Express (v5) REST API running on Bun runtime with TypeScript.
  - **ORM / DB**: Drizzle ORM with `postgres` driver (`src/db/schema.ts`, `src/lib/db.ts`).
  - **Routing**: Modular route handlers in `src/routes/` mounted in `src/index.ts` (`/auth`, `/users`, `/transactions`, `/incomes`, `/categories`, `/budgets`, `/savings`, `/debts`, `/accounts`, `/transfers`, `/health`).
  - **Auth**: JWT-based authentication middleware (`src/middleware/auth.ts`) supporting password login and Google OAuth tokens.
  - **Validation**: Request validation via Zod middleware (`src/middleware/validate.ts`).
  - **Cloudflare / Serverless**: `functions/` and `wrangler.toml` for Cloudflare Pages/Workers deployment, `api/index.ts` and `vercel.json` for Vercel.

- **`frontend/`**: Single-page application built with React 19, Vite, TailwindCSS, and TypeScript.
  - **State & Data Fetching**: Zustand for auth (`useAuth.ts`) and user preferences (`usePreferences.ts`, `useTheme.ts`), TanStack Query (`@tanstack/react-query`) for API data caching and synchronization.
  - **Navigation**: React Router v7 (`App.tsx`, `layouts/DashboardLayout.tsx`).
  - **Dynamic Backend Target**: API base URL is resolved at runtime via `@capacitor/preferences` (`lib/axios.ts`, `pages/ServerConfig.tsx`).
  - **Internationalization**: `i18next` with English (`locales/en.json`) and Indonesian (`locales/id.json`) translations.
  - **Mobile**: Capacitor 8 for Android packaging (`android/`, `capacitor.config.ts`, `build-android.sh`).

## Common Commands

### Root
- Run both frontend and backend concurrently: `bun run dev`

### Backend (`cd backend`)
- Start development server with hot-reload: `bun dev` (runs `bun run --hot src/index.ts` on port 8000)
- Generate DB migrations: `bun run db:generate`
- Run DB migrations: `bun run db:migrate` or `bun run migrate`
- Data migrations / scripts: `bun run src/scripts/normalize-transfers.ts`
- Type check: `bun run build`

### Frontend (`cd frontend`)
- Start Vite dev server: `bun dev` (default: `http://localhost:5173`)
- Lint: `bun run lint` (runs `eslint .`)
- Build web bundle: `bun run build` (runs `tsc -b && vite build`)
- Sync web build to Android: `bun run android:sync`
- Open Android Studio: `bun run android:open`

### Android Builds (CLI)
- Build debug APK via helper script: `./build-android.sh`
- Build debug APK directly with Gradle: `cd frontend/android && ./gradlew assembleDebug` (outputs to `frontend/android/app/build/outputs/apk/debug/app-debug.apk`)
