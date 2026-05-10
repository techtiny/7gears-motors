# Stage 1: Build React frontend (no VITE_API_URL — uses relative /api same origin)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Embed frontend into Spring Boot static resources and build jar
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -q
COPY backend/src ./src
COPY --from=frontend /app/dist ./src/main/resources/static
RUN mvn package -DskipTests -q

# Stage 3: Run — single process, single port
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
