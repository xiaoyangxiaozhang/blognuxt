# FlecBlog API 接口文档

## 概述

本文档详细描述了 FlecBlog 博客系统的所有 API 接口，包括请求参数、返回数据结构和类型定义。

---

## 文章接口

### 前台接口

#### 1. 获取文章列表

- **路径**: `GET /articles`
- **描述**: 获取已发布文章，置顶文章在前。支持按年/月/分类/标签筛选

**请求参数（Query）**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | int | 否 | 页码，默认1 |
| `page_size` | int | 否 | 每页数量，不传则返回全部 |
| `year` | string | 否 | 年份，如 "2025" |
| `month` | string | 否 | 月份 1-12，需配合 year |
| `category` | string | 否 | 分类 slug |
| `tag` | string | 否 | 标签 slug |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "文章标题",
        "summary": "文章摘要",
        "excerpt": "截取的摘要",
        "cover": "https://example.com/cover.jpg",
        "location": "发布地点",
        "is_top": true,
        "is_essence": false,
        "is_outdated": false,
        "url": "/articles/test-slug",
        "comment_count": 10,
        "publish_time": "2025-01-15T10:30:00Z",
        "update_time": "2025-01-16T14:00:00Z",
        "category": {
          "id": 1,
          "name": "分类名称",
          "url": "/categories/category-slug"
        },
        "tags": [
          {
            "id": 1,
            "name": "标签名称",
            "url": "/tags/tag-slug"
          }
        ]
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 10
  }
}
```

#### 2. 搜索文章

- **路径**: `GET /articles/search`
- **描述**: 全文搜索标题和正文，返回匹配的文章及高亮摘要

**请求参数（Query）**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `keyword` | string | 是 | 搜索词 |
| `page` | int | 否 | 页码，默认1 |
| `page_size` | int | 否 | 每页数量，不传则返回全部 |

**成功响应** (`200`): 同文章列表响应结构

#### 3. 获取文章详情

- **路径**: `GET /articles/{slug}`
- **描述**: 通过 slug 读取文章完整内容，自动增加阅读数

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `slug` | string | 是 | 文章 slug |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "文章标题",
    "slug": "test-slug",
    "content": "# 文章内容\n\n正文...",
    "summary": "文章摘要",
    "ai_summary": "AI生成的摘要",
    "cover": "https://example.com/cover.jpg",
    "location": "发布地点",
    "is_top": true,
    "is_essence": false,
    "is_outdated": false,
    "view_count": 150,
    "comment_count": 10,
    "url": "/articles/test-slug",
    "publish_time": "2025-01-15T10:30:00Z",
    "update_time": "2025-01-16T14:00:00Z",
    "category": {
      "id": 1,
      "name": "分类名称",
      "url": "/categories/category-slug"
    },
    "tags": [...],
    "prev": {
      "title": "上一篇文章",
      "url": "/articles/prev-slug"
    },
    "next": {
      "title": "下一篇文章",
      "url": "/articles/next-slug"
    }
  }
}
```

### 后台管理接口（需认证）

#### 4. 获取文章列表（管理）

- **路径**: `GET /admin/articles`
- **描述**: 获取所有文章含草稿，用于后台管理
- **认证**: Bearer Token

**请求参数**: 同前台列表接口

#### 5. 获取文章详情（管理）

