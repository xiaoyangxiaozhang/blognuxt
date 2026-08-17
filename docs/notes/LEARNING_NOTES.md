# blognuxt 学习笔记

这份文档是给“学过 Vue，但几乎没学过 Nuxt”的你准备的。

目标不是把 Nuxt 全讲完，而是结合当前 `blognuxt` 项目，帮你理解：

- 这个项目现在是怎么组织的
- Nuxt 和普通 Vue 项目最不一样的地方在哪里
- 页面数据是怎么拿到的
- 类型定义为什么要这样写
- 以后你自己接接口时，应该往哪里写

---

## 1. 先理解：Nuxt 是什么

你可以先把 Nuxt 理解成：

- 它底层还是 Vue 3
- 你写的组件、`ref`、`computed`、`watch`、`<script setup>`，这些都还是 Vue 的东西
- 但 Nuxt 在 Vue 上面又帮你做好了很多“项目级能力”

最重要的几个能力：

- 文件路由：你不用自己手写 `router/index.ts`
- 布局系统：你不用自己手动把每个页面包在同一个 Layout 里
- 服务端渲染 / 同构能力：页面可以在服务端先拿数据再渲染
- 自动导入：很多组合式 API、组件、工具函数不需要手动 import
- 运行时配置：例如接口地址，不一定写死在代码里

所以你可以把 Nuxt 理解成：

`Vue + 一整套更完整的项目约定`

---

## 2. 当前项目结构

`blognuxt` 目前最关键的目录是这些：

```text
blognuxt
├─ app
│  ├─ assets
│  │  └─ css
│  ├─ components
│  │  ├─ home
│  │  └─ layouts
│  ├─ composables
│  │  ├─ api
│  │  └─ useApi.ts
│  ├─ layouts
│  │  └─ default.vue
│  ├─ pages
│  │  ├─ index.vue
│  │  └─ article/[slug].vue
│  └─ app.vue
├─ public
├─ nuxt.config.ts
├─ package.json
└─ tsconfig.json
```

你先记住这几个重点：

- `app/pages`：页面目录，Nuxt 会自动生成路由
- `app/layouts`：布局目录，包裹页面外层结构
- `app/components`：普通组件目录
- `app/composables`：组合式函数目录，也可以放 API 封装
- `nuxt.config.ts`：Nuxt 全局配置

---

## 3. Nuxt 和普通 Vue 项目最大的区别

### 3.1 文件就是路由

在普通 Vue 项目里，你一般会写：

- `src/router/index.ts`
- 在里面手动配置每个页面路由

但 Nuxt 里不是这样。

当前项目的页面文件：

- [app/pages/index.vue](</D:/前端学习/vue3/博客前端/blognuxt/app/pages/index.vue>)
- [app/pages/about.vue](</D:/前端学习/vue3/博客前端/blognuxt/app/pages/about.vue>)
- [app/pages/archive.vue](</D:/前端学习/vue3/博客前端/blognuxt/app/pages/archive.vue>)
- [app/pages/article/[slug].vue](</D:/前端学习/vue3/博客前端/blognuxt/app/pages/article/[slug].vue>)

会自动变成这些路由：

- `/`
- `/about`
- `/archive`
- `/article/:slug`

其中 `[slug].vue` 这种写法，表示动态路由参数。

也就是说：

- 文件名 `[slug].vue`
- 对应 URL 里的 `:slug`

在页面里通过：

```ts
const route = useRoute()
const slug = String(route.params.slug || '')
```

就能拿到这个参数。

### 3.2 布局是自动包裹的

当前布局文件是：

- [app/layouts/default.vue](</D:/前端学习/vue3/博客前端/blognuxt/app/layouts/default.vue>)

它里面有：

- 头部 `Header`
- 主内容 `<slot />`
- 底部 `Footer`
- 返回顶部按钮

所以 `pages` 里的页面会自动被这个布局包起来。

你可以理解成：

- 页面只负责“页面自己的内容”
- 布局负责“整个网站公共壳子”

---

## 4. Nuxt 配置文件在做什么

文件：

- [nuxt.config.ts](</D:/前端学习/vue3/博客前端/blognuxt/nuxt.config.ts>)

当前内容虽然不多，但非常重要。

```ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@element-plus/nuxt'],
  css: ['~/assets/css/main.scss'],
  runtimeConfig: {
    public: {
      apiBase: ''
    }
  }
})
```

逐项解释：

