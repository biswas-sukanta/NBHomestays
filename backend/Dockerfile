# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy the POM and source code together
COPY pom.xml .
COPY libs ./libs
COPY src ./src

# Install vendored jar manually into the builder's local repository before resolution
RUN mvn install:install-file \
  -Dfile=libs/imagekit-java-2.0.1.jar \
  -DgroupId=com.github.imagekit-developer \
  -DartifactId=imagekit-java \
  -Dversion=2.0.1 \
  -Dpackaging=jar

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