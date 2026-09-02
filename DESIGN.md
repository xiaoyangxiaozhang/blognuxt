---
version: 1.0
name: BlogNuxt-design-system
description: BlogNuxt 的首页、导航栏与博客内容界面设计规范。以当前深色优先的个人博客视觉为基线，保留视频首屏、紫蓝品牌色、波浪分隔和滚动状态导航，并为留言、友链、文章、动态等页面提供可复用的延展规则。
source_of_truth:
  reference_format: external DESIGN.md / Apple-design-analysis
  current_implementation:
    homepage: app/pages/index.vue
    header: app/components/shell/Header.vue
    global_tokens: app/assets/css/main.scss
    home_feature: app/components/home/HomeFeaturePanel.vue
    home_articles: app/components/home/HomeNewestSection.vue
    footer: app/components/shell/Footer.vue
themes:
  default: midnight-blue
  alternate: blue-white
colors:
  brand-accent: "#8183ff"
  brand-accent-hover: "#6b6de6"
  brand-accent-soft: "rgba(129, 131, 255, 0.12)"
  midnight-bg: "#0e0e0e"
  midnight-secondary: "#151515"
  midnight-panel: "#171717"
  midnight-card-hover: "#1e1e1e"
  blue-white-bg: "#ffffff"
  blue-white-secondary: "#fafafa"
  text-primary-dark: "#ffffff"
  text-secondary-dark: "#cccccc"
  text-muted-dark: "#999999"
  text-primary-light: "#000000"
  text-secondary-light: "#555555"
  text-muted-light: "#999999"
  border-dark: "rgba(255, 255, 255, 0.08)"
  border-light: "rgba(0, 0, 0, 0.08)"
  home-border-dark: "#262626"
  hero-overlay-dark: "rgba(0, 0, 0, 0.35)"
  hero-overlay-light: "rgba(245, 245, 245, 0.25)"
  social-github: "#24292e"
  social-bilibili: "#00a1d6"
  social-twitter: "#000000"
  social-mail: "#ea4335"
typography:
  font-family: "Overpass, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  hero-name:
    fontSize: 92px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: 2px
  hero-name-tablet:
    fontSize: 72px
    fontWeight: 700
    lineHeight: 1.05
  hero-name-mobile:
    fontSize: 52px
    fontWeight: 700
    lineHeight: 1.05
  hero-title:
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: 1px
  hero-title-compact:
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.6
  section-title:
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.3
  section-title-tablet:
    fontSize: 44px
    fontWeight: 600
    lineHeight: 1.2
  section-title-mobile:
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  nav-brand:
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.02em
  nav-link:
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
  menu-link:
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
  card-title:
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.45
  featured-card-title:
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.2
  metadata:
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
  tag:
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  body-recommended:
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
rounded:
  indicator: 2px
  tag: 4px
  menu-item: 8px
  social-hover: 10px
  menu: 12px
  article-card: 15px
  article-card-mobile: 14px
  action: 9999px
  social: 50%
  full-bleed: 0px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 40px
  content-gutter: 60px
  content-top: 72px
  hero-top: 100px