### `defineNuxtConfig(...)`

这是 Nuxt 的配置入口，类似 Vue 项目里的：

- `vite.config.ts`
- 一部分 `main.ts` 的全局初始化

### `modules`

这里加载了两个 Nuxt 模块：

- `@pinia/nuxt`
- `@element-plus/nuxt`

意思是：

- Pinia 可以更方便地在 Nuxt 中使用
- Element Plus 也已经接入项目

### `css`

这里全局引入了：

- [app/assets/css/main.scss](</D:/前端学习/vue3/博客前端/blognuxt/app/assets/css/main.scss>)

所以全站主题变量、基础样式都从这里生效。

### `runtimeConfig`

这块特别重要。

```ts
runtimeConfig: {
  public: {
    apiBase: ''
  }
}
```

它表示：

- 这里可以放运行时配置
- `public` 里的配置，前端也能访问

当前项目里接口基础地址会通过：

```ts
const config = useRuntimeConfig()
config.public.apiBase
```

取出来。

这比直接把接口地址写死在代码里更灵活。

---

## 5. 这个项目的数据获取是怎么做的

这部分是最重要的，你一定要吃透。

当前项目的数据获取，不是直接在页面里到处写 `$fetch('/articles')`，而是分成了 3 层：

1. 通用请求层
2. 业务 API 封装层
3. 页面数据聚合层

---

## 6. 第一层：通用请求层 `useApi.ts`

文件：

- [app/composables/useApi.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/useApi.ts>)

这层做的是：

- 统一创建请求实例
- 自动带上 `baseURL`
- 自动处理 token
- 提供通用的 `apiGet`、`apiPost`
- 放通用类型定义

### 6.1 为什么叫 composables

在 Vue 3 / Nuxt 里，`composables` 目录通常放“可复用逻辑函数”。

比如：

- 获取数据的逻辑
- 封装请求的逻辑
- 公共状态逻辑

所以 `useApi.ts` 放在这里是合理的。

### 6.2 `useApi()` 做了什么

大致逻辑：

```ts
export const useApi = () => {
  const config = useRuntimeConfig()

  return $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      // 自动附加 token
    }
  })
}
```

重点理解：

- `useRuntimeConfig()`：取 Nuxt 配置里的接口地址
- `$fetch.create(...)`：创建一个带默认配置的请求实例
- `baseURL`：以后请求 `/articles` 时，Nuxt 会自动拼成完整接口地址
- `onRequest`：在请求发出去之前统一处理

当前项目的 `onRequest` 里做了一个动作：

- 如果浏览器里有 `access_token`
- 就自动在请求头里加 `Authorization`

### 6.3 为什么这里判断 `import.meta.client`

代码里你会看到：

```ts
if (!import.meta.client) {
  return
}
```

这是 Nuxt 很常见的写法。

因为 Nuxt 页面既可能在浏览器执行，也可能在服务端执行。

而像 `localStorage` 这种东西：

- 浏览器里有
- 服务端没有

所以在读取 `localStorage` 之前，必须先确认当前是在客户端。

这就是 Nuxt 比普通前端更容易遇到的“客户端 / 服务端环境差异”。

---

## 7. 第二层：API 封装层 `app/composables/api/*`

这是你这次专门想整理的结构。

当前已经建立了：

- [app/composables/api/createApi.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/createApi.ts>)
- [app/composables/api/article.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/article.ts>)
- [app/composables/api/category.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/category.ts>)
- [app/composables/api/tag.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/tag.ts>)
- [app/composables/api/user.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/user.ts>)

### 7.1 这一层的目的是什么

目的就是：

- 页面不要自己拼接口路径
- 页面不要自己到处写请求细节
- 按业务模块拆文件

也就是说：

- 文章相关接口写 `article.ts`
- 分类相关接口写 `category.ts`
- 标签相关接口写 `tag.ts`
- 用户/配置相关接口写 `user.ts`

这样页面里读起来会更像“业务语义”，而不是“底层请求细节”。

### 7.2 `createApi.ts` 是什么

这是一个小工厂函数。

文件：

- [app/composables/api/createApi.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/createApi.ts>)

大致意思：

```ts
export const createApi = (basePath: string) => {
  const list = <T>(params?: Record<string, unknown>) => apiGet<T>(basePath, { params })
  const detail = <T>(idOrSlug: string | number) => apiGet<T>(`${basePath}/${idOrSlug}`)
  const create = <T>(body?: Record<string, unknown>) => apiPost<T>(basePath, body)
  return { list, detail, create }
}
```

