# AIrecipe — 智能菜谱全栈应用

基于微信小程序的 AI 智能菜谱平台，支持 AI 拍照识材、智能生图、菜谱管理、收藏夹、小冰箱等功能。

## 功能概览

### 🧑‍🍳 用户端（微信小程序）

| 功能 | 说明 |
|------|------|
| 📷 AI 拍照识材 | 拍一张冰箱或食材照片，AI 自动识别食材并推荐可做的菜谱 |
| 🔍 菜谱浏览与搜索 | 按分类/菜系/难度/餐次浏览，支持多关键词搜索和拼音搜索 |
| 📋 分步烹饪指导 | 每道菜含详细步骤图、食材用量、营养数据，边看边做 |
| ⭐ 收藏夹系统 | 创建多个收藏夹，分类管理喜欢的菜谱，支持拖拽排序 |
| 🧊 小冰箱 | 记录家中现有食材，自动匹配可做菜谱，减少浪费 |
| 🧺 小菜篮 | 从菜谱一键添加食材到采购清单，采购时逐项勾选 |
| 📅 每日推荐 | 基于精选菜谱的个性化每日推荐，支持下拉刷新 |
| 🎯 健身餐 & 儿童餐 | 按健身目标和儿童年龄段定制的专属菜谱模式 |
| ✍️ 用户投稿 | 支持用户上传原创菜谱、浏览社区作品 |

### 🖥️ 管理端（Vue3 后台）

| 功能 | 说明 |
|------|------|
| 🎨 AI 智能生图 | 选择 Prompt 模板，一键生成菜谱封面、步骤图、Banner、卡片图标 |
| ✏️ AI 文案生成 | 输入主题自动生成运营公告和推送文案 |
| 📊 数据看板 | 核心指标概览：用户数、菜谱数、浏览量、收藏量趋势 |
| 📝 菜谱管理 | 创建/编辑/删除菜谱，配置步骤、食材、分类标签、精选/热门标记 |
| 🥬 食材字典 | 统一管理食材名称、分类、单位、营养数据 |
| 👥 用户管理 | 查看用户列表、登录记录、操作日志 |
| 💬 反馈处理 | 查看和回复用户反馈，标记处理状态 |
| 🔒 权限控制 | RBAC 四角色：超级管理员 / 管理员 / 编辑 / 审核员 |
| 🗑️ 回收站 | 软删除 + 恢复机制，误删可找回 |
| 🔑 API Key 管理 | 统一管理 AI 服务的 API Key，支持配额监控和分类（文/图/多模态） |

### ⚙️ 技术亮点

- **Monorepo 架构**：pnpm workspace 统一管理前后端依赖，一条命令启动全部服务
- **LRU 缓存**：服务端内存缓存（max 1000 条，TTL 60-300s），首页响应提速 10x
- **并发控制**：in-flight Promise Map 防止缓存击穿，翻页请求并行化
- **安全机制**：JWT 双 token 刷新、竞态锁防重复请求、全局 401 拦截
- **SQL 优化**：批量查询替代 N+1、聚合接口减少请求次数、Prisma 事务保证数据一致性

## 项目结构

