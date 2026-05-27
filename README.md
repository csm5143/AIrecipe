# AIrecipe — 智能菜谱全栈应用

基于微信小程序的 AI 智能菜谱平台，支持 AI 拍照识材、智能生图、菜谱管理、收藏夹、小冰箱等功能。

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
