# Build context: repo root. Used by both Fly.io (see fly.toml) and
# Hugging Face Spaces (which requires Dockerfile at repo root).
# Mirrors monorepo layout under /app so paths.py REPO_ROOT resolves to /app
# and finds /app/data and /app/cities.

FROM python:3.11-slim

ENV MOMENTMARKT_WEATHER_SOURCE=live

RUN pip install --no-cache-dir uv==0.4.30

COPY apps/backend/pyproject.toml apps/backend/uv.lock /app/apps/backend/
WORKDIR /app/apps/backend
RUN uv sync --frozen --no-install-project --extra llm

COPY apps/backend/src /app/apps/backend/src
COPY data /app/data
COPY cities /app/cities

RUN uv sync --frozen --extra llm

EXPOSE 7860
# HF Spaces require port 7860 by default. Fly sets PORT=8000 via fly.toml.
CMD exec uv run --no-sync uvicorn momentmarkt_backend.main:app --host 0.0.0.0 --port ${PORT:-7860}