- **路径**: `GET /admin/articles/{id}`
- **描述**: 通过 ID 获取，用于编辑器回显
- **认证**: Bearer Token

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "文章标题",
    "content": "# 文章内容",
    "summary": "文章摘要",
    "ai_summary": "AI摘要",
    "cover": "https://example.com/cover.jpg",
    "location": "发布地点",
    "is_publish": true,
    "is_top": true,
    "is_essence": false,
    "is_outdated": false,
    "publish_time": "2025-01-15T10:30:00Z",
    "update_time": "2025-01-16T14:00:00Z",
    "category": {
      "id": 1,
      "name": "分类名称"
    },
    "tags": [
      {
        "id": 1,
        "name": "标签名称"
      }
    ]
  }
}
```

#### 6. 创建文章

- **路径**: `POST /admin/articles`
- **描述**: 创建草稿或发布文章，自动生成 slug
- **认证**: Bearer Token

**请求体**:

```json
{
  "title": "文章标题",
  "content": "# 文章内容",
  "summary": "文章摘要",
  "cover": "https://example.com/cover.jpg",
  "location": "发布地点",
  "is_publish": true,
  "is_top": false,
  "is_essence": false,
  "is_outdated": false,
  "category_id": 1,
  "tag_ids": [1, 2, 3]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 文章标题 |
| `content` | string | 是 | 文章内容（Markdown） |
| `summary` | string | 否 | 文章摘要 |
| `cover` | string | 否 | 封面图URL |
| `location` | string | 否 | 发布地点 |
| `is_publish` | bool | 否 | 是否发布 |
| `is_top` | bool | 否 | 是否置顶 |
| `is_essence` | bool | 否 | 是否精选 |
| `is_outdated` | bool | 否 | 是否过时 |
| `category_id` | uint | 否 | 分类ID |
| `tag_ids` | []uint | 否 | 标签ID列表 |

**成功响应** (`201`): 同管理端文章详情响应

#### 7. 更新文章

- **路径**: `PUT /admin/articles/{id}`
- **描述**: 修改文章内容、分类、标签等
- **认证**: Bearer Token

**请求体**:

```json
{
  "title": "更新后的标题",
  "content": "# 更新后的内容",
  "summary": "更新后的摘要",
  "ai_summary": "更新后的AI摘要",
  "cover": "https://example.com/new-cover.jpg",
  "location": "新地点",
  "is_publish": true,
  "is_top": true,
  "is_essence": true,
  "is_outdated": false,
  "category_id": 2,
  "tag_ids": [2, 3, 4],
  "publish_time": "2025-01-15T10:30:00Z",
  "update_time": "2025-01-16T14:00:00Z"
}
```

#### 8. 删除文章

- **路径**: `DELETE /admin/articles/{id}`
- **描述**: 硬删除文章，会自动更新分类和标签的文章计数
- **认证**: Bearer Token

#### 9. 导入文章

- **路径**: `POST /admin/articles/import`
- **描述**: 从Hexo等静态博客系统导入文章数据
- **认证**: Bearer Token

**请求体（multipart/form-data）**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `source_type` | string | 是 | 来源类型，目前支持：hexo |
| `files` | []file | 是 | 文章文件（.md或.markdown格式） |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 10,
    "success": 8,
    "failed": 2,
    "categories_added": 2,
    "tags_added": 5,
    "errors": [
      {
        "filename": "article.md",
        "title": "文章标题",
        "error": "错误原因"
      }
    ]
  }
}
```

#### 10. 导出文章到微信公众号

- **路径**: `POST /admin/articles/{id}/wechat/export`
- **描述**: 尝试推送到公众号草稿箱，失败则返回 HTML 供复制
- **认证**: Bearer Token

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "media_id": "wx_media_id",
    "html": "<html>...</html>",
    "warnings": ["警告信息"]
  }
}
```

---

## 用户认证接口

### 1. 用户注册

- **路径**: `POST /auth/register`
- **描述**: 邮箱+密码注册，返回 Token 和用户信息

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "用户名",
  "website": "https://example.com"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `password` | string | 是 | 密码，6-32位 |
| `nickname` | string | 是 | 昵称，2-32位 |
| `website` | string | 否 | 个人网站URL |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "email_hash": "abc123...",
      "is_virtual_email": false,
      "nickname": "用户名",
      "avatar": "https://gravatar.com/avatar/...",
      "badge": "",
      "website": "https://example.com",
      "role": "user",
      "has_password": true,
      "linked_oauths": [],
      "last_login": null,
      "created_at": "2025-01-15T10:30:00Z"
    }
  }
}
```

### 2. 用户登录

- **路径**: `POST /auth/login`
- **描述**: 邮箱+密码登录，返回 JWT token

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**成功响应** (`200`): 同注册响应

### 3. 刷新 Token

- **路径**: `POST /auth/refresh`
- **描述**: 使用 refresh token 获取新的 access token

**请求体**:

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. 忘记密码

- **路径**: `POST /auth/forgot-password`
- **描述**: 通过邮箱找回密码，发送重置验证码

**请求体**:

```json
{
  "email": "user@example.com"
}
```

### 5. 重置密码

- **路径**: `POST /auth/reset-password`
- **描述**: 凭验证码设置新密码

**请求体**:

```json
{
  "email": "user@example.com",
  "code": "123456",
  "password": "newpassword123"
}
```

### 6. 用户登出

- **路径**: `POST /auth/logout`
- **描述**: 将当前 token 加入黑名单使其失效
- **认证**: Bearer Token

---

## 用户信息接口

### 前台接口

#### 1. 获取用户信息

- **路径**: `GET /user/profile`
- **描述**: 获取当前登录用户的信息
- **认证**: Bearer Token

**成功响应** (`200`): 同登录响应中的 user 对象

#### 2. 更新用户信息

- **路径**: `PATCH /user/profile`
- **描述**: 修改昵称、头像等信息，支持部分更新
- **认证**: Bearer Token

**请求体**:

```json
{
  "nickname": "新昵称",
  "email": "new@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "badge": "认证用户",
  "website": "https://new-site.com"
}
```

#### 3. 修改密码

- **路径**: `PUT /user/password`
- **描述**: 修改密码需提供旧密码验证
- **认证**: Bearer Token

**请求体**:

```json
{
  "old_password": "oldpassword",
  "new_password": "newpassword123"
}
```

#### 4. 设置密码（OAuth用户）

- **路径**: `POST /user/password`
- **描述**: OAuth 注册用户首次设置密码，无需旧密码验证
- **认证**: Bearer Token

**请求体**:

```json
{
  "password": "newpassword123",
  "confirm_password": "newpassword123"
}
```

#### 5. 注销账号

- **路径**: `DELETE /user/deactivate`
- **描述**: 用户主动注销自己的账号，需提供密码验证
- **认证**: Bearer Token

**请求体**:

```json
{
  "password": "password123"
}
```

#### 6. 解绑第三方账号

- **路径**: `DELETE /user/oauth/{provider}`
- **描述**: 解绑已绑定的第三方账号
- **认证**: Bearer Token

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `provider` | string | 提供商：github/google/qq |

### 后台管理接口

#### 7. 获取用户列表

- **路径**: `GET /admin/users`
- **描述**: 获取所有用户列表
- **认证**: Bearer Token

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | int | 否 | 页码，默认1 |
| `page_size` | int | 否 | 每页数量，默认10 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "email": "user@example.com",
        "nickname": "用户名",
        "avatar": "https://example.com/avatar.jpg",
        "badge": "",
        "website": "https://example.com",
        "role": "admin",
        "is_enabled": true,
        "last_login": "2025-01-15T10:30:00Z",
        "created_at": "2025-01-01T00:00:00Z",
        "deleted_at": null,
        "has_password": true,
        "github_id": "",
        "google_id": "",
        "qq_id": "",
        "microsoft_id": "",
        "feishu_open_id": ""
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 10
  }
}
```

