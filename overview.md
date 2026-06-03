# UI 主题优化报告

## 修改摘要

针对用户要求，完成了三项核心优化：蓝色还原、纯白文字、主题切换丝滑度。

---

## 1. 品牌色还原为纯蓝色

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| 暗色主题 brand-accent | `#84dfff`（cyan 偏青） | `#60a5fa`（blue-400 纯蓝） |
| 暗色主题 hover | `#67a8e4` | `#3b82f6`（blue-500） |
| 亮色主题 brand-accent | `#2563eb` | `#3b82f6`（blue-500 更亮） |
| 亮色主题 hover | `#1d4ed8` | `#2563eb`（blue-600） |
| Header logo glow | `rgba(132,223,255,0.18)` 等 | `rgba(96,165,250,0.18)` 等 |
| LoginDilog focus ring | `rgba(103,168,228,0.42)` 等 | `var(--brand-accent)` + `var(--brand-accent-soft)` |

## 2. 文字纯白色化

- `--home-text`: `#f5f5f5` → `#ffffff`
- `--comment-input-text`: `#e5e5e5` → `#ffffff`
- `--text-primary` 本来就是 `#ffffff`，无需改动

## 3. 主题切换丝滑度

### CSS 层
```css
html {
  transition: background-color 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              color 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### View Transitions API（Header.vue）
- 支持 `document.startViewTransition()` 的浏览器：交叉淡化动画（0.45s fade-in）
- 不支持的浏览器：回退到 CSS transition
- `prefers-reduced-motion` 时禁用所有动画

---

## 修改文件清单

| 文件 | 改动内容 |
|------|----------|
| `app/assets/css/main.scss` | 品牌色 + 纯白文字 + html 过渡 + View Transition CSS |
| `app/components/layouts/Header.vue` | View Transitions API + 清理硬编码 glow |
| `app/components/layouts/LoginDilog.vue` | focus ring 改用 CSS 变量 |

## 验证结果

- TypeScript 类型生成：✅ 通过
- Nuxt dev server：✅ HTTP 200 正常响应
