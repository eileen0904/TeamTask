# 使用官方的 Java 17 輕量級映像檔作為基礎
FROM openjdk:17-jdk-slim

# 將工作目錄設定在 /app
WORKDIR /app

# 將 Maven 專案的打包結果（JAR 檔案）複製到容器中
# 假設你已經在本地執行了 mvn package 命令來生成 JAR
# 檔案名來自你的 pom.xml 中的 <artifactId>-<version>.jar
# backend-0.0.1-SNAPSHOT.jar
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

# 定義容器啟動時執行的命令
# -jar 參數用來運行 JAR 檔案
CMD ["java", "-jar", "app.jar"]