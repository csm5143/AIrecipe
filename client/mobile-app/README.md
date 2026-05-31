# 吃了么 · AI 菜谱

基于 Flutter 的跨平台 AI 智能菜谱应用。拍照识别食材、AI 对话定制菜谱、社区分享美食作品，一站式解决「今天吃什么」。

## 设计语言

**冷调极简 · 食物前置**。UI 是白盘子，食物是唯一主角。冷白底让食物照片的色泽和温度自然跳出，液体玻璃在冷调底上透光感和折射更明显。

核心视觉特征：
- **大留白**：页面透气，UI 退后，内容向前
- **液体玻璃**：导航栏、卡片、弹窗大面积使用 `BackdropFilter` + 内阴影折射，模拟物理玻璃的厚度和透光感
- **柔和阴影**：影子取背景冷灰色系，透明度低，层次温和不刺眼
- **圆角体系**：统一的大圆角语言（22px 底栏 / 16px 卡片 / 14px 按钮）
- **动态模糊**：滚动时背景内容透过玻璃产生真实的景深感

底部悬浮药丸形导航栏是全局骨架，液体玻璃效果让它「浮」在内容之上，手指滑动时后方内容自然模糊。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Flutter 3.x |
| 语言 | Dart |
| 状态管理 | Riverpod（推荐）/ Bloc / Provider |
| 路由 | go_router |
| 网络请求 | dio |
| 本地存储 | shared_preferences + sqflite / drift |
| 样式方案 | ThemeData + 自定义 Widget，冷白底/高级黑，食物前置 |
| 目标平台 | iOS / Android / Web |

## 项目结构

```
mobile-app/
├── lib/
│   ├── main.dart                  # 应用入口
│   ├── app.dart                   # MaterialApp 配置（路由 / 主题）
│   ├── config/
│   │   ├── theme.dart             # 全局主题（冷调极简 · 冷白底/高级黑）
│   │   ├── glass_theme.dart       # 液体玻璃样式常量（模糊 / 阴影 / 边框）
│   │   ├── routes.dart            # 路由表（go_router）
│   │   └── constants.dart         # 常量（API 地址 / 分页大小等）
│   ├── models/                    # 数据模型
│   │   ├── recipe.dart            # 菜谱模型
│   │   ├── post.dart              # 帖子模型
│   │   ├── ingredient.dart        # 食材模型
│   │   ├── user.dart              # 用户模型
│   │   └── collection.dart        # 收藏夹模型
│   ├── services/                  # 业务逻辑 & API 调用
│   │   ├── api/
│   │   │   ├── http_client.dart   # dio 实例（拦截器 / Token 注入）
│   │   │   ├── auth_api.dart      # 认证接口
│   │   │   ├── recipe_api.dart    # 菜谱接口
│   │   │   ├── post_api.dart      # 帖子接口
│   │   │   ├── ai_api.dart        # AI 对话接口
│   │   │   ├── collection_api.dart# 收藏接口
│   │   │   ├── ingredient_api.dart# 食材接口
│   │   │   └── content_api.dart   # Banner / 公告接口
│   │   ├── auth_service.dart      # 认证逻辑（登录 / 注册 / Token 管理）
│   │   ├── storage_service.dart   # 本地持久化
│   │   └── upload_service.dart    # 文件上传
│   ├── providers/                 # Riverpod providers
│   │   ├── auth_provider.dart
│   │   ├── recipe_provider.dart
│   │   ├── ai_provider.dart
│   │   └── collection_provider.dart
│   ├── pages/                     # 页面
│   │   ├── home/
│   │   │   └── home_page.dart     # 首页（搜索 + Banner + 瀑布流Feed）
│   │   ├── ai/
│   │   │   ├── ai_page.dart       # AI 入口页（建议气泡 + 对话历史）
│   │   │   └── chat_page.dart     # 全屏对话页
│   │   ├── collection/
│   │   │   └── collection_page.dart # 收藏（食材 / 收藏夹 / 历史）
│   │   ├── mine/
│   │   │   └── mine_page.dart     # 我的（个人中心 / 设置）
│   │   ├── notifications/
│   │   │   └── notifications_page.dart # 通知列表
│   │   ├── login/
│   │   │   └── login_page.dart    # 登录 & 注册
│   │   ├── recipe_detail/
│   │   │   └── recipe_detail_page.dart # 菜谱详情
│   │   └── post_detail/
│   │       └── post_detail_page.dart   # 帖子详情
│   └── widgets/                   # 通用组件
│       ├── glass_scaffold.dart    # 液体玻璃 Scaffold 外壳
│       ├── bottom_nav_bar.dart    # 液体玻璃悬浮底栏
│       ├── publish_sheet.dart     # + 发布弹出菜单
│       ├── recipe_card.dart       # 菜谱卡片
│       ├── post_card.dart         # 帖子卡片
│       ├── search_bar.dart        # 搜索栏
│       ├── ai_float_button.dart   # AI 液体玻璃悬浮球
│       ├── notification_bell.dart  # 铃铛通知 + 液体玻璃预览面板
│       ├── banner_carousel.dart   # Banner 轮播
│       └── empty_state.dart       # 空状态占位
├── assets/
│   ├── images/                    # 图片资源
│   ├── icons/                     # 图标资源
│   └── fonts/                     # 字体文件
├── test/                          # 单元测试 & Widget 测试
├── pubspec.yaml                   # 依赖配置
├── analysis_options.yaml          # Dart 静态分析配置
└── README.md
```

