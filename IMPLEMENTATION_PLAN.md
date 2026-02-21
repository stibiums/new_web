# IMPLEMENTATION_PLAN - 实施计划

## 阶段 1：项目初始化

- [ ] 1.1 使用 pnpm create next-app 初始化项目 (TypeScript, Tailwind, App Router, ESLint, src/)
- [ ] 1.2 安装所有依赖包
- [ ] 1.3 配置 Tailwind CSS 主题 (CSS 变量、暗色模式、自定义颜色、字体)
- [ ] 1.4 配置 next-intl (middleware, routing, [locale] 动态路由, zh.json/en.json)
- [ ] 1.5 配置 next-themes (ThemeProvider, 明暗切换)
- [ ] 1.6 创建根布局 (RootLayout) 和 [locale] 布局 (字体加载, metadata)
- [ ] 1.7 配置 .gitignore, .env.example

## 阶段 2：数据库与认证

- [ ] 2.1 编写 docker-compose.yml (MySQL 服务)
- [ ] 2.2 Prisma 初始化 (prisma init, 配置 datasource)
- [ ] 2.3 编写 Prisma Schema (所有模型)
- [ ] 2.4 运行 Prisma 迁移 (prisma migrate dev)
- [ ] 2.5 配置 Prisma Client 单例 (src/lib/prisma.ts)
- [ ] 2.6 配置 NextAuth.js (Credentials Provider, JWT, middleware)
- [ ] 2.7 编写管理员 seed 脚本 (prisma/seed.ts)

## 阶段 3：基础组件

- [ ] 3.1 Header 组件 (Logo, 导航菜单, 语言切换, 主题切换, 搜索按钮)
- [ ] 3.2 移动端 Header (汉堡菜单, 抽屉导航)
- [ ] 3.3 Footer 组件 (社交链接, 版权信息)
- [ ] 3.4 通用 UI 组件: Button (primary/outline/ghost)
- [ ] 3.5 通用 UI 组件: Card, Tag/Badge
- [ ] 3.6 通用 UI 组件: Input, Textarea, Select
- [ ] 3.7 通用 UI 组件: Skeleton (加载骨架屏)
- [ ] 3.8 通用 UI 组件: Toast (通知提示)

## 阶段 4：Monaco Editor + Git + 数据库双写

本阶段实现 Monaco Editor 编辑器、Git 版本管理和文件-数据库双写同步。

### 4.1 环境准备

- [ ] 4.1.1 创建 content/ 目录结构 (posts/, notes/, projects/)
- [ ] 4.1.2 创建 public/assets/ 目录结构 (img/, jupyter/, video/, pdf/)
- [ ] 4.1.3 安装依赖: pnpm add @monaco-editor/react react-markdown remark-gfm gray-matter

### 4.2 数据库 Schema 调整

- [ ] 4.2.1 修改 prisma/schema.prisma: Post 模型添加 filePath 字段 (String, 非空)
- [ ] 4.2.2 修改 prisma/schema.prisma: Post 模型添加 gitCommit 字段 (String, 可空)
- [ ] 4.2.3 修改 prisma/schema.prisma: Project 模型添加 filePath, gitCommit 字段
- [ ] 4.2.4 运行 pnpm prisma migrate dev 创建迁移

### 4.3 Markdown 文件工具

- [ ] 4.3.1 创建 src/lib/markdown-file.ts: readMarkdownFile(filePath) 读取文件
- [ ] 4.3.2 创建 src/lib/markdown-file.ts: writeMarkdownFile(filePath, content) 写入文件
- [ ] 4.3.3 创建 src/lib/markdown-file.ts: parseFrontMatter(content) 解析 Front Matter
- [ ] 4.3.4 创建 src/lib/markdown-file.ts: buildFrontMatter(meta) 生成 Front Matter

### 4.4 Git 版本管理工具

- [ ] 4.4.1 创建 src/lib/git.ts: gitAdd(filePath) git add 单文件
- [ ] 4.4.2 创建 src/lib/git.ts: gitCommit(message) git commit
- [ ] 4.4.3 创建 src/lib/git.ts: gitPush() git push
- [ ] 4.4.4 创建 src/lib/git.ts: gitPull() git pull
- [ ] 4.4.5 创建 src/lib/git.ts: getCurrentCommit() 获取当前 commit hash
- [ ] 4.4.6 创建 src/lib/git.ts: autoCommit(filePath) 自动生成提交信息并提交

### 4.5 数据同步服务

- [ ] 4.5.1 创建 src/lib/sync.ts: syncPostToDatabase(filePath) 单文件同步
  - 读取 Markdown 文件
  - 解析 Front Matter (title, tags, category, date, published)
  - 提取正文 content
  - 更新/创建 Post 数据库记录
- [ ] 4.5.2 创建 src/lib/sync.ts: syncProjectToDatabase(filePath) 项目同步
- [ ] 4.5.3 创建 src/lib/sync.ts: syncAllContent() 批量同步所有内容
- [ ] 4.5.4 创建 src/lib/sync.ts: syncNoteToDatabase(filePath, category) 笔记同步

### 4.6 Monaco Editor 组件

- [ ] 4.6.1 创建 src/components/editor/MonacoMarkdownEditor.tsx
  - 集成 @monaco-editor/react
  - 设置 language: markdown
  - 设置 theme: vs-dark / vs-light (根据主题切换)
- [ ] 4.6.2 添加 Ctrl+S 保存快捷键处理
- [ ] 4.6.3 添加自动保存逻辑 (debounce)
- [ ] 4.6.4 添加文件内容加载逻辑 (props.content)

