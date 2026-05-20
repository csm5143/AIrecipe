# AIrecipe - AI 智能食谱全栈应用

> 基于微信小程序的 AI 智能菜谱应用，配合后台管理系统与跨端移动应用。

## 项目简介

AIrecipe 是一个功能完整的 AI 智能食谱生成系统，包含：
- **微信小程序端** - 用户使用的小程序应用
- **后台管理系统** - Vue 3 + Element Plus 构建的管理后台
- **后台 API 服务** - Node.js + Express + Prisma 的 RESTful API
- **跨端移动应用** - 基于 uni-app + Vue 3 的多端应用

## 项目架构

```
airecipe/
├── server/                         # 后端服务
│   └── admin-api/                  # 后台管理 RESTful API
│       ├── src/
│       │   ├── config/             # 配置文件
│       │   ├── database/           # 数据库层 (Prisma)
│       │   ├── lib/                # 核心库
│       │   ├── modules/            # 功能模块
│       │   ├── services/           # 业务服务
│       │   ├── types/              # TypeScript 类型
│       │   └── utils/              # 工具函数
│       └── prisma/
│           └── schema.prisma        # 数据库模型
│
├── client/                         # 前端应用
│   ├── admin-web/                  # 后台管理系统 (Vue 3 + Vite)
│   └── mobile-app/                 # 跨端移动应用 (uni-app)
│
├── admin-web/                      # 独立部署的后台管理前端
│
├── miniprogram/                    # 微信小程序端
│   ├── pages/                      # 小程序页面
│   ├── subpackages/                # 分包
│   ├── cloudfunctions/             # 云函数
│   └── utils/                      # 工具函数
│
├── cloudfunctions/                 # 微信云函数集合
│   ├── login/                      # 登录云函数
│   ├── collections/                # 收藏云函数
│   ├── uploadRecipes/             # 上传菜谱
│   └── ...
│
├── packages/
│   └── shared-types/               # 前后端共享类型
│
├── scripts/                        # 构建/部署脚本
├── docs/                           # 项目文档
├── .husky/                         # Git hooks 配置
└── .github/                        # GitHub Actions 配置
```

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 微信小程序 | 原生 + TypeScript + 云开发 |
| 后台 API | Node.js + Express + TypeScript + Prisma + PostgreSQL |
| 后台管理前端 | Vue 3 + Vite + TypeScript + Element Plus + Pinia |
| 跨端移动端 | uni-app + Vue 3 |
| 数据库 | PostgreSQL 16 |
| 缓存 | 内存缓存 (进程内 Map) |
| CI/CD | GitHub Actions |

## 环境要求

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **PostgreSQL** >= 14.x
- ~~**Redis** >= 6.x~~ (已移除，改用内存缓存)
- **宝塔面板** (推荐，用于服务器部署和管理)

---

## 项目启动指南

### 方式一：本地开发

#### 1. 克隆项目

```bash
git clone <仓库地址>
cd AIrecipe
```

#### 2. 安装依赖

```bash
# 安装 pnpm (如果未安装)
npm install -g pnpm

# 安装根目录依赖
pnpm install

# 安装所有子项目依赖
pnpm install -r
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板
cp server/admin-api/env .env

# 编辑 .env 文件，配置数据库、Redis 等信息
```

主要配置项：

```env
# 数据库配置
DATABASE_URL=postgresql://postgres:password@localhost:5432/airecipe
DB_HOST=localhost
DB_PORT=5432
DB_NAME=airecipe
DB_USER=postgres
DB_PASSWORD=your_password

# Redis 配置
# REDIS_HOST=localhost
# REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 腾讯云 COS 配置 (可选)
TENCENT_COS_SECRET_ID=your_secret_id
TENCENT_COS_SECRET_KEY=your_secret_key
TENCENT_COS_BUCKET=your_bucket
TENCENT_COS_REGION=ap-guangzhou
TENCENT_COS_BASE_URL=https://your_bucket.cos.ap-guangzhou.myqcloud.com
```

#### 4. 数据库初始化

```bash
# 进入后端目录
cd server/admin-api

# 生成 Prisma 客户端
pnpm db:generate

# 推送数据库表结构
pnpm db:push

# (可选) 填充种子数据
pnpm db:seed
```

#### 5. 启动开发服务

在一个新的终端窗口中启动各个服务：

```bash
# 启动后台管理 API (端口 3000)
pnpm dev:admin-api

# 启动后台管理系统 (端口 5173)
pnpm dev:admin-web

# 启动跨端移动应用 (H5)
pnpm dev:mobile-app
```

