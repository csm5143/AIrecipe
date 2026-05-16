-- =====================================================
-- 系统配置表迁移脚本
-- 执行方式：Navicat 中新建查询 -> 粘贴执行
-- =====================================================

-- 创建表
CREATE TABLE system_settings (
  id          SERIAL PRIMARY KEY,
  category    VARCHAR(50)  NOT NULL,
  key         VARCHAR(100) NOT NULL,
  value       TEXT,
  description VARCHAR(255),
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW(),
  UNIQUE(category, key)
);

-- 创建索引
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- 初始化站点信息
INSERT INTO system_settings (category, key, value, description) VALUES
  ('site', 'siteName',        'AIRecipe',                           '网站名称'),
  ('site', 'siteDescription', 'AIRecipe - 您的智能食谱助手',       '网站描述'),
  ('site', 'logo',           '',                                   '网站Logo'),
  ('site', 'favicon',        '',                                   '网站图标');

-- 初始化SEO信息
INSERT INTO system_settings (category, key, value, description) VALUES
  ('seo', 'title',       'AIRecipe - 智能食谱推荐平台',                    'SEO标题'),
  ('seo', 'keywords',    '食谱,美食,烹饪,健康饮食,AI推荐',                 'SEO关键字'),
  ('seo', 'description', 'AIRecipe 提供智能食谱推荐、AI食材识别、健康饮食管理等功能的综合平台。', 'SEO描述');

-- 初始化备案信息
INSERT INTO system_settings (category, key, value, description) VALUES
  ('legal', 'icp',       '',                         'ICP备案号'),
  ('legal', 'psbe',      '',                         '公安网安备号'),
  ('legal', 'copyright', '© 2024 AIRecipe 版权所有', '版权声明'),
  ('legal', 'company',   '',                        '公司名称'),
  ('legal', 'phone',     '',                        '联系电话');

-- 初始化安全设置
INSERT INTO system_settings (category, key, value, description) VALUES
  ('security', 'sessionTimeout',      '60',                       '会话超时(分钟)'),
  ('security', 'maxLoginAttempts',    '5',                        '最大登录失败次数'),
  ('security', 'passwordRequirements', '["minLength","number"]', '密码要求(JSON数组)'),
  ('security', 'enableOperationLog',  'true',                    '启用操作日志');

-- 初始化邮件配置
INSERT INTO system_settings (category, key, value, description) VALUES
  ('email', 'smtpHost',     '',         'SMTP主机地址'),
  ('email', 'smtpPort',     '465',      'SMTP端口'),
  ('email', 'encryption',   'ssl',      '加密方式(ssl/tls/none)'),
  ('email', 'fromEmail',    '',         '发件邮箱'),
  ('email', 'fromName',     'AIRecipe', '发件人名称'),
  ('email', 'username',     '',         '邮箱用户名'),
  ('email', 'password',     '',         '邮箱密码');
