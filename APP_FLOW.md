# APP_FLOW - 用户流程

## 页面结构

### 前台页面（公开）

```
/ (首页/关于)
├── /blog (博客列表)
│   └── /blog/[slug] (文章详情)
├── /notes (笔记列表)
│   └── /notes/[category] (课程分类)
│       └── /notes/[category]/[slug] (笔记详情)
├── /projects (项目列表)
│   └── /projects/[slug] (项目详情)
├── /publications (出版物列表)
├── /cv (简历)
└── /graph (知识图谱全局视图)
```

### 管理后台（需认证）

```
/admin (重定向到 dashboard)
├── /admin/dashboard (统计仪表盘)
├── /admin/posts (博客文章管理)
│   ├── /admin/posts/new (新建文章)
│   └── /admin/posts/[id]/edit (编辑文章)
├── /admin/notes (笔记管理)
│   ├── /admin/notes/new (新建笔记)
│   └── /admin/notes/[id]/edit (编辑笔记)
├── /admin/projects (项目管理)
│   ├── /admin/projects/new
│   └── /admin/projects/[id]/edit
├── /admin/publications (出版物管理)
│   ├── /admin/publications/new
│   └── /admin/publications/[id]/edit
└── /admin/settings (站点设置)
```

### 路由说明

- 所有前台路由前缀 `/[locale]/`，如 `/zh/blog`, `/en/blog`
- 管理后台路由也在 `[locale]` 下，但仅提供中文界面
- 默认语言为中文 (zh)

---

## 全局组件

| 组件 | 位置 | 功能 |
|------|------|------|
| Header | 页面顶部固定 | Logo + 导航菜单 + 语言切换 + 主题切换 + 搜索按钮 |
| Footer | 页面底部 | 社交链接(GitHub, Email, Bilibili, WeChat) + 版权信息 |
| 搜索 Modal | 全局浮层 | Cmd+K 打开，全文搜索，结果列表可点击跳转 |
| 移动端菜单 | Header 内 | 汉堡菜单，展开显示导航项 |

---

## 关键用户流程

### 1. 内容浏览流程

```
首页 → 点击导航"博客" → 博客列表页 → 点击文章卡片 → 文章详情页
                                     → 点击标签筛选 → 过滤后的列表
```

### 2. 搜索流程

```
任意页面 → 按 Cmd+K (或点击搜索图标) → 搜索 Modal 弹出
→ 输入关键词 → 实时显示匹配结果 → 点击结果 → 跳转到目标页面
```

### 3. 知识探索流程

```
笔记详情页 → 查看文末"关联笔记"列表 → 点击关联笔记跳转
          → 或点击"知识图谱"按钮 → 图谱视图 → 点击节点跳转
```

### 4. 评论流程

```
文章/笔记详情页 → 滚动到底部评论区 → Giscus 加载
→ 点击"用 GitHub 登录" → GitHub OAuth → 发表评论
```

### 5. 主题/语言切换

```
Header 主题按钮 → 切换明/暗模式 → 全站即时更新
Header 语言按钮 → zh/en 切换 → URL 前缀变化，页面内容切换
```

### 6. 管理员内容编辑流程

```
访问 /admin → 未登录则跳转登录页 → 输入账号密码 → NextAuth 验证
→ 进入仪表盘 → 侧边栏选择"文章管理" → 文章列表
→ 点击"新建文章" → 填写元信息 → Monaco Editor 中编辑 Markdown
→ Ctrl+S 保存 → 自动 git add → commit → push → 文章上线
→ Git 仓库保留完整版本历史
```

### 7. 点赞流程

```
文章详情页 → 点击点赞按钮 → API 记录(IP防重复) → 点赞数+1，按钮状态更新
```

---

## 页面状态

### 空状态
- 博客列表无文章时：显示"暂无文章"提示
- 搜索无结果时：显示"未找到匹配内容"
- 笔记分类为空时：显示"该分类暂无笔记"

### 错误状态
- 404 页面：自定义 404 页面
- 500 页面：自定义错误页面
- API 错误：Toast 提示用户

### 加载状态
- 页面级：Next.js loading.tsx 骨架屏
- 组件级：Skeleton loading 动画
- 搜索：输入防抖 300ms
