# FlecBlog 接口文档

这份文档基于当前 `server` 项目的实际路由整理，可作为前后端联调和接口参考使用。

## 1. 基础信息

### 1.1 基础路径

- 前台接口前缀：`/api/v1`
- 后台管理接口前缀：`/api/v1/admin`
- Swagger 文档：`/swagger/index.html`
- RSS Feed：`/rss.xml`
- Atom Feed：`/atom.xml`

### 1.2 认证方式

需要登录的接口统一使用 JWT：

```http
Authorization: Bearer <access_token>
```

权限大致分为：

- 公开接口：游客可访问
- 登录用户接口：要求登录，`user` 及以上角色
- 管理接口：要求登录，`admin` 及以上角色
- 超级管理员接口：在管理接口基础上额外要求 `super_admin`

### 1.3 请求与响应

- 常规请求：`application/json`
- 文件上传：`multipart/form-data`
- 文件下载：二进制流

成功响应的统一结构如下：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

分页响应中的 `data` 结构如下：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "page_size": 10
  }
}
```

错误响应示例：

```json
{
  "code": 400,
  "message": "参数错误"
}
```

说明：

- HTTP 状态码与业务 `code` 并不完全等价，联调时优先同时看两者
- 当前项目成功时业务码是 `0`，不是 `200`
- 创建类接口通常返回 HTTP `201`

## 2. 常用接口总览

### 2.1 公开接口

| 模块       | 方法     | 路径                                   | 说明                        |
| -------- | ------ | ------------------------------------ | ------------------------- |
| 站点配置     | `GET`  | `/api/v1/settings/:group`            | 获取公开配置分组                  |
| 统计采集     | `POST` | `/api/v1/collect`                    | 前端埋点上报                    |
| 站点统计     | `GET`  | `/api/v1/stats/site`                 | 获取站点公开统计                  |
| 文章归档     | `GET`  | `/api/v1/stats/archives`             | 获取归档统计                    |
| OAuth    | `GET`  | `/api/v1/auth/:provider`             | 发起第三方登录                   |
| OAuth 回调 | `GET`  | `/api/v1/auth/:provider/callback`    | 第三方登录回调                   |
| 注册       | `POST` | `/api/v1/auth/register`              | 邮箱注册                      |
| 登录       | `POST` | `/api/v1/auth/login`                 | 邮箱密码登录                    |
| 刷新 Token | `POST` | `/api/v1/auth/refresh`               | 使用 refresh token 换新 token |
| 忘记密码     | `POST` | `/api/v1/auth/forgot-password`       | 发送重置密码邮件                  |
| 重置密码     | `POST` | `/api/v1/auth/reset-password`        | 验证码重置密码                   |
| 文章列表     | `GET`  | `/api/v1/articles`                   | 前台文章列表                    |
| 文章搜索     | `GET`  | `/api/v1/articles/search`            | 全文搜索                      |
| 文章详情     | `GET`  | `/api/v1/articles/:slug`             | 根据 slug 获取文章              |
| 标签列表     | `GET`  | `/api/v1/tags`                       | 标签列表                      |
| 标签详情     | `GET`  | `/api/v1/tags/:slug`                 | 标签详情                      |
| 分类列表     | `GET`  | `/api/v1/categories`                 | 分类列表                      |
| 分类详情     | `GET`  | `/api/v1/categories/:slug`           | 分类详情                      |
| 友链列表     | `GET`  | `/api/v1/friends`                    | 分组友链列表                    |
| 动态列表     | `GET`  | `/api/v1/moments`                    | 前台动态列表                    |
| 菜单树      | `GET`  | `/api/v1/menus`                      | 获取前台菜单                    |
| 评论列表     | `GET`  | `/api/v1/comments`                   | 指定目标的评论列表                 |
| 发布评论     | `POST` | `/api/v1/comments`                   | 支持游客或登录用户评论               |
| 文件上传     | `POST` | `/api/v1/upload`                     | 前台上传图片/头像等                |
| 提交反馈     | `POST` | `/api/v1/feedback`                   | 提交反馈或举报                   |
| 工单查询     | `GET`  | `/api/v1/feedback/ticket/:ticket_no` | 查询反馈处理状态                  |
| 邮件订阅     | `POST` | `/api/v1/subscribe`                  | 订阅博客更新                    |
| 取消订阅     | `GET`  | `/api/v1/subscribe/unsubscribe`      | 取消订阅                      |

### 2.2 登录用户接口

| 模块       | 方法       | 路径                               | 说明                  |
| -------- | -------- | -------------------------------- | ------------------- |
| 退出登录     | `POST`   | `/api/v1/auth/logout`            | 当前 token 失效         |
| 个人资料     | `GET`    | `/api/v1/user/profile`           | 获取当前用户信息            |
| 更新资料     | `PATCH`  | `/api/v1/user/profile`           | 修改昵称、头像等            |
| 修改密码     | `PUT`    | `/api/v1/user/password`          | 需提供旧密码              |
| 设置密码     | `POST`   | `/api/v1/user/password`          | OAuth 用户首次设置密码      |
| 注销账号     | `DELETE` | `/api/v1/user/deactivate`        | 软删除当前账号             |
| 解绑 OAuth | `DELETE` | `/api/v1/user/oauth/:provider`   | 解绑 GitHub/Google/QQ |
| 申请友链     | `POST`   | `/api/v1/friends/apply`          | 登录用户申请友链            |
| 更新评论     | `PUT`    | `/api/v1/comments/:id`           | 只能修改自己的评论           |
| 删除评论     | `DELETE` | `/api/v1/comments/:id`           | 只能删除自己的评论           |
| 我的通知     | `GET`    | `/api/v1/notifications`          | 获取通知列表              |
| 已读通知     | `PUT`    | `/api/v1/notifications/:id/read` | 标记单条已读              |
| 全部已读     | `PUT`    | `/api/v1/notifications/read-all` | 标记全部已读              |

### 2.3 后台管理接口

| 模块      | 方法               | 路径                                         | 说明                    |
| ------- | ---------------- | ------------------------------------------ | --------------------- |
| 用户管理    | `GET/POST`       | `/api/v1/admin/users`                      | 用户列表、创建用户             |
| 用户管理    | `GET/PUT/DELETE` | `/api/v1/admin/users/:id`                  | 用户详情、更新、删除            |
| 文章管理    | `GET/POST`       | `/api/v1/admin/articles`                   | 文章列表、创建               |
| 文章管理    | `GET/PUT/DELETE` | `/api/v1/admin/articles/:id`               | 文章详情、更新、删除            |
| 文章导入    | `POST`           | `/api/v1/admin/articles/import`            | 导入 Hexo Markdown      |
| 导出公众号   | `POST`           | `/api/v1/admin/articles/:id/wechat/export` | 导出到微信公众号草稿            |
| 下载文章压缩包 | `GET`            | `/api/v1/admin/articles/:id/download/zip`  | 导出 Markdown + 资源      |
| 标签管理    | `GET/POST`       | `/api/v1/admin/tags`                       | 标签列表、创建               |
| 标签管理    | `GET/PUT/DELETE` | `/api/v1/admin/tags/:id`                   | 标签详情、更新、删除            |
| 分类管理    | `GET/POST`       | `/api/v1/admin/categories`                 | 分类列表、创建               |
| 分类管理    | `GET/PUT/DELETE` | `/api/v1/admin/categories/:id`             | 分类详情、更新、删除            |
| 友链类型    | `GET/POST`       | `/api/v1/admin/friends/types`              | 友链类型列表、创建             |
| 友链类型    | `GET/PUT/DELETE` | `/api/v1/admin/friends/types/:id`          | 类型详情、更新、删除            |
| 友链管理    | `GET/POST`       | `/api/v1/admin/friends`                    | 友链列表、创建               |
| 友链管理    | `GET/PUT/DELETE` | `/api/v1/admin/friends/:id`                | 友链详情、更新、删除            |
| 动态管理    | `GET/POST`       | `/api/v1/admin/moments`                    | 动态列表、创建               |
| 动态管理    | `GET/PUT/DELETE` | `/api/v1/admin/moments/:id`                | 动态详情、更新、删除            |
| 评论管理    | `POST`           | `/api/v1/admin/comments`                   | 管理员新增评论/回复            |
| 评论管理    | `GET`            | `/api/v1/admin/comments`                   | 评论列表                  |
| 评论管理    | `GET`            | `/api/v1/admin/comments/:id`               | 评论详情                  |
| 评论管理    | `PUT`            | `/api/v1/admin/comments/:id/toggle-status` | 切换评论状态                |
| 评论管理    | `PUT`            | `/api/v1/admin/comments/:id/restore`       | 恢复已删除评论               |
| 评论管理    | `DELETE`         | `/api/v1/admin/comments/:id`               | 删除评论                  |
| 评论导入    | `POST`           | `/api/v1/admin/comments/import`            | 导入 Artalk 等评论数据       |
| 文件管理    | `POST`           | `/api/v1/admin/files`                      | 上传文件                  |
| 文件管理    | `GET`            | `/api/v1/admin/files`                      | 文件列表                  |
| 文件管理    | `GET/DELETE`     | `/api/v1/admin/files/:id`                  | 文件详情、删除               |
| 仪表盘     | `GET`            | `/api/v1/admin/stats/dashboard`            | 仪表盘统计                 |
| 趋势统计    | `GET`            | `/api/v1/admin/stats/trend`                | 访问趋势                  |
| 分类统计    | `GET`            | `/api/v1/admin/stats/category`             | 分类统计                  |
| 标签统计    | `GET`            | `/api/v1/admin/stats/tag`                  | 标签统计                  |
| 贡献图     | `GET`            | `/api/v1/admin/stats/contribution`         | 发文贡献统计                |
| 访问日志    | `GET`            | `/api/v1/admin/stats/visits`               | 访问明细                  |
| 菜单管理    | `GET/POST`       | `/api/v1/admin/menus`                      | 菜单树、创建                |
| 菜单管理    | `GET/PUT/DELETE` | `/api/v1/admin/menus/:id`                  | 菜单详情、更新、删除            |
| 反馈管理    | `GET`            | `/api/v1/admin/feedback`                   | 反馈列表                  |
| 反馈管理    | `GET/PUT/DELETE` | `/api/v1/admin/feedback/:id`               | 反馈详情、处理、删除            |
| 通知管理    | `GET`            | `/api/v1/admin/notifications`              | 通知列表                  |
| 通知管理    | `PUT`            | `/api/v1/admin/notifications/:id/read`     | 单条已读                  |
| 通知管理    | `PUT`            | `/api/v1/admin/notifications/read-all`     | 全部已读                  |
| 配置管理    | `GET`            | `/api/v1/admin/settings/:group`            | 获取配置分组                |
| 配置管理    | `PATCH`          | `/api/v1/admin/settings/:group`            | 更新配置分组，仅 super\_admin |
| 系统信息    | `GET`            | `/api/v1/admin/system/static`              | 静态系统信息                |
| 系统信息    | `GET`            | `/api/v1/admin/system/dynamic`             | 动态系统信息                |
| 工具接口    | `POST`           | `/api/v1/admin/tools/parse-video`          | 解析视频信息                |
| 工具接口    | `POST`           | `/api/v1/admin/tools/fetch-linkmeta`       | 拉取链接元信息               |
| 工具接口    | `POST`           | `/api/v1/admin/tools/download-image`       | 下载图片到本地存储             |
| AI 接口   | `POST`           | `/api/v1/admin/ai/test`                    | 测试 AI 配置              |
| AI 接口   | `POST`           | `/api/v1/admin/ai/summary`                 | 生成摘要                  |
| AI 接口   | `POST`           | `/api/v1/admin/ai/ai-summary`              | 生成 AI 摘要              |
| AI 接口   | `POST`           | `/api/v1/admin/ai/title`                   | 生成标题                  |
| RSS 管理  | `GET`            | `/api/v1/admin/rssfeed`                    | RSS 文章列表              |
| RSS 管理  | `PUT`            | `/api/v1/admin/rssfeed/:id/read`           | 标记已读，仅 super\_admin   |
| RSS 管理  | `PUT`            | `/api/v1/admin/rssfeed/read-all`           | 全部已读，仅 super\_admin   |
| 订阅者管理   | `GET`            | `/api/v1/admin/subscribers`                | 订阅者列表                 |
| 订阅者管理   | `DELETE`         | `/api/v1/admin/subscribers/:id`            | 删除订阅者                 |

## 3. 关键接口说明

### 3.1 登录注册

#### `POST /api/v1/auth/register`

请求体示例：

```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirm_password": "password123",
  "nickname": "测试用户"
}
```

#### `POST /api/v1/auth/login`

请求体示例：

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

成功后会返回：

- `access_token`
- `refresh_token`
- `user`

#### `POST /api/v1/auth/refresh`

请求体示例：

```json
{
  "refresh_token": "xxxx"
}
```

### 3.2 文章

#### `GET /api/v1/articles`

常用查询参数：

- `page`
- `page_size`
- `year`
- `month`
- `category`
- `tag`

示例：

```http
GET /api/v1/articles?page=1&page_size=10&category=frontend
```

#### `GET /api/v1/articles/search`

必填查询参数：

- `keyword`

示例：

```http
GET /api/v1/articles/search?keyword=vue&page=1&page_size=10
```

#### `GET /api/v1/articles/:slug`

通过文章 `slug` 获取详情，接口内部会累加阅读数。

### 3.3 评论

#### `GET /api/v1/comments`

必填参数：

- `target_type`：`article` 或 `page`
- `target_key`：文章 `slug` 或页面唯一标识

示例：

```http
GET /api/v1/comments?target_type=article&target_key=hello-world
```

#### `POST /api/v1/comments`

请求体示例：

```json
{
  "target_type": "article",
  "target_key": "hello-world",
  "content": "写得很好",
  "parent_id": 0,
  "nickname": "访客A",
  "email": "visitor@example.com",
  "website": "https://example.com"
}
```

说明：

- 已登录用户可直接评论
- 未登录用户需要补充游客信息
- `parent_id` 不为 `0` 时表示回复评论

### 3.4 文件上传

#### `POST /api/v1/upload`

请求类型：`multipart/form-data`

表单字段：

- `file`：上传文件
- `type`：上传类型，前端场景中必填

示例：

```bash
curl -X POST "http://localhost:8080/api/v1/upload" ^
  -H "Authorization: Bearer <token>" ^
  -F "type=avatar" ^
  -F "file=@avatar.png"
