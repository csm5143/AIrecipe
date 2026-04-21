# AIrecipe - AI菜谱生成小程序 · 全栈项目

> 基于微信小程序的 AI 智能菜谱应用，配合后台管理系统与跨端移动应用。

## 项目架构

```
airecipe/
├── server/                         # 后端服务
│   └── admin-api/                  # 后台管理 RESTful API
│       └── src/
│           ├── config/             # 配置文件 (环境变量、数据库、安全等)
│           ├── modules/            # 功能模块 (MVC)
│           │   ├── auth/           # 认证授权
│           │   ├── user/           # 用户管理
│           │   ├── recipe/         # 食谱管理
│           │   ├── ingredient/    # 食材管理
│           │   ├── collection/     # 收藏夹管理
│           │   ├── feedback/       # 用户反馈
│           │   ├── content/        # 内容运营 (Banner/通知)
│           │   ├── analytics/     # 数据分析
│           │   ├── notification/   # 消息通知
│           │   ├── upload/         # 文件上传
│           │   └── system/         # 系统设置
│           ├── database/           # 数据库层
│           │   ├── models/         # 数据模型
│           │   ├── migrations/     # 数据库迁移
│           │   └── seeds/         # 种子数据
│           ├── utils/             # 工具函数
│           └── types/             # TypeScript 类型定义
│       └── tests/                 # 测试文件
│
├── client/                         # 前端应用
│   ├── admin-web/                 # 后台管理系统 (Vue 3 + Element Plus)
│   │   └── src/
│   │       ├── api/              # API 请求封装
│   │       ├── components/       # 通用组件
│   │       │   ├── common/      # 基础组件
│   │       │   ├── layout/       # 布局组件
│   │       │   ├── form/         # 表单组件
│   │       │   └── chart/        # 图表组件
│   │       ├── views/            # 页面视图
│   │       │   ├── dashboard/    # 数据看板
│   │       │   ├── user/         # 用户管理
│   │       │   ├── recipe/       # 食谱管理
│   │       │   ├── ingredient/   # 食材管理
│   │       │   ├── collection/   # 收藏管理
│   │       │   ├── feedback/     # 反馈管理
│   │       │   ├── content/      # 内容运营
│   │       │   ├── system/       # 系统设置
│   │       │   ├── login/        # 登录页
│   │       │   └── error/        # 错误页面
│   │       ├── store/            # 状态管理
│   │       ├── router/           # 路由配置
│   │       ├── styles/           # 全局样式
│   │       ├── utils/            # 工具函数
│   │       ├── locales/          # 国际化
│   │       └── assets/           # 静态资源
│   │
│   └── mobile-app/               # 跨端移动应用 (React Native / Taro)
│       └── src/
│           ├── api/              # API 请求封装
│           ├── components/       # 通用组件
│           ├── pages/            # 页面
│           │   └── user/         # 用户相关页面
│           ├── store/            # 状态管理
│           ├── router/           # 路由配置
│           ├── styles/           # 全局样式
│           ├── utils/            # 工具函数
│           └── locales/          # 国际化
│
├── packages/
│   └── shared-types/             # 前后端共享 TypeScript 类型
│       └── src/
│
├── miniprogram/                  # 微信小程序端 (现有)
├── cloudfunctions/               # 微信云函数 (现有)
├── typings/                      # TypeScript 类型声明 (现有)
│
├── scripts/                      # 构建/部署脚本
├── docs/                         # 项目文档
│
├── .vscode/                      # VSCode 工作区配置
│   └── settings.json
│
├── package.json                  # 根目录 workspace 配置
├── docker-compose.yml            # Docker 编排配置
├── .env.example                  # 环境变量示例
├── .gitignore
└── README.md
```

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 微信小程序 | 原生 + TypeScript + 云开发 |
| 后台 API | Node.js + Express/Koa + TypeScript + Prisma + MySQL |
| 后台管理前端 | Vue 3 + Vite + TypeScript + Element Plus + Pinia |
| 跨端移动端 | Taro + React + TypeScript |
| 共享类型 | TypeScript + tsd |
| 容器化 | Docker + Docker Compose |
| CI/CD | GitHub Actions |

## 快速开始

### 环境要求

- Node.js >= 18.x
- pnpm >= 8.x
- Docker & Docker Compose (可选)

### 安装依赖

```bash
# 安装根 workspace 依赖
pnpm install

# 安装所有子项目依赖
pnpm install -r
```

### 开发模式

```bash
# 启动后台管理 API (开发环境)
pnpm dev:admin-api

# 启动后台管理系统 (开发环境)
pnpm dev:admin-web

# 启动移动端应用 (开发环境)
pnpm dev:mobile-app
```

### Docker 部署

```bash
docker-compose up -d
```

## Git 工作流

```bash
# 克隆仓库
git clone <repository-url>

# 创建功能分支
git checkout -b feature/recipe-management

# 提交更改
git add .
git commit -m "feat: add recipe CRUD operations"

# 推送到远程
git push -u origin feature/recipe-management

# 创建 Pull Request
```

## License

MIT
