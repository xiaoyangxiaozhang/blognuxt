# 小羊嚣张博客前台

“小羊嚣张”个人博客的前台应用，基于 Nuxt 4 和 Vue 3 构建，使用 Nuxt SSR 输出页面，并通过后端 API 获取文章、评论、分类、标签和站点配置。

线上地址：<https://xiaoyangxiaozhang.xyz/>

后台管理端位于另一个仓库：[blog](https://github.com/xiaoyangxiaozhang/blog)。

## 功能

- 首页、文章详情、Markdown 内容和文章目录
- 归档、分类和标签浏览
- 评论、回复、表情和图片上传
- 友链、动态和留言页面
- 日间/夜间主题切换与响应式布局
- 背景视频的封面回退、移动端适配和不可见时暂停播放
- 页面访问量统计，并支持按环境开关

## 技术栈

- Nuxt 4、Vue 3、TypeScript、Nitro SSR
- Pinia、Element Plus、Sass
- Markdown-it、Unplugin Icons
- GitHub Actions + 阿里云 ECS 部署

## 环境要求

- Node.js 22.19.0 或更高版本
- npm 10 或更高版本
- 可访问的博客后端 API

项目声明的 Node.js 范围为 `^22.19.0 || ^24.11.0 || >=26.0.0`，推荐使用 Node.js 22 LTS。

## 本地开发

```bash
npm ci
npm run dev
```

开发服务器默认地址为 <http://127.0.0.1:3000/>。

### 配置后端 API

默认 API 地址为 `https://xiaoyangxiaozhang.xyz/api/v1`。连接本地后端时，可以通过环境变量覆盖：

```bash
NUXT_PUBLIC_API_BASE=http://localhost:8080/api/v1 npm run dev
```

也可以在项目根目录创建 `.env` 或 `.env.local`：

```dotenv
NUXT_PUBLIC_API_BASE=http://localhost:8080/api/v1
```

### 本地测试访问统计

开发环境默认关闭页面访问统计；如需在本地验证上报流程，可以显式开启：

```bash
NUXT_PUBLIC_ANALYTICS_ENABLED=true npm run dev
```

强制关闭统计：

```bash
NUXT_PUBLIC_ANALYTICS_ENABLED=false npm run dev
```

统计插件会在页面首次加载和路由切换时记录页面访问，遵循浏览器的 DNT/GPC 偏好；上报失败不会影响页面渲染。

## 构建与预览

```bash
npm run build
npm run preview
```

构建产物位于 `.output/`，SSR 服务入口为 `.output/server/index.mjs`。生产环境运行时仍需要正确配置 `NUXT_PUBLIC_API_BASE`，不能留空。

## 页面

| 路径 | 说明 |
| --- | --- |
| `/` | 首页 |
| `/article/:slug` | 文章详情 |
| `/archive` | 文章归档 |
| `/categories`、`/category/:slug` | 分类列表与分类文章 |
| `/tags`、`/tag/:slug` | 标签列表与标签文章 |
| `/friends` | 友情链接 |
| `/dynamic` | 动态 |
| `/message` | 留言 |

## API 与数据层

后端请求封装位于 [`app/services/api/`](./app/services/api)，按业务拆分为文章、评论、分类、标签、用户、上传、动态、系统配置和统计等模块。

页面访问统计相关代码：

- [`app/plugins/analytics.client.ts`](./app/plugins/analytics.client.ts)：客户端初始化与路由监听
- [`app/services/api/analytics.ts`](./app/services/api/analytics.ts)：访问统计 API
- [`nuxt.config.ts`](./nuxt.config.ts)：`NUXT_PUBLIC_ANALYTICS_ENABLED` 配置

## 目录结构

```text
blognuxt/
├── app/
│   ├── components/           # 页面组件
│   ├── composables/          # 可复用逻辑
│   ├── pages/                # 文件路由页面
│   ├── plugins/              # Nuxt 插件
│   ├── services/api/         # 后端 API 封装
│   └── stores/               # Pinia 状态
├── assets/                   # Sass、字体等资源
├── public/                   # 静态资源
├── deploy/aliyun/            # ECS 部署与服务配置
├── docs/                     # API、设计和使用文档
├── nuxt.config.ts
└── package.json
```

## 自动部署

合并并推送到 `main` 或 `master` 主分支后，GitHub Actions 会使用 Node.js 22.19.0 安装依赖、构建 `.output`，再上传到阿里云 ECS，并通过 systemd 切换当前 release。其他分支不会触发发布流程。

部署所需的 SSH 密钥、主机和 API 配置通过 GitHub Actions Secrets/Variables 注入。不要把私钥、Token 或生产环境敏感配置提交到仓库。

服务器部署细节见 [`deploy/aliyun/README.md`](./deploy/aliyun/README.md)。

## 相关项目

- 后台管理端：[blog](https://github.com/xiaoyangxiaozhang/blog)
- 后台线上地址：<https://admin.xiaoyangxiaozhang.xyz/>
