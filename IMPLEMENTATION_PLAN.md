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

## 阶段 4：管理后台

- [ ] 4.1 Admin 布局 (侧边栏导航, 认证保护, 响应式)
- [ ] 4.2 Tiptap 编辑器核心组件 (基础工具栏: 粗体/斜体/标题/列表)
- [ ] 4.3 Tiptap 扩展: 数学公式 (KaTeX)
- [ ] 4.4 Tiptap 扩展: 代码块 (lowlight 语法高亮)
- [ ] 4.5 Tiptap 扩展: 图片上传
- [ ] 4.6 Tiptap 扩展: 表格
- [ ] 4.7 Tiptap 扩展: 链接
- [ ] 4.8 图片上传 API (/api/admin/upload)
- [ ] 4.9 文章管理: 列表页 (搜索、筛选、分页)
- [ ] 4.10 文章管理: 新建页 (Tiptap 编辑器 + 中英双语标签)
- [ ] 4.11 文章管理: 编辑页 (加载已有内容)
- [ ] 4.12 文章管理: 删除确认
- [ ] 4.13 笔记管理: CRUD (同文章 + 分类选择)
- [ ] 4.14 项目管理: CRUD
- [ ] 4.15 出版物管理: CRUD
- [ ] 4.16 统计仪表盘 (总浏览量、总点赞、文章数、最近访问趋势)
- [ ] 4.17 站点设置页

## 阶段 5：前台页面

- [ ] 5.1 首页: 个人简介区域 (头像、姓名、身份、简介)
- [ ] 5.2 首页: 技能标签云
- [ ] 5.3 首页: 最近动态/时间线
- [ ] 5.4 首页: 社交链接
- [ ] 5.5 博客列表页: 文章卡片、标签筛选、分页
- [ ] 5.6 博客详情页: Tiptap JSON 渲染为 HTML、目录 TOC
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
