# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────
# Stage 1: Build the fat JAR
# ─────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Gradle wrapper and dependency manifests first for better layer caching
COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts ./
COPY gradle/ gradle/

# Pre-fetch dependencies (layer cached as long as build files don't change)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon 2>/dev/null || true

# Copy source and build
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# ─────────────────────────────────────────────
# Stage 2: Minimal runtime image
# ─────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create the SQLite data directory (mapped to a named volume in docker-compose)
RUN mkdir -p /app/data

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
