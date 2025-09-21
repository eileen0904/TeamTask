# TeamTask 協作平台
一個任務管理與團隊協作平台，支援個人任務管理和多人團隊協作。

## 功能特色
### 核心功能
- **個人任務管理**：簡潔易用的個人任務管理
- **團隊協作**：建立團隊、邀請成員、協作管理任務
- **拖拽式看板**：直觀的拖拽操作，支援待辦、進行中、已完成三個狀態
- **任務截止提醒**：設定截止時間，提醒過期任務
- **全部任務檢視**：統一查看所有個人和團隊任務

### 團隊管理
- **角色權限控制**：團隊擁有者和成員兩級權限
- **成員邀請系統**：透過用戶名稱邀請新成員
- **團隊生命週期**：完整的建立、管理、刪除功能
- **安全刪除機制**：防止誤刪，保護未完成任務

### 任務功能
- **任務分配**：指派任務給特定成員
- **截止時間管理**：設定和追蹤任務截止日期
- **狀態追蹤**：即時更新任務狀態
- **智能篩選**：按類型、狀態、截止時間篩選任務

## 技術架構
### 後端
- **框架**：Spring Boot 3.2.2
- **資料庫**：MySQL 8.0
- **安全認證**：JWT Token
- **ORM**：Spring Data JPA + Hibernate
- **容器化**：Docker + Docker Compose

### 前端
- **框架**：React 18 + TypeScript
- **建置工具**：Vite
- **UI 框架**：Tailwind CSS
- **拖拽功能**：@hello-pangea/dnd
- **路由管理**：React Router

### 資料庫設計
- **用戶表**：用戶基本資訊和認證
- **任務表**：任務詳情、狀態、截止時間
- **團隊表**：團隊資訊和建立者
- **團隊成員表**：成員關係和權限角色

## How to start
### Environment
- Docker and Docker Compose
- Node.js 16+ 
- JDK 17+

### Install and Run
1. **Clone the Repository**
```bash
git clone https://github.com/eileen0904/TeamTask.git
cd TeamTask
```

2. **Set Environment Variables**
```bash
# Create .env file
echo "MYSQL_ROOT_PASSWORD=your_secure_password" > .env
```

3. **Start Service**
```bash
# Start backend and database
docker-compose up -d

# Start frontend
cd frontend
npm install
npm run dev
```

4. **Visit Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

### Database Initialization
When running for the first time, the system will automatically create the necessary data tables. If you need to manually create:

```sql
docker exec -it teamtask-mysql mysql -u root -p

CREATE DATABASE IF NOT EXISTS taskdb;
USE taskdb;
```

## API 

### Auth API
```
POST /api/auth/register    # 用戶註冊
POST /api/auth/login       # 用戶登入
GET  /api/auth/me          # 獲取當前用戶資訊
```

### Task API
```
GET    /api/tasks          # 獲取任務列表
POST   /api/tasks          # 建立新任務
PUT    /api/tasks/{id}     # 更新任務
DELETE /api/tasks/{id}     # 刪除任務
GET    /api/tasks/personal # 獲取個人任務
GET    /api/tasks/all      # 獲取所有可訪問任務
```

### Team API
```
GET    /api/teams              # 獲取用戶團隊
POST   /api/teams              # 建立新團隊
DELETE /api/teams/{id}         # 刪除團隊
GET    /api/teams/{id}/tasks   # 獲取團隊任務
POST   /api/teams/{id}/tasks   # 建立團隊任務
GET    /api/teams/{id}/members # 獲取團隊成員
POST   /api/teams/{id}/members # 邀請團隊成員
DELETE /api/teams/{id}/members/{memberId} # 移除團隊成員
```

## User Guide
### 個人任務管理
1. 註冊並登入系統
2. 在主面板使用拖拽方式管理任務
3. 點擊任務卡片編輯詳情和設定截止時間
4. 使用「我的所有任務」檢視全部任務狀況

### 團隊協作
1. 前往「團隊管理」頁面建立團隊
2. 邀請其他用戶加入團隊
3. 在主面板切換到團隊模式
4. 協作管理團隊任務

### 權限說明
- **團隊擁有者**：完全控制權，可刪除團隊、邀請/移除成員，管理任務
- **成員**：可檢視和編輯團隊任務

## Develop
### Local Develop Environment
**Backend**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Project Structure
```
TeamTask/
├── backend/                 # Spring Boot 後端
│   ├── src/main/java/
│   │   └── com/example/backend/
│   │       ├── controller/  # REST API 控制器
│   │       ├── model/       # 資料模型
│   │       ├── repository/  # 資料存取層
│   │       └── security/    # 安全配置
│   └── Dockerfile
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # React 組件
│   │   ├── pages/         # 頁面組件
│   │   ├── services/      # API 服務
│   │   └── types/         # TypeScript 類型
│   └── package.json
├── docker-compose.yml     # Docker file
└── README.md
```

## Deploy

### Docker Deploy
1. **Set Production Environment Variables**
```bash
# .env.production
MYSQL_ROOT_PASSWORD=your_production_password
SPRING_PROFILES_ACTIVE=production
```

2. **Build and Deploy**
```bash
# Build frontend
cd frontend
npm run build

# Start production environment
docker-compose -f docker-compose.prod.yml up -d
```

## Changelog
### v1.0.0 (2025-09-20)
- 完整的個人任務管理功能
- 團隊協作系統
- 任務截止時間和提醒
- 全部任務檢視和篩選
- 角色權限控制
- 響應式設計