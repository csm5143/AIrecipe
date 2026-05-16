/**
 * HTTP API 请求封装层
 *
 * 小程序已不再使用微信云开发（wx.cloud），改用 HTTP API 直连后端 PostgreSQL 数据库。
 *
 * ┌──────────────┐     HTTP     ┌────────────────────┐     Prisma     ┌────────────┐
 * │  小程序       │ ──────────► │  /api/v1/wx/*      │ ────────────► │ PostgreSQL │
 * │  miniprogram │  REST API   │  admin-api (本地3001)│              │            │
 * └──────────────┘             └────────────────────┘              └────────────┘
 *
 * 目录结构：
 *   utils/httpApi/   → 底层 HTTP 调用（请求封装、认证、API 模块）
 *   utils/httpServices/ → 业务服务层（整合本地缓存 + API）
 */

export {};