## 功能架构

### 底部导航

底部悬浮药丸形导航栏，使用 `ClipRRect` + `BackdropFilter` 实现液体玻璃效果，`BoxDecoration` 内阴影模拟玻璃边缘折射光。

| Tab | 功能 |
|---|---|
| 🏠 **首页** | 搜索 + Banner + 瀑布流混合内容Feed |
| 🤖 **AI** | 智能对话助手，多模态输入，结合用户食材定制化 |
| ➕ **发布** | 上传菜谱 / 发帖子 / 拍照识别食材 |
| ❤️ **收藏** | 我的食材（冰箱+菜篮）/ 收藏夹 / 浏览历史 |
| 👤 **我的** | 个人中心 / 社交数据 / 成就 / 设置 |

### 各页面详解

#### 🏠 首页

- **顶部工具栏**：左侧汉堡菜单（侧边栏入口），中间搜索栏（菜谱名 / 食材 / 标签分类 / 拼音），右侧铃铛通知图标
- **通知预览面板**：点击铃铛时从图标下方展开液体玻璃面板（`AnimatedContainer` + `BackdropFilter`），显示最近 4 条通知摘要（头像 + 昵称 + 动作摘要），超出部分底部显示「查看全部 N 条通知 →」，点击跳转完整通知页。面板点击外部区域或再次点击铃铛收起
- **Banner 轮播**：`PageView` + 自动轮播，展示活动推广与公告
- **瀑布流混合 Feed**：菜谱卡片和帖子卡片使用 `flutter_staggered_grid_view` 在同一流中混排，`RefreshIndicator` 下拉刷新、`ScrollController` 上滑加载更多

#### 🤖 AI 助手（入口页）

点击底部 AI Tab 后，当前页面背景虚化（`BackdropFilter` + 暗色遮罩叠加），上方浮现最近对话历史卡片，底部导航栏上方出现液体玻璃「开始对话」气泡按钮。

- **背景虚化**：当前页面模糊 + 暗色半透明遮罩，内容退为背景层
- **最近对话卡片**：浮在虚化背景上，每个卡片显示对话标题 + 时间 + 首句预览，点击可直接继续对话
- **开始对话按钮**：液体玻璃气泡（大圆角胶囊形），悬在底部导航栏上方，点击后：遮罩逐渐加深 → 页面淡出 → 平滑过渡到全屏对话页 → 底部导航栏消失
- **全屏对话页** `/ai/chat`：沉浸式聊天界面，流式输出（SSE），多模态输入（文字 / 图片 / 语音），内置 Skills，结合用户食材定制化。对话历史 `drift` 本地持久化

#### ➕ 发布入口

