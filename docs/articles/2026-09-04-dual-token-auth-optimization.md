---
title: 双 Token 认证优化实践：短时 Access Token 与 HttpOnly Refresh Token 的协同
date: 2026-09-04 14:00:00
updated: 2026-09-04 14:00:00
slug: dual-token-auth-optimization
categories: 工程实践
tags: [JWT, 认证, 安全, 前端工程]
description: 从一个真实博客项目出发，拆解 Access Token 与 Refresh Token 的职责划分、Cookie 安全、刷新轮换、并发请求队列，以及前后端如何一起处理登录状态恢复。
---

很多项目第一次实现登录时，都会把一个 JWT 放进 `localStorage`，每次请求带上它。代码很短，但很快会遇到两个互相拉扯的问题：Token 有效期长了，泄露后的风险窗口就变大；有效期短了，用户又会频繁掉登录。

双 Token 的思路，是把“访问资源”和“证明可以继续登录”拆开：

```text
登录
  ├─ Access Token：短期、放在前端内存、用于访问业务接口
  └─ Refresh Token：长期、HttpOnly Cookie、只用于换取新的 Token

业务请求 --401--> Refresh Token
                  ├─ 成功：得到新的 Access Token，重试原请求
                  └─ 失败：清理登录状态，回到登录页
```

这篇文章记录我在博客项目中对这套逻辑的整理和优化。重点不在“JWT 怎么生成”这一行代码，而在于两个 Token 如何配合，才能同时兼顾安全性、可用性和并发场景。

## 一、先把两个 Token 的职责分开

### Access Token：只负责访问

Access Token 出现在业务请求的 `Authorization` 请求头中：

```http
Authorization: Bearer <access_token>
```

它的特点是有效期短、使用频率高。博客后端将它设置为 15 分钟，前端只把它保存在当前页面的内存状态中。这样做的结果是：

- 正常请求不需要反复读取持久化存储；
- 页面关闭后，内存中的 Access Token 自然消失；
- 即使 Access Token 泄露，攻击者可利用它的时间也相对有限。

Access Token 不是“永久登录凭证”。它过期并不代表用户必须重新输入密码，而是进入刷新流程。

### Refresh Token：只负责续期

Refresh Token 不应该参与普通业务请求，也不应该被前端 JavaScript 读取。博客后端把它写入 `HttpOnly` Cookie，并设置 `SameSite=Lax`；前端请求使用 `credentials: 'include'`，由浏览器自动携带 Cookie。

这形成了一个重要边界：

```text
前端 JavaScript       能读取 Access Token，不能读取 Refresh Token
普通业务接口           接收 Access Token，不使用 Refresh Token
刷新接口               读取 HttpOnly Cookie，不依赖 Authorization
```

需要注意，`HttpOnly` 只能阻止 JavaScript 直接读取 Cookie，并不能让 XSS 变得无害。前端仍然要避免注入不可信 HTML，后端也要正确配置 Cookie、CORS 和 CSRF 防护。安全设计是多层约束，不是加上一个属性就结束。

## 二、后端实现：类型隔离比“都能解析”更重要

双 Token 最容易被忽略的错误，是后端只验证 JWT 签名和过期时间，却没有验证 Token 的用途。这样一来，Refresh Token 可能被误当成 Access Token 使用。

博客后端在 JWT claims 中加入了 `token_type`：

```go
type Claims struct {
    UserID    uint           `json:"user_id"`
    Role      model.UserRole `json:"role"`
    TokenType TokenType      `json:"token_type"`
    jwt.RegisteredClaims
}

const (
    AccessTokenExpire  = 15 * time.Minute
    RefreshTokenExpire = 30 * 24 * time.Hour
)
```

解析时也按用途分成两个入口，而不是让所有地方调用一个“万能解析函数”：

```go
func ParseToken(tokenString string, cfg *config.JWTConfig) (*Claims, error) {
    claims, err := parseTokenInternal(tokenString, cfg)
    if err != nil {
        return nil, err
    }
    if claims.TokenType != AccessToken {
        return nil, fmt.Errorf("invalid token type, expected access token")
    }
    return claims, nil
}

func ParseRefreshToken(tokenString string, cfg *config.JWTConfig) (*Claims, error) {
    claims, err := parseTokenInternal(tokenString, cfg)
    if err != nil {
        return nil, err
    }
    if claims.TokenType != RefreshToken {
        return nil, fmt.Errorf("invalid token type, expected refresh token")
    }
    return claims, nil
}
```

这里的关键不是函数名，而是“验证签名”和“验证用途”必须同时成立：

```text
业务中间件       -> ParseToken          -> 只能接受 access
刷新接口         -> ParseRefreshToken   -> 只能接受 refresh
```

