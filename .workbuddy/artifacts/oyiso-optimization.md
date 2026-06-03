# 参考 oyiso.cn 界面优化报告

**时间**: 2026-06-01  
**参考站**: https://oyiso.cn/  
**核心理念**: 极简主义、内容优先、社交属性增强

---

## 参考分析摘要

| 维度 | oyiso.cn | 小羊嚣张（优化前） | 优化后 |
|------|----------|-------------------|--------|
| Hero 社交链接 | GitHub/B站/网易云等7平台 | 无 | ✅ 4平台图标行 |
| Footer 信息密度 | 统计+版权+许可 | 简单版权行 | ✅ 统计网格+社交+完整底部 |
| 圆角风格 | 中等圆角 | 30px大圆角卡片 | ✅ 统一15px |
| 主题切换 | Light/Dark/Auto | 双主题 | 保持（已有View Transitions） |
| Feature Tabs | 7个Tab | 5个Tab | 保持（功能对齐） |

---

## 改动清单

### 1. 圆角全局统一（15px左右）
| 文件 | 改动 |
|------|------|
| `about.vue` | 16px → 14px |
| `friends.vue` | 16px → 14px |
| `message.vue` | 16px → 14px |

### 2. Hero 社交链接行（index.vue）
- **新增图标**: GitHub (mdi), B站 (ri), 网易云 (ri), 邮箱 (material-symbols)
- **样式**: 44px圆形半透明按钮，hover 品牌蓝色高亮 + 上浮
- **数据源**: basicSettings (basic.github / basic.bilibili / basic.netease / basic.email)
- **条件渲染**: hasSocials 控制整行显隐
- **响应式**: 手机端 38px

### 3. Footer 重构（Footer.vue）
- **品牌区**: 头像+名+tagline「让美好持续发生」+ 社交图标
- **统计格**: 文章数 / 运行天数 / 许可协议（三栏网格）
- **底部**: Copyright + ICP备案 + Powered by
- **样式**: 上下border分隔统计区，整体三段垂直布局

---

## 构建验证
- `npx nuxi prepare` ✅ 类型生成通过
- 所有修改使用 CSS 变量，双主题自动适配