点击底部 `+` 按钮后弹出 `BottomSheet`：
- `+` 旋转 45° 变为 ✕（`AnimatedRotation`）
- 页面叠加半透明遮罩（`ModalBarrier`）
- 弹出三选一动作菜单

| 动作 | 说明 |
|---|---|
| 📝 **上传菜谱** | 固定模板表单（菜名、食材清单、步骤、封面图、难度、耗时等） |
| 💬 **发帖子** | 自由格式，图文混排 |
| 📷 **拍照识别** | 拍摄食材照片，AI 自动识别并生成菜谱 |

所有发布的菜谱和帖子均记录：**浏览量 / 收藏量 / 评论数 / 点赞数 / 转发量**

#### ❤️ 收藏

顶部 `TabBar` 可左右滑动：

| Tab | 内容 |
|---|---|
| **我的食材** | 已拥有（冰箱）+ 待采购（菜篮），`TabBarView` 内部切换 |
| **我的收藏** | 收藏菜谱/帖子，自定义收藏夹分组 |
| **浏览历史** | 最近浏览的菜谱和帖子 |

#### 👤 我的

- **个人内容**：我的作品、我的帖子
- **社交数据**：关注 / 粉丝数，点击进入列表页
- **成就系统**：徽章和成就展示
- **设置入口**：右上角 `IconButton`
  - 编辑资料（头像、昵称、简介）
  - 账号安全（修改密码、更换绑定手机号）
  - 通知管理（点赞 / 评论 / 关注 / 系统公告，各通道独立开关）
  - 隐私设置（收藏夹可见范围 / 冰箱食材可见范围）
  - 缓存管理（图片缓存 / AI 对话历史，支持一键清除并显示占用体积）
  - 反馈建议
  - 用户协议 & 隐私政策
  - 关于（版本号、更新日志）

#### 🔔 通知

- **通知预览面板**：首页顶部铃铛点击，从图标下方展开液体玻璃面板，`AnimatedContainer` 弹性过渡 + `BackdropFilter` 背景模糊
- 面板内展示最近 4 条通知摘要（头像 + 昵称 + 动作描述，单行截断），未读标记为蓝色圆点
- 超出 4 条时底部显示「查看全部 N 条通知 →」，点击进入完整通知列表
- 点击面板外区域或再次点击铃铛，面板收起
- **通知列表页**：完整通知流，按「今天」「本周」「更早」时间分组，段间留白分隔
  - 每条通知：左侧头像 + 右侧文字（昵称 + 动作 + 对象名称 + 相对时间）+ 未读蓝点
  - 点赞通知 → 跳菜谱/帖子详情；评论通知 → 跳评论位置；关注通知 → 跳对方主页；系统通知 → 跳活动页
  - 左滑单条删除，顶部「全部已读」按钮，下拉刷新

#### 🍽️ 菜谱详情

**顶部封面区**
- 封面图全宽通栏，高度自适应
- 图片下方浅色渐变背景过渡到白色
- 渐变区叠加：菜名（粗体大字）+ 简介（次级文字，最多 2 行）
- 左上角：返回箭头，玻璃圆底图标（`CircleAvatar` + `BackdropFilter`）
- 右上角：三点菜单按钮，点击弹出下拉列表（分享 / 举报 / 不感兴趣）

**核心信息卡片**
- 菜名下方悬浮圆角白色卡片，四列横向排布
- 烹饪时间 + 难度 + 食材数量 + 份量，各列细竖线分隔

**食材清单区**
- 每行：食材名称 + 用量 + 单位，右侧「＋」按钮一键加入菜篮
- 底部汇总：「X 种食材已加入菜篮」+「查看菜篮 →」

**烹饪步骤区**
- 每一步独立圆角卡片：步骤序号 + 步骤图片（可选）+ 描述文字
- 当前步骤奶油黄背景高亮

**评论区**
- 每条评论：头像 + 昵称 + 时间 + 内容 + 点赞 + 回复
- 最新 / 最热排序，空状态引导

**底部悬浮操作栏**
- 液体玻璃质感，固定底部不随滚动消失
- ❤️ 点赞 / 🔖 收藏 / 🛒 加入小菜篮

#### 🔐 登录 & 注册