#### 8. 创建用户（管理员）

- **路径**: `POST /admin/users`
- **描述**: 管理员快速创建用户，可指定角色和状态
- **认证**: Bearer Token

**请求体**:

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "nickname": "新用户",
  "avatar": "https://example.com/avatar.jpg",
  "badge": "",
  "website": "",
  "role": "user"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱 |
| `password` | string | 是 | 密码，6-32位 |
| `nickname` | string | 是 | 昵称 |
| `avatar` | string | 否 | 头像URL |
| `badge` | string | 否 | 铭牌 |
| `website` | string | 否 | 网站 |
| `role` | string | 是 | 角色：super_admin/admin/user/guest |

#### 9. 更新用户（管理员）

- **路径**: `PUT /admin/users/{id}`
- **描述**: 管理员修改用户信息、角色、是否启用、密码等
- **认证**: Bearer Token

**请求体**:

```json
{
  "email": "updated@example.com",
  "nickname": "更新后的昵称",
  "avatar": "https://example.com/new-avatar.jpg",
  "badge": "VIP",
  "website": "https://updated.com",
  "role": "admin",
  "is_enabled": true,
  "password": "newpassword123"
}
```

#### 10. 删除用户（管理员）

- **路径**: `DELETE /admin/users/{id}`
- **描述**: 软删除用户，可通过恢复接口还原
- **认证**: Bearer Token

---

## 分类接口

### 前台接口

#### 1. 获取分类列表

- **路径**: `GET /categories`
- **描述**: 获取所有分类

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页数量，不传则返回全部 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "分类名称",
        "slug": "category-slug",
        "url": "/categories/category-slug",
        "description": "分类描述",
        "count": 10,
        "sort": 1
      }
    ],
    "total": 5,
    "page": 1,
    "page_size": 10
  }
}
```

#### 2. 获取分类详情

- **路径**: `GET /categories/{slug}`
- **描述**: 通过 slug 获取分类信息

### 后台管理接口

#### 3. 创建分类

- **路径**: `POST /admin/categories`
- **描述**: 创建新分类，自动生成 slug
- **认证**: Bearer Token

**请求体**:

```json
{
  "name": "新分类",
  "description": "分类描述",
  "sort": 1
}
```

#### 4. 更新分类

- **路径**: `PUT /admin/categories/{id}`
- **描述**: 修改分类信息
- **认证**: Bearer Token

**请求体**: 同创建分类

#### 5. 删除分类

- **路径**: `DELETE /admin/categories/{id}`
- **描述**: 软删除分类
- **认证**: Bearer Token

---

## 标签接口

### 前台接口

#### 1. 获取标签列表

- **路径**: `GET /tags`
- **描述**: 获取所有标签

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "标签名称",
        "slug": "tag-slug",
        "url": "/tags/tag-slug",
        "description": "标签描述",
        "count": 5
      }
    ],
    "total": 20
  }
}
```

#### 2. 获取标签详情

- **路径**: `GET /tags/{slug}`
- **描述**: 通过 slug 获取标签信息

### 后台管理接口

#### 3. 创建标签

- **路径**: `POST /admin/tags`
- **描述**: 创建新标签，自动生成 slug
- **认证**: Bearer Token

**请求体**:

```json
{
  "name": "新标签",
  "description": "标签描述"
}
```

#### 4. 更新标签

- **路径**: `PUT /admin/tags/{id}`
- **描述**: 修改标签信息
- **认证**: Bearer Token

#### 5. 删除标签

- **路径**: `DELETE /admin/tags/{id}`
- **描述**: 软删除标签
- **认证**: Bearer Token

---

## 评论接口

### 前台接口

#### 1. 获取评论列表

