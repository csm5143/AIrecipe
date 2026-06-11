// 加载环境变量（必须放在最前面）
import 'dotenv/config';

// DNS 强制使用公共 DNS，必须在所有网络操作前设置
import dns from 'dns';
dns.setServers(['8.8.8.8', '114.114.114.114']);

import 'reflect-metadata';
import express, { Express } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import { prisma } from './lib/prisma';
import { errorHandler } from './modules/system/middleware/errorHandler';
import { requestLogger } from './modules/system/middleware/requestLogger';
import { settingsStore } from './modules/system/settingsStore';
import { ensureAiQuotaDefaults } from './services/aiQuota.service';
import { startScheduler } from './services/scheduler.service';
import authRoutes from './modules/auth/routes/auth.routes';
import userRoutes from './modules/user/routes/user.routes';
import recipeRoutes from './modules/recipe/routes/recipe.routes';
import ingredientRoutes from './modules/ingredient/routes/ingredient.routes';
import collectionRoutes from './modules/collection/routes/collection.routes';
import feedbackRoutes from './modules/feedback/routes/feedback.routes';
import reportRoutes from './modules/report/routes/report.routes';
import adminNotificationRoutes from './modules/notification/routes/admin-notification.routes';
import recipeAuditRoutes from './modules/recipe-audit/routes/recipe-audit.routes';
import userRecipeRoutes from './modules/user-recipe/routes/user-recipe.routes';
import adminAuthRoutes from './modules/admin/routes/admin-auth.routes';
import adminRoutes from './modules/admin/routes/admin.routes';
import contentRoutes from './modules/content/routes/content.routes';
import analyticsRoutes from './modules/analytics/routes/analytics.routes';
import uploadRoutes from './modules/upload/routes/upload.routes';
import systemRoutes from './modules/system/routes/system.routes';
import appRoutes from './modules/app/routes';
import wxRoutes from './modules/wx/routes/wx.routes';
import fridgeRoutes from './modules/fridge/routes/fridge.routes';
import logsRoutes from './modules/logs/routes/logs.routes';
import recycleBinRoutes from './modules/recycle-bin/routes/recycle-bin.routes';
import featuredRoutes from './modules/featured/routes/featured.routes';
import aiKeyRoutes, { aiKeyPublicRoutes } from './modules/ai-key/routes/ai-key.routes';
import aiRoutes from './modules/ai/routes/ai.routes';
import aiControlRoutes from './modules/ai-control/routes/ai-control.routes';
import devRoutes from './modules/dev/routes/dev.routes';
import adminCommentRoutes from './modules/admin-comment/routes/admin-comment.routes';

const app: Express = express();

app.use('/h5', express.static(path.join(__dirname, '../public/h5')));

// ==================== 全局中间件 ====================

// 安全头
app.use(helmet());

// CORS - 支持多域名配置（格式：https://domain1.com,https://domain2.com）
const customOrigins = (process.env.CORS_ORIGIN || '').split(',').filter(Boolean);
const corsOptions: cors.CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    // 开发环境：允许所有 localhost 来源（Flutter web / 移动端调试等随机端口）
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    const prodOrigins = [
      "https://admin.airecipe.cn",
    ];
    const allAllowed = [...prodOrigins, ...customOrigins];

    if (allAllowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
};
app.use(cors(corsOptions));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(requestLogger);

// 限流
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { code: 429, message: '请求过于频繁，请稍后再试', timestamp: Date.now() },
});
app.use('/api', limiter);

// 静态文件服务
app.use(config.upload.staticDir, express.static(path.resolve(config.upload.uploadDir)));

// ==================== 路由 ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API v1 前缀下的健康检查（供反向代理使用）
// Nginx location /api -> proxy_pass / 时，/api/v1/health 会变成 /v1/health
app.get('/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use(`${config.app.apiPrefix}/auth`, authRoutes);
app.use(`${config.app.apiPrefix}/users`, userRoutes);
app.use(`${config.app.apiPrefix}/recipes`, recipeRoutes);
app.use(`${config.app.apiPrefix}/featured-recipes`, featuredRoutes);
app.use(`${config.app.apiPrefix}/ingredients`, ingredientRoutes);
app.use(`${config.app.apiPrefix}/collections`, collectionRoutes);
app.use(`${config.app.apiPrefix}/feedbacks`, feedbackRoutes);
app.use(`${config.app.apiPrefix}/reports`, reportRoutes);
app.use(`${config.app.apiPrefix}/admin/notifications`, adminNotificationRoutes);
app.use(`${config.app.apiPrefix}/recipe-audit`, recipeAuditRoutes);
app.use(`${config.app.apiPrefix}/user-recipes`, userRecipeRoutes);
app.use(`${config.app.apiPrefix}/admin`, adminAuthRoutes);
app.use(`${config.app.apiPrefix}/admins`, adminRoutes);
app.use(`${config.app.apiPrefix}/content`, contentRoutes);
app.use(`${config.app.apiPrefix}/app`, appRoutes);
app.use(`${config.app.apiPrefix}/ai`, aiRoutes);
app.use(`${config.app.apiPrefix}/ai-control`, aiControlRoutes);
app.use(`${config.app.apiPrefix}/dev`, devRoutes);
app.use(`${config.app.apiPrefix}/ai-keys/active`, aiKeyPublicRoutes);
app.use(`${config.app.apiPrefix}/ai-keys`, aiKeyRoutes);
app.use(`${config.app.apiPrefix}/wx`, wxRoutes);
app.use(`${config.app.apiPrefix}/app/fridge`, fridgeRoutes);
app.use(`${config.app.apiPrefix}/analytics`, analyticsRoutes);
app.use(`${config.app.apiPrefix}/comments`, adminCommentRoutes);
app.use(`${config.app.apiPrefix}/upload`, uploadRoutes);
app.use(`${config.app.apiPrefix}/system`, systemRoutes);
app.use(`${config.app.apiPrefix}/logs`, logsRoutes);
app.use(`${config.app.apiPrefix}/recycle-bin`, recycleBinRoutes);

// ==================== 错误处理 ====================

app.use(errorHandler);

// ==================== 启动服务器 ====================

app.listen(config.app.port, config.app.host, async () => {
  console.log(`🚀 AIRecipe Admin API 已启动`);
  console.log(`   环境: ${config.app.env}`);
  console.log(`   端口: ${config.app.port}`);
  console.log(`   API: http://localhost:${config.app.port}${config.app.apiPrefix}`);

  // Warm up Prisma connection pool — avoids cold-start latency on first real query
  try {
    await prisma.$connect();
    await prisma.ingredient.findFirst({ select: { id: true } });
    console.log('[WARMUP] Prisma pool ready');

    // Ensure system settings are seeded on first run
    await settingsStore.ensureInitialized();
    await ensureAiQuotaDefaults();
    startScheduler();
  } catch (e) {
    console.warn('[WARMUP] Failed to warm up Prisma pool:', e);
  }
});

export default app;
