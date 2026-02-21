# BACKEND_STRUCTURE - 后端结构

## 数据库

- **数据库**: MySQL 8.x
- **ORM**: Prisma 6.x
- **连接**: Docker 内部网络，Next.js 通过环境变量 `DATABASE_URL` 连接

---

## 数据库表设计 (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String   // bcrypt hashed
  role      Role     @default(ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  titleEn     String?
  content     String?   @db.LongText  // Markdown 内容（可选，用于搜索索引）
  contentEn   String?   @db.LongText
  excerpt     String?   @db.Text
  excerptEn   String?   @db.Text
  type        PostType  // BLOG / NOTE
  category    String?   // 笔记课程分类 (ML, CV, DSA...)
  tags        String?   // 逗号分隔: "tag1,tag2"
  coverImage  String?
  filePath    String?   // Markdown 文件相对路径: "posts/2025-01-01-hello-world.md"
  published   Boolean   @default(false)
  publishedAt DateTime?
  views       Int       @default(0)
  likes       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  reactions   Reaction[]
  links       PostLink[] @relation("source")
  backlinks   PostLink[] @relation("target")

  @@index([type])
  @@index([category])
  @@index([published])
  @@index([publishedAt])
}

model PostLink {
  id       String @id @default(cuid())
  sourceId String
  targetId String
  source   Post   @relation("source", fields: [sourceId], references: [id], onDelete: Cascade)
  target   Post   @relation("target", fields: [targetId], references: [id], onDelete: Cascade)

  @@unique([sourceId, targetId])
  @@index([sourceId])
  @@index([targetId])
}

