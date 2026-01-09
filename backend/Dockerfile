# 第一階段：使用 Maven 進行編譯
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# 第二階段：使用輕量級 JRE 執行
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# 從第一階段複製編譯好的 JAR 檔
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]