components:
  page-shell:
    backgroundColor: "{colors.midnight-bg} or {colors.blue-white-bg}"
    textColor: "{colors.text-primary-dark} or {colors.text-primary-light}"
    theme: "data-theme=midnight-blue | blue-white"
  hero-video-viewport:
    minHeight: 100vh
    background: "configured blog.background_image only"
    imageFit: cover
    poster: "blog.screenshot when configured"
    overlay: "functional top fade only"
  hero-content:
    alignment: center
    padding: "100px 20px 56px"
    entrance: "opacity + translateY"
  wave-divider:
    height: 120px
    layers: 3
    motion: "9s / 14s / 22s wave tracks"
    interaction: none
  feature-panel:
    maxWidth: 1000px
    title: "Feature"
    tabs: "博主 / 文章 / 动态 / 评论 / 公告"
    activeSignal: "brand-accent 3px indicator"
  article-card:
    background: "{colors.midnight-panel} or theme equivalent"
    border: "1px solid home-border"
    rounded: "{rounded.article-card}"
    shadow: "current home-shadow only"
    grid: "2 columns; featured item spans all columns"
  header-full:
    height: 60px
    container: "min(1200px, 100% - 40px)"
    background: transparent
    position: sticky
  header-logo-state:
    trigger: "scroll down past 48px"
    content: "centered mini logo"
    background: "theme header translucent + blur"
  header-island-state:
    trigger: "scroll upward past 48px"
    content: "centered logo, compact nav and actions"
    shape: pill
  brand-route-menu:
    background: "theme elevated panel"
    rounded: "{rounded.menu}"
    blur: 12px
    motion: "vertical expand + staggered items"
  nav-dropdown:
    trigger: "hover or focus-within"
    background: "theme elevated panel"
    rounded: "{rounded.menu}"
  action-button:
    size: "32px; theme action is 36px"
    rounded: "{rounded.action}"
    iconSize: 18px
    active: "keep within existing transparent/icon-button grammar"
  social-link:
    size: "44px desktop; 38px home mobile"
    rounded: "{rounded.social}"
    hover: "brand or platform color + translateY(-2px)"
  footer:
    maxWidth: 1000px
    borderTop: "1px theme border"
    layout: "brand / social / stats / legal"
---

## Overview

BlogNuxt 的视觉核心不是复制外部 Apple 页面，而是把当前首页已经形成的几个识别点稳定下来：深色优先的画布、紫蓝品牌交互色、沉浸式视频或图片 Hero、柔和的波浪分隔、内容逐层出现，以及随滚动在完整导航、居中 Logo 和紧凑岛状导航之间切换的 Header。

附件 `DESIGN.md` 提供的是设计文档格式和一套 Apple 风格分析结果。它可以作为排版方式、token 组织方式和 Do/Don't 结构的参考，但不是本项目的直接视觉 token。当前项目仍以 `main.scss` 的主题变量和首页/Header 的实际 CSS 为准：品牌色是 `#8183ff`，默认主题是 `midnight-blue`，而不是附件中的 Action Blue `#0066cc`。

### Design Intent

- 让首页 Hero 先建立情绪，再让 Feature 和文章内容逐步进入阅读节奏。
- 让 Header 在顶部尽量轻，在滚动中保持可用；状态变化要像一个连续的空间变形，而不是突然替换 DOM。
- 使用少量、稳定、可复用的颜色和圆角。视觉变化主要来自主题、图片、留白和动效，不来自无穷增加的装饰。
- 非首页页面应借用相同的 Header、主题、内容宽度、卡片和交互 token，不能各自发明一套导航与按钮语言。
- 新设计首先服务于文章阅读、留言交流和站点探索，不用装饰压过内容。

### Current Implementation Map

| Area | Current source | Current behavior | Extension rule |
|---|---|---|---|
| Hero | `app/pages/index.vue` | 只有配置了 `blog.background_image` 才渲染首屏视觉；视频优先使用配置截图作 poster | 新页面优先复用图片/视频配置和降级逻辑，不重新引入固定资源 |
| Theme | `app/assets/css/main.scss` | `midnight-blue` 与 `blue-white` 通过 CSS variables 切换 | 新组件只消费变量，不直接写死主题颜色 |
| Header | `app/components/shell/Header.vue` | sticky Header 有 full/logo/island 三种状态 | 新页面不替换全局 Header，只适配它的内容层级和遮挡关系 |
| Feature | `app/components/home/HomeFeaturePanel.vue` | 五个 tab 共用一条紫蓝活动指示线，并使用滚动显现 | 同类分组优先采用 tab + indicator，不新增多色标签导航 |
| Articles | `app/components/home/HomeNewestSection.vue` | 双列卡片，首张 featured 横向跨列，移动端单列 | 新卡片复用相同圆角、边框、标题和图片裁切规则 |
| Footer | `app/components/shell/Footer.vue` | 品牌信息、社交入口、站点统计、法律信息分层展示 | 社交平台颜色只用于平台识别，不升级为全站品牌色 |

## Colors

### Theme Surfaces

