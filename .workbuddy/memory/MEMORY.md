# 项目长期记忆

## 图片跨域方案
- 使用 Nitro 代理路由 `server/routes/proxy-image.get.ts` 转发外部图片
- 工具函数 `proxyImageUrl()` / `proxyHtmlImages()` 在 `app/composables/proxyImage.ts`
- 在数据映射层（`mapArticleCard`、`mapSingleComment` 等）自动应用代理
- 所有 `app/composables/` 下的函数均被 Nuxt 自动导入

## 代理路由
- `GET /proxy-image?url=<encoded_url>` — 同源代理外部图片，返回响应流、透传 Content-Type、设置 CORS 头