- **登录方式**：用户名 + 密码 / 手机号 + 密码 / 手机号 + 验证码
- **注册流程**：用户名 + 手机号 + 密码 + 手机验证码
- Token 自动刷新，登录态持久化

#### 💬 帖子详情

- **顶部**：返回箭头（玻璃圆底） + 右上角三点菜单（分享 / 举报 / 不感兴趣）
- **作者信息栏**：头像 + 昵称 + 发布时间 + 关注按钮（他人帖子时显示）
- **帖子内容**：文字正文 + 图片（支持多图左右滑动，点击全屏查看）
- **互动数据行**：点赞数 / 收藏数 / 评论数，图标 + 数字横向排列
- **评论区**：同菜谱详情评论区结构，最新 / 最热排序，空状态引导
- **底部操作栏**：液体玻璃悬浮，❤️ 点赞 / 🔖 收藏 / 💬 评论（滚动到评论区并聚焦输入框）

#### 👤 用户主页

- **顶部信息区**：大尺寸头像 + 昵称 + 简介（最多 3 行）
- **数据栏**：关注数 / 粉丝数 / 作品数 / 收藏数，四列横向排布，点击跳转列表
- **操作按钮**：自己的主页 →「编辑资料」；他人的主页 →「关注 / 已关注」（可取消）
- **内容 Tab**：作品 / 帖子 / 收藏，`TabBar` 切换
  - 作品：该用户发布的菜谱，双列网格展示
  - 帖子：该用户发布的帖子，单列时间线展示
  - 收藏：该用户公开的收藏夹（受隐私设置控制）
- 右上角三点菜单：举报 / 拉黑（仅他人主页时显示）

## 页面路由（go_router）

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | ShellRoute → 首页 | Tab 容器，含底部导航 |
| `/ai` | ShellRoute → AI 入口 | 建议气泡 + 对话历史 |
| `/ai/chat` | 全屏对话 | 沉浸式 AI 聊天，无底栏 |
| `/collection` | ShellRoute → 收藏 | 食材 / 收藏 / 历史 |
| `/mine` | ShellRoute → 我的 | 个人中心 |
| `/login` | 登录 | 登录 & 注册 |
| `/recipe/:id` | 菜谱详情 | 完整菜谱信息 |
| `/post/:id` | 帖子详情 | 帖子内容 & 评论 |
| `/user/:id` | 用户主页 | 他人主页 |
| `/notifications` | 通知列表 | 点赞 / 评论 / 关注 / 系统通知 |
| `/publish/recipe` | 上传菜谱 | 固定模板 |
| `/publish/post` | 发帖子 | 自由格式 |
| `/publish/scan` | 拍照识别 | AI 识别食材 |

## 依赖（pubspec.yaml 核心包）

```yaml
dependencies:
  flutter:
    sdk: flutter
  # 状态管理
  flutter_riverpod: ^2.x
  # 路由
  go_router: ^14.x
  # 网络
  dio: ^5.x
  # 本地存储
  shared_preferences: ^2.x
  drift: ^2.x          # SQLite ORM
  # UI
  flutter_staggered_grid_view: ^0.7.x  # 瀑布流
  cached_network_image: ^3.x           # 图片缓存
  shimmer: ^3.x                        # 骨架屏
  # 媒体
  image_picker: ^1.x  # 拍照 / 选图
  # 工具
  intl: ^0.19.x       # 国际化 / 日期格式化
  freezed_annotation: ^2.x  # 不可变模型
  json_annotation: ^4.x     # JSON 序列化

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.x
  freezed: ^2.x
  json_serializable: ^6.x
  drift_dev: ^2.x
  flutter_lints: ^4.x
```

## 快速开始

### 环境要求

- Flutter SDK ≥ 3.x
- Dart ≥ 3.x
- VS Code + Flutter 扩展（推荐）
- Xcode（iOS 构建需要，仅 macOS）

### 安装依赖

```bash
cd client/mobile-app
flutter pub get
```

### 代码生成

```bash
# freezed / json_serializable / drift 等需要代码生成
flutter pub run build_runner build --delete-conflicting-outputs
```

### 开发运行