- **路径**: `GET /comments`
- **描述**: 获取目标评论，扁平化显示所有评论和回复

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `target_type` | string | 是 | 目标类型：article/page |
| `target_key` | string | 是 | 目标标识：文章slug或页面key |
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页数量，不传则返回全部 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "content": "评论内容",
        "parent_id": null,
        "created_at": "2025-01-15T10:30:00Z",
        "location": "北京",
        "browser": "Chrome",
        "os": "Windows",
        "user": {
          "id": 1,
          "nickname": "用户昵称",
          "avatar": "https://example.com/avatar.jpg",
          "badge": "",
          "email_hash": "abc123...",
          "website": "https://example.com",
          "role": "user"
        },
        "reply_user": null,
        "replies": []
      }
    ],
    "total": 10
  }
}
```

#### 2. 创建评论

- **路径**: `POST /comments`
- **描述**: 发表评论或回复

**请求体**:

```json
{
  "content": "评论内容",
  "target_type": "article",
  "target_key": "article-slug",
  "parent_id": null,
  "nickname": "游客昵称",
  "email": "guest@example.com",
  "website": "https://example.com"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | 是 | 评论内容，1-500字 |
| `target_type` | string | 是 | 目标类型：article/page |
| `target_key` | string | 是 | 目标标识 |
| `parent_id` | uint | 否 | 父评论ID（回复时必填） |
| `nickname` | string | 游客必填 | 游客昵称，2-32位 |
| `email` | string | 游客必填 | 游客邮箱 |
| `website` | string | 否 | 个人网站 |

**成功响应** (`201`): 同评论列表项结构

#### 3. 更新评论

- **路径**: `PUT /comments/{id}`
- **描述**: 只能修改自己的评论内容
- **认证**: Bearer Token

**请求体**:

```json
{
  "content": "修改后的评论内容"
}
```

#### 4. 删除评论

- **路径**: `DELETE /comments/{id}`
- **描述**: 只能删除自己的评论，子评论会保留
- **认证**: Bearer Token

### 后台管理接口

#### 5. 获取评论列表（管理）

- **路径**: `GET /admin/comments`
- **描述**: 获取所有评论，支持按状态筛选
- **认证**: Bearer Token

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页数量 |
| `status` | int | 否 | 状态筛选：0隐藏，1显示 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "content": "评论内容",
        "status": 1,
        "parent_id": null,
        "created_at": "2025-01-15T10:30:00Z",
        "deleted_at": null,
        "target": {
          "type": "article",
          "key": "article-slug",
          "title": "文章标题"
        },
        "user": {
          "id": 1,
          "email": "user@example.com",
          "nickname": "用户昵称",
          "avatar": "https://example.com/avatar.jpg",
          "badge": ""
        }
      }
    ],
    "total": 10
  }
}
```

#### 6. 切换评论状态

- **路径**: `PUT /admin/comments/{id}/toggle-status`
- **描述**: 切换评论的显示状态，隐藏后前台不可见
- **认证**: Bearer Token

#### 7. 删除评论（管理）

- **路径**: `DELETE /admin/comments/{id}`
- **描述**: 软删除评论，可通过恢复接口还原
- **认证**: Bearer Token

#### 8. 恢复评论

- **路径**: `PUT /admin/comments/{id}/restore`
- **描述**: 恢复已删除的评论
- **认证**: Bearer Token

#### 9. 导入评论

- **路径**: `POST /admin/comments/import`
- **描述**: 从Artalk等第三方评论系统导入评论数据
- **认证**: Bearer Token

**请求体（multipart/form-data）**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | file | 是 | 导入文件（JSON或Artrans格式） |
| `source_type` | string | 是 | 来源类型：artalk |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "user_created": 10,
    "errors": [...]
  }
}
```

---

## 友链接口

### 前台接口

#### 1. 获取友链列表

- **路径**: `GET /friends`
- **描述**: 获取友链列表（按类型分组并排序）

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "groups": [
      {
        "type_id": 1,
        "type_name": "友情链接",
        "type_sort": 1,
        "friends": [
          {
            "id": 1,
            "name": "网站名称",
            "url": "https://example.com",
            "description": "网站描述",
            "avatar": "https://example.com/avatar.jpg",
            "screenshot": "https://example.com/screenshot.png",
            "sort": 1,
            "is_invalid": false
          }
        ]
      }
    ],
    "total_groups": 3,
    "total_friends": 20
  }
}
```

#### 2. 申请友链

- **路径**: `POST /friends/apply`
- **描述**: 用户提交友链申请，系统将通知管理员审核
- **认证**: Bearer Token

**请求体**:

```json
{
  "name": "我的网站",
  "url": "https://my-site.com",
  "description": "网站描述",
  "avatar": "https://my-site.com/avatar.jpg",
  "screenshot": "https://my-site.com/screenshot.png"
}
```

### 后台管理接口

#### 3. 获取友链类型列表

- **路径**: `GET /admin/friends/types`
- **描述**: 获取所有友链类型
- **认证**: Bearer Token

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "友情链接",
        "sort": 1,
        "is_visible": true,
        "count": 10
      }
    ],
    "total": 3
  }
}
```

#### 4. 创建友链类型

- **路径**: `POST /admin/friends/types`
- **描述**: 创建新的友链类型
- **认证**: Bearer Token

**请求体**:

```json
{
  "name": "新类型",
  "sort": 2,
  "is_visible": true
}
```

#### 5. 更新友链类型