`midnight-blue` 是默认主题。它使用 `#0e0e0e` 作为主背景、`#151515` 作为次级背景、`#171717` 作为面板和卡片基底，文字从白色到 `#999999` 形成三层层级。`blue-white` 使用白色主背景、`#fafafa` 次级背景和黑色主文字，保留同一套结构和品牌交互色。

主题切换必须通过 `data-theme` 和全局 CSS 变量完成。组件中禁止用 JavaScript 逐个修改颜色，也禁止仅为单个页面复制一套主题判断。

### Brand Accent

- `--brand-accent: #8183ff`：站点唯一的核心交互色，用于当前导航、活动 tab、焦点信号、链接和主要行动提示。
- `--brand-accent-hover: #6b6de6`：需要更强反馈时使用的 hover 变体。
- `--brand-accent-soft`：用于岛状导航活动项、登录提示和轻量背景，不用于大面积渐变。
- `--home-accent`：首页局部 accent token。若新页面需要强调，优先使用 `--brand-accent` 或语义等价的已有 token。

附件里的 `#0066cc` 只作为外部参考，不得未经明确的品牌决策直接替换项目现有紫蓝色。

### Social Brand Colors

GitHub、Bilibili、Twitter/X、邮件等入口可以保留各平台本身的识别色，但这些颜色只允许出现在对应社交图标或社交按钮内部。它们不能用于页面标题、导航活动态、主 CTA 或内容卡片。

### Gradients and Images

首页已有的 Hero 顶部渐变是图片/视频可读性的功能性遮罩；文章图片上的轻微渐变是现有卡片 hover 氛围层。它们不是新的品牌色，也不能扩展成全站装饰性渐变。新页面应优先使用真实图片、主题表面和留白来建立层次。

## Typography

### Font Family

全站基础字体是 `Overpass`，并回退到 `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont` 等系统字体。新页面要继承站点字体栈，不在页面级引入新的字体文件或远程字体，除非先完成性能与授权评估。

### Hierarchy

| Token | Size / weight | Use | Status |
|---|---|---|---|
| `hero-name` | 92px / 700 / 1.05 / 2px | Hero 中的站点或作者名称 | 当前实现 |
| `hero-title` | 32px / 500 / 1.6 / 1px | Hero 打字式介绍文案 | 当前实现；500 仅限此语境 |
| `section-title` | 28px / 600 | Feature、最新文章等区块标题 | 当前实现 |
| `nav-brand` | 18px / 700 | 左侧品牌按钮 | 当前实现 |
| `nav-link` | 15px / 400 | 桌面主导航 | 当前实现 |
| `menu-link` | 14px / 400 | 下拉菜单项 | 当前实现 |
| `card-title` | 18px / 400 / 1.45 | 普通文章卡片标题 | 当前实现 |
| `featured-card-title` | 30px / 400 / 1.2 | featured 文章标题 | 当前实现 |
| `metadata` | 13px / 500 | 分类、日期、辅助信息 | 当前实现 |
| `tag` | 12px / 400 | 文章标签 | 当前实现 |
| `body-recommended` | 16px / 400 / 1.6 | 新增内容型页面的建议正文基线 | 延展建议，需按现有组件复核 |

标题允许使用 600/700 建立层级，正文默认 400。不要把 500 扩散成全站正文权重；目前它只服务于 Hero title 和少数 metadata 场景。超大文字必须有明确内容理由，不能只为制造“高级感”而放大。

## Layout

### Container Widths

- Header 主容器：`min(1200px, calc(100% - 40px))`。
- 首页内容容器：桌面 `min(1000px, calc(100% - 60px))`。
- 1200px 以下，Feature 和文章内容收窄到约 700–760px，避免阅读行长过长。
- 移动端内容区域约束为 `min(368px, 100%)`，两侧由页面和组件共同保留安全间距。
- Footer 内容最大宽度为 1000px，与首页内容建立对齐关系。

### Homepage Rhythm

1. Header 透明地覆盖 Hero 顶部。
2. Hero 至少占据一整个 viewport，内容居中，顶部保留 100px 内部空间。
3. 三层波浪在 Hero 底部运动，作为视觉过渡；它不承担交互。
4. Content section 使用站点背景色，顶部约 72px 留白。
5. Feature 先出现，随后是最新文章；区块之间以留白而不是额外分割线为主。
6. 文章网格桌面双列，featured 卡片跨两列；移动端变成单列。

