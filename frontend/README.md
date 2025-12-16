# Mankeu Frontend

This is the frontend application for Mankeu, a personal financial management tool.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Shadcn/UI (Custom Implementation)
- **Icons**: Lucide React
- **State Management**: Zustand / React Query
- **Runtime**: Bun

## Getting Started

### Prerequisites
- Install [Bun](https://bun.sh/)

### Installation

```bash
cd frontend
bun install
```

### Development

Run the development server:

```bash
bun run dev
```

### Build

Build for production:

```bash
bun run build
```

## Structure

- `src/components`: UI components (Button, Cards, etc.) and feature-specific components (Sidebar, TopBar).
- `src/layouts`: Page layouts (DashboardLayout).
- `src/pages`: Application pages.
- `src/lib`: Utilities (cn, formatters).
- `src/hooks`: Custom React hooks.