它的作用是：

- 给你一套通用的列表接口、详情接口、创建接口模板

比如文章：

```ts
const articleApi = createApi('/articles')
```

这样你就自动有：

- `articleApi.list(...)`
- `articleApi.detail(...)`
- `articleApi.create(...)`

这是一种“减少重复代码”的写法。

### 7.3 `article.ts` 在做什么

文件：

- [app/composables/api/article.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/article.ts>)

当前封装了：

```ts
export const getArticleList = (params?: Record<string, unknown>) => {
  return articleApi.list<PaginationData<ArticleListItem>>(params)
}
```

你要重点理解泛型这部分：

`PaginationData<ArticleListItem>`

意思是：

- 这是一个“分页结果”
- 这个分页结果里的每一项是 `ArticleListItem`

也就是：

```ts
{
  list: ArticleListItem[]
  total: number
  page: number
  page_size: number
}
```

### 7.4 `user.ts` 为什么不是用户登录接口

当前 `user.ts` 实际上先承担的是“站点基础配置”这部分。

因为首页要用这些数据：

- 作者名
- 作者简介
- 作者头像

这些来自：

`/settings/basic`

所以先封装了：

```ts
export const getBasicSettings = () => {
  return apiGet<BasicSettingMap>('/settings/basic')
}
```

后面如果你真的要接用户系统：

- 用户详情
- 登录用户信息
- 个人中心信息

也可以继续放在 `user.ts`，或者再拆更细。

---

## 8. 第三层：页面数据聚合层 `useAsyncData`

这是 Nuxt 最关键的能力之一。

文件：

- [app/pages/index.vue](</D:/前端学习/vue3/博客前端/blognuxt/app/pages/index.vue>)

你会看到这段：

```ts
const { data, pending } = await useAsyncData<HomePayload>(
  'home-page',
  async () => {
    // 请求数据
  },
  {
    watch: [currentPage]
  }
)
```

### 8.1 `useAsyncData` 是什么

你可以先把它理解成：

`Nuxt 版本的异步数据获取工具`

它和你在普通 Vue 里自己写：

- `const loading = ref(false)`
- `onMounted(async () => { ... })`

最大的不同在于：

- Nuxt 可以在服务端就先把数据取好
- 页面首屏渲染时就能直接带数据
- 它天然适合 SSR / SEO 场景

### 8.2 它返回了什么

这里主要用了两个返回值：

- `data`
- `pending`

含义：

- `data`：异步函数返回的数据
- `pending`：当前是否还在加载中

所以模板里会看到：

```vue
<div v-if="pending">加载中</div>
<div v-else>展示数据</div>
```

### 8.3 `await useAsyncData(...)` 为什么可以直接写在 `<script setup>`

这是 Nuxt 支持的能力。

在普通 Vue 组件里，你不会这样直接顶层 `await` 去拿页面数据。

但在 Nuxt 页面中，这样写是常见做法，因为：

- 页面可能要 SSR
- Nuxt 允许在页面 setup 阶段等待数据准备

### 8.4 第一个参数 `'home-page'` 是什么

这是这次数据请求的 key。

Nuxt 会用这个 key 来做：

- 缓存
- 标识这份异步数据

所以你可以理解成：

`这次首页数据请求的名字`

### 8.5 `watch: [currentPage]` 是什么

这表示：

- 当 `currentPage` 改变时
- `useAsyncData` 会重新执行一次

这样分页切换时，首页文章列表就会自动重新请求。

---

## 9. 首页的数据获取完整流程

首页目前一共取了 5 组数据：

```ts
const [articlesResponse, categoriesResponse, tagsResponse, recentResponse, settingsResponse] =
  await Promise.all([
    getArticleList({ page: currentPage.value, page_size: pageSize }),
    getCategoryList({ page_size: 10 }),
    getTagList({ page_size: 20 }),
    getArticleList({ page_size: 6 }),
    getBasicSettings()
  ])
```

为什么用 `Promise.all`：

- 这 5 个请求互不依赖
- 可以并发请求
- 比一个接一个请求更快

拿到响应后，再做“页面用的数据映射”：

- 文章列表映射成 `ArticleCard`
- 最近文章映射成 `FeatureArticleItem`
- 基础配置映射成作者名、简介、头像

这一步很重要，因为：

- 后端返回的是“接口格式”
- 页面真正要的是“展示格式”

