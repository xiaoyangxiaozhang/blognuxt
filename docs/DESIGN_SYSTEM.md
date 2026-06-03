# 「小羊嚣张」博客设计系统文档

> 本文档为博客「小羊嚣张」的完整设计规范，供 AI 生成（sitich/stitch）统一风格界面时参考。
> 遵循此文档可确保新页面与现有界面视觉一致。

---

## 一、设计灵魂

| 维度 | 描述 |
|------|------|
| **风格定位** | 极简暗色为主，蓝白亮色为副，高端科技感 |
| **核心气质** | 深邃、克制、聚焦内容，轻微玻璃态质感 |
| **色彩基调** | 暗色：纯黑底 + 纯白文字 + 蓝色品牌点缀；亮色：纯白底 + 纯黑文字 + 深蓝品牌点缀 |
| **品牌色** | 蓝色系 `#3b82f6 ~ #60a5fa`，在黑白世界中作为唯一彩色信号 |
| **动效哲学** | 丝滑、克制、尊重用户偏好，用 cubic-bezier 实现高级缓动 |

---

## 二、主题系统

博客支持双主题切换，通过 `data-theme` 属性控制：

| 主题名 | `data-theme` 值 | 说明 |
|--------|----------------|------|
| 午夜蓝黑 | `midnight-blue`（默认/无属性） | 纯黑深色主题 |
| 蓝白 | `blue-white` | 纯白浅色主题 |

### 2.1 暗色主题（默认）完整色板

```
背景体系：
  --bg-primary:         #000000    主背景（最深黑）
  --bg-secondary:       #0f0f0f    次级背景
  --bg-panel:           rgba(0,0,0,0.92)    面板/浮层背景（半透明）
  --bg-panel-solid:     #111111    面板背景（实色）
  --bg-soft:            rgba(255,255,255,0.06)   轻微高亮背景
  --bg-elevated:        rgba(10,10,10,0.98)     悬浮最高层背景
  --bg-header:          linear-gradient(...)     顶部渐变（透明→黑）
  --bg-header-scrolled: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(30,30,30,0.9))

文本体系（纯白系）：
  --text-primary:       #ffffff    主要文字 ★纯白
  --text-secondary:     #b0b0b0    次级文字
  --text-muted:         #8c8c8c    弱化文字
  --text-on-accent:     #000000    在强调色上的文字（黑）

品牌色（蓝色系 — 唯一彩色信号）：
  --brand-accent:       #60a5fa    品牌主色（亮蓝）
  --brand-accent-soft:  rgba(96,165,250,0.12)  品牌色半透明背景
  --brand-accent-hover: #3b82f6    品牌悬停色（深蓝）

强调色（黑白体系）：
  --accent:             #ffffff    通用强调（白）
  --accent-strong:      #d9d9d9    强强调
  --accent-soft:        rgba(255,255,255,0.1)   弱强调背景
  --accent-border:      rgba(255,255,255,0.18)  强调边框

边框 & 阴影：
  --border-color:       rgba(255,255,255,0.08)  通用边框
  --shadow-color:       rgba(0,0,0,0.45)        通用阴影

滚动条：
  --scroll-track:       #1a1a1a
  --scroll-thumb:       #333333
  --scroll-thumb-hover: #ffffff

首页专属 Token：
  --home-surface:        #050505
  --home-surface-elevated: #101010
  --home-card-bg:        #141414
  --home-card-hover:     #1b1b1b
  --home-card-alt:       #171717
  --home-border:         rgba(255,255,255,0.08)
  --home-accent:         #ffffff
  --home-accent-soft:    rgba(255,255,255,0.08)
  --home-text:           #ffffff  ★纯白
  --home-text-muted:     #8c8c8c
  --home-shadow:         0 18px 40px rgba(0,0,0,0.32)

评论区 Token：
  --comment-input-text:       #ffffff
  --comment-input-placeholder:#6b7280
  --comment-login-bg:         rgba(96,165,250,0.08)
  --comment-toolbar-btn:      #6b7280
  --comment-toolbar-btn-hover:#b0b0b0
  --comment-separator:        rgba(255,255,255,0.1)
```

