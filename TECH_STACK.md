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

## 内容管理

| 技术 | 版本 | 用途 |
|------|------|------|
| @monaco-editor/react | ^4.x | Monaco Editor (VS Code 内核) |
| react-markdown | ^6.x | Markdown 渲染组件 |
| remark-gfm | latest | GitHub Flavored Markdown 支持 |
| gray-matter | ^4.x | Front Matter 解析 |

## 内容存储

| 技术 | 用途 |
|------|------|
| 文件系统 (content/) | Markdown 文件存储目录 |
| Git | 版本管理（自动提交推送） |
| public/assets/ | 静态资源（图片、Jupyter、PDF、视频） |

## 数据库与 ORM

| 技术 | 版本 | 用途 |
|------|------|------|
| MySQL | ^8.x | 关系型数据库 |
| Prisma | ^6.x | TypeScript ORM |

## 认证

| 技术 | 版本 | 用途 |
|------|------|------|
| NextAuth.js (Auth.js) | ^5.x | 认证框架 |
| @auth/prisma-adapter | ^2.x | Prisma 适配器 |
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
