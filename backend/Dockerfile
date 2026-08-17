FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
ENV MAVEN_OPTS="-XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Xmx256m"
COPY pom.xml .
# Download dependencies first to cache them
RUN mvn dependency:go-offline -B || true
COPY src ./src
RUN mvn clean package -DskipTests -B -T 1C

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx384m", "-Xms128m", "-jar", "app.jar"]
