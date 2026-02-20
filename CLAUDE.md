# CLAUDE.md - 项目操作手册

## 项目结构

```
new_web/                     # 项目根目录
├── src/                     # Next.js 应用源码 (create-next-app 初始化)
├── .claude/                 # Claude Code 配置
├── .git/                    # Git 仓库
├── PRD.md                   # 产品需求文档
├── APP_FLOW.md              # 用户流程
├── TECH_STACK.md            # 技术栈
├── FRONTEND_GUIDELINES.md   # 设计系统
├── BACKEND_STRUCTURE.md     # 后端结构
├── IMPLEMENTATION_PLAN.md   # 实施计划
├── CLAUDE.md                # 本文件
└── progress.txt             # 进度追踪
```

---

## 项目概述

个人学术网站 (stibiums.top) 的全栈重构项目，基于 Next.js 16 + TypeScript + Tailwind CSS。

- **内容管理**: 数据库存储 (MySQL + Prisma)，后台 Tiptap 富文本编辑器
- **前台展示**: 首页、博客、笔记、项目、出版物、简历、知识图谱
- **特色功能**: 全文搜索、知识图谱、评论、RSS、点赞统计
- **部署**: Docker → CasaOS，Gitea Actions 自动部署

---

## 技术栈速查

- **框架**: Next.js 16 (App Router) + TypeScript
- **样式**: Tailwind CSS 4 + CSS 变量主题
- **数据库**: MySQL 8 + Prisma 6
- **认证**: NextAuth.js v5 (Credentials)
- **编辑器**: Yoopta Editor v6 (beta) + Slate.js
- **国际化**: next-intl
- **搜索**: FlexSearch
- **图谱**: D3.js
- **评论**: Giscus
- **包管理**: pnpm

---

## 代码规范

### TypeScript
- strict 模式
- 函数式 React 组件，使用箭头函数
- 接口命名: `IPost`, `IProject`，或 `PostProps`, `ProjectCardProps`
- 类型文件: `src/types/` 目录

### 组件
- 函数式组件 + hooks
- 文件命名: PascalCase (如 `PostCard.tsx`)
- 目录按功能分组: layout/, ui/, editor/, content/, search/, graph/
- 一个文件一个组件（小型辅助组件可例外）

### 命名约定
- 文件/目录: kebab-case (API routes, pages)
- 组件: PascalCase
- 函数/变量: camelCase
- 常量: UPPER_SNAKE_CASE
- CSS 变量: kebab-case (--primary-hover)

---

## 文件结构

```
src/
├── app/[locale]/          # 页面路由
│   ├── admin/             # 管理后台
│   └── (前台页面)/
├── app/api/               # API Route Handlers
├── components/            # React 组件
│   ├── layout/            # Header, Footer, AdminSidebar
│   ├── ui/                # 通用 UI (Button, Card, Tag, Input...)
│   ├── editor/            # Yoopta 编辑器相关
│   ├── content/           # 内容渲染 (TiptapRenderer/Yoopta readOnly)
│   ├── search/            # 搜索组件
│   └── graph/             # 知识图谱
├── lib/                   # 工具函数
│   ├── prisma.ts          # Prisma Client 单例
│   ├── auth.ts            # NextAuth 配置
│   ├── search.ts          # 搜索索引
│   └── utils.ts           # 通用工具
├── i18n/                  # 国际化
│   ├── messages/          # zh.json, en.json
│   ├── config.ts
│   └── request.ts
├── types/                 # TypeScript 类型定义
└── styles/
    └── globals.css        # Tailwind + CSS 变量
```

---

## 内容格式

### Yoopta JSON

所有富文本内容以 Yoopta JSON 格式 (`Record<string, YooptaBlockData>`) 存储在数据库 `content` 字段中。

前台渲染方式:
1. 从数据库读取 JSON 字符串
2. 使用 `createYooptaEditor({ readOnly: true })` 创建只读编辑器实例
3. 通过 TiptapRenderer 组件（已重写为 Yoopta 渲染）直接渲染

编辑器组件:
- `plugins.ts` - 插件配置 (20+ 插件 + applyTheme)
- `YooptaEditorWrapper.tsx` - 编辑器主组件 (含浮动工具栏、斜杠菜单等)

### 双语内容

每个内容模型有中英文字段对:
- `title` / `titleEn`
- `content` / `contentEn`
- `excerpt` / `excerptEn`

前台根据当前 locale 选择对应字段，英文字段为空时 fallback 到中文。

---

## API 约定

### 路径命名
- 公开 API: `/api/{resource}` (如 `/api/posts`, `/api/views/[slug]`)
- 管理 API: `/api/admin/{resource}` (如 `/api/admin/posts`)

### 响应格式
```typescript
// 成功
{ data: T }
// 列表
{ data: T[], total: number, page: number, limit: number }
// 错误
{ error: string }
```

### 认证检查
管理 API 统一使用 `getServerSession()` 检查，未认证返回 401。

---

## i18n 翻译键约定

```
{namespace}.{section}.{key}

示例:
nav.home, nav.blog, nav.notes
home.title, home.subtitle, home.skills
blog.title, blog.noResults
admin.posts.title, admin.posts.create
common.search, common.loading, common.error
```

---

## Git 提交规则

**每完成一个小任务后必须立即进行 git 提交。** 不要积攒多个任务再一起提交。

- 提交粒度：一个功能点/步骤 = 一次提交
- 使用 conventional commits 格式：`type(scope): 描述`
- 添加文件时使用 `git add <具体文件>` 而非 `git add .`
- **每次 git 提交完成后，必须清空上下文 (/compact)**
- 示例：
  - `feat(init): 初始化 Next.js 项目`
  - `feat(i18n): 配置 next-intl 国际化`
  - `feat(db): 添加 Prisma schema 和 MySQL docker-compose`
  - `feat(admin): 实现 Tiptap 富文本编辑器`

---

## 常用命令

```bash
# 开发 (在 src 目录下执行)
cd src
pnpm dev                    # 启动开发服务器
pnpm build                  # 生产构建
pnpm lint                   # 代码检查
pnpm format                 # 代码格式化

# 数据库 (在 src 目录下执行)
cd src
pnpm prisma migrate dev     # 开发迁移
pnpm prisma migrate deploy  # 生产迁移
pnpm prisma studio          # 数据库 GUI
pnpm prisma db seed         # 运行 seed

# Docker
docker compose up -d        # 启动 MySQL
docker compose up --build   # 构建并启动全部
docker compose down         # 停止

# Git
git remote add gitea https://git.stibiums.top/stibiums/new_web.git
git remote add github https://github.com/stibiums/new_web.git
```

---

## 环境变量

```env
# 数据库
DATABASE_URL="mysql://user:password@localhost:3306/stibiums_web"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# 管理员初始账号 (seed 用)
ADMIN_EMAIL="admin@stibiums.top"
ADMIN_PASSWORD="your-admin-password"

# Giscus
NEXT_PUBLIC_GISCUS_REPO="stibiums/new_web"
NEXT_PUBLIC_GISCUS_REPO_ID=""
NEXT_PUBLIC_GISCUS_CATEGORY=""
NEXT_PUBLIC_GISCUS_CATEGORY_ID=""
```
