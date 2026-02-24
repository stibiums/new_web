---
title: 个人学术网站
titleEn: Personal Academic Website
description: 基于 Next.js 16 + TypeScript + Tailwind CSS 的个人学术网站全栈重构项目
descriptionEn: >-
  Full-stack reconstruction of personal academic website using Next.js 16,
  TypeScript, Tailwind CSS
techStack: >-
  Next.js 16, TypeScript, Tailwind CSS 4, MySQL, Prisma, NextAuth.js, Monaco
  Editor, D3.js, FlexSearch, Giscus
githubUrl: 'https://github.com/stibiums/new_web'
demoUrl: 'https://stibiums.top'
coverImage: /assets/img/1771940955740-Screenshot-from-2026-02-24-21-49-07.png
published: true
---

# 个人学术网站

基于 **Next.js 16** + **TypeScript** + **Tailwind CSS 4** 的个人学术网站全栈重构项目。

## 项目背景

原站采用 Hexo 框架，文章存储于 GitHub 仓库，每次更新需本地编译后推送至仓库。使用中发现诸多不便：依赖本地环境、无法在移动端编辑、版本管理不灵活等。

本次重构采用 Next.js App Router 架构，结合 Monaco Editor (VS Code 内核) 实现 Web 端 Markdown 编辑，配合 Git 实现内容版本化管理，同时引入 MySQL + Prisma 提供数据持久化支持。

## 功能特性

### 前台展示

- **首页**: 个人简介、技能标签云、最近动态时间线、社交链接
- **博客系统**: 文章列表、分类/标签筛选、分页、详情页
- **学习笔记**: 按课程分类组织、侧边栏导航、Wiki 双向链接
- **项目展示**: 项目卡片网格、支持详情页/GitHub/Demo 链接
- **学术出版物**: 论文列表、BibTeX 引用复制
- **简历展示**: 结构化简历、PDF 下载
- **知识图谱**: 笔记双向链接可视化、D3.js 力导向图
- **全局搜索**: Cmd+K 搜索弹窗，支持 Post/Note/Project/Publication
- **评论系统**: Giscus 基于 GitHub Discussions
- **点赞功能**: 匿名点赞（IP 防重复）
- **访问统计**: 页面浏览量展示
- **RSS 订阅**: /feed.xml
- **双语支持**: 全站中英文切换 (zh/en)
- **主题切换**: 明/暗模式

### 管理后台

- **Monaco Editor**: VS Code 内核的 Web Markdown 编辑器，支持语法高亮、迷你地图
- **自动保存**: Ctrl+S 保存时自动 git add → commit → push
- **版本回滚**: 支持撤销上一次提交
- **图片上传**: 编辑器内直接上传图片
- **Markdown 导入**: 支持上传 .md 文件创建内容
- **站点设置**: 社交链接、Git 配置、主题设置、欢迎语、页脚信息

## 技术架构

- **框架**: Next.js 16 (App Router) + TypeScript
- **样式**: Tailwind CSS 4 + CSS 变量主题
- **数据库**: MySQL 8 + Prisma 6 ORM
- **认证**: NextAuth.js v5 (Credentials)
- **编辑器**: Monaco Editor
- **搜索**: FlexSearch 客户端全文搜索
- **图谱**: D3.js
- **评论**: Giscus
- **部署**: Docker → CasaOS，Gitea Actions 自动部署

## 目录结构

```
src/
├── app/[locale]/          # 页面路由 (i18n)
│   ├── admin/             # 管理后台
│   ├── blog/              # 博客
│   ├── notes/             # 笔记
│   ├── projects/          # 项目
│   ├── publications/      # 出版物
│   ├── cv/                # 简历
│   └── graph/             # 知识图谱
├── components/            # React 组件
├── lib/                   # 工具函数
│   ├── prisma.ts          # Prisma Client
│   ├── auth.ts            # NextAuth 配置
│   ├── markdown-file.ts   # Markdown 读写
│   ├── git.ts             # Git 版本管理
│   └── sync.ts            # 文件到数据库同步
└── content/               # Markdown 内容 (独立 Git 仓库)
    ├── posts/             # 博客文章
    ├── notes/             # 学习笔记
    └── projects/          # 项目展示
```
