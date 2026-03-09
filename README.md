# Web Bán Hàng (Production Ready)

Hệ thống bán hàng, quản lý kho, và cộng đồng mua bán được xây dựng với công nghệ hiện đại, bảo mật cao và sẵn sàng cho môi trường Production.

## 🚀 Tech Stack

- **Backend**: Node.js, Express, MySQL, Redis, Socket.IO
- **Frontend**: React, Vite, TailwindCSS
- **Database**: MySQL 8.0
- **Cache**: Redis
- **Container**: Docker, Docker Compose
- **Server**: Nginx (Reverse Proxy)

## ✨ Tính năng chính

- **Authentication**: JWT Access/Refresh Token Rotation, Secure Cookies, Session Management (Max 5 devices), Logout All.
- **Real-time**: Socket.IO cho thông báo, chat.
- **Database**: Tự động migration khi khởi động.
- **Security**: Rate Limiting, Helmet (Headers), CORS, CSRF Protection, Input Validation.
- **Monitoring**: Logging (Winston), Health Checks.

## 🛠 Cài đặt và Chạy (Docker - Khuyên dùng)

Cách đơn giản nhất để chạy toàn bộ hệ thống là sử dụng Docker Compose.

### 1. Clone Repo
```bash
git clone https://github.com/ThanhDuy-2006/DEMO_WEB.git
cd DEMO_WEB
```

### 2. Cấu hình biến môi trường
Copy file mẫu và chỉnh sửa nếu cần:
```bash
cp .env.example .env
```
*Lưu ý: Mặc định cấu hình trong `.env.example` đã tương thích với `docker-compose.yml`.*

### 3. Khởi chạy
```bash
docker-compose up -d --build
```
Hệ thống sẽ tự động:
- Build backend và frontend.
- Khởi tạo MySQL và Redis.
- Chạy script migration để tạo bảng dữ liệu.
- Backend chạy tại port `3000`.
- Frontend chạy tại port `80` (truy cập `http://localhost`).

### 4. Truy cập
- Web App: [http://localhost](http://localhost)
- API Health Check: [http://localhost/api/health](http://localhost/api/health)

## 💻 Cài đặt và Chạy (Local - Backend/Frontend riêng)

Nếu muốn chạy dev mode hoặc không dùng Docker:

### Backend
1. `cd backend`
2. `cp .env.example .env` (Chỉnh DB_HOST thành localhost)
3. `npm install`
4. `npm run dev`

### Frontend
1. `cd frontend`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

## 🚀 Deployment Guide (Production)

### 1. Frontend (Vercel - Recommended)
The React/Vite frontend is optimized for **Vercel**.

1. **Push Code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deploy"
   git push origin master
   ```

2. **Deploy on Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Import your GitHub repository.
   - **Root Directory**: Click `Edit` and select `frontend`.
   - **Build Command**: `npm run build` (Default).
   - **Output Directory**: `dist` (Default).
   - **Environment Variables**:
     - `VITE_API_URL`: URL of your deployed backend (e.g., `https://webbanhang-api.onrender.com/api`).
     - `VITE_SOCKET_URL`: URL of your deployed backend (e.g., `https://webbanhang-api.onrender.com`).
     - `VITE_RECAPTCHA_SITE_KEY`: Your production ReCaptcha key.

### 2. Backend & Database (Render / Railway)
**IMPORTANT**: The Backend uses **Socket.IO** (WebSockets) and **MySQL** (Stateful DB), which are NOT supported natively on Vercel Serverless Functions. You must deploy the backend to a provider that supports long-running processes like **Render**, **Railway**, or a **VPS**.

#### Option A: Render.com (Easiest Free Tier)
1. Create a [Render Account](https://render.com).
2. **Database (MySQL)**:
   - Create a new **MySQL** database (Free tier handles limited connections).
   - Copy the `Internal DB URL` or `External DB URL`.

3. **Backend Service**:
   - Create a new **Web Service**.
   - Connect your GitHub repo.
   - **Root Directory**: `backend`.
   - **Build Command**: `npm install`.
   - **Start Command**: `npm start`.
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: From your MySQL service.
     - `JWT_SECRET`: Random secure string.
     - `FRONTEND_URL`: `https://your-frontend.vercel.app` (The Vercel URL from Step 1).
     - `PORT`: `10000` (Render default).

#### Option B: Railway.app (Simpler, Paid after trial)
1. Create a new project on Railway.
2. Add **MySQL** plugin.
3. Add **Redis** plugin.
4. Deploy the Repo (it will auto-detect Dockerfile).
5. Set Environment Variables in Railway dashboard.

### 3. Final Connection
After deploying both:
1. Update `VITE_API_URL` in your Vercel project settings to point to the new Backend URL.
2. Update `FRONTEND_URL` in your Backend service settings to point to the new Vercel Frontend URL.
3. Redeploy both services.

## 📂 Cấu trúc thư mục

```
root/
├── backend/            # Source code Node.js
│   ├── src/
│   │   ├── modules/    # Module based structure
│   │   ├── scripts/    # Migration & Utilities
│   │   └── ...
│   ├── Dockerfile
│   └── ...
├── frontend/           # Source code React
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf      # Config Nginx cho Frontend container
│   └── ...
├── docker-compose.yml  # Orchestration
├── .env.example        # Mẫu biến môi trường
└── README.md
```

## 🔒 Security & Production Notes

- **JWT Rotation**: Refresh token có thời hạn 30 ngày, tự động xoay vòng. Access token 15 phút.
- **Cookies**: Sử dụng `HttpOnly`, `SameSite=Strict` (trong Production).
- **Session Limit**: Giới hạn 5 thiết bị/user. Tự động thu hồi session cũ nhất.
- **CORS**: Chỉ cho phép domain frontend gọi API.

## 🤝 Đóng góp
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
[MIT](https://choosealicense.com/licenses/mit/)