所以不要害怕多写一层映射，这是正常做法。

---

## 10. API 部分深入拆解

这一节专门继续补“接口这一套到底怎么组织”。

如果你是 Vue 基础、Nuxt 零基础，最容易混乱的往往不是语法，而是这些问题：

- 到底该把请求写在哪一层
- 到底什么时候写类型
- 到底是先拿原始数据，还是先映射成页面数据
- 到底新增一个接口时，要改几个地方

下面我按“从下往上”的顺序讲。

### 10.1 最底层：真正发请求的是 `useApi.ts`

文件：

- [app/composables/useApi.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/useApi.ts>)

这层可以理解成“请求基础设施”。

它不关心你请求的是文章、标签还是评论，它只关心：

- 请求往哪个服务器发
- 请求头怎么带
- GET/POST 怎么封装
- 返回值的通用格式长什么样

所以这层最适合放：

- `ApiResponse<T>`
- `PaginationData<T>`
- `apiGet`
- `apiPost`
- 公共实体类型

但这层不适合放：

- “首页文章列表怎么展示”
- “作者卡片怎么拼数据”
- “这个页面失败了显示什么文案”

这些都属于更上层。

### 10.2 `useRuntimeConfig()` 在 API 里为什么很重要

你现在的接口地址不是写死在每个页面里，而是通过：

```ts
const config = useRuntimeConfig()
```

再读：

```ts
config.public.apiBase
```

这带来的好处是：

- 本地开发可以用一个地址
- 线上部署可以换另一个地址
- 页面代码不需要跟着改

你可以把它理解成“项目的全局环境配置入口”。

在 Nuxt 里，这比你在普通 Vue 项目里到处写 `const baseUrl = 'xxx'` 更规范。

### 10.3 为什么 `apiGet<T>()` 要写成泛型函数

当前写法是：

```ts
export const apiGet = async <T>(url: string, options?: { params?: Record<string, unknown> }) => {
  const api = useApi()
  return api<ApiResponse<T>>(url, {
    method: 'GET',
    query: options?.params
  })
}
```

你先抓住这个核心：

- `apiGet<T>` 里的 `T`
- 指的是“后端 `data` 字段里的真实数据类型”

不是整个响应类型。

因为整个响应外面已经固定包了一层：

```ts
{
  code: number
  message: string
  data: T
}
```

所以：

```ts
apiGet<PaginationData<ArticleListItem>>('/articles')
```

最后的返回结果其实是：

```ts
ApiResponse<PaginationData<ArticleListItem>>
```

你以后看到这种写法不要怕，它只是“外层响应壳 + 内层真实数据”。

### 10.4 `createApi.ts` 本质上是在做“接口模板复用”

文件：

- [app/composables/api/createApi.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/createApi.ts>)

它不是 Nuxt 内置的东西，是我们自己写的一个小工具。

它的想法非常简单：

- 很多资源型接口都有 list
- 很多资源型接口都有 detail
- 很多资源型接口都有 create

比如：

- `/articles`
- `/categories`
- `/tags`

这些都符合“一个资源一个 basePath”的结构。

所以就可以抽成：

```ts
const articleApi = createApi('/articles')
const categoryApi = createApi('/categories')
const tagApi = createApi('/tags')
```

这样比每个文件都从零手写 `apiGet` 更省，也更统一。

你可以把 `createApi` 理解成：

`给某个资源目录批量生成常用请求方法`

### 10.5 `article.ts` 这一层的价值，不只是少写几行代码

看起来 `article.ts` 现在内容不多，但这层非常关键。

文件：

- [app/composables/api/article.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/article.ts>)

它的意义是把：

- `/articles`
- `/articles/:slug`

这样的“接口路径知识”

转成：

- `getArticleList()`
- `getArticleDetail()`

这样的“业务语义函数”。

这两种写法的区别非常大：

页面里如果看到：

```ts
await getArticleList({ page: 1, page_size: 6 })
```

你一眼就知道它在做什么。

但如果页面里到处都是：

```ts
await apiGet('/articles', { params: { page: 1, page_size: 6 } })
```

久了以后页面会越来越像“请求脚本”，而不是“页面逻辑”。

所以 API 封装层的重要价值是：

- 提高可读性
- 统一命名
- 限制页面直接碰底层接口细节

### 10.6 `user.ts` 现在更准确地说是“站点信息接口”

这一点你要特别注意。

