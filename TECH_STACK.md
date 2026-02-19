# TECH_STACK - 技术栈

## 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js (App Router) | ^16.x | 全栈 React 框架 |
| TypeScript | ^5.x | 类型安全 |
| React | ^19.x | UI 库 |
| Node.js | ^20.x | 运行时 |

## 样式与 UI

| 技术 | 版本 | 用途 |
|------|------|------|
| Tailwind CSS | ^4.x | 实用优先 CSS 框架 |
| next-themes | ^0.x | 明暗主题切换 |
| Lucide React | latest | 图标库 |
| Noto Sans SC | - | 中文字体 (Google Fonts) |
| Inter | - | 英文字体 (Google Fonts) |
| JetBrains Mono | - | 代码字体 (Google Fonts) |

## 内容编辑

| 技术 | 版本 | 用途 |
|------|------|------|
| @tiptap/react | ^2.x | 富文本编辑器核心 |
| @tiptap/starter-kit | ^2.x | 基础扩展包 |
| @tiptap/extension-link | ^2.x | 链接扩展 |
| @tiptap/extension-image | ^2.x | 图片扩展 |
| @tiptap/extension-code-block-lowlight | ^2.x | 代码块扩展 |
| @tiptap/extension-table | ^2.x | 表格扩展 |
| @tiptap/extension-table-row | ^2.x | 表格行 |
| @tiptap/extension-table-cell | ^2.x | 表格单元格 |
| @tiptap/extension-table-header | ^2.x | 表格表头 |
| @tiptap/extension-placeholder | ^2.x | 占位符 |
| @tiptap/extension-heading | ^2.x | 标题扩展 |
| @tiptap/extension-mathematics | ^2.x | KaTeX 数学公式 |
| lowlight | latest | 代码语法高亮引擎 |
| katex | latest | 数学公式渲染 |

## 数据库与 ORM

| 技术 | 版本 | 用途 |
|------|------|------|
| MySQL | ^8.x | 关系型数据库 |
| Prisma | ^6.x | TypeScript ORM |

## 认证

| 技术 | 版本 | 用途 |
|------|------|------|
| NextAuth.js (Auth.js) | ^5.x | 认证框架 |
| bcryptjs | latest | 密码哈希 |

## 国际化

| 技术 | 版本 | 用途 |
|------|------|------|
| next-intl | ^4.x | Next.js 国际化 |

## 功能依赖

| 技术 | 版本 | 用途 |
|------|------|------|
| FlexSearch | ^0.7.x | 客户端全文搜索引擎 |
| D3.js | ^7.x | 知识图谱力导向图可视化 |
| Giscus | latest | 基于 GitHub Discussions 的评论系统 |
| feed | ^4.x | RSS Feed 生成 |
| gray-matter | ^4.x | Frontmatter 解析（兼容性保留） |

## 开发工具

| 技术 | 版本 | 用途 |
|------|------|------|
| ESLint | latest | 代码检查 |
| Prettier | latest | 代码格式化 |
| pnpm | ^9.x | 包管理器 |

## 部署与运维

| 技术 | 版本 | 用途 |
|------|------|------|
| Docker | latest | 容器化 |
| docker-compose | latest | 多容器编排 |
| CasaOS | - | 自托管平台 |
| Gitea Actions | - | CI/CD 自动部署 |

## 代码托管

| 平台 | 用途 |
|------|------|
| Gitea (git.stibiums.top) | 主仓库，触发 Gitea Actions 自动部署 |
| GitHub | 镜像仓库，用于 Giscus 评论 (GitHub Discussions) |
