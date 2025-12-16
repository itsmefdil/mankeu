# Technology Stack & Architecture

## Overview
This project is a personal financial management application designed to track transactions, budgets, and savings with a premium, responsive user interface and a robust, high-performance backend.

## 1. Core Stack
| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React 18 + TypeScript | Built using **Vite** for fast HMR and bundling. |
| **Backend** | FastAPI (Python 3.10+) | High-performance async framework for REST APIs. |
| **Database** | MySQL 8.0+ | Relational database for structured financial data. |
| **Mobile** | Capacitor | Native runtime to deploy Web App to Android. |
| **Styling** | TailwindCSS + Shadcn/UI | Utility-first CSS with accessible, premium web components. |

## 2. Frontend (Web & Mobile)
**Strategy**: Single Codebase (Monorepo-style or Shared). The React application serves as both the responsive website and the source for the Android app via Capacitor.
- **Framework**: React (Vite)
- **Language**: TypeScript (Strict)
- **State Management**: Zustand / React Query (TanStack Query) for server state.
- **UI Component Library**: Shadcn/UI (Radix Primitives)
- **Charts**: Recharts / Tremor (Optimized for financial data visualization)
- **Icons**: Lucide React
- **HTTP Client**: Axios or Ky
- **Form Handling**: React Hook Form + Zod (Validation)

## 3. Mobile (Android)
- **Runtime**: Capacitor 6 (Cross-platform native wrapper)
- **Build Tool**: Android Studio (Gradle)
- **Framework**: Ionic Framework (Optional, mostly using standard React/Tailwind)
- **Native Features**: Camera (Receipt scanning), Filesystem, Biometric Auth (Login)

## 4. Backend (Server)
- **Framework**: FastAPI
- **ORM**: SQLAlchemy (Async) / SQLModel
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Authentication**: OAuth2 with JWT (JSON Web Tokens)
- **Task Queue**: Celery (Optional, for generating heavy reports)

## 5. Database & Storage
- **Primary DB**: MySQL 8
- **Cache**: Redis (Optional, for caching frequent budget queries)
- **Object Storage**: Local filesystem or S3-compatible (for receipt uploads)

## 6. DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions (planned)

## 7. Development Tools
- **Linting/Formatting**:
  - Python: `ruff`, `black`
  - JS/TS: `eslint`, `prettier`
- **Testing**: `pytest` (Backend), `vitest` (Frontend)

## 8. Project Structure
```
mankeu/
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── core/           # Config, security, database modules
│   │   ├── models/         # SQLAlchemy/SQLModel tables
│   │   ├── schemas/        # Pydantic models (Request/Response)
│   │   ├── services/       # Business logic layer
│   │   └── main.py         # App entry point
│   ├── tests/
│   ├── alembic/            # Database migrations
│   ├── pyproject.toml
│   └── docker-compose.yml
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components (buttons, cards)
│   │   ├── features/       # Feature-based modules (transactions, dashboard)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities (axios, formating)
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── mobile/                 # Capacitor / Android Project
│   ├── android/            # Generated Android native code
│   └── capacitor.config.ts
│
└── docs/                   # Documentation & Plans
    ├── plan.md
    └── tech-stack.md
```
