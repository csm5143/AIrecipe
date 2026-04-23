# 吃了么-AI菜谱 APP

基于 UniApp 的跨平台 AI 智能菜谱生成应用。

## 技术栈

- **框架**: UniApp + Vue 3
- **状态管理**: Pinia
- **样式**: SCSS
- **类型**: TypeScript

## 项目结构

```
airecipe-app/
├── src/
│   ├── api/                 # API 请求封装
│   ├── components/         # 通用组件
│   ├── config/             # 配置文件
│   ├── pages/              # 页面
│   ├── pages-sub/          # 分包页面
│   ├── store/              # 状态管理
│   ├── styles/             # 全局样式
│   ├── types/              # 类型定义
│   └── utils/              # 工具函数
├── static/                 # 静态资源
├── App.vue                 # 应用入口
├── main.ts                 # 主入口
├── manifest.json           # 应用配置
├── pages.json              # 页面路由配置
└── vite.config.ts          # Vite 配置
```

## 快速开始

### 安装依赖

```bash
cd client/mobile-app
pnpm install
```

### 开发模式

```bash
# H5 开发
pnpm dev:h5

# 小程序开发
pnpm dev:mp-weixin

# APP 开发
pnpm dev:app
```

### 构建发布

```bash
# 构建 H5
pnpm build:h5

# 构建 Android
pnpm build:app-android

# 构建 iOS
pnpm build:app-ios
```

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| /pages/index/index | 首页 | 首页、推荐食谱 |
| /pages/search/index | 搜索 | 搜索菜谱、食材 |
| /pages/scan/index | 拍照识别 | AI 拍照识别食材 |
| /pages/collection/index | 收藏 | 我的收藏 |
| /pages/mine/index | 我的 | 个人中心 |
| /pages/login/index | 登录 | 用户登录 |
| /pages/recipe/list | 菜谱列表 | 分类浏览 |
| /pages/recipe/detail | 菜谱详情 | 菜谱详细信息 |

## API 接口

需要配合 `server/admin-api` 后端服务使用，确保后端服务已启动。

开发环境: `http://localhost:3000/api/v1`
生产环境: `https://api.airecipe.com/api/v1`

## 功能模块

- [x] 首页推荐
- [x] 菜谱搜索
- [x] AI 拍照识别食材
- [x] 菜谱详情
- [x] 收藏管理
- [x] 用户登录
- [x] 儿童营养专区
- [x] 健身餐专区

## License

MIT