- **路径**: `PUT /admin/friends/types/{id}`
- **描述**: 修改友链类型信息
- **认证**: Bearer Token

#### 6. 删除友链类型

- **路径**: `DELETE /admin/friends/types/{id}`
- **描述**: 删除友链类型，关联的友链 type_id 会被设置为 NULL
- **认证**: Bearer Token

#### 7. 获取友链列表（管理）

- **路径**: `GET /admin/friends`
- **描述**: 获取所有友链用于管理
- **认证**: Bearer Token

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "网站名称",
        "url": "https://example.com",
        "description": "网站描述",
        "avatar": "https://example.com/avatar.jpg",
        "screenshot": "https://example.com/screenshot.png",
        "sort": 1,
        "is_invalid": false,
        "is_pending": false,
        "type_id": 1,
        "type_name": "友情链接",
        "rss_url": "https://example.com/rss",
        "accessible": 1
      }
    ],
    "total": 20
  }
}
```

#### 8. 创建友链

- **路径**: `POST /admin/friends`
- **描述**: 创建新友链
- **认证**: Bearer Token

**请求体**:

```json
{
  "name": "网站名称",
  "url": "https://example.com",
  "description": "网站描述",
  "avatar": "https://example.com/avatar.jpg",
  "screenshot": "https://example.com/screenshot.png",
  "sort": 1,
  "type_id": 1,
  "rss_url": "https://example.com/rss"
}
```

#### 9. 更新友链

- **路径**: `PUT /admin/friends/{id}`
- **描述**: 修改友链信息
- **认证**: Bearer Token

**请求体**:

```json
{
  "name": "更新后的名称",
  "url": "https://new-url.com",
  "description": "更新后的描述",
  "avatar": "https://new-url.com/avatar.jpg",
  "screenshot": "https://new-url.com/screenshot.png",
  "sort": 2,
  "is_invalid": false,
  "is_pending": false,
  "type_id": 1,
  "rss_url": "https://new-url.com/rss",
  "accessible": 1
}
```

#### 10. 删除友链

- **路径**: `DELETE /admin/friends/{id}`
- **描述**: 软删除友链
- **认证**: Bearer Token

---

## 动态接口

### 前台接口

#### 1. 获取动态列表

- **路径**: `GET /moments`
- **描述**: 获取所有公开的动态

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "content": {
          "text": "动态文本内容",
          "images": ["https://example.com/img1.jpg"],
          "location": "北京",
          "tags": "#标签",
          "link": {
            "url": "https://example.com",
            "title": "链接标题",
            "favicon": "https://example.com/favicon.ico"
          },
          "music": {
            "server": "netease",
            "type": "song",
            "id": "123456"
          },
          "video": {
            "url": "https://example.com/video.mp4",
            "platform": "bilibili",
            "video_id": "BV1234567890"
          },
          "book": {...},
          "movie": {...}
        },
        "is_publish": true,
        "publish_time": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 50
  }
}
```

### 后台管理接口

#### 2. 创建动态

- **路径**: `POST /admin/moments`
- **描述**: 创建新动态
- **认证**: Bearer Token

**请求体**:

```json
{
  "content": {
    "text": "动态内容",
    "images": ["https://example.com/img.jpg"],
    "location": "北京"
  },
  "is_publish": true,
  "publish_time": "2025-01-15T10:30:00Z"
}
```

#### 3. 更新动态

- **路径**: `PUT /admin/moments/{id}`
- **描述**: 修改动态信息
- **认证**: Bearer Token

#### 4. 删除动态

- **路径**: `DELETE /admin/moments/{id}`
- **描述**: 删除动态
- **认证**: Bearer Token

---

## 文件接口

### 前台接口

#### 1. 文件上传

- **路径**: `POST /upload`
- **描述**: 前台用户上传图片、头像等，支持匿名上传

**请求体（multipart/form-data）**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | file | 是 | 上传的文件 |
| `type` | string | 是 | 上传类型：用户头像/评论贴图/反馈投诉 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "original_name": "original.jpg",
    "file_url": "https://example.com/uploads/xxx.jpg"
  }
}
```

### 后台管理接口

#### 2. 文件上传（管理）

- **路径**: `POST /admin/files`
- **描述**: 管理员上传文件，限制相对宽松
- **认证**: Bearer Token

#### 3. 获取文件列表

- **路径**: `GET /admin/files`
- **描述**: 获取已上传的所有文件，支持按类型筛选
- **认证**: Bearer Token

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | int | 否 | 页码，默认1 |
| `page_size` | int | 否 | 每页数量，默认20 |
| `type` | string | 否 | 文件类型筛选 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "original_name": "original.jpg",
        "file_name": "xxx.jpg",
        "file_size": 102400,
        "file_type": "image/jpeg",
        "file_url": "https://example.com/uploads/xxx.jpg",
        "upload_type": "avatar",
        "user_id": 1,
        "status": 1,
        "upload_time": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 100
  }
}
```

#### 4. 删除文件

- **路径**: `DELETE /admin/files/{id}`
- **描述**: 删除指定文件
- **认证**: Bearer Token

---