登录成功时，后端返回 Access Token，同时通过响应 Cookie 写入 Refresh Token。Refresh Token 不放进 JSON 响应，避免它被前端代码、日志或状态管理层误处理。

## 三、Refresh Token 轮换：让旧凭证不能重复使用

如果 Refresh Token 在 30 天内始终有效，那么一旦它被复制，攻击者就可能长期换取新的 Access Token。因此，刷新成功后不能只生成一个新的 Access Token，还要生成新的 Refresh Token，并让旧 Refresh Token 失效。

博客后端的刷新流程可以概括为：

```text
读取 refresh_token Cookie
  -> 验证签名、过期时间和 token_type
  -> 检查 refresh token 是否在黑名单
  -> 查询用户并确认账号仍然启用
  -> 生成新的 Access Token
  -> 生成新的 Refresh Token
  -> 把旧 Refresh Token 的哈希加入黑名单
  -> 写入新的 Refresh Token Cookie
  -> 返回新的 Access Token
```

代码中保存的是 Refresh Token 的 SHA-256 哈希，而不是原文：

```go
func hashToken(token string) string {
    hash := sha256.Sum256([]byte(token))
    return hex.EncodeToString(hash[:])
}
```

刷新时，旧 Token 被加入黑名单，并沿用它原本的过期时间。这样既能支持主动撤销，也不会让黑名单记录无限增长。

轮换还带来一个安全信号：如果一个已经使用过的旧 Refresh Token 再次出现，通常意味着凭证被复制或出现并发刷新。生产系统可以在此基础上增加会话吊销、设备标识和异常告警。

## 四、Cookie 属性和接口边界

Refresh Token Cookie 至少要明确以下属性：

| 属性 | 作用 |
| --- | --- |
| `HttpOnly` | 阻止前端脚本直接读取 Refresh Token |
| `Secure` | HTTPS 场景下只通过加密连接发送 |
| `SameSite=Lax` | 降低跨站请求自动携带 Cookie 的风险 |
| `Path=/api/v1/auth` | 只在认证接口路径下携带，减少暴露面 |

博客后端会根据当前 HTTPS 或反向代理传来的协议决定 `Secure`，并把 Cookie 的路径限制在认证接口下。路径限制不能替代其他安全措施，但它能让 Refresh Token 不被发送到文章、评论等无关接口。

刷新接口也有一个容易踩坑的细节：它不能依赖失效的 Access Token。前端请求拦截器必须识别 `/auth/refresh`，不要给这个接口附加旧的 `Authorization`；响应拦截器也不能在刷新失败时再次触发刷新，否则会形成递归重试。

## 五、前端优化一：只在 401 时刷新，并且只重试一次

前台 Nuxt 的请求封装把 Access Token 加到普通请求中：

```ts
onRequest({ options }) {
  if (!accessToken.value) return

  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${accessToken.value}`)
  options.headers = headers
}
```

当业务接口返回 401 时，客户端才调用刷新接口。刷新成功后，使用新 Token 重试原请求；刷新接口自己失败，或者原请求已经重试过一次，就直接把错误交给调用方。

```ts
if (getResponseStatus(error) !== 401 || options._authRetry || isRefreshRequest(url)) {
  throw error
}

const token = await refreshAccessToken()
if (!token) throw error

const headers = new Headers(options.headers || {})
headers.set('Authorization', `Bearer ${token}`)
return fetcher(url, { ...options, _authRetry: true, headers })
```

“只重试一次”非常重要。它把一次请求的状态限制为：

```text
原请求 -> 401 -> 刷新 -> 原请求重试一次
```

如果重试后仍然是 401，就应该认为当前会话不可恢复，而不是继续循环请求。

## 六、前端优化二：用 Promise 合并并发刷新

假设 Access Token 同时过期，页面上有文章请求、用户资料请求和评论请求：它们可能在几乎同一时间收到 401。如果每个请求都独立调用 `/auth/refresh`，会产生多个刷新请求；而 Refresh Token 又启用了轮换，后发请求可能拿着已经被加入黑名单的旧 Token，结果就是本来正常的用户被迫退出。

解决方案是把刷新动作变成一个共享 Promise：

```ts
let refreshPromise: Promise<string | null> | null = null

