// 加载环境变量（必须放在最前面）
import 'dotenv/config';

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config';
import { errorHandler } from './modules/system/middleware/errorHandler';
import { requestLogger } from './modules/system/middleware/requestLogger';
import authRoutes from './modules/auth/routes/auth.routes';
import userRoutes from './modules/user/routes/user.routes';
import recipeRoutes from './modules/recipe/routes/recipe.routes';
import ingredientRoutes from './modules/ingredient/routes/ingredient.routes';
import collectionRoutes from './modules/collection/routes/collection.routes';
import feedbackRoutes from './modules/feedback/routes/feedback.routes';
import recipeAuditRoutes from './modules/recipe-audit/routes/recipe-audit.routes';
import userRecipeRoutes from './modules/user-recipe/routes/user-recipe.routes';
import contentRoutes from './modules/content/routes/content.routes';
import analyticsRoutes from './modules/analytics/routes/analytics.routes';
import uploadRoutes from './modules/upload/routes/upload.routes';
import systemRoutes from './modules/system/routes/system.routes';

const app = express();

// ==================== 全局中间件 ====================

// 安全头
app.use(helmet());

// CORS
const corsOptions: cors.CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // 允许没有 origin 的请求（如 Postman、curl）
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3001',
    ];
    
    if (allowedOrigins.includes(origin)) {
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

// 请求日志
if (config.app.env !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);

// 限流
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { code: 429, message: '请求过于频繁，请稍后再试', timestamp: Date.now() },
});
app.use('/api', limiter);

// 静态文件服务
app.use(config.upload.staticDir, express.static(config.upload.uploadDir));

// ==================== 路由 ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use(`${config.app.apiPrefix}/auth`, authRoutes);
app.use(`${config.app.apiPrefix}/users`, userRoutes);
app.use(`${config.app.apiPrefix}/recipes`, recipeRoutes);
app.use(`${config.app.apiPrefix}/ingredients`, ingredientRoutes);
app.use(`${config.app.apiPrefix}/collections`, collectionRoutes);
app.use(`${config.app.apiPrefix}/feedbacks`, feedbackRoutes);
app.use(`${config.app.apiPrefix}/recipe-audit`, recipeAuditRoutes);
app.use(`${config.app.apiPrefix}/user-recipes`, userRecipeRoutes);
app.use(`${config.app.apiPrefix}/content`, contentRoutes);
app.use(`${config.app.apiPrefix}/analytics`, analyticsRoutes);
app.use(`${config.app.apiPrefix}/upload`, uploadRoutes);
app.use(`${config.app.apiPrefix}/system`, systemRoutes);

// ==================== 错误处理 ====================

app.use(errorHandler);

// ==================== 启动服务器 ====================

app.listen(config.app.port, config.app.host, () => {
  console.log(`🚀 AIRecipe Admin API 已启动`);
  console.log(`   环境: ${config.app.env}`);
  console.log(`   端口: ${config.app.port}`);
  console.log(`   API: http://localhost:${config.app.port}${config.app.apiPrefix}`);
});

export default app;