当前的 [app/composables/api/user.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/user.ts>) 里，其实还没有用户登录系统那种接口。

它目前主要做的是：

- `getBasicSettings()`

也就是从：

- `/settings/basic`

拿到站点基础配置。

所以这个文件现在更像：

- 用户展示相关
- 站长信息相关
- 站点基础配置相关

后面如果项目继续扩展，你可以有两种思路：

1. 继续放在 `user.ts`
2. 单独拆一个 `setting.ts` 或 `site.ts`

这两种都可以，关键是命名要和职责一致。

如果未来 `user.ts` 里真的出现：

- 登录
- 注册
- 当前用户信息
- 权限信息

那我会更建议把“站点设置”单独拆出去。

### 10.7 当前 API 目录应该怎么理解

你现在的目录大概可以这样理解：

```text
app/composables/api
├─ createApi.ts     -> 通用资源接口工厂
├─ article.ts       -> 文章接口
├─ category.ts      -> 分类接口
├─ tag.ts           -> 标签接口
├─ user.ts          -> 站点基础配置 / 作者信息接口
└─ moments.ts       -> 预留给动态接口
```

每个文件最适合做的事情是：

- `createApi.ts`：只做通用方法模板，不写具体业务
- `article.ts`：只导出文章相关函数和文章相关类型辅助
- `category.ts`：只管分类
- `tag.ts`：只管标签
- `user.ts`：只管用户展示或站点信息
- `moments.ts`：后面接动态列表、动态详情时再补

这样以后你找代码会很快。

### 10.8 新增一个接口时，推荐你固定走 4 步

假设你后面要接“评论列表”接口。

我建议你固定这样做：

1. 先确认后端路径和返回结构。
2. 先写原始数据类型。
3. 再写 `app/composables/api/comment.ts`。
4. 最后在页面里通过 `useAsyncData` 或普通组合函数消费。

比如后端是：

```text
GET /comments?page=1&page_size=6
```

那你可以先在 `useApi.ts` 或单独类型文件里定义：

```ts
export interface CommentItem {
  id: number
  nickname: string
  content: string
  created_at: string
}
```

然后写：

```ts
import type { CommentItem, PaginationData } from '~/composables/useApi'
import { createApi } from './createApi'

const commentApi = createApi('/comments')

export const getCommentList = (params?: Record<string, unknown>) => {
  return commentApi.list<PaginationData<CommentItem>>(params)
}
```

最后页面里再写：

```ts
const { data } = await useAsyncData('home-comments', async () => {
  const response = await getCommentList({ page_size: 6 })
  return response.data.list
})
```

这样每一层职责都很清楚。

### 10.9 “原始接口类型”和“页面展示类型”最好分开

这是很多初学者最容易忽略的点。

后端返回给你的数据，不一定刚好适合页面直接渲染。

比如文章列表接口返回：

```ts
interface ArticleListItem {
  id: number
  slug?: string
  title: string
  cover: string
  publish_time: string
  category?: {
    name: string
    url?: string
  }
  tags?: Array<{
    name: string
    url?: string
  }>
}
```

但页面卡片想用的结构可能是：

```ts
interface ArticleCard {
  id: number
  slug: string
  title: string
  cover: string
  publishDate: string
  categoryName: string
  tagNames: string[]
}
```

注意，这两个类型不是同一个层次的东西：

- `ArticleListItem` 是后端原始结构
- `ArticleCard` 是页面展示结构

把这两层分开，你后面改 UI 时会非常舒服。

因为你只需要改“映射逻辑”，不一定要去动底层接口类型。

### 10.10 API 返回到页面，中间到底经过了哪些步骤

这条链路建议你背下来：

1. 页面调用 `getArticleList`
2. `getArticleList` 调用 `articleApi.list`
3. `articleApi.list` 来自 `createApi('/articles')`
4. `createApi` 内部调用 `apiGet`
5. `apiGet` 再调用 `useApi()` 创建的 `$fetch` 实例
6. `$fetch` 根据 `baseURL` 真正发请求
7. 后端返回 `ApiResponse<PaginationData<ArticleListItem>>`
8. 页面再把原始数据映射成页面展示数据

如果你能把这 8 步讲明白，说明你已经真正理解项目里的 API 结构了。

### 10.11 在 Nuxt 里，页面为什么更适合用 `useAsyncData` 来消费 API

因为 Nuxt 的页面不只是浏览器运行。

它可能：