### 4.7 Markdown 渲染组件

- [ ] 4.7.1 创建 src/components/content/MarkdownRenderer.tsx
  - 使用 react-markdown 渲染
  - 添加 remark-gfm 支持 (表格、任务列表等)
  - 支持代码高亮 (可选: react-syntax-highlighter)
- [ ] 4.7.2 创建 src/components/content/MarkdownViewer.tsx (只读视图)

### 4.8 管理 API 改造

- [ ] 4.8.1 改造 POST /api/admin/posts: 保存时写入文件 + 同步数据库 + Git 提交
- [ ] 4.8.2 改造 PUT /api/admin/posts/[id]: 更新文件 + 同步数据库 + Git 提交
- [ ] 4.8.3 改造 DELETE /api/admin/posts/[id]: 删除文件 + Git 提交
- [ ] 4.8.4 新增 GET /api/admin/posts/[id]/content: 获取文件内容 (给编辑器用)
- [ ] 4.8.5 同样改造 notes 和 projects 的 API

### 4.9 后台编辑页面

- [ ] 4.9.1 改造文章编辑页: 用 MonacoMarkdownEditor 替换原有编辑器
- [ ] 4.9.2 添加保存时的加载状态和成功/错误提示
- [ ] 4.9.3 同样改造笔记编辑页和项目编辑页

### 4.10 图片/资源上传

- [ ] 4.10.1 保留图片上传 API: POST /api/admin/upload
- [ ] 4.10.2 上传后的资源存储在 public/uploads/ 目录

### 4.11 文章/笔记/项目管理页面

- [ ] 4.11.1 文章列表页: 搜索、筛选、分页 (从数据库查询)
- [ ] 4.11.2 文章新建页: 元信息表单 + Monaco Editor
- [ ] 4.11.3 笔记管理: CRUD + 分类选择
- [ ] 4.11.4 项目管理: CRUD
- [ ] 4.11.5 出版物管理: CRUD
- [ ] 4.11.6 统计仪表盘
- [ ] 4.11.7 站点设置页
- [ ] 4.11.8 Admin 布局 (侧边栏导航, 认证保护)

## 阶段 4'：旧内容迁移

- [ ] 4'.1 创建导入脚本 (scripts/import-legacy.ts)
- [ ] 4'.2 解析旧站 _posts/ 目录，复制到 content/posts/
- [ ] 4'.3 解析旧站 _notes/ 目录，复制到 content/notes/
- [ ] 4'.4 解析旧站 _projects/ 目录，复制到 content/projects/
- [ ] 4'.5 迁移 assets/img/ 到 public/assets/img/
- [ ] 4'.6 迁移 assets/jupyter/ 到 public/assets/jupyter/
- [ ] 4'.7 迁移 assets/video/ 到 public/assets/video/
- [ ] 4'.8 迁移 assets/pdf/ 到 public/assets/pdf/
- [ ] 4'.9 创建数据库记录 (slug, title, filePath, tags, category)
- [ ] 4'.10 初始 Git 提交

## 阶段 5：前台页面

- [ ] 5.1 首页: 个人简介区域 (头像、姓名、身份、简介)
- [ ] 5.2 首页: 技能标签云
- [ ] 5.3 首页: 最近动态/时间线
- [ ] 5.4 首页: 社交链接
- [ ] 5.5 博客列表页: 文章卡片、标签筛选、分页
- [ ] 5.6 博客详情页: 读取 Markdown 文件并渲染、目录 TOC
- [ ] 5.7 博客详情页: 上下篇导航、分享按钮
- [ ] 5.8 笔记列表页: 按课程分类分组、侧边栏导航
- [ ] 5.9 笔记详情页: 内容渲染、TOC、面包屑
- [ ] 5.10 笔记详情页: 关联笔记列表 (双向链接)
- [ ] 5.11 项目展示页: 项目卡片网格
- [ ] 5.12 出版物页面: 论文列表、BibTeX 引用复制
- [ ] 5.13 简历页面: 结构化简历、PDF 下载
- [ ] 5.14 404 页面
- [ ] 5.15 loading.tsx 骨架屏

## 阶段 6：新功能

- [ ] 6.1 浏览量 API + 前端组件 (自动记录、展示)
- [ ] 6.2 点赞 API + 前端组件 (动画效果、IP 防重复)
- [ ] 6.3 全文搜索: FlexSearch 索引构建 (API 端)
- [ ] 6.4 全文搜索: Cmd+K 搜索 Modal 组件
- [ ] 6.5 全文搜索: 搜索结果高亮展示
- [ ] 6.6 知识图谱: PostLink 双向链接数据接口
- [ ] 6.7 知识图谱: D3.js 力导向图组件
- [ ] 6.8 知识图谱: 节点交互 (点击跳转、hover 预览)
- [ ] 6.9 Giscus 评论系统集成
- [ ] 6.10 RSS Feed 生成 (/feed.xml)
- [ ] 6.11 Sitemap 生成

## 阶段 7：部署

- [ ] 7.1 多阶段 Dockerfile (deps → build → runner, standalone 输出)
- [ ] 7.2 docker-compose.yml (Next.js + MySQL, volumes, networks)
- [ ] 7.3 .env.example 环境变量文档
- [ ] 7.4 Gitea Actions 自动部署 workflow (.gitea/workflows/deploy.yaml)
- [ ] 7.5 GitHub 镜像仓库配置
- [ ] 7.6 CasaOS 部署与测试
- [ ] 7.7 git init + 初始提交 + 推送到 Gitea