### Navigation Relationship

Header 是全站层，不应被页面内容重复实现。首页允许 Header 在 Hero 上透明显示；文章详情和普通页面必须考虑内容是否被 Header 遮挡。新增页面应先确认 `app/layouts/default.vue` 的 `blog-main` 负 margin 和页面自身首屏 padding，再决定顶部间距。

## Elevation & Depth

项目当前不是“零阴影”系统，而是把阴影限制在少数有功能意义的层级：

| Level | Current treatment | Allowed use |
|---|---|---|
| Flat | 主题背景，无边框或仅继承背景 | 页面大区、Hero、波浪、Footer |
| Hairline | `--border-color` 或 `--home-border` | Header 滚动态、卡片、菜单边界 |
| Soft panel | 主题面板、`backdrop-filter: blur(12px)` | 下拉菜单、需要与背景分离的浮层 |
| Home card | `--home-shadow` + 1px border | 首页文章卡片的现有视觉 |
| Header blur | `blur(15px)` | Header logo/island 状态的滚动背景 |

新组件不要随意增加多层阴影、发光或玻璃拟态。若内容需要浮起，先尝试背景层级、边框或 blur；确需阴影时，应复用已有语义 token，而不是在组件中散落新的 rgba 值。

## Shapes

### Radius Grammar

- `9999px`：按钮、操作图标、岛状导航、活动链接和需要明确表达“可操作”的控件。
- `15px`：首页文章卡片；移动端使用 `14px`。
- `12px`：品牌下拉菜单和主导航下拉菜单。
- `8px`：下拉菜单项。
- `4px`：文章标签。
- `50%`：社交头像和社交图标按钮。
- `0`：全宽 Hero、波浪和页面大区，不加卡片式圆角。

不要在同一个组件里混用大量接近的圆角值。新增页面如果不是操作控件或文章卡片，默认使用平面容器，只有在交互或内容分组确实需要时才加圆角。

## Components

### Header

**`header-full`** 是顶部状态。Header 使用 `position: sticky`，整体 z-index 为 300，进入页面时从上方滑入。品牌区域包含 Logo、站点标题和可展开的站点路由菜单；中央是首页、文章下拉、友链、动态、留言；右侧是主题、订阅和搜索操作。

**`header-logo-state`** 在用户向下滚动并超过约 48px 后显示居中小 Logo。它是一个轻量锚点，不应承载完整导航或额外文案。

**`header-island-state`** 在用户向上滚动时显示紧凑导航岛。它保留 Logo、归档、分类、标签、留言和操作按钮，活动路由使用紫蓝软背景。岛状结构是 Header 的功能性收缩状态，不是新的页面容器。

状态切换由滚动方向和阈值控制：滚动到顶部回到 full；超过阈值向下进入 logo，向上进入 island。任何新导航功能必须在 full 与 island 两种可见状态中明确放置，不能只加在其中一个状态。

### Brand Route Menu

品牌菜单是站点路由的补充入口，不替代主导航。它使用主题 elevated panel、12px 圆角、12px blur 和 8px 内边距；菜单项按顺序进行轻量 stagger。必须同时支持鼠标路径、键盘 focus 和路由跳转；离开菜单后应关闭，不得阻塞页面内容。

### Main Navigation and Dropdown

主导航使用 15px 文字、28px 桌面间距和紫蓝活动态。文章下拉包含归档、分类、标签，使用 12px 菜单容器圆角和 8px 菜单项圆角。触发方式保留 `hover` 与 `focus-within`，避免只对鼠标可用。

### Action Buttons

主题、订阅、搜索使用圆形透明 icon button。图标基线为 18px；普通 action 32px，主题按钮 36px。Hover 只改变背景、颜色和边框，不把 Header action 变成大面积彩色按钮。新增需要高频触摸的页面控件必须达到至少 44×44px 的可点击区域，即使视觉图标仍是 18px。

### Hero