**VS Code（推荐）**

1. 安装 Flutter 官方扩展
2. `Ctrl+Shift+P` → `Flutter: Select Device` 选择目标设备（iOS 模拟器 / Chrome / 已连接手机）
3. 打开 `lib/main.dart`，按 `F5` 或点击右上角 ▶ 启动调试
4. 支持 Hot Reload（保存即刷新）和 Hot Restart

**命令行**

```bash
# iOS 模拟器（仅 macOS）
flutter run

# Web 浏览器
flutter run -d chrome

# 指定设备
flutter run -d <device-id>
```

### 构建发布

```bash
flutter build apk --release     # Android
flutter build ios --release      # iOS（仅 macOS）
flutter build web --release      # Web
```

## API 接口

后端服务 `server/admin-api`，接口前缀 `/api/v1`。

| 领域 | 核心端点 |
|---|---|
| 认证 | `/auth/login` `/auth/register` `/auth/send-code` `/auth/profile` `/auth/refresh` |
| 菜谱 | `/recipes` CRUD + `/recipes/recommended` `/recipes/hot` `/recipes/search` |
| 帖子 | `/posts` CRUD + `/posts/feed` `/posts/:id/comments` |
| AI | `/ai/chat`（通用对话 SSE 流式）`/ai/generate-by-photo` `/ai/generate-by-ingredients` |
| 收藏 | `/collections` CRUD + 收藏夹 items 管理 |
| 食材 | `/ingredients` `/ingredients/search` `/user/ingredients`（冰箱/菜篮） |
| 用户 | `/user/profile` `/user/follow` `/user/achievements` |
| 内容 | `/content/banners` `/content/announcements` |

开发环境：`http://localhost:3000/api/v1`
生产环境：`https://api.airecipe.com/api/v1`

## 设计规范速查

### 色板

> 核心逻辑：冷暖对比。UI 越冷越干净，食物照片越跳越诱人。

| 角色 | 色值 | 用途 |
|---|---|---|
| 页面底色 | `#F8F8FA` | 冷白底（带极微蓝底），全局背景 |
| 卡片底色 | `#FFFFFF` | 纯白卡片，或 `rgba(255,255,255,0.72)` 玻璃态 |
| 次级背景 | `#F0F0F5` | 高亮/选中区域、分隔背景 |
| 高级黑 | `#1C1C1E` | 文字主色、深色强调元素 |
| 次级文字 | `#6E6E73` | 描述、辅助信息 |
| 占位文字 | `#AEAEB2` | placeholder、禁用态 |
| 分隔线 | `#E5E5EA` / `rgba(0,0,0,0.06)` | 细线分隔 |
| 强调色 | `#FF6B35` | 珊瑚橙，用于关键 CTA（发送按钮、收藏爱心等），冷白底上唯一跳出暖色 |

### 液体玻璃参数

| 属性 | 值 |
|---|---|
| 模糊强度 | `ImageFilter.blur(sigmaX: 24, sigmaY: 24)` |
| 背景透明度 | `rgba(255, 255, 255, 0.72)` |
| 边框 | `1px solid rgba(0, 0, 0, 0.04)` |
| 外阴影 | `offset(0, 4) blur(24) spread(0) rgba(0,0,0,0.04)` |
| 内折射光（顶部） | `offset(0, 1) blur(0) spread(0) rgba(255,255,255,0.6)` |
| 底栏圆角 | `BorderRadius.circular(22)` |
| 卡片圆角 | `BorderRadius.circular(16)` |
| 按钮圆角 | `BorderRadius.circular(14)` |

### 字体

| 角色 | 平台 | 字体 |
|---|---|---|
| 标题 / 正文 | iOS | SF Pro Display / SF Pro Text |
| 标题 / 正文 | Android | Noto Sans SC（推荐） |
| 数字 / 等宽 | 通用 | SF Mono / JetBrains Mono |

### 间距

| 级别 | 值 |
|---|---|
| 页面水平边距 | 16px |
| 卡片内边距 | 16px |
| 元素间距（紧凑） | 8px |
| 元素间距（舒适） | 12px |
| Section 间距 | 24px |

## License

MIT