export const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const response = await $fetch(`${apiBase}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    })
    const token = response.data?.access_token
    if (!token) throw new Error('登录状态已失效。')
    accessToken.value = token
    return token
  })()
    .catch(() => {
      accessToken.value = null
      return null
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}
```

并发请求的实际效果变成：

```text
请求 A --401--┐
请求 B --401--┼--> 共享 refreshPromise --> 新 Access Token
请求 C --401--┘                         ├--> A 重试
                                        ├--> B 重试
                                        └--> C 重试
```

这就是常说的 single-flight：同一时间只允许一个刷新动作，其他请求等待同一个结果。它不是简单的防抖，因为防抖关注的是时间窗口，而这里关注的是“同一件进行中的异步任务”。

## 七、管理端的队列：刷新后让失败请求继续执行

管理端使用 Axios，因此在共享刷新 Promise 之外，又在响应拦截器中维护了等待队列：

```ts
if (isRefreshing) {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject })
  }).then(() => request(originalRequest))
}
```

第一个遇到 401 的请求负责刷新；后续请求进入 `failedQueue`。刷新成功后，队列统一放行，重新经过请求拦截器，自动带上刚刚写入内存的新 Access Token。

刷新失败则必须拒绝整个队列，并清理登录状态：

```text
刷新成功 -> 队列全部重试
刷新失败 -> 队列全部失败 + 清理用户状态 + 跳转登录页
```

这里有两个容易遗漏的边界：

1. `/auth/refresh` 自己失败时不能再次进入 401 刷新分支。
2. 原请求必须带 `_retry` 标记，避免业务接口永久重试。

## 八、页面启动时的登录状态恢复

只处理“请求过程中的 401”还不够。用户刷新浏览器后，内存里的 Access Token 已经消失，但 HttpOnly Cookie 仍然存在，这时页面需要主动尝试恢复会话：

```text
页面启动
  -> 内存没有 Access Token
  -> POST /auth/refresh，浏览器自动带 Cookie
  -> 成功：保存新的 Access Token，再获取用户资料
  -> 失败：保持游客状态，不把旧凭证写回 localStorage
```

博客前台和管理端都清理了历史遗留的 `localStorage` Token。Access Token 只存在内存，用户信息也只保存在当前页面状态中。这样可以避免旧版本留下的持久化凭证继续参与新认证流程。

不过，页面恢复也要防重复：同一个页面只应进行一次初始恢复，恢复过程中的其他调用共享同一个 Promise。否则首页初始化、用户菜单和评论区可能各自发起一次恢复请求。

## 九、哪些做法看起来方便，但不建议保留

### 把两个 Token 都放进 localStorage

这会让 Refresh Token 暴露给所有能执行 JavaScript 的代码。只要页面存在 XSS，长期凭证就可能被读取并带走。更稳妥的边界是：Access Token 内存化，Refresh Token 交给 HttpOnly Cookie 管理。

### 让 Refresh Token 也访问业务接口

这会模糊 Token 类型，后端容易遗漏用途校验。Refresh Token 只应该出现在刷新、登出或明确的会话管理流程里。

### 每个 401 都直接重新登录或直接刷新

前者破坏体验，后者会在并发场景造成刷新风暴。正确的处理应该是：只对 401 刷新、共享刷新任务、原请求最多重试一次。

### 只校验 JWT 签名，不检查账号状态

JWT 签名正确，只能说明它是服务端签发的，并不代表用户现在仍然可以使用系统。刷新时还要检查过期、Token 类型、黑名单、用户是否存在以及账号是否被禁用。

### 把刷新失败吞掉

如果刷新失败后仍然保留旧的用户信息，页面会出现“看起来已登录、请求全部失败”的半登录状态。失败路径应该统一清理 Access Token、用户资料和旧存储，再回到明确的游客或登录页状态。

## 十、最终的职责分工

把整套方案压缩成一句话就是：

> Access Token 负责短期访问，Refresh Token 负责长期续期；后端负责验证、轮换和撤销，前端负责内存管理、并发合并和失败恢复。

一套可落地的检查清单如下：

- Access Token 和 Refresh Token 是否有不同的过期时间和 `token_type`？
- 普通接口是否只接受 Access Token？
- Refresh Token 是否为 HttpOnly Cookie，且没有出现在 JSON、localStorage 或日志中？
- 刷新成功后是否轮换 Refresh Token，并使旧 Token 失效？
- 刷新时是否检查黑名单、用户存在性和账号启用状态？
- 多个请求同时 401 时，是否只有一个真实刷新请求？
- 刷新接口是否排除在自动刷新逻辑之外？
- 原请求是否最多只重试一次？
- 页面刷新后，是否能用 Cookie 恢复会话？
- 恢复失败后，是否能进入干净、明确的游客状态？

双 Token 的价值不在于多了一个字段，而在于它把“访问权限”和“续期能力”拆成了不同生命周期的凭证。再配合 Token 类型隔离、HttpOnly Cookie、刷新轮换和并发队列，登录系统才真正从“能用”走向“可维护、可撤销、可解释”。
