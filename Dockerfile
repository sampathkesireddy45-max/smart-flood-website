# ====================================================================
# SURAKSHA-FLOOD Production Multi-Stage Container Dockerfile
# Stage 1: Build React 19 Frontend with Vite
# Stage 2: FastAPI Uvicorn Server serving both API & Built SPA
# ====================================================================

# --- STAGE 1: FRONTEND BUILD ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source and build production bundle
COPY frontend/ ./
RUN npm run build

# --- STAGE 2: BACKEND & ALL-IN-ONE RUNTIME ---
FROM python:3.11-slim AS runner

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENV=production \
    PORT=8000 \
    DATA_MODE=live

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy Backend Application
COPY backend /app/backend

# Copy Built Frontend Distribution from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Ensure Uploads Directory Exists
RUN mkdir -p /app/backend/uploads

WORKDIR /app/backend

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start Uvicorn bound to dynamic PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