服务地址：
- 后台管理 API: http://localhost:3000
- 后台管理系统: http://localhost:5173
- 跨端移动端 (H5): http://localhost:5174

---

### 方式二：宝塔面板部署 (推荐用于生产环境)

使用宝塔面板可以在服务器上直接管理 Node.js、PostgreSQL、Redis 和网站，无需 Docker。

#### 1. 服务器环境准备

在宝塔面板中安装以下软件：

- **Node.js** (版本 >= 18.x) — 通过宝塔「软件商店」→「Node.js版本管理器」安装
- **PM2** — 全局安装: `npm install -g pm2`
- **PostgreSQL** — 通过宝塔「软件商店」安装
- **Redis** — 通过宝塔「软件商店」安装
- **Nginx** — 通过宝塔「软件商店」安装

#### 2. 数据库创建

1. 打开宝塔「数据库」功能
2. 添加数据库，填写数据库名、用户名和密码（记住这些信息）
3. 选择 PostgreSQL 版本，点击提交

#### 3. 上传项目代码

1. 将项目代码上传到服务器，例如 `/www/wwwroot/airecipe/`
2. 进入项目目录: `cd /www/wwwroot/airecipe/`
3. 安装依赖: `pnpm install`
4. 进入后端目录: `cd server/admin-api`

#### 4. 配置环境变量

```bash
# 在项目根目录创建 .env 文件
cp server/admin-api/env .env
nano .env
```

主要配置项：

```env
# 数据库配置 (使用宝塔创建的数据库信息)
DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/airecipe
DB_HOST=localhost
DB_PORT=5432
DB_NAME=airecipe
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 配置
JWT_SECRET=your_random_jwt_secret_here
JWT_EXPIRES_IN=7d

# 端口配置
PORT=3000
NODE_ENV=production

# 腾讯云 COS (可选)
TENCENT_COS_SECRET_ID=your_secret_id
TENCENT_COS_SECRET_KEY=your_secret_key
TENCENT_COS_BUCKET=your_bucket
TENCENT_COS_REGION=ap-guangzhou
TENCENT_COS_BASE_URL=https://your_bucket.cos.ap-guangzhou.myqcloud.com
```

#### 5. 初始化数据库

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 推送数据库表结构
pnpm db:push

# (可选) 填充种子数据
pnpm db:seed
```

#### 6. 构建应用

```bash
# 构建后台 API
pnpm build:admin-api

# 构建后台管理 Web
pnpm build:admin-web
```

构建产物位于:
- `server/admin-api/dist/` — 后端 API 服务
- `client/admin-web/dist/` — 后台管理前端

#### 7. 使用 PM2 启动后端 API

```bash
# 进入后端目录
cd server/admin-api

# 使用 PM2 启动服务
pm2 start dist/index.js --name airecipe-api

# 设置开机自启
pm2 save
pm2 startup

# 查看状态
pm2 list
pm2 logs airecipe-api
```

#### 8. 宝塔网站配置 (Nginx)

1. 打开宝塔「网站」功能
2. 点击「添加站点」，填写：
   - 域名: `你的域名` 或 `服务器IP:端口`
   - 根目录: 选择 `/www/wwwroot/airecipe/client/admin-web/dist`
   - PHP版本: 选择「纯静态」
3. 点击提交

4. 点击站点「设置」→「反向代理」→「添加反向代理」：

   **API 反向代理:**
   - 代理名称: `API`
   - 目标URL: `http://127.0.0.1:3000`
   - 发送域名: `$host`

5. 点击「设置」→「配置文件」，在 `server {}` 块中添加以下配置：

```nginx
# API 反向代理
location /api/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# 上传文件访问
location /uploads/ {
    alias /www/wwwroot/airecipe/server/admin-api/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# SPA fallback
location / {
    try_files $uri $uri/ /index.html;
}
```

6. 点击「保存」并重启 Nginx

#### 9. 配置 SSL (可选)

1. 在宝塔「网站」中找到你的站点
2. 点击「SSL」→「Let's Encrypt」→「申请免费证书」
3. 申请成功后开启「强制HTTPS」

---

### 方式三：微信小程序开发

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

2. 导入项目
   - 项目目录选择 `miniprogram` 文件夹
   - AppID 填写你在微信公众平台获取的 AppID

---

## Git 工作流程

### 1. 克隆仓库

```bash
git clone <仓库地址>
cd AIrecipe
pnpm install
```

### 2. 创建功能分支

```bash
# 基于 main 创建新分支
git checkout -b feature/your-feature-name

# 或基于 dev 分支
git checkout -b feature/your-feature-name dev
```

