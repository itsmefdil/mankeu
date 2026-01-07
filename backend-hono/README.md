# Mankeu Backend (Hono)

This is the backend for Mankeu, a financial planner application. It is built using **Hono** (TypeScript) and **Drizzle ORM** with **PostgreSQL**.

It serves as a high-performance replacement for the original Python (FastAPI) backend, designed to be deployable on Vercel or any Node.js/Bun environment.

## Features

- **High Performance**: Built on Hono and Bun.
- **Type Safe**: End-to-end type safety with TypeScript and Drizzle ORM.
- **Authentication**: JWT-based auth (Email/Password + Google).
- **Full REST API**: Endpoints for Transactions, Budgets, Goals, Debts, etc.
- **Database**: Postgres via Drizzle ORM.

## Prerequisites

- **Bun** (v1.0+): [Install Bun](https://bun.sh)
- **PostgreSQL**: A running Postgres database (local or cloud like Neon/Supabase/Vercel Postgres).

## Installation

1.  **Clone/Navigate** to the directory:
    ```bash
    cd backend-hono
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    ```

3.  **Environment Setup**:
    Copy `.env` from the project root or create one:
    ```bash
    cp .env.example .env
    ```
    Ensure `DATABASE_URL` and `SECRET_KEY` are set.
    ```env
    DATABASE_URL=postgres://user:pass@host:5432/mankeu
    SECRET_KEY=your_secret_key
    ```

## Database Migration

We use **Drizzle Kit** for migrations.

1.  **Generate Migrations**:
    Creates SQL files based on schema changes in `src/db/schema.ts`.
    ```bash
    bun run db:generate
    ```

2.  **Run Migrations**:
    Applies the SQL migrations to your database.
    ```bash
    bun run db:migrate
    ```

    *Note: If you are setting up for the first time, run both commands in order.*

## Running the Server

**Development Mode**:
```bash
bun run dev
```
The server will start at `http://localhost:8888`.

## API Documentation

For a detailed list of available endpoints and their usage, please refer to [API.md](./API.md).

## Project Structure

- `src/index.ts`: Entry point.
- `src/routes/*`: API route handlers.
- `src/db/schema.ts`: Database definition (Drizzle).
- `src/lib/db.ts`: Database connection.
- `src/middleware/*`: Middlewares (Auth, etc.).
- `drizzle/`: Migration SQL files.
