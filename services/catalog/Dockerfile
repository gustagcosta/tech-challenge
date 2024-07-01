FROM amazoncorretto:17 AS build

WORKDIR /app

COPY . .

RUN ./mvnw clean package -DskipTests

FROM amazoncorretto:17

WORKDIR /app

COPY --from=build /app/target/catalog-0.0.1.jar /app/catalog-0.0.1.jar

EXPOSE 8080

ENV SPRING_DATASOURCE_URL="jdbc:mysql://mysql:3306/docker?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC"
ENV SPRING_DATASOURCE_USERNAME="docker"
ENV SPRING_DATASOURCE_PASSWORD="docker"

CMD ["java", "-jar", "catalog-0.0.1.jar"]
