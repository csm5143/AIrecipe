# API 接口文档

## 基础信息

- 基础路径: `/api/v1`
- 认证方式: Bearer Token (JWT)
- 响应格式: JSON

## 认证模块 `/auth`

### POST /auth/login
登录

**请求体:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "...",
    "refreshToken": "...",
    "expiresIn": "7d",
    "admin": {
      "id": 1,
      "username": "admin",
      "role": "ADMIN"
    }
  }
}
```

### POST /auth/logout
退出登录

### GET /auth/profile
获取当前管理员信息

## 用户模块 `/users`

### GET /users
获取用户列表

**查询参数:**
- `page` - 页码
- `pageSize` - 每页数量
- `keyword` - 搜索关键词
- `status` - 状态筛选

### GET /users/:id
获取用户详情

### PATCH /users/:id/status
更新用户状态

## 食谱模块 `/recipes`

### GET /recipes
获取食谱列表

### GET /recipes/:id
获取食谱详情

### POST /recipes
创建食谱

### PUT /recipes/:id
更新食谱

### DELETE /recipes/:id
删除食谱

## 食材模块 `/ingredients`

### GET /ingredients
获取食材列表

### POST /ingredients
创建食材

## 反馈模块 `/feedbacks`

### GET /feedbacks
获取反馈列表

### POST /feedbacks/:id/reply
回复反馈

## 内容运营 `/content`

### GET /content/banners
获取 Banner 列表

### POST /content/banners
创建 Banner

### PUT /content/banners/:id
更新 Banner

### DELETE /content/banners/:id
删除 Banner

## 数据分析 `/analytics`

### GET /analytics/dashboard
获取仪表盘统计数据

### GET /analytics/users
获取用户统计数据

### GET /analytics/recipes
获取食谱统计数据

## 文件上传 `/upload`

### POST /upload
上传文件

**响应:**
```json
{
  "code": 200,
  "data": {
    "url": "/uploads/xxx.png",
    "filename": "xxx.png",
    "size": 1024
  }
}
```