### 2.2 亮色主题完整色板

```
背景体系：
  --bg-primary:         #ffffff
  --bg-secondary:       #f5f5f5
  --bg-panel:           rgba(255,255,255,0.84)
  --bg-panel-solid:     #ffffff
  --bg-soft:            rgba(0,0,0,0.16)
  --bg-elevated:        rgba(255,255,255,0.95)
  --bg-header:          linear-gradient(to bottom, rgba(255,255,255,1), rgba(245,245,245,0.7)...)
  --bg-header-scrolled: linear-gradient(135deg, rgba(255,255,255,0.96), rgba(245,245,245,0.95))

文本体系：
  --text-primary:       #000000
  --text-secondary:     #555555
  --text-muted:         #666666
  --text-on-accent:     #ffffff

品牌色（深蓝为主）：
  --brand-accent:       #3b82f6
  --brand-accent-soft:  rgba(59,130,246,0.08)
  --brand-accent-hover: #2563eb

强调色（黑体系）：
  --accent:             #000000
  --accent-strong:      #333333
  --accent-soft:        rgba(0,0,0,0.14)
  --accent-border:      rgba(0,0,0,0.22)

边框 & 阴影：
  --border-color:       rgba(0,0,0,0.14)
  --shadow-color:       rgba(0,0,0,0.12)

首页专属：
  --home-surface:        #ffffff
  --home-card-bg:        #ffffff
  --home-card-hover:     #f4f6f9
  --home-card-alt:       #f8fafc
  --home-border:         rgba(0,0,0,0.08)
  --home-accent:         #111111
  --home-accent-soft:    rgba(0,0,0,0.06)
  --home-text:           #111111
  --home-text-muted:     #666666
  --home-shadow:         0 18px 40px rgba(15,23,42,0.08)
```

---

## 三、字体系统

| 用途 | 字体栈 | 说明 |
|------|--------|------|
| **全局 UI** | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` | 系统默认无衬线 |
| **文章正文** | `"LXGWWenKaiLite", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif` | 霞鹜文楷优先，兼雅兼具 |
| **代码** | `"Consolas", "Monaco", "Courier New", monospace` | 等宽字体 |

### 字体大小层级

```
Hero 大标题：   92px (桌面) / 72px (平板) / 52px (手机)
Hero 副标题：   46px (桌面) / 36px (平板) / 24px (手机)
Section 标题：  48px (桌面) / 44px (平板) / 32px (手机)
文章卡片标题：  21px (默认) / 18px (手机)
特色文章标题：  30px (桌面) / 28px (平板) / 18px (手机)
导航文字：      15px
正文：          1rem (16px)
辅助文字：      12-14px
```

### 字重规范

- **700**：Hero 大标题、按钮文字、重要标签
- **600**：导航标题、作者名、卡片分类、加粗文本
- **500**：正文、链接（含中等强调）
- **400**：常规文本

---

## 四、间距 & 布局系统

### 4.1 容器宽度

```
桌面端 (≥1200px)：  max-width: 1200px (header) / 1000px (content) / 1120px (hero)
平板端 (768-1199)：  max-width: 760px / 700px
手机端 (<768px)：    max-width: 380px / calc(100% - 28px)
小手机 (<480px)：    calc(100% - 16px)

