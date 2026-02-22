# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy the POM and source code together
COPY pom.xml .
COPY src ./src

# Let Maven download only the strictly required dependencies during the package phase
RUN mvn clean package -DskipTests

# Stage 2: Run (Low Memory Alpine Image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# CRITICAL: Container-aware flags for a 512MB hard limit
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=65.0", \
  "-XX:+TieredCompilation", \
  "-XX:TieredStopAtLevel=1", \
  "-Xss256k", \
  "-jar", "app.jar"]