Hero 使用配置的 `blog.background_image`。当没有配置背景时，不渲染空的视觉首屏，也不重新引入默认 poster 作为伪内容。视频使用 poster 先行、播放成功后淡入；播放失败时保留可用的静态画面或主题背景。页面必须支持 `prefers-reduced-motion`，此时停止视频动效与背景缩放。

Hero 文案居中：作者/站点名称使用大号品牌色文字，介绍语使用白色和打字光标。文字必须具备足够对比度，不能依赖图片本身保证可读性。

### Feature Panel

Feature 面板是首页内容的导航式摘要，包含“博主、文章、动态、评论、公告”五个 tab。标题下方使用一条 3px 紫蓝指示线；活动内容通过有限的 fade + translate 切换。tab 内容异步更新时，稳定的 `.feature-body-reveal` 负责滚动显现，不要把显现状态绑定到会因 key 改变的内部节点。

### Article Card

文章卡片使用主题面板背景、1px 边框和 15px 圆角。桌面普通卡片为两列，featured 卡片横向跨满；图片 `object-fit: cover`，默认轻微放大约 1.015，hover 时平滑放大到约 1.08。卡片 hover/focus-within 当前使用轻微 `scale(0.97)`，新组件可以复用这种克制的按压感，但不能让内容跳动或改变布局。

### Footer

Footer 与首页内容宽度对齐，按品牌信息、社交入口、统计、法律信息分层。统计数字使用 20px/600，辅助标签使用 12px；版权和 powered 文案保持低对比度。Footer 社交图标的品牌色是平台例外，不得被抽取为全站 accent。

## Interaction and Motion

### Motion Tokens

- Header 首次进入：约 0.6s，从 `translateY(-100%)` 和透明状态进入。
- Header 状态变化：opacity 约 0.16s，transform 约 0.24s。
- Hero 内容：opacity 约 0.8s，transform 约 0.9s。
- Hero 背景：首屏缩放约 1s，poster 与 video 交接约 0.65s。
- Feature 与文章滚动显现：约 0.9–1.05s，默认从 22–34px 下方进入。
- 波浪轨道：9s、14s、22s 三层循环。

动效应该表达进入、切换和状态变化。不要用持续运动装饰普通内容，也不要因为追求“丝滑”而延长可交互状态的等待时间。

### Reduced Motion

所有新增动效都必须在 `prefers-reduced-motion: reduce` 下可用：停止背景缩放和视频动效，直接显示 Hero 内容，取消滚动显现位移，保留必要的颜色或可见状态变化。不能把 reduced motion 处理成隐藏内容。

## Responsive Behavior

### Breakpoints

| Breakpoint | Current behavior | Extension guidance |
|---|---|---|
| > 1200px | 首页内容宽 1000px；Header 容器宽 1200px；文章双列 | 使用完整内容层级和 28px 导航间距 |
| ≤ 1200px | 首页内容收窄约 760px；Hero name 72px；标题 24px | 保留居中布局，避免把内容拉满 |
| ≤ 960px | Header 容器两侧缩小到约 14px；导航间距减少 | 只压缩间距，不改变信息架构 |
| ≤ 768px | 主导航隐藏；Header 高度约 72px；island 隐藏内部导航；首页文章单列 | 新增移动导航前需先定义键盘与无障碍行为，不能假设已有 hamburger |
| ≤ 480px | Header 高度约 68px；品牌字 14px；Logo 30px | 保护品牌、主题、搜索和订阅操作的可用性 |

### Touch Targets

新增触控控件最小点击区域为 44×44px。当前 Header 的 32px icon button 是桌面视觉基线；移动端新增功能不要继续压缩视觉按钮的可点击区域。文章卡片、Feature tab 和品牌菜单项必须能通过键盘 focus 访问，不能只依赖 hover。

### Content and Media

Hero 图片和视频使用 `object-fit: cover`，优先加载首屏 poster；非首屏图片应按实际页面需要懒加载。新媒体必须评估文件体积、移动网络和构建产物，单个可替换模型或媒体组件优先使用轻量资源，不把整个 3D 作品集搬进博客。

## Extension Rules for Message, About, and Other Pages

