# FRONTEND_GUIDELINES - 前端设计规范

## 设计风格

**简约学术风** — 干净、现代、专业，注重内容可读性，减少视觉干扰。

---

## 配色方案

使用 CSS 变量实现主题切换。

### 亮色模式

| 变量 | 值 | 用途 |
|------|------|------|
| --background | #FAFAFA | 页面背景 |
| --foreground | #1A1A2E | 主文字颜色 |
| --primary | #4A3AFF | 主色调（链接、按钮、强调） |
| --primary-hover | #3A2AEF | 主色 hover |
| --secondary | #6C63FF | 辅助色 |
| --muted | #F1F0FB | 低调背景（标签、代码块背景） |
| --muted-foreground | #64748B | 次要文字 |
| --border | #E2E8F0 | 边框 |
| --card | #FFFFFF | 卡片背景 |
| --accent | #F59E0B | 强调色（警告、特殊标注） |
| --destructive | #EF4444 | 危险操作 |
| --success | #22C55E | 成功状态 |

### 暗色模式

| 变量 | 值 | 用途 |
|------|------|------|
| --background | #0F0F23 | 页面背景 |
| --foreground | #E2E8F0 | 主文字 |
| --primary | #7C6AFF | 主色调 |
| --primary-hover | #9B8FFF | 主色 hover |
| --secondary | #8B7FFF | 辅助色 |
| --muted | #1E1E35 | 低调背景 |
| --muted-foreground | #94A3B8 | 次要文字 |
| --border | #2D2D44 | 边框 |
| --card | #1A1A2E | 卡片背景 |
| --accent | #FBBF24 | 强调色 |

---

## 字体系统

| 用途 | 字体 | 字重 |
|------|------|------|
| 中文正文 | Noto Sans SC | 400 (Regular), 500 (Medium), 700 (Bold) |
| 英文正文 | Inter | 400, 500, 600, 700 |
| 代码 | JetBrains Mono | 400, 500 |

### 字号

| 元素 | 大小 | 行高 |
|------|------|------|
| body | 16px (1rem) | 1.75 |
| h1 | 2.5rem | 1.2 |
| h2 | 2rem | 1.3 |
| h3 | 1.5rem | 1.4 |
| h4 | 1.25rem | 1.5 |
| small | 0.875rem | 1.5 |
| code | 0.9rem | 1.6 |

---

## 间距系统

基于 Tailwind 默认间距 (4px 基准)。

| 用途 | 值 |
|------|------|
| 页面内边距 (移动) | px-4 (16px) |
| 页面内边距 (平板) | px-8 (32px) |
| 页面内边距 (桌面) | px-16 (64px) |
| 内容最大宽度 (文章) | max-w-4xl (896px) |
| 内容最大宽度 (列表) | max-w-6xl (1152px) |
| 区块间距 | space-y-8 (32px) |
| 组件间距 | space-y-4 或 gap-4 (16px) |
| 卡片内边距 | p-6 (24px) |

---

## 组件规范

### Button
- 圆角: rounded-lg
- 内边距: px-4 py-2
- 变体: primary (实心) / outline (边框) / ghost (无边框)
- Hover: 渐变过渡 transition-colors duration-200

### Card
- 圆角: rounded-xl
- 阴影: shadow-sm
- 边框: border border-border
- Hover: shadow-md, 轻微上移 -translate-y-0.5
- 过渡: transition-all duration-200

### Tag / Badge
- 圆角: rounded-full
- 内边距: px-3 py-1
- 字号: text-sm
- 背景色: 按分类区分颜色

### Input
- 圆角: rounded-lg
- 边框: border border-border
- Focus: ring-2 ring-primary/50
- 内边距: px-3 py-2

### Header / 导航
- 固定顶部: sticky top-0
- 背景: backdrop-blur-lg + 半透明
- 高度: h-16
- z-index: z-50

---

## 响应式断点

| 断点 | 宽度 | 用途 |
|------|------|------|
| 默认 | < 640px | 手机竖屏 |
| sm | >= 640px | 手机横屏 |
| md | >= 768px | 平板 |
| lg | >= 1024px | 小桌面 |
| xl | >= 1280px | 桌面 |

**Mobile-first 设计**：所有样式默认为移动端，通过 sm: md: lg: xl: 前缀逐步增强。

---

## 动画规范

- 默认过渡: transition-all duration-200 ease-in-out
- 页面切换: 无额外动画（依赖 Next.js 路由）
- 组件交互: hover/focus 状态使用 200ms 过渡
- 搜索 Modal: 淡入淡出 + 轻微缩放
- 避免过度动画，保持学术风格的克制感

---

## 图片规范

- 使用 next/image 组件自动优化
- 默认懒加载
- 首屏关键图片设置 priority
- 头像: 圆形 rounded-full
- 项目封面: 16:9 比例 aspect-video
- 响应式: 使用 sizes 属性适配不同屏幕