统一使用 min(1200px, calc(100% - 40px)) 模式
```

### 4.2 通用间距尺度

```
卡片内边距：        22-24px
卡片间距(grid)：    22-24px
Section 间距：      28-36px
页面顶部留白：      72px
Header 高度：       60px (桌面) / 54px (平板) / 52px (手机)
```

### 4.3 圆角系统（2026-06-01 更新）

```
全圆/药丸形：      border-radius: 999px  → 按钮、标签、chip、mini-logo、Header island
卡片圆角：         border-radius: 15px   → 文章卡片、占位卡片、评论区卡片
弹窗/面板：        border-radius: 14-15px → 登录弹窗、下拉菜单、搜索框、输入框
头像：             border-radius: 50%    → 用户头像
小元素：           border-radius: 8-10px → 动态媒体项、toolbar 图标
图片/代码块：      border-radius: 8px    → 文章内图片、代码区
微圆角：           border-radius: 4-6px  → 行内代码、表格
```

> 2026-06-01：统一缩小圆角，卡片从 30px→15px，弹窗从 22px→15px，面板从 16px→14px

---

## 五、核心组件模式

### 5.1 Header（三态导航栏）

```
状态切换逻辑：
  scrollY ≤ 8px     → state-full   (完整导航：logo + 菜单 + 操作)
  向下滚动 > 48px   → state-logo   (仅圆形 logo 浮动)
  向上滚动 > 48px   → state-island (胶囊导航栏：mini logo + 简略菜单)

full 状态：
  - 高度 60px，grid 三栏（auto 1fr auto）
  - 左侧：圆形「羊」标志(42×30px, 药丸形, accent 背景) + "小羊嚣张"
  - 中间：导航链接（文章下拉 + 友链/动态/留言/关于）
  - 右侧：操作图标按钮 6 个（主题/RSS/通知/收藏/搜索/菜单）
  - 背景透明，文字用 --text-secondary

logo 状态：
  - 顶部居中浮动圆形「羊」按钮
  - blue glow 效果（品牌色光晕）
  - hover 上浮 + 放大

island 状态：
  - 胶囊形导航栏（border-radius: 999px）
  - 背景：bg-header-scrolled + backdrop-filter: blur(14px)
  - 包含：mini logo + 归档/分类/标签/关于 + 主题切换
  - 边框 + 大阴影悬浮感

Header 全局：
  - position: sticky, z-index: 300
  - 亮色主题时导航文字强制白色（#ffffff）
```

### 5.2 文章卡片

```
两种变体：
A. 特色卡片 (featured) — 首页第一条
  - 横排布局：grid 1.45fr + 1fr
  - 封面全高填充，hover 图片放大 1.06
  - 标题 30px，更大留白 padding: 34px 36px

B. 标准卡片 — 其他文章
  - 竖排布局：封面(260px) + 内容
  - 标题 21px / 18px(手机)，最多 3 行截断
  - padding: 22px 24px

共用样式：
  - border-radius: 15px（手机 14px）
  - border: 1px solid var(--home-border)
  - background: var(--home-card-bg)
  - box-shadow: var(--home-shadow)
  - hover: translateY(-4px) + border-color → accent-border + bg → home-card-hover

ArticleMasonryFeed 卡片增强：
  - background: radial-gradient(右上角 brand-accent-soft) + home-card-bg
  - hover: translateY(-6px)
  - 封面区域含精选/置顶标记 chip
  - meta chip: 圆角药丸形、半透明背景、内含图标
  - tag chip: 药丸形、带边框、accent-soft 背景