## AI功能接口

### 1. 测试AI配置

- **路径**: `POST /admin/ai/test`
- **描述**: 使用提供的配置测试AI服务连通性
- **认证**: Bearer Token

**请求体**:

```json
{
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-xxx",
  "model": "gpt-4"
}
```

### 2. 生成文章摘要

- **路径**: `POST /admin/ai/summary`
- **描述**: 基于文章内容自动生成摘要（50-100字，创作者角度）
- **认证**: Bearer Token

**请求体**:

```json
{
  "content": "# 文章内容..."
}
```

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "summary": "生成的摘要内容"
  }
}
```

### 3. 生成AI摘要

- **路径**: `POST /admin/ai/ai-summary`
- **描述**: 基于文章内容生成AI摘要（150-200字，旁观者角度）
- **认证**: Bearer Token

**请求体**: 同生成文章摘要

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "summary": "生成的AI摘要内容"
  }
}
```

### 4. 生成标题建议

- **路径**: `POST /admin/ai/title`
- **描述**: 根据内容生成多个标题建议
- **认证**: Bearer Token

**请求体**:

```json
{
  "content": "# 文章内容..."
}
```

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "title": "生成的标题"
  }
}
```

---

## 菜单接口

### 前台接口

#### 1. 获取菜单树

- **路径**: `GET /menus`
- **描述**: 获取前台菜单树

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `type` | string | 否 | 菜单类型：aggregate/navigation/footer |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "type": "navigation",
      "parent_id": null,
      "title": "首页",
      "url": "/",
      "icon": "home",
      "sort": 1,
      "is_enabled": true,
      "children": [
        {
          "id": 2,
          "type": "navigation",
          "parent_id": 1,
          "title": "子菜单",
          "url": "/sub",
          "icon": "",
          "sort": 1,
          "is_enabled": true,
          "children": []
        }
      ]
    }
  ]
}
```

### 后台管理接口

#### 2. 创建菜单

- **路径**: `POST /admin/menus`
- **描述**: 创建菜单
- **认证**: Bearer Token

**请求体**:

```json
{
  "type": "navigation",
  "parent_id": null,
  "title": "新菜单",
  "url": "/new",
  "icon": "icon-name",
  "sort": 1,
  "is_enabled": true
}
```

#### 3. 更新菜单

- **路径**: `PUT /admin/menus/{id}`
- **描述**: 更新菜单
- **认证**: Bearer Token

#### 4. 删除菜单

- **路径**: `DELETE /admin/menus/{id}`
- **描述**: 删除菜单
- **认证**: Bearer Token

**请求体（可选）**:

```json
{
  "children_action": "delete"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `children_action` | string | 子菜单处理方式：delete-删除子菜单，upgrade-升级为主菜单 |

---

## 反馈接口

### 前台接口

#### 1. 提交反馈

- **路径**: `POST /api/v1/feedback`
- **描述**: 提交反馈投诉

**请求体**:

```json
{
  "reportUrl": "https://example.com/article/1",
  "reportType": "copyright",
  "email": "user@example.com",
  "description": "反馈描述内容",
  "reason": "原因说明",
  "attachmentFiles": ["https://example.com/img.jpg"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reportUrl` | string | 是 | 举报URL |
| `reportType` | string | 是 | 举报类型：copyright/inappropriate/summary/suggestion |
| `email` | string | 否 | 联系邮箱 |
| `description` | string | 是 | 描述内容 |
| `reason` | string | 否 | 原因 |
| `attachmentFiles` | []string | 否 | 附件文件URL数组 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "ticket_no": "TK202501150001",
    "report_url": "https://example.com/article/1",
    "report_type": "copyright",
    "form_content": {...},
    "email": "user@example.com",
    "status": "pending",
    "admin_reply": "",
    "reply_time": null,
    "user_agent": "Mozilla/5.0...",
    "ip": "127.0.0.1",
    "feedback_time": "2025-01-15T10:30:00Z"
  }
}
```

#### 2. 根据工单号查询反馈

- **路径**: `GET /api/v1/feedback/ticket/{ticket_no}`
- **描述**: 根据工单号查询反馈

### 后台管理接口

#### 3. 获取反馈列表

- **路径**: `GET /api/v1/admin/feedback`
- **描述**: 获取反馈列表
- **认证**: Bearer Token

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | int | 是 | 页码 |
| `page_size` | int | 是 | 每页数量 |

#### 4. 获取反馈详情

- **路径**: `GET /api/v1/admin/feedback/{id}`
- **描述**: 获取反馈详情
- **认证**: Bearer Token

#### 5. 更新反馈

- **路径**: `PUT /api/v1/admin/feedback/{id}`
- **描述**: 更新反馈状态和回复
- **认证**: Bearer Token

**请求体**:

```json
{
  "status": "resolved",
  "admin_reply": "已处理您的反馈"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 是 | 状态：pending/resolved/closed |
| `admin_reply` | string | 否 | 管理员回复 |

#### 6. 删除反馈

- **路径**: `DELETE /api/v1/admin/feedback/{id}`
- **描述**: 删除反馈
- **认证**: Bearer Token

---

## 通知接口

### 前台接口

#### 1. 获取用户通知列表

- **路径**: `GET /api/v1/notifications`
- **描述**: 获取当前用户的通知列表
- **认证**: Bearer Token

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | int | 是 | 页码 |
| `page_size` | int | 是 | 每页数量 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "type": "comment_reply",
        "type_text": "评论回复",
        "title": "您的评论收到了回复",
        "content": "用户xxx回复了您的评论",
        "link": "/articles/test-slug#comment-1",
        "data": {...},
        "target_id": 1,
        "is_read": false,
        "read_at": null,
        "created_at": "2025-01-15T10:30:00Z",
        "sender": "用户名"
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 10,
    "unread_count": 3
  }
}
```

#### 2. 标记通知为已读

- **路径**: `PUT /api/v1/notifications/{id}/read`
- **描述**: 将指定通知标记为已读状态
- **认证**: Bearer Token

#### 3. 标记所有通知为已读

- **路径**: `PUT /api/v1/notifications/read-all`
- **描述**: 将所有通知标记为已读状态
- **认证**: Bearer Token

### 后台管理接口

#### 4. 获取管理员通知列表

- **路径**: `GET /api/v1/admin/notifications`
- **描述**: 获取管理员的通知列表
- **认证**: Bearer Token

---

## 统计接口

### 前台接口

#### 1. 数据收集

- **路径**: `POST /collect`
- **描述**: 前端埋点数据收集，记录页面访问等

**请求体**:

```json
{
  "url": "/articles/test-slug",
  "hostname": "example.com",
  "referrer": "https://google.com",
  "language": "zh-CN",
  "screen": "1920x1080",
  "title": "文章标题",
  "timestamp": 1736900000,
  "type": "pageview",
  "duration": 30,
  "article_id": 1
}
```

**成功响应** (`204`): 无内容

#### 2. 获取网站统计信息

- **路径**: `GET /stats/site`
- **描述**: 获取博客前台公开统计数据

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total_words": "100000",
    "total_visitors": 10000,
    "total_page_views": 50000,
    "online_users": 10,
    "today_visitors": 50,
    "today_pageviews": 200,
    "yesterday_visitors": 45,
    "yesterday_pageviews": 180,
    "month_pageviews": 3000,
    "total_articles": 50,
    "total_comments": 200,
    "total_friends": 20,
    "total_moments": 100,
    "total_categories": 5,
    "total_tags": 30
  }
}
```

#### 3. 获取文章归档数据

- **路径**: `GET /stats/archives`
- **描述**: 按年月归档的文章统计

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "archives": [
      {
        "year": "2025",
        "month": "01",
        "count": 10
      }
    ]
  }
}
```

### 后台管理接口

#### 4. 获取仪表盘统计数据

- **路径**: `GET /admin/stats/dashboard`
- **描述**: 获取基础统计、今日数据和趋势对比
- **认证**: Bearer Token

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total_articles": 50,
    "total_friends": 20,
    "total_moments": 100,
    "total_views": 50000,
    "total_visitors": 10000,
    "total_comments": 200,
    "total_users": 100,
    "today_views": 200,
    "today_visitors": 50,
    "today_comments": 5,
    "today_users": 2,
    "views_growth": 10.5,
    "visitors_growth": 5.0,
    "comments_growth": 20.0,
    "users_growth": 0.0
  }
}
```

#### 5. 获取访问趋势数据

- **路径**: `GET /admin/stats/trend`
- **描述**: 指定时间段的访问趋势，支持按天/周/月聚合
- **认证**: Bearer Token

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `start_date` | string | 是 | 开始日期 YYYY-MM-DD |
| `end_date` | string | 是 | 结束日期 YYYY-MM-DD |
| `type` | string | 否 | 统计类型：daily/weekly/monthly，默认daily |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "date": "2025-01-01",
      "pv_count": 100,
      "uv_count": 50
    }
  ]
}
```

#### 6. 获取分类统计数据

- **路径**: `GET /admin/stats/category`
- **描述**: 每个分类的文章数量统计
- **认证**: Bearer Token

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "name": "分类1",
      "count": 10
    }
  ]
}
```

#### 7. 获取标签统计数据

- **路径**: `GET /admin/stats/tag`
- **描述**: 每个标签的文章数量统计
- **认证**: Bearer Token

#### 8. 获取文章贡献数据

- **路径**: `GET /admin/stats/contribution`
- **描述**: 获取文章发布数据，支持按年份或月份查询
- **认证**: Bearer Token

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `year` | int | 否 | 年份 |
| `month` | int | 否 | 月份 1-12 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "date": "2025-01-15",
      "count": 2
    }
  ]
}
```

#### 9. 获取访问日志列表

