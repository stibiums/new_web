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
| @yoopta/editor | ^6.0.0-beta | Yoopta 富文本编辑器核心 |
| @yoopta/paragraph | ^6.0.0-beta | 段落插件 |
| @yoopta/headings | ^6.0.0-beta | 标题插件 (H1-H3) |
| @yoopta/lists | ^6.0.0-beta | 列表插件 (有序/无序/待办) |
| @yoopta/blockquote | ^6.0.0-beta | 引用块 |
| @yoopta/callout | ^6.0.0-beta | 提示框 |
| @yoopta/code | ^6.0.0-beta | 代码块 |
| @yoopta/image | ^6.0.0-beta | 图片 (自定义上传) |
| @yoopta/video | ^6.0.0-beta | 视频嵌入 |
| @yoopta/embed | ^6.0.0-beta | 通用嵌入 |
| @yoopta/file | ^6.0.0-beta | 文件附件 |
| @yoopta/table | ^6.0.0-beta | 表格 |
| @yoopta/accordion | ^6.0.0-beta | 手风琴/折叠 |
| @yoopta/tabs | ^6.0.0-beta | 选项卡 |
| @yoopta/steps | ^6.0.0-beta | 步骤 |
| @yoopta/divider | ^6.0.0-beta | 分隔线 |
| @yoopta/link | ^6.0.0-beta | 链接插件 |
| @yoopta/mention | ^6.0.0-beta | @提及 |
| @yoopta/emoji | ^6.0.0-beta | 表情符号 |
| @yoopta/carousel | ^6.0.0-beta | 图片轮播 |
| @yoopta/table-of-contents | ^6.0.0-beta | 目录 |
| @yoopta/marks | ^6.0.0-beta | 文本标记 (粗体/斜体/下划线/删除线/代码/高亮) |
| @yoopta/themes-shadcn | ^6.0.0-beta | shadcn 风格主题 |
| @yoopta/ui | ^6.0.0-beta | UI 组件 (浮动工具栏/斜杠菜单等) |
| slate | ^0.123.0 | 编辑器底层引擎 |
| slate-react | ^0.123.0 | React 绑定 |
| slate-dom | ^0.123.0 | DOM 绑定 |

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
