# 全面对齐 oyiso.cn 设计风格 — 完成报告

**时间**: 2026-06-01  
**参考**: https://oyiso.cn/ (Oyiso's Theme v1.5.2)  
**构建**: npx nuxi prepare ✅

---

## 改动总览

### 🎨 配色全面对齐

| Token | 改前 | 改后 | 来源 |
|-------|------|------|------|
| 品牌色 | `#60a5fa` 🔵 | `#8183ff` 🟣 | oyiso `--theme-color-pri` |
| 暗色背景 | `#000000` | `#0e0e0e` | oyiso `--html` 暗色 |
| 卡片背景 | `#141414` | `#171717` | oyiso `--bgc-box` |
| 亮色背景 | `#f5f5f5` | `#fafafa` | oyiso `--container` |
| 阴影 | `0 18px 40px rgba(0,0,0,.32)` | `0 0 10px rgba(0,0,0,.08)` | oyiso 极轻阴影 |
| 缓动 | `cubic-bezier(.16,1,.3,1)` | `cubic-bezier(.345,.045,.345,1)` | oyiso 全站统一 |
| 边框色 | `rgba(255,255,255,.08)` | `#262626` | oyiso `--border-box` |

### 🧩 UI 细节对齐

| 组件 | 改动 |
|------|------|
| **Header** | 毛玻璃 `blur(15px)`，背景 `rgba(23,23,23,0.7)`，亮色导航 #555 |
| **mini-logo** | glow 从 20px→10px，品牌色对齐 #8183ff |
| **文章卡片** | 去 radial-gradient 装饰，hover 上浮 4px |
| **弹窗** | 遮罩更轻，阴影极小 |
| **下拉菜单** | 阴影从 14px 30px → 0 0 10px |
| **返回顶部** | 阴影轻量化 |

### 📁 改动文件

| 文件 | 类型 |
|------|------|
| `app/assets/css/main.scss` | 配色 & token 大改 |
| `app/components/layouts/Header.vue` | 毛玻璃、glow、导航色 |
| `app/components/articles/ArticleMasonryFeed.vue` | 卡片简化 |
| `app/components/layouts/LoginDilog.vue` | 阴影轻量 |
| `app/layouts/default.vue` | 返回顶部阴影 |
