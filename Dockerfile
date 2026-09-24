# Stage 1: Build the frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Copy frontend source
COPY 3d_map/frontend/package*.json ./
RUN npm install

COPY 3d_map/frontend/ ./
RUN npm run build

# Stage 2: Build the backend and serve the app
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies (needed for OpenCV, PostgreSQL libs, etc.)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY 3d_map/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project context to maintain the exact directory structure
COPY 3d_map/ /app/3d_map/

# Overwrite the empty frontend/dist with the built artifacts from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/3d_map/frontend/dist

# Expose the port Render uses
EXPOSE 10000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=10000
# Ensure Python can find the "app" module inside "3d_map/backend"
ENV PYTHONPATH=/app/3d_map/backend

# Run the FastAPI server. Render dynamically assigns a port to the $PORT env variable.
WORKDIR /app/3d_map/backend
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