- 先在服务端拿数据
- 再把结果带到页面首屏
- 然后客户端再接管交互

所以页面层最常见的模式不是：

```ts
onMounted(async () => {
  const res = await getArticleList()
})
```

而是：

```ts
const { data, pending, error } = await useAsyncData(...)
```

这样做的好处：

- SSR 更友好
- 首屏更自然
- Nuxt 会帮你接住异步数据生命周期

你可以理解成：

- `api/*.ts` 解决“怎么请求”
- `useAsyncData` 解决“页面何时拿到这份请求结果”

### 10.12 API 文件里适合放什么，不适合放什么

适合放：

- 某个业务模块的请求函数
- 该模块专属的原始接口类型
- 路径拼接逻辑
- 参数类型

不太适合放：

- 页面专属 UI 状态
- `ref(false)` 这种展示状态
- 组件点击事件
- Element Plus 的消息提示
- 很强的页面结构映射

比如：

- `getArticleList()` 适合放 API 文件
- `articleCards.value = ...` 不适合放 API 文件

这是“数据获取”和“界面展示”分层的核心。

### 10.13 以后如果 API 变多，类型可以继续再拆一层

当前项目不大，把很多通用类型先放在 `useApi.ts` 没问题。

但如果后面接口越来越多，你可以继续进化成：

```text
app/composables
├─ api
│  ├─ article.ts
│  ├─ comment.ts
│  ├─ moments.ts
│  └─ user.ts
├─ types
│  ├─ api.ts
│  ├─ article.ts
│  ├─ comment.ts
│  └─ site.ts
└─ useApi.ts
```

这时候：

- `useApi.ts` 只保留请求工具
- 类型单独拆到 `types`
- `api/*.ts` 只负责调接口

你现在先不用一步到位学这么复杂，但要知道这是后续可扩展方向。

### 10.14 你现在这套 API 结构，已经能支撑什么开发方式

以你现在的基础，我最建议你养成这个习惯：

- 先看接口文档
- 再写类型
- 再写 `api/*.ts`
- 再写页面 `useAsyncData`
- 最后写展示映射

不要一上来就在页面里边写模板边调请求。

那样虽然短期看起来快，但一旦接口一多，就会很难维护。

---

## 11. 类型定义一定要重点理解

你特别要求“数据获取和类型定义一定要详细”，这一节我会展开讲。

---

## 12. 什么是 TypeScript 类型

你可以先用最朴素的话理解：

类型就是在告诉编辑器：

- 这个变量是什么结构
- 它有哪些字段
- 每个字段是什么类型

好处：

- 自动提示更准确
- 更不容易写错字段名
- 改接口时更容易发现问题

---

## 13. 通用类型：`ApiResponse<T>`

在 [app/composables/useApi.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/useApi.ts>) 里定义了：

```ts
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
```

这是在描述后端统一响应格式。

比如后端可能返回：

```json
{
  "code": 0,
  "message": "success",
  "data": { ...真正的数据... }
}
```

这里的 `T` 是泛型。

意思是：

- `data` 里面具体是什么，不固定
- 谁来用这个类型，谁来决定 `T` 是什么

例如：

```ts
apiGet<PaginationData<ArticleListItem>>('/articles')
```

那么此时：

- `T = PaginationData<ArticleListItem>`

所以整个返回值结构就是：

```ts
ApiResponse<PaginationData<ArticleListItem>>
```

也就是：

```ts
{
  code: number
  message: string
  data: {
    list: ArticleListItem[]
    total: number
    page: number
    page_size: number
  }
}
```

---

## 14. 分页类型：`PaginationData<T>`

定义：

```ts
export interface PaginationData<T> {
  list: T[]
  total: number
  page: number
  page_size: number
}
```

这说明：

- `list`：当前页的数据数组
- `total`：总条数
- `page`：当前页码
- `page_size`：每页数量

依然要理解 `T`：

- 如果 `T = ArticleListItem`，那就是文章分页
- 如果 `T = CategoryItem`，那就是分类分页
- 如果 `T = TagItem`，那就是标签分页

这就是泛型最大的价值：

`同一个分页壳子，复用给不同数据类型`

---

## 15. 文章接口类型：`ArticleListItem`

定义在：

- [app/composables/useApi.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/useApi.ts>)

它描述的是：

`后端返回的一条文章原始数据长什么样`

当前大致字段：