```

### 5.3 首页 Hero 区域

```
结构：
  - 全屏背景图（viewport-bg-image，object-fit: cover, scale 1.04）
  - 渐变遮罩：linear-gradient(180deg, rgba(4,4,4,0.18) → #050505)
  - 粒子动画：星星(黄绿光点) + 花朵(白色浮动点)
  - 居中文字：品牌蓝色 Hero 名(92px) + 打字机副标题(46px, #ffffff)

动效：
  - 星星：twinkle 动画（opacity 0.3~1, scale 1~1.5）
  - 花朵：float 动画（translateY + rotate）
  - 文字：fadeInUp 逐个字符动画
  - 光标：blink 闪烁
```

### 5.4 按钮系统

```
操作按钮 (.action-btn)：
  - 32×32px 圆形，透明背景
  - hover: accent-soft 背景 + accent 文字 + accent-border 边框
  - 过渡：0.28s ease

主题切换按钮 (.action-theme)：
  - 36×36px，预置 accent-soft 背景 + accent-border 边框
  - 内含 sun/moon 图标(18×18px svg)

提交按钮 (.submit-btn)：
  - 全宽 56px 高，border-radius: 14px
  - 背景色 brand-accent-hover，文字白色 16px/700
  - disabled: opacity 0.7

mini-logo 按钮：
  - 圆形药丸形，品牌蓝色文字
  - ::before 伪元素实现 blue glow（品牌色半透明 + blur + box-shadow）
  - hover: translateY(-1px) + scale(1.05) + brightness(1.06)
```

### 5.5 表单输入框

```
样式：
  - height: 56px, padding: 0 16px, border-radius: 14px
  - border: 1px solid --border-color
  - background: --bg-panel-solid
  - color: --text-primary
  - placeholder: --text-muted

focus 状态：
  - border-color → --brand-accent
  - box-shadow: 0 0 0 3px --brand-accent-soft
```

### 5.6 弹窗/Modal

```
遮罩层：
  - background: rgba(15,23,42,0.22) + backdrop-filter: blur(8px)
  - z-index: 9999

容器：
  - max-width: 500px, padding: 28px 24px 22px
  - border-radius: 15px
  - background: --bg-elevated
  - border: 1px solid --border-color
  - box-shadow: 0 24px 60px --shadow-color

入场动画：
  - 遮罩 opacity 0→1
  - 容器 translateY(12px) scale(0.98) → 原地
  - transition: 0.25s ease
```

### 5.7 Feature Tabs 面板

```
Tab 按钮：
  - 透明背景，文字 20px/500
  - 底部 indicator：5px 高，brand-accent 色，圆角
  - indicator 滑动过渡：0.3s ease
  - active/hover: 文字变 brand-accent

内容切换：
  - fade 过渡：opacity + translateY 10px
  - 0.25s ease
```

---

## 六、动效系统

### 6.1 缓动函数（Easing）

```css
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);    /* 最常用 */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);    /* 更柔和 */

Header 专用：     cubic-bezier(0.22, 1, 0.36, 1);    /* 弹性但不过分 */
主题切换：        cubic-bezier(0.4, 0, 0.2, 1);      /* 标准 Material */
```

### 6.2 过渡时长

```
--transition-fast:  150ms   → hover 微交互
--transition-base:  250ms   → 常规过渡
--transition-slow:  400ms   → 大区域变化、图片缩放

主题切换 html:     350ms   → 全局背景/文字
View Transition:   450ms   → 主题切换 fade
```

### 6.3 View Transitions API（主题切换）

```
::view-transition-old(root): z-index:1, 保持原位
::view-transition-new(root): z-index:9999, theme-fade-in 0.45s
                              opacity 0→1，mix-blend-mode: normal
```

### 6.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  ::view-transition-old/new { animation-duration: 0.01ms !important; }
}
```

---

## 七、Markdown 文章排版系统

### 7.1 标题层级

```
h1: 2.25em  letter-spacing: -0.02em
h2: 1.875em letter-spacing: -0.01em (手机: 1.625em / 1.5em)
h3: 1.5em   (手机: 1.375em / 1.25em)
h4: 1.25em  (手机: 1.125em)
h5: 1.125em
h6: 1em
所有标题: font-weight: 600, scroll-margin-top: 80px
```

### 7.2 代码块

```
容器：border-radius: 6px, border, 独立背景色
工具栏：语言标签 + 折叠按钮 + 复制按钮（右对齐）
行号：2em 宽度，右侧 border 分隔
折叠：max-height: 0 → 3000px, 箭头旋转 90deg
```

### 7.3 自定义块

```
.custom-note:   左边框 4px + 类型颜色(info/warning/success/error)
.custom-tabs:   Tab 切换面板，active tab 用 accent 色填充
.custom-fold:   可折叠面板，max-height 过渡
.custom-link-card: 链接预览卡片（图标 + 标题 + 描述 + 箭头）
```

### 7.4 表格

```
圆角 6px, border-collapse
thead: 渐变背景
隔行变色 + hover 高亮
响应式：手机端 font-size 缩小
```

### 7.5 暗色/亮色 prose 变量差异