```

### 3.5 用户资料

#### `GET /api/v1/user/profile`

获取当前登录用户资料。

#### `PATCH /api/v1/user/profile`

常见更新字段：

- `nickname`
- `avatar`
- `website`
- `badge`

#### `PUT /api/v1/user/password`

请求体示例：

```json
{
  "old_password": "old-password",
  "new_password": "new-password"
}
```

## 4. 管理后台接口补充

### 4.1 文章创建与更新

#### `POST /api/v1/admin/articles`

#### `PUT /api/v1/admin/articles/:id`

常见字段：

- `title`
- `content`
- `summary`
- `cover`
- `category_id`
- `tag_ids`
- `is_publish`
- `is_top`
- `is_essence`
- `is_outdated`
- `location`

创建文章示例：

```json
{
  "title": "Vue 3 状态管理实践",
  "content": "# 正文内容",
  "summary": "这是一段摘要",
  "cover": "https://example.com/cover.jpg",
  "category_id": 1,
  "tag_ids": [1, 3, 5],
  "is_publish": true,
  "is_top": false,
  "is_essence": false,
  "is_outdated": false,
  "location": "Shanghai"
}
```

### 4.2 文章导入

#### `POST /api/v1/admin/articles/import`

请求类型：`multipart/form-data`

表单字段：

- `source_type`：目前支持 `hexo`
- `files`：可上传多个 `.md` / `.markdown` 文件

限制说明：

- 单次最多导入 100 个文件
- 单文件大小上限为 10MB

### 4.3 评论导入

#### `POST /api/v1/admin/comments/import`

适合从第三方评论系统迁移数据，当前代码注释中标明支持 Artalk 等来源。

### 4.4 配置接口

#### `GET /api/v1/admin/settings/:group`

获取某个配置分组。

#### `PATCH /api/v1/admin/settings/:group`

更新配置分组，仅超级管理员可用。

当前公开接口中也可以通过以下接口获取公开配置：

```http
GET /api/v1/settings/:group
```

常见分组包括：

- `basic`
- `blog`
- `notification`
- `upload`
- `ai`
- `oauth`
- `wechat`

## 5. 联调建议

### 5.1 推荐调用顺序

前台联调通常按下面顺序即可：

1. 先调用 `GET /api/v1/settings/basic` 获取站点基础配置
2. 再调用 `GET /api/v1/menus` 渲染导航
3. 首页调用 `GET /api/v1/articles`
4. 详情页调用 `GET /api/v1/articles/:slug`
5. 评论区调用 `GET /api/v1/comments`
6. 登录后补充调用 `/api/v1/user/*` 和 `/api/v1/notifications*`

### 5.2 常见注意点

- 分页字段名是 `list`，不是很多项目常见的 `items`
- 一部分失败场景会返回 HTTP `200`，但业务 `code` 非 `0`
- 需要登录的接口请统一处理 token 过期后的刷新逻辑
- 上传接口是 `multipart/form-data`，不要按 JSON 发
- 评论列表必须同时传 `target_type` 和 `target_key`
- 用户注销接口虽然是 `DELETE`，但仍然需要请求体传密码

## 6. 参考地址

- 路由入口：[api/router/router.go](/D:/前端学习/vue3/博客/FlecBlog/server/api/router/router.go)
- Swagger 文件：[docs/swagger.yaml](/D:/前端学习/vue3/博客/FlecBlog/server/docs/swagger.yaml)
- 响应结构：[pkg/response/response.go](/D:/前端学习/vue3/博客/FlecBlog/server/pkg/response/response.go)

如果后面你希望，我还可以继续帮你补两种版本：

- 面向前端的“精简联调版”
- 面向对外开放的“标准 OpenAPI/Swagger 注释版”