```ts
export interface ArticleListItem {
  id: number
  slug?: string
  url?: string
  title: string
  cover: string
  publish_time: string
  category?: {
    name: string
    url?: string
  }
  tags?: Array<{
    name: string
    url?: string
  }>
}
```

注意这里有很多 `?`：

- `slug?`
- `url?`
- `category?`
- `tags?`

这表示这些字段“可能没有”。

为什么要写可选：

- 因为后端不一定总是返回
- 如果你把它写成必填，代码就会更容易报错

例如：

```ts
item.category?.name || '未分类'
```

这里的 `?.` 就是在说：

- 如果 `category` 存在，再取 `name`
- 如果 `category` 不存在，就不要报错

---

## 16. 页面展示类型：`ArticleCard`

这个类型定义在首页页面里：

- [app/pages/index.vue](</D:/前端学习/vue3/博客前端/blognuxt/app/pages/index.vue>)

它不是后端原始结构，而是：

`首页卡片真正要用的数据结构`

例如：

```ts
interface ArticleCard {
  id: number
  slug: string
  title: string
  cover: string
  publishDate: string
  categoryName: string
  categoryUrl: string
  tags: Array<{ name: string; url?: string }>
}
```

这里和 `ArticleListItem` 的区别非常重要：

- `ArticleListItem`：接口原始数据
- `ArticleCard`：页面展示数据

为什么要分开：

因为页面常常不想直接吃后端原始字段。

比如：

- 后端给你的是 `publish_time`
- 页面更想要 `publishDate`
- 后端的 `category` 是对象
- 页面更想直接拿 `categoryName`

所以会有映射函数：

```ts
const mapArticleCard = (item: ArticleListItem): ArticleCard => ({
  id: item.id,
  slug: resolveArticleSlug(item),
  title: item.title,
  cover: item.cover || DEFAULT_COVER,
  publishDate: formatDate(item.publish_time),
  categoryName: item.category?.name || '未分类',
  categoryUrl: item.category?.url || '',
  tags: item.tags?.map(...) || []
})
```

这就是“接口模型”和“页面模型”分离。

这是非常好的习惯。

---

## 17. 为什么还要定义 `FeatureArticleItem`

首页 Feature 区不需要完整文章卡片数据。

它只需要：

- id
- slug
- title
- publishDate
- categoryName
- cover

所以单独定义了：

```ts
interface FeatureArticleItem {
  id: number
  slug: string
  title: string
  publishDate: string
  categoryName: string
  cover: string
}
```

这样做的好处：

- 更清楚这个区域到底要什么数据
- 避免把不需要的字段也传来传去

---

## 18. 首页页面的数据流，按顺序理解

你可以按下面这个顺序理解首页：

### 第一步：调用 API 封装函数

```ts
getArticleList(...)
getCategoryList(...)
getTagList(...)
getBasicSettings()
```

### 第二步：拿到后端原始数据

后端原始数据类型是：

- `ArticleListItem`
- `CategoryItem`
- `TagItem`
- `Record<string, string>`

### 第三步：做页面映射

例如文章会映射成：

- `ArticleCard`
- `FeatureArticleItem`

### 第四步：组装成页面统一返回结构

```ts
interface HomePayload {
  articles: ArticleCard[]
  totalArticles: number
  categories: CategoryItem[]
  tags: TagItem[]
  recentArticles: FeatureArticleItem[]
  basicSettings: Record<string, string>
  error: string
}
```

### 第五步：页面模板读取

```ts
const articles = computed(() => data.value?.articles || [])
const categories = computed(() => data.value?.categories || [])
```

模板再用这些数据渲染。

---

## 19. 为什么页面里还要写 `computed`

例如：

```ts
const articles = computed(() => data.value?.articles || [])
```

原因是：

- `data.value` 一开始可能还没有
- 直接用 `data.value.articles` 可能出错
- 用 `|| []` 可以保证模板拿到的是安全值

这是一种“空值保护”。

同理：

```ts
const authorName = computed(() => basicSettings.value['basic.author'] || '')
```

这里也在做保护：

- 如果后端没配作者名
- 就先给空字符串

---

## 20. 文章详情页的数据获取

文件：

- [app/pages/article/[slug].vue](</D:/前端学习/vue3/博客前端/blognuxt/app/pages/article/[slug].vue>)

这里同样用了 `useAsyncData`。

和首页不同的是：

- 首页取的是多个接口
- 详情页主要取的是单篇文章

思路仍然一样：