1. 先复用全局 Header、Footer、主题变量和内容容器，再设计页面局部结构。
2. 页面首屏必须考虑默认 layout 的导航负 margin；不要通过随机增加顶部空白修复遮挡。
3. 页面主标题沿用 `section-title`，页面操作沿用 `brand-accent`，信息卡沿用文章卡片的边框和圆角语法。
4. 如果页面使用模型或其他客户端能力，必须用 `ClientOnly`/mounted 边界隔离 SSR，提供 loading、error 和静态降级状态。
5. 关于/留言类模型区域默认显示“加载模型中”而不是先加载作者头像；头像只作为真实加载失败时的降级内容。
6. 可替换模型应是单个轻量可复用组件，支持 `modelUrl` 等 props；不要复制完整 3D 作品集、额外场景系统或约 300MB 的重型资源。
7. 模型如果包含内置 glTF 动画，必须保留并正确更新 mixer；不能为了修复自转/公转问题直接关闭内置动画。
8. 移动端模型允许触摸旋转，但要保留页面上下滚动：使用 `enableControls`、`enablePan=false` 和合适的 `touch-action: pan-y` 组合，并在真实移动端验证。
9. 任何第三方模型都要保留来源、作者和许可证署名；`.gltf` 资源必须同时维护对应的 `.bin` 与 `textures/` 相对路径。

## Do's

- 使用已有 CSS variables：`--bg-primary`、`--bg-secondary`、`--text-primary`、`--text-muted`、`--brand-accent`、`--home-card-bg`、`--home-border`。
- 先选择表面层级和留白，再增加边框或装饰。
- 让首页和 Header 的现有状态成为新页面的组成部分，而不是覆盖它们。
- 使用稳定的 max-width 与内容行长，桌面和移动端都保持可读。
- 同时实现 hover、focus-visible、active/pressed 和 reduced-motion 所需的可见状态。
- 对图片、视频和模型设置加载、失败、空数据和 API 不可用时的可理解反馈。
- 复用 `useScrollReveal` 的 IntersectionObserver 思路，避免为每个页面重复造滚动监听器。
- 先检查当前工作区和现有差异，再做局部改动；把实现范围、验证结果和未验证项写入交付说明。

## Don'ts

- 不要未经确认把外部 Apple 的 `#0066cc`、SF Pro、零阴影规则直接替换进本项目。
- 不要新增第二套品牌 accent；社交平台色只限于对应社交入口。
- 不要为普通卡片、文字或按钮堆叠阴影、发光和玻璃效果。
- 不要新增装饰性大渐变；不要移除现有功能性 Hero 遮罩而只留下不可读图片。
- 关于与留言页面禁止使用灰色正文、灰色编号和低对比辅助文字；重要信息统一使用主题主文字层级。
- 关于与留言页面禁止使用英文小标签或英文装饰性小字；非必要的英文内容直接删除或改为中文。
- 不要加入无意义的解释性副标题、页眉说明或仅为装饰存在的注释；信息层级交给标题、留白和真实内容。
- 不要在错误提示、模块标题或模块之间放置紧邻的细分隔线、连接线或紫色侧线。
- 不要把正文普遍设置成 500；500 只保留在当前 Hero title 或确有语义的 metadata 场景。
- 不要混用大量接近的圆角，也不要给全宽 Hero、波浪和页面大区强行加卡片圆角。
- 不要把桌面 hover 当成移动端唯一交互，也不要在移动端通过禁用页面手势来解决模型旋转问题。
- 不要默认加载头像来替代模型 loading 状态；不要在失败前闪现错误内容。
- 不要关闭模型内置动画，不要用固定缩放代替包围盒/包围球计算，不要遗漏 glTF 的 `.bin` 或纹理资源。
- 不要引入整个 3D 作品集、300MB 级资源、额外路由或无关依赖来完成一个局部视觉需求。
- 不要假设存在独立 `/about` 页面；本项目关于/留言相关内容以实际路由和当前 checkout 为准，当前 `/message` 是重要入口。
- 不要在没有明确需求时重做留言页、导航结构、SEO、API 或后台字段；设计文档中的延展规则不等于立即实施。
- 不要使用 `git reset --hard`、`git clean` 或清理用户未提交的修改来“整理”工作区。
- 不要把无关文件、构建产物、`dist`、密钥或环境文件一起提交；提交前只暂存目标文件并检查 staged diff。

