# Stage 1: Builder
FROM ghcr.io/astral-sh/uv:python3.12-alpine AS builder

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy the lockfile and pyproject.toml
COPY uv.lock pyproject.toml ./

# Install dependencies
# We use --frozen to ensure strict adherence to the lockfile
# We install the project dependencies but not the project itself yet
RUN uv sync --frozen --no-install-project

# Copy the rest of the application
COPY . .

# Install the project itself
RUN uv sync --frozen

# Stage 2: Runtime
FROM python:3.12-alpine

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /app/.venv /app/.venv

# Copy application code and necessary configuration files
COPY app /app/app
COPY alembic /app/alembic
COPY alembic.ini /app/alembic.ini

# Place the virtual environment in the PATH
ENV PATH="/app/.venv/bin:$PATH"

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
