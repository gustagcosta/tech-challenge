FROM maven AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

FROM amazoncorretto:17

WORKDIR /app

COPY --from=build /app/target/catalog-0.0.1.jar /app/catalog-0.0.1.jar

EXPOSE 8082

CMD ["java", "-jar", "catalog-0.0.1.jar"]