## Accessibility and Resilience

- Logo、品牌按钮、搜索、订阅、主题切换和返回顶部都必须有可理解的 accessible name。
- 菜单使用 `aria-expanded`、`aria-controls` 或等价语义；路由切换后关闭临时菜单。
- Feature tabs 保持 `role=tablist`、`role=tab` 和 `aria-selected` 的一致性，并补齐键盘操作验收。
- 文本与背景在 midnight-blue 和 blue-white 两个主题下都要检查对比度。
- 首屏视频失败、API 请求失败、图片不存在、模型加载失败时，页面仍应保留结构、文字和可继续浏览的路径。
- 不以“端口正在监听”作为唯一运行证明；至少用真实 HTTP 请求或浏览器确认页面可访问。

## Iteration Guide

1. 先指出要延展的现有组件：例如 `header-island-state`、`article-card` 或 `feature-panel`。
2. 查阅对应源码和当前 CSS token，确认这是当前实现、已知缺口还是新建议。
3. 优先复用已有 token、容器、组件和 composable；只有现有抽象不足时才增加新 token。
4. 先实现一个页面区域，随后在 midnight-blue、blue-white、桌面、移动端和 reduced-motion 下检查。
5. 验证 loading、empty、error、keyboard focus、真实图片/视频/模型失败状态。
6. 运行项目已有的构建或检查命令，并执行 `git diff --check`。
7. 报告目标、已完成、修改文件、已验证、未完成、风险和回滚方式；不要把设计建议写成已完成能力。

## Acceptance Checklist

### Visual

- [ ] 新页面使用正确的主题变量，没有散落的硬编码品牌颜色。
- [ ] Header 在顶部、向下滚动、向上滚动三种状态都不遮挡核心内容。
- [ ] 首页延展区域的宽度、留白、圆角和图片裁切与现有系统一致。
- [ ] 移动端不出现横向溢出；操作区域可触摸，文本可读。

### Interaction

- [ ] 主导航、品牌菜单、文章下拉、主题、搜索和订阅在鼠标与键盘下都可用。
- [ ] Feature/tab 类交互有正确活动态和焦点态。
- [ ] reduced-motion 下内容不消失，持续运动被取消或降级。
- [ ] 异步数据和媒体都有 loading、empty、error 或 fallback 反馈。

### Engineering

- [ ] 没有引入完整 3D 作品集、300MB 级资源或不必要依赖。
- [ ] 客户端能力不会在 SSR 阶段访问 `window`、`document` 或 WebGL。
- [ ] 资源来源与许可证已记录，模型关联文件完整。
- [ ] 只修改需求范围内的文件；未提交的无关改动得到保留。
- [ ] `npm run build`、相关测试或真实浏览器检查的结果已区分记录。

## Known Gaps

- 当前 Header 在 `≤768px` 会隐藏主导航和 island 内部链接，但项目没有在本文件中假设已有 hamburger；如果要补移动导航，需要单独定义抽屉、焦点管理和关闭行为。
- 首页与 Footer 的部分颜色、阴影和字号仍以组件内 scoped CSS 为主，尚未完全抽成统一 token；新增组件应先复用语义变量，不要扩大重复。
- 当前文章卡片仍使用现有的 hover 缩放和图片渐变，后续如要对齐更极简的外部参考，需要单独做视觉决策，不能在普通修复中顺手删除。
- API、真实评论数据、模型 CDN、授权资源和生产环境图片的可用性需要运行时分别验证；本设计文档不等于后端或生产验收证明。
- Feature tabs 已有基础 ARIA 语义，但完整的键盘方向键、焦点循环和屏幕阅读器体验仍应在实现具体改动时验证。
- 设计文档描述的是当前 checkout 与允许的延展边界；如果首页或 Header 后续发生结构性改动，应同步更新 `source_of_truth`、token、响应式和 Known Gaps。