- **路径**: `GET /admin/stats/visits`
- **描述**: 获取访问日志列表，支持分页查询
- **认证**: Bearer Token

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | int | 否 | 页码，默认1 |
| `page_size` | int | 否 | 每页数量，默认20 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "visitor_id": "abc123",
        "ip": "127.0.0.1",
        "page_url": "/articles/test-slug",
        "user_agent": "Mozilla/5.0...",
        "location": "北京",
        "browser": "Chrome",
        "os": "Windows",
        "referer": "https://google.com",
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 1000
  }
}
```

---

## 订阅接口

### 前台接口

#### 1. 邮件订阅

- **路径**: `POST /api/v1/subscribe`
- **描述**: 订阅博客更新邮件

**请求体**:

```json
{
  "email": "user@example.com"
}
```

#### 2. 退订

- **路径**: `GET /api/v1/subscribe/unsubscribe`
- **描述**: 通过token退订

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `token` | string | 是 | 退订令牌 |

### 后台管理接口

#### 3. 获取订阅者列表

- **路径**: `GET /api/v1/admin/subscribers`
- **描述**: 获取订阅者列表
- **认证**: Bearer Token

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | int | 是 | 页码 |
| `page_size` | int | 是 | 每页数量 |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "email": "user@example.com",
        "active": true,
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 100
  }
}
```

#### 4. 删除订阅者

- **路径**: `DELETE /api/v1/admin/subscribers/{id}`
- **描述**: 删除订阅者
- **认证**: Bearer Token

---

## RSS订阅接口

### 后台管理接口

#### 1. 获取RSS文章列表

- **路径**: `GET /admin/rssfeed`
- **描述**: 获取RSS订阅文章列表
- **认证**: Bearer Token

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页数量 |

#### 2. 标记文章已读

- **路径**: `PUT /admin/rssfeed/{id}/read`
- **描述**: 将指定文章标记为已读
- **认证**: Bearer Token

#### 3. 全部标记已读

- **路径**: `PUT /admin/rssfeed/read-all`
- **描述**: 将所有未读文章标记为已读
- **认证**: Bearer Token

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "affected": 10
  }
}
```

---

## 工具接口

### 1. 解析视频URL

- **路径**: `POST /tools/parse-video`
- **描述**: 解析视频URL，提取平台和视频ID

**请求体**:

```json
{
  "url": "https://www.bilibili.com/video/BV1234567890"
}
```

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "platform": "bilibili",
    "video_id": "BV1234567890"
  }
}
```

### 2. 获取链接元数据

- **路径**: `POST /tools/fetch-link-metadata`
- **描述**: 获取链接的标题和favicon

**请求体**:

```json
{
  "url": "https://example.com"
}
```

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "title": "网站标题",
    "favicon": "https://example.com/favicon.ico"
  }
}
```

### 3. 下载图片

- **路径**: `POST /tools/download-image`
- **描述**: 下载远程图片

**请求体**:

```json
{
  "url": "https://example.com/image.jpg"
}
```

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content_type": "image/jpeg",
    "content_length": 102400,
    "data": "base64-encoded-image-data"
  }
}
```

---

## 系统信息接口

### 1. 获取系统静态信息

- **路径**: `GET /system/static`
- **描述**: 获取系统静态信息

**成功响应** (`200`): 返回系统基础配置信息

### 2. 获取系统动态信息

- **路径**: `GET /system/dynamic`
- **描述**: 获取系统动态信息（如运行时间、内存使用等）

---

## 配置接口

### 前台接口

#### 1. 获取公开配置分组

- **路径**: `GET /settings/{group}`
- **描述**: 获取指定分组的公开配置项

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `group` | string | 是 | 配置分组：basic/blog/notification/upload/ai/oauth/wechat |

**成功响应** (`200`):

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

### 后台管理接口

#### 2. 获取配置分组（管理）

- **路径**: `GET /admin/settings/{group}`
- **描述**: 获取指定分组的所有配置项
- **认证**: Bearer Token

#### 3. 更新配置分组

- **路径**: `PATCH /admin/settings/{group}`
- **描述**: 批量更新指定分组的配置项
- **认证**: Bearer Token

**请求体**:

```json
{
  "key1": "new_value1",
  "key2": "new_value2"
}
```

---

## 响应格式

所有API接口返回统一的响应格式：

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {...}
}
```

### 分页响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "page_size": 10
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "请求参数错误",
  "data": null
}
```

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 无内容 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 禁止访问，权限不足 |
| 404 | 资源不存在 |
| 409 | 冲突（如邮箱已存在） |
| 500 | 服务器内部错误 |

---

## 认证方式

### Bearer Token

所有需要认证的接口需要在请求头中携带 `Authorization` 字段：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 第三方OAuth认证

- **路径**: `GET /auth/{provider}`
- **描述**: 跳转到第三方认证页面
- **路径参数**: `provider` - 提供商：github/google/qq

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `action` | string | 否 | 操作类型：login(默认) 或 bind |
| `token` | string | 否 | 绑定时的认证token |
| `redirect` | string | 否 | 成功后跳转的页面路径 |

---

## 通用数据类型

### JSONTime

时间格式，ISO 8601标准格式：

```json
"2025-01-15T10:30:00Z"
```

### UserRole

用户角色枚举：

| 值 | 说明 |
|----|------|
| `super_admin` | 超级管理员 |
| `admin` | 管理员 |
| `user` | 普通用户 |
| `guest` | 访客 |