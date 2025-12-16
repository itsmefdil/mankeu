# Mankeu Backend API

Backend service for the Mankeu Financial Planner application, built with FastAPI, SQLAlchemy (Async), and MySQL.

## Tech Stack

- **Framework**: FastAPI
- **Database**: MySQL 8.0
- **ORM**: SQLAlchemy (Async)
- **Migrations**: Alembic
- **Package Manager**: uv / pip

## Prerequisites

- Python 3.10+
- Docker & Docker Compose (for Database)

## Installation

1. **Clone the repository** (if not already done)
2. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```
3. **Install dependencies**:
   ```bash
   # Using uv (recommended)
   uv sync
   
   # Or using pip
   pip install .
   ```

## Configuration

1. **Environment Variables**:
   Copy the example config:
   ```bash
   cp .env.example .env
   ```
   Update `.env` if necessary (e.g., if you change database credentials).

## Database Setup

1. **Start MySQL Container**:
   ```bash
   docker-compose up -d
   ```

2. **Run Migrations**:
   Apply the database schema:
   ```bash
   alembic upgrade head
   ```

   *Note: If you need to create a new migration after changing models:*
   ```bash
   alembic revision --autogenerate -m "Description of changes"
   ```

## Running the Server

Start the development server with hot-reload:

```bash
uvicorn app.main:app --reload
```

The API will be available at: http://localhost:8000

## API Documentation

Interactive API documentation is automatically generated:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── alembic/            # Database migrations
├── app/
│   ├── api/            # Route handlers
│   ├── core/           # Config, database connection
│   ├── models/         # SQLAlchemy ORM models
│   ├── schemas/        # Pydantic data models
│   └── main.py         # Application entry point
├── docker-compose.yml  # Database container config
├── pyproject.toml      # Project dependencies
└── README.md
```
