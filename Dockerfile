# ─── Stage 1: Build Spring Boot backend ───────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS backend-build

# Install Maven
RUN apk add --no-cache maven

WORKDIR /app/backend

# Copy POM first for dependency layer caching
COPY backend/pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build the JAR (skip tests for faster builds)
COPY backend/src ./src
RUN mvn package -DskipTests -q

# ─── Stage 2: Build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ .
RUN npm run build

# ─── Stage 3: Production image ────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

# Install Node.js (for serving the frontend) and a lightweight static server
RUN apk add --no-cache nodejs npm && \
    npm install -g serve@14

WORKDIR /app

# Copy the Spring Boot JAR
COPY --from=backend-build /app/backend/target/motors-1.0.0.jar ./backend.jar

# Copy the built React app
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy the production startup script
COPY docker-start.sh ./start.sh
RUN chmod +x ./start.sh

# Expose frontend (3000) and backend (9090)
EXPOSE 3000 9090

CMD ["./start.sh"]
