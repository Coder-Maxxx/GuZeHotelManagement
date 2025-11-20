# 🏨 Hotel Inventory Management System (酒店库存管理系统)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-v19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6)
![Vite](https://img.shields.io/badge/Vite-v6-646CFF)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC)

一个现代化、轻量级且功能全面的酒店/仓库库存管理系统。专为解决传统库存管理痛点而设计，支持多端实时同步、批量操作、权限管理以及深色模式体验。

---

## ✨ 核心功能 (Features)

### 📊 仪表盘与可视化
- **实时概览**：直观展示库存总价值、商品总数、低库存预警及出入库单据统计。
- **图表分析**：集成 Recharts，提供库存分类占比饼图和低库存预警条形图。

### 📦 高效库存管理
- **全生命周期管理**：商品的增删改查 (CRUD)，支持自定义分类与仓库位置。
- **批量出入库**：支持动态添加多行，一次性提交数十条出入库记录，极大提高工作效率。
- **智能校验**：输入时允许留空，提交时自动校验数值合法性（非负、非空）。
- **Excel 导出**：一键导出当前筛选后的库存清单为 `.xlsx` 格式。

### 🛡️ 安全与权限 (RBAC)
- **用户认证**：完整的登录流程，支持 **30分钟免登录**（本地会话持久化）。
- **角色权限**：
  - **管理员 (Admin)**：拥有最高权限，可管理所有用户、配置系统参数、执行库存归零。
  - **普通用户 (User)**：仅限正常的出入库操作及修改自身密码。
- **用户管理**：支持添加用户、删除用户、修改用户名及重置密码。

### 📝 历史记录与审计
- **完整审计日志**：记录每一笔出入库操作的时间、人员、数量及备注。
- **后悔药功能 (Undo)**：支持 **一键撤销** 最近的操作，系统自动计算并回滚库存数量，防止误操作。
- **历史导出**：支持导出出入库流水记录为 Excel 表格，方便对账。

### 🎨 极致体验
- **深色模式**：支持亮色/暗色主题一键切换，自动适配系统偏好。
- **响应式设计**：完美适配桌面端与移动端操作。

---

## 🛠 技术栈 (Tech Stack)

**前端 (Frontend):**
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Utils:** XLSX (SheetJS), Lucide React

**后端 (Backend & Database):**
- **BaaS:** Supabase (PostgreSQL)
- **Features:** Custom Auth Table, Realtime Database

**部署 (Deployment):**
- **Frontend Hosting:** Vercel
- **Database Hosting:** Supabase Cloud
- **Domain Name:** Spaceship

---

## 🚀 快速开始 (Getting Started)

### 1. 克隆项目
```bash
git clone https://github.com/your-username/hotel-inventory-system.git
cd hotel-inventory-system
```

### 2. 安装依赖
```bash
npm install
# 或
yarn install
```

### 3. 配置环境变量
在项目根目录新建 `.env` 文件，填入以下 Supabase 配置：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 启动本地开发服务器
```bash
npm run dev
# 或
yarn dev
```
打开浏览器访问 `http://localhost:5173`。

---

## 🗄️ 数据库设置 (Supabase Setup)

本项目依赖 Supabase 数据库。请在 Supabase 控制台的 **SQL Editor** 中运行以下脚本以初始化表结构和默认数据。

```sql
-- 1. 创建核心表结构
CREATE TABLE IF NOT EXISTS items (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text,
  location text,
  quantity numeric DEFAULT 0,
  unit text,
  "minStockLevel" numeric DEFAULT 0,
  price numeric DEFAULT 0,
  "lastUpdated" text,
  description text
);

CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  "itemId" text,
  "itemName" text,
  type text,
  quantity numeric,
  timestamp text,
  "user" text,
  notes text
);

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text,
  color text
);

CREATE TABLE IF NOT EXISTS locations (
  id text PRIMARY KEY,
  name text
);

-- 2. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 3. 插入默认管理员账号 (账号: admin / 密码: 123456)
INSERT INTO users (id, username, password, role) 
VALUES ('user_admin', 'admin', '123456', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 4. 关闭 RLS (行级安全策略) 以允许前端直接读写
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

---

## ☁️ 部署指南 (Deployment)

### 1. 部署到 Vercel
1. 将代码推送至 GitHub。
2. 登录 [Vercel](https://vercel.com)，点击 **"Add New..." -> "Project"**。
3. 导入你的 GitHub 仓库。
4. 在 **Environment Variables** 设置中添加：
   - `VITE_SUPABASE_URL`: 你的 Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: 你的 Supabase Anon Key
5. 点击 **Deploy**。

### 2. 配置自定义域名 (Spaceship)
1. 在 Spaceship 购买域名。
2. 在 Vercel 项目面板 -> **Settings** -> **Domains** 中添加你的域名 (例如 `inventory.yourdomain.com`)。
3. Vercel 会显示需要的 DNS 记录（通常是 CNAME pointing to `cname.vercel-dns.com`）。
4. 登录 Spaceship 控制台 -> **Advanced DNS**。
5. 添加 Vercel 提供的记录。
6. 等待 DNS 生效，Vercel 会自动配置 SSL 证书。

---

## 🤝 贡献 (Contributing)

欢迎提交 Pull Request 或 Issue！

1. Fork 本仓库
2. 创建分支 (`git checkout -b feature/NewFeature`)
3. 提交更改 (`git commit -m 'Add NewFeature'`)
4. 推送到分支 (`git push origin feature/NewFeature`)
5. 提交 Pull Request

---

## 📄 许可证 (License)

本项目采用 MIT 许可证。
