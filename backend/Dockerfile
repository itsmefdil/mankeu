FROM python:3.12-slim-bookworm

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

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

# Place the virtual environment in the PATH so we can run installed commands directly
ENV PATH="/app/.venv/bin:$PATH"

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