| 元素 | 暗色 | 亮色 |
|------|------|------|
| 正文 | `#ffffffb3` | `#000000` |
| 标题 | `#ffffff` | `#000000` |
| 链接 | `#ffffff` | `#000000` |
| 代码背景 | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.08)` |
| 代码块背景 | `#1e1e1e` | `#f6f8fa` |
| 引用边框 | `#ffffff` | `#000000` |
| 表格表头渐变 | `rgba(255,255,255,0.15→0.08)` | `rgba(0,0,0,0.1→0.05)` |

---

## 八、滚动条样式

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: --scroll-track; border-radius: 3px; }
::-webkit-scrollbar-thumb { background: --scroll-thumb; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: --scroll-thumb-hover; }
```

---

## 九、响应式断点

| 断点 | 宽度 | 主要变化 |
|------|------|----------|
| Desktop | ≥1200px | 完整布局 |
| Desktop-S | ≤1200px | 容器收窄 760px/700px, 特色卡片变紧凑 |
| Tablet | ≤960px | Header 部分图标隐藏, island nav 间距缩小 |
| Tablet-S | ≤900px | feed head 单列 |
| Mobile | ≤768px | 容器 380px, 导航折叠, 卡片单列, 特色卡片竖排 |
| Mobile-S | ≤480px | 容器 100%-16px, 字体进一步缩小 |

---

## 十、色值速查卡

### 暗色主题常用色

| 色值 | 用途 |
|------|------|
| `#000000` | 主背景 |
| `#0f0f0f` | 次级背景 |
| `#ffffff` | 主文字、强调色 |
| `#b0b0b0` | 次级文字 |
| `#8c8c8c` | 弱化文字 |
| `#60a5fa` | 品牌亮蓝（链接、高亮、logo glow） |
| `#3b82f6` | 品牌深蓝（hover、active） |
| `rgba(255,255,255,0.08)` | 通用边框 |
| `rgba(96,165,250,0.12)` | 品牌色半透明背景 |
| `rgba(96,165,250,0.18)` | logo glow 背景 |

### 亮色主题常用色

| 色值 | 用途 |
|------|------|
| `#ffffff` | 主背景 |
| `#f5f5f5` | 次级背景 |
| `#000000` | 主文字、强调色 |
| `#555555` | 次级文字 |
| `#666666` | 弱化文字 |
| `#3b82f6` | 品牌蓝（链接、高亮） |
| `#2563eb` | 品牌深蓝（hover） |
| `rgba(0,0,0,0.14)` | 通用边框 |
| `rgba(59,130,246,0.08)` | 品牌色半透明背景 |

---

## 十一、设计原则速记

1. **暗色 = 黑底白字，亮色 = 白底黑字**，品牌蓝色是唯一彩色信号
2. **圆角使用药丸形(999px)与统一大圆角(15px)两种极端**，保持克制一致
3. **所有过渡用 cubic-bezier 缓动**，不用 linear/ease
4. **玻璃态效果**：backdrop-filter: blur() + 半透明背景 + 细边框
5. **卡片统一有 shadow + border**，hover 上浮 + 边框变色
6. **文字纯白/纯黑优先**，不透明度文本用于弱化层级
7. **用 CSS 变量做主题切换**，不写硬编码颜色
8. **尊重 reduced-motion**，动画全部有关闭方案
9. **移动端卡片变单列**，圆角从 15px 降为 14px
10. **Header 三种状态**用 scroll 驱动，丝滑切换

---

## 十二、技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Nuxt 4 + Vue 3.5 |
| 语言 | TypeScript |
| UI 库 | Element Plus |
| 状态管理 | Pinia |
| 样式 | SCSS + CSS 自定义属性 |
| 图标 | Material Symbols (Iconify/unplugin-icons) |
| 构建 | Vite |
| 关键包 | @pinia/nuxt, @element-plus/nuxt, unplugin-icons, unplugin-auto-import |

---

*文档生成时间：2026-06-01*
*基于 `blognuxt` 项目实际代码提取*