```
AIrecipe/
├── server/
│   └── admin-api/                     # 后端 API 服务 (Express + Prisma + PostgreSQL)
│       ├── prisma/
│       │   ├── schema.prisma          # 数据库模型定义（19 个表）
│       │   └── migrations/            # 数据库迁移文件
│       └── src/
│           ├── index.ts               # 服务入口，路由注册，中间件配置
│           ├── config/                # 环境变量、COS、应用配置
│           ├── lib/                   # Prisma 客户端、缓存（LRU + TTL）
│           ├── modules/               # 功能模块（按领域划分）
│           │   ├── auth/              # JWT 认证、RBAC 权限（4 角色）
│           │   ├── admin/             # 管理员账号管理
│           │   ├── ai/                # AI 生图、文案生成、模板管理
│           │   ├── ai-key/            # API Key 管理（图文分类配额）
│           │   ├── ai-scan/           # AI 拍照识材
│           │   ├── analytics/         # 数据统计看板
│           │   ├── app/               # 小程序端 API（菜谱/食材/收藏）
│           │   ├── collection/        # 收藏夹 CRUD
│           │   ├── content/           # Banner、公告等内容运营
│           │   ├── featured/          # 精选菜谱管理
│           │   ├── feedback/          # 用户反馈处理
│           │   ├── fridge/            # 小冰箱食材管理
│           │   ├── ingredient/        # 食材字典管理
│           │   ├── operation-logs/    # 管理员操作日志
│           │   ├── recipe/            # 菜谱 CRUD + 热门管理
│           │   ├── recipe-audit/      # 用户投稿审核
│           │   ├── recycle-bin/       # 软删除回收站
│           │   ├── system/            # 系统设置、站点配置
│           │   ├── upload/            # 文件上传
│           │   ├── user/              # 用户管理
│           │   ├── user-recipe/       # 用户菜谱社区
│           │   └── wx/                # 微信登录、小程序路由聚合
│           ├── services/              # 业务逻辑层
│           │   ├── aiImage.service.ts # AI 图片生成（动态模板 + COS 上传）
│           │   ├── aiText.service.ts  # AI 文案生成
│           │   ├── cos.service.ts     # 腾讯云 COS 上传封装
│           │   └── export.service.ts  # Excel 导出
│           ├── types/                 # TypeScript 响应类型
│           └── utils/                 # 工具函数（权限、辅助方法）
│
├── client/
│   ├── miniprogram/                   # 微信小程序（原生 + TypeScript）
│   │   ├── app.ts                     # 全局入口，401 拦截，预加载
│   │   ├── pages/                     # 主包页面
│   │   │   ├── index/                 # 首页（推荐 + 分类）
│   │   │   ├── recipes/               # 菜谱详情 + 列表
│   │   │   ├── search/                # 搜索页
│   │   │   ├── scan/                  # AI 拍照识材
│   │   │   ├── basket/                # 小菜篮
│   │   │   ├── fridge/                # 小冰箱
│   │   │   ├── collections/           # 收藏夹列表
│   │   │   ├── collection-detail/     # 收藏夹详情
│   │   │   ├── collection-edit/       # 编辑收藏夹
│   │   │   ├── custom/                # 定制页（健身/儿童）
│   │   │   ├── ingredients/           # 食材选择页
│   │   │   ├── mine/                  # 个人中心
│   │   │   └── preference/            # 偏好设置
│   │   ├── subpackages/               # 分包
│   │   │   ├── lowfreq/               # 低频页面（登录/反馈/健身/儿童）
│   │   │   └── user-recipe/           # 用户菜谱社区（上传/浏览）
│   │   ├── components/                # 公共组件
│   │   ├── utils/                     # 工具函数、API 封装、缓存、索引
│   │   ├── types/                     # TypeScript 类型
│   │   └── assets/                    # 图片、图标等静态资源
│   │
│   ├── admin-web/                     # 后台管理系统 (Vue 3 + Element Plus + Vite)
│   │   └── src/
│   │       ├── api/                   # API 请求层（18 个模块）
│   │       ├── views/                 # 页面视图
│   │       │   ├── dashboard/         # 数据看板
│   │       │   ├── recipe/            # 菜谱管理（列表/创建/编辑）
│   │       │   ├── ingredient/        # 食材管理
│   │       │   ├── user/              # 用户管理
│   │       │   ├── feedback/          # 反馈管理
│   │       │   ├── content/           # 内容运营 + AI 生图工作台
│   │       │   ├── hot-recipes/       # 热门菜谱管理
│   │       │   ├── featured/          # 精选菜谱管理
│   │       │   ├── ai-scan/           # AI 扫描记录
│   │       │   ├── recipe-audit/      # 菜谱审核
│   │       │   ├── system/            # 系统设置（站点/Key/管理员）
│   │       │   ├── recycle/           # 回收站
│   │       │   ├── login/             # 登录
│   │       │   └── profile/           # 个人中心
│   │       ├── components/            # 公共组件（布局/导出弹窗）
│   │       ├── store/                 # Pinia 状态管理
│   │       ├── router/                # 路由配置 + 权限守卫
│   │       ├── composables/           # 组合式函数（useExport 等）
│   │       ├── utils/                 # 工具函数（权限/COS 上传/请求封装）
│   │       └── styles/                # 全局样式
│   │
│   ├── mobile-app/                    # 跨端移动 App (UniApp + Vue 3)
│   │   └── src/
│   │       ├── pages/                 # 主页面（首页/菜谱/搜索/扫码/我的）
│   │       ├── pages-sub/             # 子页面（健身/儿童食谱）
│   │       ├── components/            # 公共组件（TabBar/RecipeCard）
│   │       ├── api/                   # API 请求封装
│   │       ├── store/                 # Pinia 状态管理
│   │       ├── config/                # 环境配置
│   │       ├── types/                 # TypeScript 类型
│   │       └── utils/                 # 工具函数（auth/storage/navigate）
│   │
│   └── web/                           # 产品介绍落地页 (Vue 3 + Vite)
│       └── src/                       # 页面组件 + 资源
│
├── packages/
│   └── shared-types/                  # 前后端共享 TypeScript 类型定义
│
├── scripts/                           # 数据库迁移脚本
├── .github/workflows/                 # GitHub Actions CI/CD 配置
├── .husky/                            # Git hooks（pre-commit lint）
│
├── .env.example                       # 环境变量配置模板（开源贡献者参考）
├── .gitignore                         # Git 忽略规则
├── .gitattributes                     # 换行符统一（LF）
├── package.json                       # Monorepo 根配置（公共脚本 + 依赖）
├── pnpm-workspace.yaml                # pnpm 工作空间配置
├── pnpm-lock.yaml                     # 依赖版本锁定文件
└── tsconfig.json                      # TypeScript 基础配置
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Express + TypeScript + Prisma + PostgreSQL |
| 后台管理 | Vue 3 + Vite + Element Plus + Pinia |
| 微信小程序 | 原生小程序 + TypeScript |
| 移动 App | UniApp + Vue 3 |
| 产品官网 | Vue 3 + Vite |
| 缓存 | 内存 LRU（max 1000，TTL 60-300s） |
| 对象存储 | 腾讯云 COS |
| AI 服务 | OpenAI 兼容 API（DeepSeek / 豆包 / GPT） |
| 内网穿透 | NATAPP |
| 包管理 | pnpm (monorepo) |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14

### 安装与启动

```bash
# 安装依赖
pnpm install