model Project {
  id            String   @id @default(cuid())
  slug          String   @unique
  title         String
  titleEn       String?
  description   String?  @db.Text
  descriptionEn String?  @db.Text
  content       String?  @db.LongText  // Markdown 内容（可选）
  contentEn     String?  @db.LongText
  techStack     String?  // 逗号分隔: "React,TypeScript"
  githubUrl     String?
  demoUrl       String?
  coverImage    String?
  filePath      String?  // Markdown 文件相对路径: "projects/wordhub.md"
  published     Boolean  @default(false)
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Publication {
  id        String   @id @default(cuid())
  title     String
  authors   String   // JSON array: ["Author1", "Author2"]
  venue     String?
  year      Int?
  doi       String?
  url       String?
  bibtex    String?  @db.Text
  abstract  String?  @db.Text
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Reaction {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  type      String   // 'like'
  ip        String
  createdAt DateTime @default(now())

  @@unique([postId, ip, type])
  @@index([postId])
}

model PageView {
  id        String   @id @default(cuid())
  path      String
  ip        String?
  userAgent String?  @db.Text
  referer   String?  @db.Text
  createdAt DateTime @default(now())

  @@index([path])
  @@index([createdAt])
}

model SiteConfig {
  id    String @id @default(cuid())
  key   String @unique
  value String @db.Text  // JSON string
}

enum PostType {
  BLOG
  NOTE
}

enum Role {
  ADMIN
}
```

---

## API 端点

### 公开 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/posts?type=BLOG&tag=xx&page=1&limit=10 | 文章列表（支持筛选、分页） |
| GET | /api/posts/[slug] | 文章详情 |
| GET | /api/posts/categories | 笔记分类列表 |
| GET | /api/projects | 项目列表 |
| GET | /api/projects/[slug] | 项目详情 |
| GET | /api/publications | 出版物列表 |
| GET | /api/views/[slug] | 获取浏览量 |
| POST | /api/views/[slug] | 记录浏览（自动获取 IP） |
| GET | /api/likes/[slug] | 获取点赞数 + 当前用户是否已赞 |
| POST | /api/likes/[slug] | 点赞/取消点赞 |
| GET | /api/search?q=keyword | 全文搜索 |
| GET | /api/graph | 知识图谱数据 (nodes + edges) |

### 管理 API（需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/posts | 文章列表（含未发布） |
| POST | /api/admin/posts | 创建文章（写入 Markdown 文件） |
| GET | /api/admin/posts/[id] | 获取文章（编辑用） |
| PUT | /api/admin/posts/[id] | 更新文章（重写 Markdown 文件） |
| DELETE | /api/admin/posts/[id] | 删除文章（删除 Markdown 文件） |
| GET | /api/admin/posts/[id]/download | 下载 Markdown 文件 |
| GET | /api/admin/projects | 项目列表 |
| POST | /api/admin/projects | 创建项目 |
| PUT | /api/admin/projects/[id] | 更新项目 |
| DELETE | /api/admin/projects/[id] | 删除项目 |
| GET | /api/admin/projects/[id]/download | 下载 Markdown 文件 |
| GET | /api/admin/publications | 出版物列表 |
| POST | /api/admin/publications | 创建出版物 |
| PUT | /api/admin/publications/[id] | 更新出版物 |
| DELETE | /api/admin/publications/[id] | 删除出版物 |
| GET | /api/admin/stats | 统计概览（总浏览、总点赞、文章数等） |
| POST | /api/admin/upload | 图片上传（返回 URL） |
| GET | /api/admin/settings | 获取站点设置 |
| PUT | /api/admin/settings | 更新站点设置 |

### 认证 API

| 方法 | 路径 | 说明 |
|------|------|------|
| * | /api/auth/[...nextauth] | NextAuth.js 路由（登录、登出、session） |

### 静态生成

| 路径 | 说明 |
|------|------|
| /feed.xml | RSS Feed (通过 Route Handler 生成) |
| /sitemap.xml | Sitemap (通过 Next.js sitemap 配置) |

---

## 认证逻辑

- **框架**: NextAuth.js v5 (Auth.js)
- **Provider**: Credentials (邮箱 + 密码)
- **密码存储**: bcryptjs 哈希
- **Session 策略**: JWT
- **保护路由**: Next.js middleware 拦截 `/admin/*`，未认证重定向到登录页
- **管理员**: 单用户，通过 seed 脚本初始化

---

## 图片上传

- **存储位置**: `public/uploads/` 目录
- **命名规则**: `{timestamp}-{random}.{ext}`
- **支持格式**: JPEG, PNG, WebP, GIF
- **大小限制**: 5MB
- **返回**: 图片 URL (`/uploads/xxx.jpg`)

---

## Markdown 文件存储

- **内容存储**: 项目根目录 `content/`
- **资源存储**: `public/assets/` 目录
  - `assets/img/` - 图片（按课程/章节分类）
  - `assets/jupyter/` - Jupyter Notebook 文件
  - `assets/video/` - 视频文件
  - `assets/pdf/` - PDF 文档
- **Git 仓库**: 内容单独 Git 仓库或主仓库分支
- **版本管理**: 每次保存自动 git add → commit → push
- **资源引用**: 使用标准 Markdown 语法 `![描述](/assets/img/...)`

### 资源引用示例

```markdown
![图片描述](/assets/img/notes_img/cv-ch02/pinhole-camera.png)

[下载 PDF](/assets/pdf/CV.pdf)
```

---

## 内容格式

### 双写架构：文件系统 + 数据库同步

采用 Git 为 source of truth，数据库作为缓存的双写架构：

| 存储 | 用途 |
|------|------|
| 文件系统 `content/` | Markdown 文件存储，Git 版本管理 |
| 数据库 `Post.content` | 全文副本，用于搜索和快速查询 |

#### 同步流程

```
保存时:
1. 写入 content/*.md 文件
2. 解析 Front Matter (title, tags, category...)
3. 同步到数据库 (元数据 + 全文 content 字段)
4. git add → commit → push
5. 记录 gitCommit hash

查询时:
- 列表页: 直接查数据库 (高性能)
- 详情页: 数据库查元数据 + 文件读内容渲染
- 搜索: 数据库 content 字段全文搜索
```

#### 目录结构

```
content/                              # Markdown (Git source of truth)
├── posts/          # 博客文章
│   ├── 2025-01-01-hello-world.md
│   └── ...
├── notes/          # 学习笔记
│   ├── dsa/
│   │   └── ch01.md
│   └── ...
└── projects/       # 项目展示
    └── wordhub.md
```

### Markdown 文件格式

使用 **Front Matter** 定义元数据:
```markdown
---
title: "文章标题"
titleEn: "Article Title"
date: 2025-01-01
tags: [tag1, tag2]
categories: tech
excerpt: "文章摘要"
coverImage: /uploads/cover.jpg
published: true
---

## 正文内容

支持 **Markdown** 语法，包括代码块、表格等。

```python
def hello():
    print("Hello, World!")
```
```

### 元数据字段映射

| Front Matter | 数据库字段 |
|--------------|-----------|
| title | title |
| titleEn | titleEn |
| date | publishedAt |
| tags | tags (逗号分隔) |
| categories | category |
| excerpt | excerpt |
| excerptEn | excerptEn |
| coverImage | coverImage |
| published | published |
| --- | filePath |