### 3. 开发与提交

```bash
# 查看修改状态
git status

# 添加文件到暂存区
git add .

# 提交更改 (遵循 Conventional Commits 规范)
git commit -m "feat: add new recipe feature"
git commit -m "fix: resolve login issue"
git commit -m "docs: update README"
git commit -m "refactor: improve API response"

# 推送分支到远程
git push -u origin feature/your-feature-name
```

### 4. 提交信息规范

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

类型 (type)：
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码格式 (不影响功能)
- `refactor` - 重构
- `perf` - 性能优化
- `test` - 测试相关
- `build` - 构建相关
- `ci` - CI 配置
- `chore` - 其他更改

### 5. 合并分支

```bash
# 切换到主分支
git checkout main

# 拉取最新代码
git pull origin main

# 合并功能分支
git merge feature/your-feature-name

# 推送合并后的代码
git push origin main
```

### 6. 同步远程仓库

```bash
# 添加远程仓库 (如果需要)
git remote add origin <仓库地址>

# 查看远程仓库
git remote -v

# 拉取远程更新
git fetch origin
git pull origin main

# 删除本地分支
git branch -d feature/your-feature-name

# 删除远程分支
git push origin --delete feature/your-feature-name
```

---

## 可用脚本

在根目录执行：

```bash
# 开发模式
pnpm dev:admin-api       # 启动后台 API
pnpm dev:admin-web       # 启动后台管理系统
pnpm dev:mobile-app      # 启动移动端应用

# 构建
pnpm build:admin-api     # 构建后台 API
pnpm build:admin-web     # 构建后台管理系统
pnpm build:mobile-app    # 构建移动端应用

# 代码质量
pnpm lint                # 运行 ESLint
pnpm lint:fix            # 自动修复 ESLint 问题
pnpm typecheck           # TypeScript 类型检查
pnpm format              # Prettier 格式化

# 测试
pnpm test                # 运行测试
```

---

## 项目结构说明

### 后台 API (`server/admin-api`)

```
src/
├── index.ts              # 入口文件
├── config/               # 配置 (环境变量、CORS、安全等)
├── database/             # 数据库相关
│   ├── prisma/           # Prisma 配置
│   └── seeds/            # 种子数据
├── modules/              # 功能模块 (按功能划分)
│   ├── auth/             # 认证授权
│   ├── user/             # 用户管理
│   ├── recipe/           # 菜谱管理
│   ├── ingredient/       # 食材管理
│   ├── collection/       # 收藏夹
│   ├── feedback/         # 用户反馈
│   ├── content/          # 内容运营
│   ├── analytics/        # 数据分析
│   ├── notification/     # 消息通知
│   ├── upload/           # 文件上传
│   └── system/           # 系统设置
├── services/             # 业务逻辑服务
├── types/                # TypeScript 类型定义
└── utils/                # 工具函数
```

### 后台管理前端 (`client/admin-web`)

```
src/
├── api/                  # API 请求封装
├── components/           # 组件
│   ├── common/          # 通用组件
│   └── layout/          # 布局组件
├── views/                # 页面视图
│   ├── dashboard/       # 数据看板
│   ├── user/            # 用户管理
│   ├── recipe/          # 菜谱管理
│   ├── ingredient/      # 食材管理
│   ├── collection/      # 收藏管理
│   ├── feedback/        # 反馈管理
│   ├── content/         # 内容运营
│   ├── recipe-audit/    # 菜谱审核
│   ├── system/          # 系统设置
│   ├── login/           # 登录页
│   ├── profile/         # 个人中心
│   └── error/           # 错误页面
├── store/               # Pinia 状态管理
├── router/              # Vue Router 路由
├── styles/              # 全局样式
├── utils/               # 工具函数
└── assets/              # 静态资源
```

---

## 常见问题

### 1. 数据库连接失败

确保 PostgreSQL 服务已启动，并且 `.env` 中的 `DATABASE_URL` 配置正确。

### 2. 端口被占用

修改 `package.json` 中的端口配置，或在启动命令中指定端口：

```bash
PORT=3001 pnpm dev:admin-api
```

### 3. PM2 进程异常退出

检查 API 日志定位问题：

```bash
pm2 logs airecipe-api
```

常见原因：数据库连接失败、端口被占用。

### 4. 宝塔 Nginx 502 Bad Gateway

- 检查后端 API 是否正常运行: `pm2 list`
- 检查反向代理配置是否正确指向 `127.0.0.1:3000`
- 检查防火墙是否放行了对应端口

---

## License

MIT License
