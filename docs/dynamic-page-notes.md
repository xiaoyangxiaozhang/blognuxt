# Dynamic 页面实现说明

## 页面目标

`app/pages/dynamic.vue` 负责渲染一个类似朋友圈的动态页面，整体分成两部分：

1. 顶部封面区：展示作者封面、头像、昵称、签名。
2. 动态内容区：展示动态列表，并在最底部接入统一评论区。

这次实现里，动态本身仍然是列表流展示，但评论不再挂在每条动态下面，而是作为整个 `dynamic` 页面共享的评论模块。

## 组件结构

### 页面入口

页面文件：`app/pages/dynamic.vue`

职责：

- 获取动态列表数据
- 获取站点基础信息（作者昵称、签名、头像）
- 获取页面级评论列表
- 处理评论提交
- 将评论数据和表单状态传入底部评论组件

### 评论组件

组件文件：`app/components/comments/UnifiedCommentPanel.vue`

职责：

- 只负责评论区 UI 展示
- 展示评论输入表单
- 展示评论列表
- 通过 `update:form` 把输入内容同步给父组件
- 通过 `submit` 通知父组件执行提交

这个组件不直接请求接口，因此后续文章页、留言页等其它场景也可以复用，只要外层页面自己准备数据即可。

## 数据交互设计

### 1. 动态列表

动态数据来自：

- `app/composables/api/moments.ts`

调用方式：

```ts
getMomentList({ page_size: 20 })
```

在 `dynamic.vue` 中会把接口返回的结构映射成页面专用的 `DynamicMomentItem`：

```ts
interface DynamicMomentItem {
  id: number
  publishTime: string
  text: string
  images: string[]
  location: string
}
```

这样页面模板只关心展示字段，不直接依赖后端原始结构。

### 2. 页面级评论列表

新增接口封装文件：

- `app/composables/api/comments.ts`

提供两个方法：

```ts
getCommentList(params)
createComment(body)
```

当前 `dynamic` 页面使用的是统一评论区模式，也就是：

```ts
target_type: 'page'
target_key: 'moment'
```

评论列表请求：

```ts
getCommentList({
  target_type: 'page',
  target_key: 'moment',
  page: 1,
  page_size: 10
})
```

这表示整页动态共用一个评论池，而不是每条动态各自一套评论。

### 3. 评论提交

底部评论区提交时，页面会调用：

```ts
createComment({
  target_type: 'page',
  target_key: 'moment',
  content,
  nickname,
  email,
  website
})
```

当前页面保留了 `website` 输入框，主要是为了界面完整度和后续扩展。真正请求时仍以现有接口为准。

提交成功后的处理流程：

1. 前端校验昵称、邮箱、内容是否为空
2. 调用 `POST /comments`
3. 清空评论内容输入框
4. 重新调用 `refreshComments()` 刷新评论列表
5. 使用 `ElMessage` 给出成功或失败提示

这种方式比在组件内部直接发请求更适合复用，因为：

- 页面能自由决定评论目标类型
- 页面能决定分页方式
- 页面能统一处理错误提示和刷新策略

### 4. 评论数据映射

由于评论接口在不同阶段可能返回字段命名略有差异，`dynamic.vue` 中做了一层兼容映射，例如：

- `nickname` / `user_nickname` / `user.nickname`
- `avatar` / `user_avatar` / `user.avatar`
- `created_at` / `publish_time`

最终统一成组件消费的数据：

```ts
interface DynamicCommentCard {
  id: number | string
  author: string
  avatar?: string
  content: string
  publishTime: string
  website?: string
  replyTo?: string
}
```

这样评论组件可以保持稳定，不会被后端字段小改动直接影响。

## 交互说明

### 动态列表底部操作

每条动态底部保留了轻量的交互区：

- 地址标签
- 发布时间
- 评论区跳转按钮
- 更多按钮

评论按钮当前不是“单条动态评论”，而是滚动定位到底部统一评论区。

### 评论区表单

评论区表单采用“父组件持有状态，子组件发出更新事件”的方式：

```ts
@update:form="handleFormUpdate"
@submit="handleCommentSubmit"
```

好处是：

- 表单状态可被页面统一管理
- 后续接入登录态、草稿缓存会更方便
- 组件可以保持纯展示和交互层职责

## 样式说明

样式上这次主要保持了三点：

1. 继续使用项目里的主题变量，如 `var(--home-card-bg)`、`var(--home-text)`，避免主题切换失效。
2. 动态内容区比头图略窄，保持朋友圈式的视觉重心。
3. 评论区使用独立卡片和列表块，视觉层级清晰，但不做过重装饰，方便后续在其它页面复用。

## 当前限制

当前实现是“页面统一评论区”，不是“每条动态独立评论区”。

如果后续后端支持给每条动态单独评论，只需要把请求改成：

```ts
target_type: 'moment'
target_key: String(moment.id)
```

然后把底部统一评论区改成挂在具体动态项下，或改成弹出式评论面板即可。
