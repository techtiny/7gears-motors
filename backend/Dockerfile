FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn -q package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Create default uploads dir (overridden by Railway volume at /uploads)
RUN mkdir -p /uploads

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