# 配置环境变量（从模板复制）
cp .env.example server/admin-api/env
# 编辑 server/admin-api/env 填入真实值

# 初始化数据库
cd server/admin-api
pnpm db:generate
pnpm db:push
pnpm db:seed          # 可选：填充种子数据

# 启动开发服务
cd ../..
pnpm dev:admin-api    # 后端 → http://localhost:3000
pnpm dev:admin-web    # 后台 → http://localhost:5173
```

### 可用命令

```bash
pnpm dev:admin-api      # 启动后端 API
pnpm dev:admin-web      # 启动后台管理系统
pnpm dev:mobile-app     # 启动移动端应用
pnpm build:admin-api    # 构建后端
pnpm build:admin-web    # 构建后台前端
pnpm lint               # 代码检查
pnpm typecheck          # 类型检查
pnpm format             # 格式化代码
```

## 环境变量

参考 `.env.example`，主要配置项：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 |
| `JWT_SECRET` | JWT 签名密钥（至少 32 位随机字符串） |
| `WECHAT_APPID` / `WECHAT_SECRET` | 微信小程序凭证 |
| `TENCENT_COS_*` | 腾讯云 COS 对象存储配置 |
| `DEEPSEEK_API_KEY` / `DOUBAO_API_KEY` | AI 服务 API Key |

## 权限体系

| 角色 | 权限范围 |
|------|---------|
| SUPER_ADMIN | 全部权限（含系统设置、管理员管理） |
| ADMIN | 内容管理 + AI 功能 + 数据统计 |
| EDITOR | 菜谱/食材/内容编辑 |
| AUDITOR | 只看不操作（审核员） |

## License

MIT