1. 从路由里拿 `slug`
2. 请求 `/articles/${slug}`
3. 返回 `article` 和 `error`
4. 页面根据 `pending / error / article` 分状态渲染

这个页面现在还是直接用了：

```ts
apiGet<ArticleDetailData>(`/articles/${slug}`)
```

后面如果你想更统一，也可以把它改成走：

- `getArticleDetail(slug)`

这样就和首页一样，全部从 `composables/api/article.ts` 出口走。

---

## 21. Nuxt 里常见的自动导入

当前项目里你会发现很多东西没有手写 import，例如：

- `ref`
- `computed`
- `watch`
- `onMounted`
- `onUnmounted`
- `useRoute`
- `useAsyncData`
- `useRuntimeConfig`

这不是你漏写了，而是 Nuxt 自动帮你导入了。

这也是 Nuxt 和普通 Vue 项目不一样的地方。

所以你以后在 Nuxt 页面里看到这些没 import，不要慌。

---

## 22. 当前项目已经在用的技术

你可以把这个项目理解成使用了这些东西：

### Vue 层

- Vue 3
- Composition API
- `<script setup>`
- TypeScript

### Nuxt 层

- Nuxt 4
- 文件路由
- 默认布局 `default.vue`
- `useAsyncData`
- `useRoute`
- `useRuntimeConfig`
- composables 自动导入

### UI 层

- Element Plus
- 自定义 SCSS 主题变量

### 状态 / 工具层

- Pinia 模块已安装
- 当前首页主要还是页面局部状态，没有大量使用 Pinia

### 接口层

- `$fetch`
- `useApi()` 通用请求封装
- `composables/api/*.ts` 业务 API 分层

---

## 23. 如果你以后要继续接接口，推荐步骤

以后你接一个新接口，比如“评论列表”，建议按这个顺序来：

1. 先在 `app/composables/useApi.ts` 看看有没有需要复用的公共类型。
2. 在 `app/composables/api/comment.ts` 里新增对应请求函数。
3. 如果后端返回结构复杂，先写接口原始类型。
4. 再在页面里定义“页面展示类型”。
5. 用 `useAsyncData` 或组合函数把数据请求进来。
6. 最后用 `computed` 做空值保护和展示映射。

最重要的原则是：

- 不要让页面直接到处拼 URL
- 不要让页面直接生吃后端所有原始字段
- 原始类型和展示类型可以分开

---

## 24. 你现在最该先学会的 Nuxt 知识点

如果你是 Vue 基础、Nuxt 零基础，我建议你先按这个顺序学：

1. `pages` 自动路由
2. `layouts` 布局机制
3. `useAsyncData` 数据获取
4. `useRuntimeConfig` 配置读取
5. `composables` 的组织方式
6. 客户端 / 服务端环境区别

只要你把这 6 个点吃透，这个项目你就已经能继续维护了。

---

## 25. 一句话总结当前项目

当前 `blognuxt` 项目本质上是：

一个基于 Nuxt 4 的博客前端，使用 `pages + layouts + composables/api + useAsyncData + TypeScript` 这一套方式来组织页面、接口和数据类型。

如果用你熟悉的 Vue 语言来理解：

- Vue 还是核心
- Nuxt 只是帮你把“路由、布局、数据获取、配置、自动导入”这些项目级工作做得更规范了

---

## 26. 后面我建议你怎么继续学这个项目

你可以按下面顺序继续往下看代码：

1. 先看 [nuxt.config.ts](</D:/前端学习/vue3/博客前端/blognuxt/nuxt.config.ts>)
2. 再看 [app/layouts/default.vue](</D:/前端学习/vue3/博客前端/blognuxt/app/layouts/default.vue>)
3. 然后看 [app/pages/index.vue](</D:/前端学习/vue3/博客前端/blognuxt/app/pages/index.vue>)
4. 接着看 [app/composables/useApi.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/useApi.ts>)
5. 再看 [app/composables/api/article.ts](</D:/前端学习/vue3/博客前端/blognuxt/app/composables/api/article.ts>)
6. 最后看 [app/pages/article/[slug].vue](</D:/前端学习/vue3/博客前端/blognuxt/app/pages/article/[slug].vue>)

这个顺序最容易把全局结构串起来。

如果你后面愿意，我还可以继续给你做第二份文档：

- “从 Vue 角度对照 Nuxt 的学习笔记”

或者第三份：

- “blognuxt 首页数据流逐行讲解版”
